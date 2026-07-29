import { defineConfig, type Plugin } from 'vitepress'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import UnoCSS from 'unocss/vite'
import { tipContainerPlugin } from './md-plugins/tip-container'
import { normalizeMdPlugin } from './md-plugins/normalize-md'
import { buildEndCdnPrefix } from './cdn-prefix'
import { NAV_TABS_BY_REGION } from './tabs.config'
import zhCN from './i18n/locales/zh-CN'
import en from './i18n/locales/en'
import zhHK from './i18n/locales/zh-HK'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 单 VitePress 实例同时服务 /hk/* /sg/* /us/*。每个 region 的「内容主源」
// locale 由 REGION_SOURCE_LOCALE 定义:HK/SG 用中文写、翻译到英文,US 用英文
// 写、翻译到繁中。缺目标 locale 目录时启动期自动从主源物理镜像(避免 rewrites
// 失配 + 默认 locale 找不到 index.md)。
const REGION_ALL = ['hk', 'sg', 'us'] as const
type Region = typeof REGION_ALL[number]

// 每个 region 的可用 locale 列表。US 目前只有英文和繁中(Zendesk 未启用简中);
// 首位是「内容主源」,同时也是 URL 上省略 locale 段的默认 locale。
const REGION_LOCALES: Record<Region, string[]> = {
  hk: ['zh-CN', 'en', 'zh-HK'],
  sg: ['zh-CN', 'en', 'zh-HK'],
  us: ['en', 'zh-HK'],
}
// 内容主源 locale(mirror 的源、sidebar 目录扫描的源、closeBundle 的源)。
const REGION_SOURCE_LOCALE: Record<Region, string> = {
  hk: 'zh-CN',
  sg: 'zh-CN',
  us: 'en',
}
// URL 上作为「无 locale 段默认」的 locale。三个 region 目前都是 en。
const REGION_DEFAULT_URL_LOCALE: Record<Region, string> = {
  hk: 'en',
  sg: 'en',
  us: 'en',
}

function mirrorMissingLocales() {
  for (const region of REGION_ALL) {
    const root = path.resolve(`./docs/${region}`)
    const source = REGION_SOURCE_LOCALE[region]
    const src = path.join(root, source)
    if (!fs.existsSync(src)) continue
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
    for (const target of REGION_LOCALES[region]) {
      if (target === source) continue
      const dst = path.join(root, target)
      if (!fs.existsSync(dst)) {
        copyRecursive(src, dst)
        console.log(`[config] auto-mirrored ${region}/${source} → ${region}/${target}`)
      }
    }
  }
}
mirrorMissingLocales()

// 访问 /<region>(/<locale>)?/some/page.md 返回原始 markdown 源码
// （开发模式 + 生产构建）。
function rawMarkdownPlugin(): Plugin {
  return {
    name: 'raw-markdown-source',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').replace(/\?.*$/, '')
        if (!url.endsWith('.md')) return next()

        // 只处理浏览器导航请求，放过 Vite 内部模块导入（import('/xxx.md')）
        const accept = req.headers['accept'] ?? ''
        if (!accept.includes('text/html')) return next()

        // URL → 源文件路径：
        //   /hk/foo.md                → docs/hk/en/foo.md（en 默认无 locale 段）
        //   /hk/zh-CN/foo.md          → docs/hk/zh-CN/foo.md
        //   /sg/zh-HK/account/foo.md  → docs/sg/zh-HK/account/foo.md
        //   /us/foo.md                → docs/us/en/foo.md
        const regionAlt = REGION_ALL.join('|')
        const m = url.match(new RegExp(`^\\/(${regionAlt})(?:\\/(zh-CN|zh-HK))?(\\/.*)$`))
        if (!m) return next()
        const region = m[1] as Region
        const locale = m[2] || REGION_DEFAULT_URL_LOCALE[region]
        const rest = m[3]
        const filePath = path.join('docs', region, locale, rest)
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
    closeBundle() {
      const outDir = path.resolve('docs/.vitepress/dist')
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

      // 单 dist 内同时含所有 region:
      //   docs/<region>/<default>/*  → dist/<region>/*                 (default 无 locale 段)
      //   docs/<region>/<locale>/*   → dist/<region>/<locale>/*        (其它 locale)
      for (const region of REGION_ALL) {
        const srcRoot = path.resolve(`docs/${region}`)
        const defaultLocale = REGION_DEFAULT_URL_LOCALE[region]
        for (const locale of REGION_LOCALES[region]) {
          const urlBase = locale === defaultLocale ? `/${region}` : `/${region}/${locale}`
          copyMdFiles(path.join(srcRoot, locale), urlBase)
        }
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
// US 走 Zendesk 分类:name 直接由 overview.md frontmatter 提供,不需要在 dirNames
// 维护 slug → 中文/英文对照,天然多语一致。
function resolveDirDisplayName(dirPath: string, slug: string, dirNames: Record<string, string>): string {
  if (dirNames[slug]) return dirNames[slug]
  const overview = path.join(dirPath, 'overview.md')
  if (fs.existsSync(overview)) return extractTitle(overview, slug)
  return slug
}

// 跳过的目录（语言子目录 + 文档中心入口目录）
const skipDirs = new Set(['en', 'zh-HK', 'zh-CN', 'docs'])

// 读取目录的排序配置（_order.json），返回 slug/dirname 数组
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
// depth=0：顶级分类的直接子目录（二级），展开；depth>=1：三级及以下，折叠
function generateSidebarItemsFromDir(dir: string, base: string, dirNames: Record<string, string>, depth = 0): any[] {
  const items: any[] = []

  try {
    const order = loadOrder(dir)
    const allEntries = fs.readdirSync(dir)
      .filter(e => !e.startsWith('.') && e !== '_order.json' && e !== 'images')

    // 按 _order.json 排序；未列出的追加到末尾（字母序）
    const sorted = [
      ...order.filter(o => allEntries.includes(o) || allEntries.includes(`${o}.md`))
        .map(o => allEntries.find(e => e === o || e === `${o}.md`)!),
      ...allEntries.filter(e => {
        const slug = e.replace(/\.md$/, '')
        return !order.includes(slug) && !order.includes(e)
      }).sort(),
    ]

    for (const entry of sorted) {
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        const subItems = generateSidebarItemsFromDir(fullPath, `${base}/${entry}`, dirNames, depth + 1)
        const displayName = resolveDirDisplayName(fullPath, entry, dirNames)

        // 若目录下有 overview.md，把 group 标题本身做成 overview link：
        // 点击 group 文字 → 展开 + 跳转 overview（Layout.vue 全局拦截补 caret 触发）。
        // 不再额外插入 Overview leaf，避免父子两条相同标题被同时高亮
        const overviewPath = path.join(fullPath, 'overview.md')
        const groupLink = fs.existsSync(overviewPath)
          ? `${base}/${entry}/overview`
          : undefined

        const groupItem: any = {
          // 二级及以下 group 默认展开；用 false（而非 undefined）保留 collapsible，
          // 让用户仍可手动折叠
          text: displayName,
          collapsed: false,
          items: subItems,
        }
        if (groupLink) groupItem.link = groupLink

        items.push(groupItem)
      } else if (entry.endsWith('.md') && entry !== 'overview.md') {
        const slug = entry.replace(/\.md$/, '')
        const link = `${base}/${slug}`
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

// 顶级分类 icon 字典(对齐 docs.cdp.coinbase.com 风格)
// 使用 Phosphor icon 名,经 UnoCSS preset-icons 渲染为 `<span class="i-ph-XXX">` 的 CSS mask SVG
// HK/SG 使用业务 slug,US 使用 Zendesk category slugify(见 tabs.config.NAV_TABS_US)。
const CATEGORY_ICONS: Record<string, string> = {
  // HK / SG
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

// 生成侧边栏配置：从指定 region 的「内容主源 locale」读目录结构,按 urlPrefix 给
// link/key 加前缀。urlPrefix 形如 `/hk`、`/hk/zh-CN`、`/us/zh-HK` 等。
// HK/SG 主源是 zh-CN,US 主源是 en(见 REGION_SOURCE_LOCALE)。
// NAV_TABS 走 per-region:HK/SG 共用一套业务 tab,US 用 Zendesk 分类 slug 手工归并。
function generateSidebar(region: Region, dirNames: Record<string, string>, urlPrefix: string) {
  const contentRoot = `./docs/${region}/${REGION_SOURCE_LOCALE[region]}`
  const navTabs = NAV_TABS_BY_REGION[region]

  const topDirs = (() => {
    try {
      return fs.readdirSync(contentRoot)
        .filter(e => {
          if (skipDirs.has(e)) return false
          const fullPath = path.join(contentRoot, e)
          return fs.statSync(fullPath).isDirectory() && !e.startsWith('.')
        })
        .sort()
    } catch { return [] }
  })()

  // 构建每个分类目录的 sidebar item。已知分类白名单来自当前 region 的 navTabs
  // (HK/SG 一套业务 slug,US 一套 Zendesk slug);未在 navTabs 出现的目录视为
  // "野生分类"(可能是 Zendesk 新加但未映射),打印警告后跳过 sidebar 挂载。
  const knownCategories = new Set(navTabs.flatMap(t => t.categories))
  const itemByCategory: Record<string, object> = {}
  for (const dir of topDirs) {
    if (!knownCategories.has(dir)) {
      console.warn(`[config] ${region}/${dir}: 目录存在但未在 NAV_TABS_${region.toUpperCase()} 里挂载, sidebar 会缺失。请检查 tabs.config.ts。`)
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
  // 跳过 home（path '/'）：把 '/' 写进 sidebar 会被 VitePress 当作所有路径的兜底，
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

// sidebar 数量 = 每个 region 的 (locale 数)。US 只有 en + zh-HK,所以少一套 zh-CN。
// dirNames 各 locale 独立来源;缺 key 时回退 zh-CN(en/zh-HK 翻译未完成的 token)
const mergedEnDirNames = { ...zhCN.data.dirNames, ...en.data.dirNames }
const mergedZhHKDirNames = { ...zhCN.data.dirNames, ...zhHK.data.dirNames }

// root locale(en,URL 不带 locale 段):合并所有 region 的 en sidebar
const sidebarRoot = {
  ...generateSidebar('hk', mergedEnDirNames, '/hk'),
  ...generateSidebar('sg', mergedEnDirNames, '/sg'),
  ...generateSidebar('us', mergedEnDirNames, '/us'),
}
// 非默认 locale 合并到对应 locale.themeConfig.sidebar 里
const sidebarHkZhCN = generateSidebar('hk', zhCN.data.dirNames, '/hk/zh-CN')
const sidebarSgZhCN = generateSidebar('sg', zhCN.data.dirNames, '/sg/zh-CN')
const sidebarHkZhHK = generateSidebar('hk', mergedZhHKDirNames, '/hk/zh-HK')
const sidebarSgZhHK = generateSidebar('sg', mergedZhHKDirNames, '/sg/zh-HK')
const sidebarUsZhHK = generateSidebar('us', mergedZhHKDirNames, '/us/zh-HK')

// 每个 region 实际存在的顶级分类目录。HomeNavbar 据此过滤 NAV_TABS，避免
// 显示 sg 没有的 derivatives / crypto / compliance 等 sub-tab（点了会 404）
const regionCategories: Record<string, string[]> = {}
for (const region of REGION_ALL) {
  const root = `./docs/${region}/${REGION_SOURCE_LOCALE[region]}`
  try {
    regionCategories[region] = fs.readdirSync(root)
      .filter(e => !skipDirs.has(e) && !e.startsWith('.') && fs.statSync(path.join(root, e)).isDirectory())
  } catch {
    regionCategories[region] = []
  }
}

// 每 region 实际存在的所有文章相对路径（无 .md 后缀，以 / 开头），用于让
// TaskIndex 等首页 section 在 sg 等内容不全的 region 下过滤掉对应缺失的卡片。
const regionArticles: Record<string, string[]> = {}
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
for (const region of REGION_ALL) {
  const acc: string[] = []
  collectArticles(`./docs/${region}/${REGION_SOURCE_LOCALE[region]}`, '', acc)
  regionArticles[region] = acc
}

const sharedNav = [
  { text: '首页', link: '/' },
  { text: '文档', link: '/docs/' },
  { text: 'Developers', link: 'https://open.longbridge.com', target: '_blank' },
]

const editLinkPattern = 'https://github.com/longbridge/docs/edit/main/docs/:path'

export default defineConfig({
  title: zhCN.vp.title,
  description: zhCN.vp.description,
  // 单 VitePress 实例同时服务 /hk/* 与 /sg/*。产物落到 .vitepress/dist 根下
  // （含 /hk 与 /sg 子目录），dev 端 `yarn dev` 一个端口即可访问全部 region。
  base: '/',
  outDir: '.vitepress/dist',
  appearance: 'light',
  ignoreDeadLinks: true,
  cleanUrls: true,

  // 部署到 OSS + 主域 nginx 反代时启用：把所有 dist 产物 URL 重写为完整 CDN URL
  // （JS/CSS/字体/图片/runtime 拼接的 hashmap.json 与 page chunk），同时保留 page
  // link href 不动，确保导航留在主域。无 env var 时 no-op，本地 dev 不受影响。
  buildEnd: process.env.ASSETS_CDN_PREFIX
    ? buildEndCdnPrefix(process.env.ASSETS_CDN_PREFIX)
    : undefined,

  head: [
    ['link', { rel: 'shortcut icon', type: 'image/x-icon', href: 'https://assets.wbrks.com/assets/logo/logo1.png' }],
  ],

  // rewrites 把 `<region>/en/*` 落到 `<region>/*`，让 en 成为该 region 的默认
  // locale（URL 不带语言段）。zh-CN/zh-HK 的 URL 直接等于 src 路径，不需要 rewrite。
  //   docs/hk/en/foo.md      → /hk/foo
  //   docs/hk/zh-CN/foo.md   → /hk/zh-CN/foo
  //   docs/sg/en/account/*   → /sg/account/*
  rewrites: {
    'hk/en/:path*': 'hk/:path*',
    'sg/en/:path*': 'sg/:path*',
    'us/en/:path*': 'us/:path*',
  },

  // 6 个 locale：root（en，匹配 /hk/* /sg/* /us/* 中不在子 locale 下的 URL）+ 5
  // 个 region+lang 组合多段 key(hk/zh-CN、hk/zh-HK、sg/zh-CN、sg/zh-HK、us/zh-HK)。
  // US 只启用 en + zh-HK,没有 us/zh-CN 条目。VitePress 按 URL 最长前缀匹配解析当前 locale。
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      link: '/hk/',
      title: 'Longbridge Docs',
      description: 'Longbridge Docs',
      themeConfig: {
        nav: sharedNav,
        sidebar: sidebarRoot,
        outline: { level: [2, 4], label: 'On this page' },
        lastUpdated: { text: 'Last updated', formatOptions: { dateStyle: 'medium' } },
        editLink: { pattern: editLinkPattern, text: 'Edit this page on GitHub' },
        docFooter: { prev: 'Previous', next: 'Next' },
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Return to top',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        skipToContentLabel: 'Skip to content',
      },
    },
    'hk/zh-CN': {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/hk/zh-CN/',
      title: zhCN.vp.title,
      description: zhCN.vp.description,
      themeConfig: {
        nav: sharedNav,
        sidebar: sidebarHkZhCN,
        outline: { level: [2, 4], label: zhCN.vp.outline },
        lastUpdated: { text: zhCN.vp.lastUpdated, formatOptions: { dateStyle: 'medium' } },
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
    },
    'hk/zh-HK': {
      label: '繁體中文',
      lang: 'zh-HK',
      link: '/hk/zh-HK/',
      title: 'Longbridge Docs',
      description: 'Longbridge Docs',
      themeConfig: {
        nav: sharedNav,
        sidebar: sidebarHkZhHK,
        outline: { level: [2, 4], label: '本頁內容' },
        lastUpdated: { text: '最近更新', formatOptions: { dateStyle: 'medium' } },
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
    },
    'sg/zh-CN': {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/sg/zh-CN/',
      title: zhCN.vp.title,
      description: zhCN.vp.description,
      themeConfig: {
        nav: sharedNav,
        sidebar: sidebarSgZhCN,
        outline: { level: [2, 4], label: zhCN.vp.outline },
        lastUpdated: { text: zhCN.vp.lastUpdated, formatOptions: { dateStyle: 'medium' } },
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
    },
    'sg/zh-HK': {
      label: '繁體中文',
      lang: 'zh-HK',
      link: '/sg/zh-HK/',
      title: 'Longbridge Docs',
      description: 'Longbridge Docs',
      themeConfig: {
        nav: sharedNav,
        sidebar: sidebarSgZhHK,
        outline: { level: [2, 4], label: '本頁內容' },
        lastUpdated: { text: '最近更新', formatOptions: { dateStyle: 'medium' } },
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
    },
    'us/zh-HK': {
      label: '繁體中文',
      lang: 'zh-HK',
      link: '/us/zh-HK/',
      title: 'Longbridge Docs',
      description: 'Longbridge Docs',
      themeConfig: {
        nav: sharedNav,
        sidebar: sidebarUsZhHK,
        outline: { level: [2, 4], label: '本頁內容' },
        lastUpdated: { text: '最近更新', formatOptions: { dateStyle: 'medium' } },
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
    },
  },

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
    plugins: [UnoCSS(), rawMarkdownPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './theme'),
      },
    },
    define: {
      __VUE_PROD_DEVTOOLS__: false,
      // 注入每 region 实际存在的顶级分类列表，给 HomeNavbar 过滤 NAV_TABS
      __LB_REGION_CATEGORIES__: JSON.stringify(regionCategories),
      // 注入每 region 实际存在的文章路径列表（无 .md 后缀，以 / 开头），
      // 让 TaskIndex 等 home section 在 sg 等内容不全的 region 下过滤掉
      // 对应缺失的卡片
      __LB_REGION_ARTICLES__: JSON.stringify(regionArticles),
    },
    ssr: {
      noExternal: ['vue-i18n', '@intlify/core-base', '@intlify/message-compiler'],
    },
  },
})
