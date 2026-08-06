import { defineConfig, type Plugin, type UserConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import UnoCSS from 'unocss/vite'
import { tipContainerPlugin } from './md-plugins/tip-container'
import { normalizeMdPlugin } from './md-plugins/normalize-md'
import { buildEndCdnPrefix } from './cdn-prefix'
import type { NavTab } from './tabs.config'
import unoConfig from '../uno/config'
import zhCN from '../i18n/locales/zh-CN'
import en from '../i18n/locales/en'
import zhHK from '../i18n/locales/zh-HK'

// ─────────────────────────────────────────────────────────────────────────────
// VitePress 配置工厂：每个 region app(apps/hk、apps/sg、apps/us) 的
// docs/.vitepress/config.mts 只需调用 createDocsConfig 并传 4 个参数。
//
// 单 app 单 region:
//   - URL 上的 region 前缀由 VitePress `base`(如 /hk/)提供,内容目录不再有
//     region 层 (docs/zh-CN/... 而非 docs/hk/zh-CN/...)。
//   - locale key 回归标准 VitePress 形态 (root/zh-CN/zh-HK),不再是
//     hk/zh-CN 这种复合 key。
//   - 生产部署由 CI 把三个 app 的 dist 合并为 dist/{hk,sg,us},对外 URL 与
//     单实例时代完全一致。
// ─────────────────────────────────────────────────────────────────────────────

export type Region = 'hk' | 'sg' | 'us'
export type LocaleCode = 'en' | 'zh-CN' | 'zh-HK'

export interface CreateDocsConfigOptions {
  region: Region
  /** app 的 docs 目录绝对路径 (内容 locale 子目录、.vitepress 都在这下面) */
  docsDir: string
  /** 本 app 暴露的 locale 列表 (必须含 'en';en 是 URL 无前缀默认) */
  locales: LocaleCode[]
  /** 内容主源 locale:mirror 的源、sidebar 目录扫描的源 */
  sourceLocale: LocaleCode
  /** 本 region 的顶部导航 tabs(见 tabs.config.ts) */
  navTabs: NavTab[]
}

// URL 上省略 locale 段的默认 locale，三个 region 都是 en
const DEFAULT_URL_LOCALE: LocaleCode = 'en'

export function createDocsConfig(opts: CreateDocsConfigOptions): UserConfig {
  const { region, docsDir, locales, sourceLocale, navTabs } = opts
  const base = `/${region}/`

  // ── 启动期：缺 locale 目录时从主源物理镜像 ────────────────────────────
  // (US 的 zh-HK 是 gitignored 生成物，fresh checkout / CI 依赖这里兜底;
  //  sync 脚本自身也会刷新 mirror，两层保障)
  mirrorMissingLocales(docsDir, sourceLocale, locales)

  // ── 目录扫描：分类清单 + 文章清单 (注入给 HomeNavbar / TaskIndex 过滤) ──
  const contentRoot = path.join(docsDir, sourceLocale)
  const regionCategories = scanTopCategories(contentRoot)
  const regionArticles: string[] = []
  collectArticles(contentRoot, '', regionArticles)

  // ── sidebar:每 locale 一套 (en 无 URL 前缀) ─────────────────────────
  const mergedEnDirNames = { ...zhCN.data.dirNames, ...en.data.dirNames }
  const mergedZhHKDirNames = { ...zhCN.data.dirNames, ...zhHK.data.dirNames }
  const dirNamesByLocale: Record<LocaleCode, Record<string, string>> = {
    'en': mergedEnDirNames,
    'zh-CN': zhCN.data.dirNames,
    'zh-HK': mergedZhHKDirNames,
  }
  const sidebarByLocale = Object.fromEntries(
    locales.map(code => [
      code,
      generateSidebar(contentRoot, dirNamesByLocale[code], code === DEFAULT_URL_LOCALE ? '' : `/${code}`, navTabs),
    ]),
  ) as Record<LocaleCode, Record<string, object[]>>

  const editLinkPattern = `https://github.com/longbridge/docs/edit/main/apps/${region}/docs/:path`

  const sharedNav = [
    { text: '首页', link: '/' },
    { text: '文档', link: '/docs/' },
    { text: 'Developers', link: 'https://open.longbridge.com', target: '_blank' },
  ]

  // ── locale 条目模板 ───────────────────────────────────────────────────
  function localeEntry(code: LocaleCode) {
    const sidebar = sidebarByLocale[code]
    if (code === 'en') {
      return {
        label: 'English',
        lang: 'en',
        link: '/',
        title: 'Longbridge Docs',
        description: 'Longbridge Docs',
        themeConfig: {
          nav: sharedNav,
          sidebar,
          outline: { level: [2, 4] as [number, number], label: 'On this page' },
          lastUpdated: { text: 'Last updated', formatOptions: { dateStyle: 'medium' as const } },
          editLink: { pattern: editLinkPattern, text: 'Edit this page on GitHub' },
          docFooter: { prev: 'Previous', next: 'Next' },
          sidebarMenuLabel: 'Menu',
          returnToTopLabel: 'Return to top',
          darkModeSwitchLabel: 'Appearance',
          lightModeSwitchTitle: 'Switch to light theme',
          darkModeSwitchTitle: 'Switch to dark theme',
          skipToContentLabel: 'Skip to content',
        },
      }
    }
    if (code === 'zh-CN') {
      return {
        label: '简体中文',
        lang: 'zh-CN',
        link: '/zh-CN/',
        title: zhCN.vp.title,
        description: zhCN.vp.description,
        themeConfig: {
          nav: sharedNav,
          sidebar,
          outline: { level: [2, 4] as [number, number], label: zhCN.vp.outline },
          lastUpdated: { text: zhCN.vp.lastUpdated, formatOptions: { dateStyle: 'medium' as const } },
          editLink: { pattern: editLinkPattern, text: zhCN.vp.editLink },
          docFooter: { prev: zhCN.vp.prev, next: zhCN.vp.next },
          footer: { message: zhCN.vp.footerMessage },
          sidebarMenuLabel: zhCN.vp.sidebarMenu,
          returnToTopLabel: zhCN.vp.returnToTop,
          darkModeSwitchLabel: zhCN.vp.darkModeSwitch,
          lightModeSwitchTitle: zhCN.vp.lightModeSwitch,
          darkModeSwitchTitle: zhCN.vp.darkModeSwitch,
          skipToContentLabel: zhCN.vp.skipToContent,
        },
      }
    }
    // zh-HK
    return {
      label: '繁體中文',
      lang: 'zh-HK',
      link: '/zh-HK/',
      title: 'Longbridge Docs',
      description: 'Longbridge Docs',
      themeConfig: {
        nav: sharedNav,
        sidebar,
        outline: { level: [2, 4] as [number, number], label: '本頁內容' },
        lastUpdated: { text: '最近更新', formatOptions: { dateStyle: 'medium' as const } },
        editLink: { pattern: editLinkPattern, text: '在 GitHub 上編輯此頁' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        footer: { message: '© 2026 Longbridge. All rights reserved.' },
        sidebarMenuLabel: '選單',
        returnToTopLabel: '返回頂部',
        darkModeSwitchLabel: '切換深色模式',
        lightModeSwitchTitle: '切換淺色模式',
        darkModeSwitchTitle: '切換深色模式',
        skipToContentLabel: '跳至內容',
      },
    }
  }

  const localesConfig = Object.fromEntries(
    locales.map(code => [code === DEFAULT_URL_LOCALE ? 'root' : code, localeEntry(code)]),
  )

  // rewrites:en 内容目录 → URL 无 locale 段
  const rewrites = { [`${DEFAULT_URL_LOCALE}/:path*`]: ':path*' }

  return defineConfig({
    title: zhCN.vp.title,
    description: zhCN.vp.description,
    base,
    outDir: '.vitepress/dist',
    appearance: 'light',
    ignoreDeadLinks: true,
    cleanUrls: true,

    // 部署到 OSS + 主域 nginx 反代时启用：把所有 dist 产物 URL 重写为完整 CDN
    // URL，同时保留 page link href 不动。无 env var 时 no-op。
    buildEnd: process.env.ASSETS_CDN_PREFIX
      ? buildEndCdnPrefix(process.env.ASSETS_CDN_PREFIX)
      : undefined,

    head: [
      ['link', { rel: 'shortcut icon', type: 'image/x-icon', href: 'https://assets.wbrks.com/assets/logo/logo1.png' }],
    ],

    rewrites,
    locales: localesConfig,

    themeConfig: {
      logo: {
        src: 'https://assets.wbrks.com/assets/logo/logo-without-title-lb.svg',
        alt: 'Longbridge',
      },

      search: {
        provider: 'local',
        options: {
          miniSearch: {
            options: {
              storeFields: ['title', 'titles', 'text'],
            },
          },
          locales: {
            root: {
              translations: {
                button: {
                  buttonText: zhCN.vp.search.buttonText,
                  buttonAriaLabel: zhCN.vp.search.buttonAriaLabel,
                },
                modal: {
                  displayDetails: zhCN.vp.search.displayDetails,
                  resetButtonTitle: zhCN.vp.search.resetButtonTitle,
                  backButtonTitle: zhCN.vp.search.backButtonTitle,
                  noResultsText: zhCN.vp.search.noResultsText,
                  footer: {
                    selectText: zhCN.vp.search.footer.selectText,
                    selectKeyAriaLabel: zhCN.vp.search.footer.selectKeyAriaLabel,
                    navigateText: zhCN.vp.search.footer.navigateText,
                    navigateUpKeyAriaLabel: zhCN.vp.search.footer.navigateUpKeyAriaLabel,
                    navigateDownKeyAriaLabel: zhCN.vp.search.footer.navigateDownKeyAriaLabel,
                    closeText: zhCN.vp.search.footer.closeText,
                    closeKeyAriaLabel: zhCN.vp.search.footer.closeKeyAriaLabel,
                  },
                },
              },
            },
            en: {
              translations: {
                button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
                modal: {
                  displayDetails: 'Display detailed list',
                  resetButtonTitle: 'Reset search',
                  backButtonTitle: 'Close search',
                  noResultsText: 'No results for',
                  footer: {
                    selectText: 'to select',
                    selectKeyAriaLabel: 'Enter',
                    navigateText: 'to navigate',
                    navigateUpKeyAriaLabel: 'Up arrow',
                    navigateDownKeyAriaLabel: 'Down arrow',
                    closeText: 'to close',
                    closeKeyAriaLabel: 'Escape',
                  },
                },
              },
            },
            'zh-HK': {
              translations: {
                button: { buttonText: '搜尋文件', buttonAriaLabel: '搜尋文件' },
                modal: {
                  displayDetails: '顯示詳細列表',
                  resetButtonTitle: '清除查詢',
                  backButtonTitle: '關閉搜尋',
                  noResultsText: '無法找到相關結果',
                  footer: {
                    selectText: '選擇',
                    selectKeyAriaLabel: 'Enter',
                    navigateText: '切換',
                    navigateUpKeyAriaLabel: '方向鍵上',
                    navigateDownKeyAriaLabel: '方向鍵下',
                    closeText: '關閉',
                    closeKeyAriaLabel: 'Escape',
                  },
                },
              },
            },
          },
        },
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/longbridge/docs' },
      ],
    },

    markdown: {
      breaks: true,
      config(md) {
        md.use(normalizeMdPlugin)
        md.use(tipContainerPlugin)
      },
    },

    vite: {
      server: {
        host: '127.0.0.1',
        port: 9999,
        strictPort: true,
      },
      preview: {
        host: '127.0.0.1',
        port: 9999,
        strictPort: true,
      },
      plugins: [UnoCSS(unoConfig as any), rawMarkdownPlugin(docsDir, base, locales)],
      resolve: {
        alias: {
          // shared 组件消费的 per-app 数据:app 侧提供实现，shared 侧 import 别名
          '@app/topic-counts.data': path.join(docsDir, '.vitepress/topic-counts.data.ts'),
          '@app/link-graph.json': path.join(docsDir, '.vitepress/link-graph.json'),
        },
      },
      define: {
        __VUE_PROD_DEVTOOLS__: false,
        // 本 app 的 region,theme 内 useRegion 等直接读常量，不再解析 URL
        __LB_REGION__: JSON.stringify(region),
        // 注入本 region 实际存在的顶级分类列表，给 HomeNavbar 过滤 NAV_TABS
        __LB_REGION_CATEGORIES__: JSON.stringify({ [region]: regionCategories }),
        // 注入本 region 实际存在的文章路径列表 (无 .md 后缀，以 / 开头),
        // 让 TaskIndex 等 home section 过滤掉缺失的卡片
        __LB_REGION_ARTICLES__: JSON.stringify({ [region]: regionArticles }),
      },
      ssr: {
        // @lb-docs/shared 以 .ts/.vue 源码形态被消费，SSR 构建必须内联转译
        noExternal: ['vue-i18n', '@intlify/core-base', '@intlify/message-compiler', '@lb-docs/shared'],
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

// 跳过的目录 (locale 子目录 + 文档中心入口目录)
const skipDirs = new Set(['en', 'zh-HK', 'zh-CN', 'docs'])

function mirrorMissingLocales(docsDir: string, sourceLocale: string, locales: string[]) {
  const src = path.join(docsDir, sourceLocale)
  if (!fs.existsSync(src)) return
  function copyRecursive(s: string, d: string) {
    fs.mkdirSync(d, { recursive: true })
    for (const entry of fs.readdirSync(s)) {
      const sp = path.join(s, entry)
      const dp = path.join(d, entry)
      const st = fs.statSync(sp)
      if (st.isDirectory()) copyRecursive(sp, dp)
      else fs.copyFileSync(sp, dp)
    }
  }
  for (const target of locales) {
    if (target === sourceLocale) continue
    const dst = path.join(docsDir, target)
    if (!fs.existsSync(dst)) {
      copyRecursive(src, dst)
      console.log(`[config] auto-mirrored ${sourceLocale} → ${target}`)
    }
  }
}

// 访问 /<base>(/<locale>)?/some/page.md 返回原始 markdown 源码 (dev + build)
function rawMarkdownPlugin(docsDir: string, base: string, locales: string[]): Plugin {
  const subLocales = locales.filter(l => l !== DEFAULT_URL_LOCALE)
  return {
    name: 'raw-markdown-source',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').replace(/\?.*$/, '')
        if (!url.endsWith('.md')) return next()

        // 只处理浏览器导航请求，放过 Vite 内部模块导入 (import('/xxx.md'))
        const accept = req.headers['accept'] ?? ''
        if (!accept.includes('text/html')) return next()

        // 剥 base(dev server 在 base 下服务，req.url 带 /hk/ 前缀)
        let p = url
        if (p.startsWith(base)) p = '/' + p.slice(base.length)
        // URL → 源文件路径：
        //   /foo.md          → docs/en/foo.md(en 默认无 locale 段)
        //   /zh-CN/foo.md    → docs/zh-CN/foo.md
        const m = p.match(new RegExp(`^\\/(?:(${subLocales.join('|')})\\/)?(.*)$`))
        if (!m) return next()
        const locale = m[1] || DEFAULT_URL_LOCALE
        const rest = m[2]
        const filePath = path.join(docsDir, locale, rest)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(content)
          return
        }
        next()
      })
    },

    // 生产构建：把所有 .md 源文件复制到 dist，保持与 HTML 相同的路径结构
    //   docs/en/*     → dist/*        (en 默认无 locale 段)
    //   docs/<loc>/*  → dist/<loc>/*
    closeBundle() {
      const outDir = path.join(docsDir, '.vitepress/dist')
      if (!fs.existsSync(outDir)) return

      function copyMdFiles(srcDir: string, urlBase: string) {
        if (!fs.existsSync(srcDir)) return
        for (const entry of fs.readdirSync(srcDir)) {
          const srcPath = path.join(srcDir, entry)
          const stat = fs.statSync(srcPath)
          if (stat.isDirectory()) {
            copyMdFiles(srcPath, `${urlBase}/${entry}`)
          } else if (entry.endsWith('.md')) {
            const destPath = path.join(outDir, urlBase, entry)
            fs.mkdirSync(path.dirname(destPath), { recursive: true })
            fs.copyFileSync(srcPath, destPath)
          }
        }
      }

      for (const locale of locales) {
        const urlBase = locale === DEFAULT_URL_LOCALE ? '' : `/${locale}`
        copyMdFiles(path.join(docsDir, locale), urlBase)
      }
    },
  }
}

// 从 .md 文件中提取 frontmatter title 或第一个 H1
function extractTitle(filePath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
    if (fmMatch) {
      const titleMatch = fmMatch[1].match(/^title:\s*['"]?(.+?)['"]?$/m)
      if (titleMatch) return titleMatch[1].trim()
    }
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match) return h1Match[1].trim()
  } catch { }
  return fallback
}

// 取目录展示名:i18n dirNames > overview.md 的 title > 原始 slug。
// US 走 Zendesk 分类:name 直接由 overview.md frontmatter 提供，不需要在
// dirNames 维护 slug 对照，天然多语一致。
function resolveDirDisplayName(dirPath: string, slug: string, dirNames: Record<string, string>): string {
  if (dirNames[slug]) return dirNames[slug]
  const overview = path.join(dirPath, 'overview.md')
  if (fs.existsSync(overview)) return extractTitle(overview, slug)
  return slug
}

// 读取目录的排序配置 (_order.json),返回 slug/dirname 数组
function loadOrder(dir: string): string[] {
  try {
    const orderFile = path.join(dir, '_order.json')
    if (fs.existsSync(orderFile)) {
      return JSON.parse(fs.readFileSync(orderFile, 'utf-8'))
    }
  } catch { }
  return []
}

// 递归扫描目录生成侧边栏 items
// depth=0:顶级分类的直接子目录 (二级),展开;depth>=1:三级及以下，折叠
function generateSidebarItemsFromDir(dir: string, urlBase: string, dirNames: Record<string, string>, depth = 0): any[] {
  const items: any[] = []

  try {
    const order = loadOrder(dir)
    const allEntries = fs.readdirSync(dir)
      .filter((e: string) => !e.startsWith('.') && e !== '_order.json' && e !== 'images')

    // 按 _order.json 排序;未列出的追加到末尾 (字母序)
    const sorted = [
      ...order.filter(o => allEntries.includes(o) || allEntries.includes(`${o}.md`))
        .map(o => allEntries.find((e: string) => e === o || e === `${o}.md`)!),
      ...allEntries.filter((e: string) => {
        const slug = e.replace(/\.md$/, '')
        return !order.includes(slug) && !order.includes(e)
      }).sort(),
    ]

    for (const entry of sorted) {
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        const subItems = generateSidebarItemsFromDir(fullPath, `${urlBase}/${entry}`, dirNames, depth + 1)
        const displayName = resolveDirDisplayName(fullPath, entry, dirNames)

        // 若目录下有 overview.md，把 group 标题本身做成 overview link:
        // 点击 group 文字 → 展开 + 跳转 overview(Layout.vue 全局拦截补 caret 触发)。
        // 不再额外插入 Overview leaf，避免父子两条相同标题被同时高亮
        const overviewPath = path.join(fullPath, 'overview.md')
        const groupLink = fs.existsSync(overviewPath)
          ? `${urlBase}/${entry}/overview`
          : undefined

        const groupItem: any = {
          // 二级及以下 group 默认展开;用 false(而非 undefined) 保留 collapsible,
          // 让用户仍可手动折叠
          text: displayName,
          collapsed: false,
          items: subItems,
        }
        if (groupLink) groupItem.link = groupLink

        items.push(groupItem)
      } else if (entry.endsWith('.md') && entry !== 'overview.md') {
        const slug = entry.replace(/\.md$/, '')
        const link = `${urlBase}/${slug}`
        const title = extractTitle(fullPath, slug)
        items.push({
          text: title,
          link,
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return items
}

// 顶级分类 icon 字典 (对齐 docs.cdp.coinbase.com 风格)
// 使用 Phosphor icon 名，经 UnoCSS preset-icons 渲染为 `<span class="i-ph-XXX">` 的 CSS mask SVG
const CATEGORY_ICONS: Record<string, string> = {
  // HK / SG business slug
  'getting-started':           'book',
  'app-guide':                 'device-mobile-speaker',
  'account':                   'identification-card',
  'deposit':                   'hand-deposit',
  'withdrawal':                'hand-withdraw',
  'transfers-and-fx':          'swap',
  'stock-trading':             'chart-line-up',
  'derivatives':               'function',
  'crypto':                    'currency-btc',
  'ipo':                       'star',
  'margin':                    'scales',
  'funds-and-wealth':          'vault',
  'market-data':               'chart-bar',
  'portfolio-and-statements':  'chart-pie-slice',
  'rewards':                   'gift',
  'compliance-and-tax':        'shield-check',
  'troubleshooting':           'bug',

  // US(Zendesk category slug)
  'opening-an-account':                                  'user-plus',
  'trading-and-investing':                               'chart-line-up',
  'funding-your-account-withdrawals-and-transfer':       'hand-deposit',
  'account-and-security':                                'shield-check',
  'longbridge-community':                                'users',
  'campaigns':                                           'gift',
}

// 扫描 contentRoot 顶级目录 → 分类 slug 列表
function scanTopCategories(contentRoot: string): string[] {
  try {
    return fs.readdirSync(contentRoot)
      .filter((e: string) => !skipDirs.has(e) && !e.startsWith('.') && fs.statSync(path.join(contentRoot, e)).isDirectory())
  } catch {
    return []
  }
}

function collectArticles(dir: string, prefix: string, acc: string[]) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'images' || entry === '_order.json') continue
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      collectArticles(full, `${prefix}/${entry}`, acc)
    } else if (entry.endsWith('.md')) {
      acc.push(`${prefix}/${entry.replace(/\.md$/, '')}`)
    }
  }
}

// 生成侧边栏配置：从内容主源 locale 读目录结构，按 urlPrefix 给 link/key 加前
// 缀。urlPrefix 为 ''(en,URL 无 locale 段) 或 '/zh-CN' / '/zh-HK'。
// 已知分类白名单来自本 region 的 navTabs;未挂载的目录 fail-loud 打警告。
function generateSidebar(
  contentRoot: string,
  dirNames: Record<string, string>,
  urlPrefix: string,
  navTabs: NavTab[],
) {
  const topDirs = (() => {
    try {
      return fs.readdirSync(contentRoot)
        .filter((e: string) => {
          if (skipDirs.has(e)) return false
          const fullPath = path.join(contentRoot, e)
          return fs.statSync(fullPath).isDirectory() && !e.startsWith('.')
        })
        .sort()
    } catch { return [] }
  })()

  const knownCategories = new Set(navTabs.flatMap(t => t.categories))
  const itemByCategory: Record<string, object> = {}
  for (const dir of topDirs) {
    if (!knownCategories.has(dir)) {
      console.warn(`[config] ${dir}: 目录存在但未在本 region 的 NAV_TABS 里挂载，sidebar 会缺失。请检查 tabs.config.ts。`)
      continue
    }
    const dirPath = path.join(contentRoot, dir)
    const items = generateSidebarItemsFromDir(dirPath, `${urlPrefix}/${dir}`, dirNames)
    const iconName = CATEGORY_ICONS[dir]
    const iconHtml = iconName
      ? `<span class="sidebar-group-icon i-ph-${iconName}" aria-hidden="true"></span>`
      : ''
    const label = resolveDirDisplayName(dirPath, dir, dirNames)
    // 顶级分类目录如果有 overview.md，也让标题可点
    const overviewPath = path.join(dirPath, 'overview.md')
    const overviewLink = fs.existsSync(overviewPath)
      ? `${urlPrefix}/${dir}/overview`
      : undefined
    const group: any = {
      text: `${iconHtml}<span class="sidebar-group-label">${label}</span>`,
      collapsed: false,
      items,
    }
    if (overviewLink) group.link = overviewLink
    itemByCategory[dir] = group
  }

  // 每个 tab 路径前缀对应该 tab 下的分类列表
  // 跳过 home(path '/'):把 '/' 写进 sidebar 会被 VitePress 当作所有路径的兜底，
  // 让具体业务路径匹配不到自己的 sidebar，面包屑也因此推不出层级
  const sidebar: Record<string, object[]> = {}
  for (const tab of navTabs) {
    if (tab.path === '/') continue
    sidebar[`${urlPrefix}${tab.path}`] = tab.categories
      .filter(cat => itemByCategory[cat])
      .map(cat => itemByCategory[cat])
  }

  // 补齐各分类自身的路径前缀
  for (const tab of navTabs) {
    if (tab.path === '/') continue
    for (const cat of tab.categories) {
      const catPath = `${urlPrefix}/${cat}/`
      if (catPath !== `${urlPrefix}${tab.path}`) {
        sidebar[catPath] = sidebar[`${urlPrefix}${tab.path}`]
      }
    }
  }

  return sidebar
}
