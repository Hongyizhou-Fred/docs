import fs from 'fs'
import path from 'path'
import type { Article, Category, Section } from './types'
import { slugFromHtmlUrl, slugify } from './slugify'
import { SLUG_OVERRIDES } from '../zendesk.config'

// 目录/文件写盘 + frontmatter + _order.json 生成。
// 目录结构 (方案 Y):
//   ${root}/${category-slug}/${section-slug}/${article-slug}.md
//   ${root}/${category-slug}/_order.json    -- section slug list
//   ${root}/${category-slug}/${section-slug}/_order.json  -- article slug list

export interface WrittenArticle {
  articleId: number
  categorySlug: string
  sectionSlug: string
  articleSlug: string
  filePath: string // 相对项目根
}

/** category.name → slug(优先 SLUG_OVERRIDES) */
export function categorySlug(cat: Pick<Category, 'id' | 'name'>): string {
  return SLUG_OVERRIDES[String(cat.id)] ?? slugify(cat.name.trim())
}

/** section.name → slug */
export function sectionSlug(sec: Pick<Section, 'id' | 'name'>): string {
  return SLUG_OVERRIDES[String(sec.id)] ?? slugify(sec.name.trim())
}

/** article.html_url 里带的 slug，回退到 article ID */
export function articleSlug(article: Pick<Article, 'id' | 'html_url'>): string {
  return slugFromHtmlUrl(article.html_url, article.id)
}

/**
 * 写一篇 article 到磁盘。localeRoot 形如 `docs/en`(相对 apps/us),catSlug/secSlug 已 slugify。
 * body 是转好的 Markdown(不含 frontmatter),我们在这里拼 frontmatter。
 */
export function writeArticleMd(params: {
  localeRoot: string
  catSlug: string
  secSlug: string
  artSlug: string
  article: Article
  bodyMd: string
}): string {
  const { localeRoot, catSlug, secSlug, artSlug, article, bodyMd } = params
  const dir = path.join(localeRoot, catSlug, secSlug)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, `${artSlug}.md`)
  const fm = buildFrontmatter({
    title: article.title,
    zendesk_article_id: article.id,
    zendesk_section_id: article.section_id,
    zendesk_updated_at: article.updated_at,
    zendesk_edited_at: article.edited_at,
    source_url: article.html_url,
    promoted: article.promoted,
    position: article.position,
    labels: article.label_names,
  })
  fs.writeFileSync(filePath, fm + '\n' + bodyMd)
  return filePath
}

/** 写目录级 _order.json(内容是 slug 数组) */
export function writeOrderJson(dir: string, order: string[]): void {
  if (!order.length) return
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '_order.json'), JSON.stringify(order, null, 2) + '\n')
}

/**
 * 写 category 级 overview.md:让 NAV_TABS 的 landingHref
 * (`/us/<cat>/overview`) 有内容;同时给 sidebar 顶层分类标题一个可点链接。
 * 内容 = category 名称 + 描述 (如有) + 每个含内容 section 的入口链接。
 */
export function writeCategoryOverview(params: {
  localeRoot: string
  catSlug: string
  categoryName: string
  categoryDescription?: string
  categoryId: number
  urlBase: string // 例:'' (en) 或 '/zh-HK';region 前缀由 VitePress base 提供
  sections: Array<{ slug: string; name: string; description?: string; articleCount: number }>
}): string {
  const { localeRoot, catSlug, categoryName, categoryDescription, categoryId, urlBase, sections } = params
  const dir = path.join(localeRoot, catSlug)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, 'overview.md')

  const fm = buildFrontmatter({
    layout: 'doc',
    sidebar: true,
    title: categoryName,
    zendesk_category_id: categoryId,
  })

  const parts: string[] = [fm, '', `# ${categoryName}`, '']
  if (categoryDescription?.trim()) {
    parts.push(categoryDescription.trim(), '')
  }
  const withContent = sections.filter(s => s.articleCount > 0)
  if (withContent.length) {
    parts.push('## Sections', '')
    for (const sec of withContent) {
      const link = `${urlBase}/${catSlug}/${sec.slug}/overview`
      const suffix = sec.description?.trim() ? ` — ${sec.description.trim()}` : ''
      parts.push(`- [${sec.name}](${link})${suffix}`)
    }
    parts.push('')
  }
  fs.writeFileSync(filePath, parts.join('\n'))
  return filePath
}

