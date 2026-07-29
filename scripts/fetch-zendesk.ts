/**
 * fetch-zendesk.ts — 一键从 Zendesk US 帮助中心同步内容到 docs/us/**
 *
 * 用法：
 *   1. 本地首次：创建 .env.local 填 ZENDESK_SUBDOMAIN / ZENDESK_EMAIL / ZENDESK_API_TOKEN
 *   2. 运行 `bun run sync:us`
 *   3. 检查 git diff docs/us/ 里的产物;确认后 commit
 *
 * CI 里同样命令，凭据来自 GitLab CI Vault(见 .gitlab-ci.yml sync-us-content job)。
 *
 * 过滤：只拉 draft:false(见 zendesk.config.ARTICLE_FILTER,project memory 有硬约束)。
 * 结构：方案 Y ── docs/us/{fs_locale}/{category-slug}/{section-slug}/{article-slug}.md
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { ZendeskClient } from './zendesk/client'
import { htmlToMarkdown } from './zendesk/html-to-md'
import {
  articleSlug,
  categorySlug,
  sectionSlug,
  writeArticleMd,
  writeCategoryOverview,
  writeOrderJson,
  writeSectionOverview,
  pruneStaleFiles,
} from './zendesk/writer'
import { ARTICLE_FILTER, CONTENT_ROOT, ID_BLOCKLIST, LOCALES_TO_PULL, LOCALE_TO_FS } from './zendesk.config'
import type { Article, Category, Section } from './zendesk/types'

dotenv.config({ path: '.env.local' })

const REQUIRED_ENVS = ['ZENDESK_SUBDOMAIN', 'ZENDESK_EMAIL', 'ZENDESK_API_TOKEN'] as const

function requireEnv(): { subdomain: string; email: string; token: string } {
  const missing = REQUIRED_ENVS.filter(k => !process.env[k])
  if (missing.length) {
    console.error(`❌ Missing env: ${missing.join(', ')}. 请在 .env.local 或 CI Secret 里配置。`)
    process.exit(2)
  }
  return {
    subdomain: process.env.ZENDESK_SUBDOMAIN!,
    email: process.env.ZENDESK_EMAIL!,
    token: process.env.ZENDESK_API_TOKEN!,
  }
}

async function main() {
  const started = Date.now()
  const { subdomain, email, token } = requireEnv()
  const client = new ZendeskClient({ subdomain, email, token })

  console.log(`▶ Sync from ${subdomain}.zendesk.com → ${CONTENT_ROOT}/{en,zh-HK}/...`)
  console.log(`  locales: ${LOCALES_TO_PULL.join(', ')}`)
  console.log(`  filter:  draft=${ARTICLE_FILTER.includeDrafts}  (only published articles)\n`)

  const totalStats: Record<string, LocaleStats> = {}

  for (const zdLocale of LOCALES_TO_PULL) {
    const fsLocale = LOCALE_TO_FS[zdLocale]
    if (!fsLocale) {
      console.warn(`  ⚠️  ${zdLocale}: 未在 LOCALE_TO_FS 里映射，跳过`)
      continue
    }
    const stats = await syncLocale(client, zdLocale, fsLocale)
    totalStats[zdLocale] = stats
    console.log()
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`✔ Done in ${elapsed}s`)
  console.log('  ' + Object.entries(totalStats).map(([l, s]) => `${l}: ${s.written} written, ${s.skippedDrafts} drafts skipped, ${s.pruned} stale removed`).join('\n  '))
}

interface LocaleStats {
  written: number
  skippedDrafts: number
  pruned: number
  unmappedCategoryWarnings: number
}

async function syncLocale(client: ZendeskClient, zdLocale: string, fsLocale: string): Promise<LocaleStats> {
  console.log(`  ▶ ${zdLocale} → docs/us/${fsLocale}/`)
  const [categories, sections, articles] = await Promise.all([
    client.listCategories(zdLocale),
    client.listSections(zdLocale),
    client.listArticles(zdLocale, { sortBy: 'position', sortOrder: 'asc' }),
  ])
  console.log(`    fetched: ${categories.length} categories, ${sections.length} sections, ${articles.length} articles`)

  // ── 建索引 ────────────────────────────────────────────────
  const categoryById = new Map<number, Category>()
  categories.forEach(c => categoryById.set(c.id, c))

  const sectionById = new Map<number, Section>()
  sections.forEach(s => sectionById.set(s.id, s))

  // 每个 category / section 分配 slug(相同名字的老/新 set 会 slugify 到同一 slug → 合并)
  const catSlugById = new Map<number, string>()
  categories.forEach(c => catSlugById.set(c.id, categorySlug(c)))
  const secSlugById = new Map<number, string>()
  sections.forEach(s => secSlugById.set(s.id, sectionSlug(s)))

  // ── 过滤 articles ────────────────────────────────────────
  const publishedArticles = articles.filter(a => !a.draft && !ID_BLOCKLIST.has(String(a.id)))
  const skippedDrafts = articles.length - publishedArticles.length

  // ── 建 article path 映射 (用于内链改写) ────────────────────
  interface ArticlePath {
    catSlug: string
    secSlug: string
    artSlug: string
    docsPath: string // /us/{fsLocale}/{cat}/{sec}/{art} (无 .md;fsLocale=en 时省略段)
  }
  const articlePathById = new Map<number, ArticlePath>()
  const urlLocaleSegment = fsLocale === 'en' ? '' : `/${fsLocale}`
  for (const a of publishedArticles) {
    const sec = sectionById.get(a.section_id)
    if (!sec) continue
    const cat = categoryById.get(sec.category_id)
    if (!cat) continue
    const catSlug = catSlugById.get(cat.id)!
    const secSlug = secSlugById.get(sec.id)!
    const artSlug = articleSlug(a)
    articlePathById.set(a.id, {
      catSlug,
      secSlug,
      artSlug,
      docsPath: `/us${urlLocaleSegment}/${catSlug}/${secSlug}/${artSlug}`,
    })
  }

  // ── 内链改写 ─────────────────────────────────────────────
  // Zendesk 内部链接形如 https://longbridgeus.zendesk.com/hc/en-us/articles/12345678(-slug)?
  // 或相对形式 /hc/en-us/articles/12345678(-slug)?
  const zdArticleUrlRe = /^(?:https?:\/\/[^/]+)?\/hc\/[a-z]{2}-[a-z]{2}\/articles\/(\d+)(?:-[^/?#]*)?(?:[/?#].*)?$/i
  function rewriteLink(href: string): string | null {
    const m = href.match(zdArticleUrlRe)
    if (!m) return null
    const targetId = Number(m[1])
    const targetPath = articlePathById.get(targetId)
    return targetPath ? targetPath.docsPath : null // 未 published / 不存在 → 保留原 href(打警告)
  }

  // ── 写盘 ─────────────────────────────────────────────────
  const localeRoot = path.join(CONTENT_ROOT, fsLocale)
  fs.mkdirSync(localeRoot, { recursive: true })
  const writtenRelPaths = new Set<string>()
  let unmappedWarnings = 0

  for (const a of publishedArticles) {
    const pathInfo = articlePathById.get(a.id)
    if (!pathInfo) {
      unmappedWarnings++
      console.warn(`    ⚠️  article ${a.id} "${a.title}": section 或 category 不存在，跳过`)
      continue
    }
    const bodyMd = htmlToMarkdown(a.body || '', { rewriteLink })
    writeArticleMd({
      localeRoot,
      catSlug: pathInfo.catSlug,
      secSlug: pathInfo.secSlug,
      artSlug: pathInfo.artSlug,
      article: a,
      bodyMd,
    })
    writtenRelPaths.add(`${pathInfo.catSlug}/${pathInfo.secSlug}/${pathInfo.artSlug}.md`)
  }

  // ── 生成 _order.json ─────────────────────────────────────
  //   category 目录里:section slug 按 section.position ASC(合并去重)
  //   section 目录里:article slug 按 (promoted DESC, position ASC)
  const catToSecOrder = new Map<string, Section[]>()
  for (const sec of sections) {
    const catSlug = catSlugById.get(sec.category_id)
    if (!catSlug) continue
    if (!catToSecOrder.has(catSlug)) catToSecOrder.set(catSlug, [])
    catToSecOrder.get(catSlug)!.push(sec)
  }
  for (const [catSlug, secs] of catToSecOrder) {
    const orderedSlugs = Array.from(new Set(
      secs.sort((a, b) => a.position - b.position).map(s => secSlugById.get(s.id)!),
    ))
    // 只在该 category 目录真的存在时写 (避免创建空目录)
    const catDir = path.join(localeRoot, catSlug)
    if (fs.existsSync(catDir)) writeOrderJson(catDir, orderedSlugs)
  }

  const secToArtOrder = new Map<string, Article[]>()
  for (const a of publishedArticles) {
    const pathInfo = articlePathById.get(a.id)
    if (!pathInfo) continue
    const key = `${pathInfo.catSlug}/${pathInfo.secSlug}`
    if (!secToArtOrder.has(key)) secToArtOrder.set(key, [])
    secToArtOrder.get(key)!.push(a)
  }
  const secArtsOrdered = new Map<string, Article[]>() // 排序后的 articles(同 key)
  for (const [key, arts] of secToArtOrder) {
    const sorted = arts.slice().sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1
      return a.position - b.position
    })
    secArtsOrdered.set(key, sorted)
    const orderedSlugs = sorted.map(a => articleSlug(a))
    // 去重 (老 + 新 slug 撞到一起后)
    const uniq = Array.from(new Set(orderedSlugs))
    writeOrderJson(path.join(localeRoot, key), uniq)
  }

  // ── 生成 overview.md ──────────────────────────────────────
  // 让 NAV_TABS.landingHref (/us/<cat>/overview) 与 sidebar 分类/section 标题
  // 点击都能落到真实页面，而不是 404。
  const urlBase = `/us${urlLocaleSegment}`

  // Category overview:每个含 published 内容的 category 一份
  for (const [catSlug, secs] of catToSecOrder) {
    const catDir = path.join(localeRoot, catSlug)
    if (!fs.existsSync(catDir)) continue
    const cat = categories.find(c => catSlugById.get(c.id) === catSlug)
    if (!cat) continue
    // 同名老 / 新 category 合并;section 层合并 by slug，按 position ASC
    const orderedSecs = secs
      .slice()
      .sort((a, b) => a.position - b.position)
    const seen = new Set<string>()
    const secList: Array<{ slug: string; name: string; description?: string; articleCount: number }> = []
    for (const sec of orderedSecs) {
      const secSlug = secSlugById.get(sec.id)!
      if (seen.has(secSlug)) continue
      seen.add(secSlug)
      const arts = secArtsOrdered.get(`${catSlug}/${secSlug}`) ?? []
      secList.push({
        slug: secSlug,
        name: sec.name.trim(),
        description: sec.description,
        articleCount: arts.length,
      })
    }
    const overviewPath = writeCategoryOverview({
      localeRoot,
      catSlug,
      categoryName: cat.name.trim(),
      categoryDescription: cat.description,
      categoryId: cat.id,
      urlBase,
      sections: secList,
    })
    writtenRelPaths.add(path.relative(localeRoot, overviewPath))
  }

  // Section overview:每个含 published 内容的 section 一份
  for (const [key, sortedArts] of secArtsOrdered) {
    if (!sortedArts.length) continue
    const [catSlug, secSlug] = key.split('/')
    // 用文章的 section_id 反查 section 对象;老 / 新 同名合并时随便一个都行
    const anyArt = sortedArts[0]
    const sec = sections.find(s => s.id === anyArt.section_id)
    if (!sec) continue
    const dedupArts = new Map<string, { slug: string; title: string }>()
    for (const a of sortedArts) {
      const slug = articleSlug(a)
      if (!dedupArts.has(slug)) dedupArts.set(slug, { slug, title: a.title })
    }
    const overviewPath = writeSectionOverview({
      localeRoot,
      catSlug,
      secSlug,
      sectionName: sec.name.trim(),
      sectionDescription: sec.description,
      sectionId: sec.id,
      urlBase,
      articles: Array.from(dedupArts.values()),
    })
    writtenRelPaths.add(path.relative(localeRoot, overviewPath))
  }

  // ── 清理旧文章文件 ─────────────────────────────────────
  const { deleted } = pruneStaleFiles(localeRoot, writtenRelPaths)
  if (deleted.length) console.log(`    pruned: ${deleted.length} stale file(s)`)

  console.log(`    written: ${writtenRelPaths.size} articles (${skippedDrafts} drafts skipped)`)

  return {
    written: writtenRelPaths.size,
    skippedDrafts,
    pruned: deleted.length,
    unmappedCategoryWarnings: unmappedWarnings,
  }
}

main().catch(err => {
  console.error('❌', err)
  process.exit(1)
})