/**
 * 写 section 级 overview.md:让 sidebar 的 section 标题可点。
 * 内容 = section 名称 + 描述 (如有) + 该 section 下每篇 published article 的链接。
 */
export function writeSectionOverview(params: {
  localeRoot: string
  catSlug: string
  secSlug: string
  sectionName: string
  sectionDescription?: string
  sectionId: number
  urlBase: string
  articles: Array<{ slug: string; title: string }>
}): string {
  const { localeRoot, catSlug, secSlug, sectionName, sectionDescription, sectionId, urlBase, articles } = params
  const dir = path.join(localeRoot, catSlug, secSlug)
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, 'overview.md')

  const fm = buildFrontmatter({
    layout: 'doc',
    sidebar: true,
    title: sectionName,
    zendesk_section_id: sectionId,
  })

  const parts: string[] = [fm, '', `# ${sectionName}`, '']
  if (sectionDescription?.trim()) {
    parts.push(sectionDescription.trim(), '')
  }
  if (articles.length) {
    parts.push('## Articles', '')
    for (const a of articles) {
      parts.push(`- [${a.title}](${urlBase}/${catSlug}/${secSlug}/${a.slug})`)
    }
    parts.push('')
  }
  fs.writeFileSync(filePath, parts.join('\n'))
  return filePath
}

/**
 * 清理 localeRoot 下不再存在于本次同步的老文章 / 老目录。
 * 传入本次实际写入的 article file 相对路径列表 (相对 localeRoot);
 * 未列入且属于我们管理范围内的 `.md` 会被删除，空目录会被清理。
 * 注意：只清 `.md` + _order.json，不动 index.md / graph.md / images/ 等手工文件。
 */
export function pruneStaleFiles(localeRoot: string, keepArticlePaths: Set<string>): { deleted: string[] } {
  const deleted: string[] = []
  if (!fs.existsSync(localeRoot)) return { deleted }
  walk(localeRoot)
  return { deleted }

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      const rel = path.relative(localeRoot, full)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        // 跳过顶层保留目录:images / getting-started(S1 placeholder)
        if (rel === 'images') continue
        walk(full)
        // 目录变空 (且不是 localeRoot 本身) → rmdir
        try {
          if (fs.readdirSync(full).length === 0) fs.rmdirSync(full)
        } catch {}
      } else if (entry.endsWith('.md')) {
        // overview.md 是分类/section 索引，由 fetcher 每次重写，不算 stale
        if (entry === 'overview.md') continue
        // 保护顶层的 index.md / graph.md
        // 只清"category/section/article.md" 这种深度的
        const parts = rel.split(path.sep)
        if (parts.length < 3) continue
        if (!keepArticlePaths.has(rel)) {
          fs.rmSync(full)
          deleted.push(rel)
        }
      } else if (entry === '_order.json') {
        // _order.json 每次同步会重写,老的直接删(下面再重写)
        // 但为了避免竞态,只删完全空目录里的 _order.json
        // 实际做法:上层同步流程结束前统一重写,这里不动
      }
    }
  }
}

// ── internals ──────────────────────────────────────────────────

function buildFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = ['---']
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue
    if (Array.isArray(v)) {
      if (v.length === 0) continue
      lines.push(`${k}:`)
      for (const item of v) lines.push(`  - ${yamlScalar(item)}`)
    } else {
      lines.push(`${k}: ${yamlScalar(v)}`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

function yamlScalar(v: unknown): string {
  if (typeof v === 'boolean' || typeof v === 'number') return String(v)
  const s = String(v)
  // 引号包裹如果：含 : # - ? , [ ] { } | > * & ! % @ ` 或以空格开头/结尾 或是特殊 yaml token
  if (/[:#\-?,\[\]{}|>*&!%@`]/.test(s) || /^\s|\s$/.test(s) || /^(true|false|null|~|yes|no|on|off)$/i.test(s)) {
    return `'${s.replace(/'/g, "''")}'`
  }
  return s
}
