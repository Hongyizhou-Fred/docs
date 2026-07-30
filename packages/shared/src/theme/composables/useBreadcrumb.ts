import { computed } from 'vue'
import { useRoute, useData } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { NAV_TABS_BY_REGION } from '../../config/tabs.config'

// 面包屑分组按本 app 的 region tabs 解析 (US 用 Zendesk 分类 tabs)
const NAV_TABS = NAV_TABS_BY_REGION[typeof __LB_REGION__ !== 'undefined' ? __LB_REGION__ : 'hk']
import { useI18n } from '../../i18n/useI18n'
import { useRegion } from './useRegion'

export interface BreadcrumbItem {
  text: string
  link?: string
}

const REGION_PREFIX_RE = /^\/(hk|sg|us)(?=\/|$)/
const LOCALE_PREFIX_RE = /^\/(zh-CN|zh-HK)(?=\/|$)/

// 同时剥掉 region 和 locale 前缀 —— 它们不属于文章层级
function stripPrefixes(p: string): { rest: string; locale: string } {
  let rest = p.replace(REGION_PREFIX_RE, '')
  const localeMatch = rest.match(LOCALE_PREFIX_RE)
  const locale = localeMatch?.[0] ?? ''
  rest = rest.replace(LOCALE_PREFIX_RE, '') || '/'
  return { rest, locale }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

// 在 sidebar 中找指定 link 对应的标题（精确匹配）
function findTitleByLink(
  items: DefaultTheme.SidebarItem[],
  link: string,
): string | null {
  for (const item of items) {
    if (item.link === link && item.text) return stripHtml(item.text)
    if (item.items?.length) {
      const r = findTitleByLink(item.items, link)
      if (r) return r
    }
  }
  return null
}

export function useBreadcrumb() {
  const route = useRoute()
  const { theme, page, frontmatter } = useData()
  const { t } = useI18n()
  const { withRegionAndLocale } = useRegion()
  const sidebar = computed(() => theme.value.sidebar)

  // 把 sidebar 配置摊平成数组（无论是 record 还是 array）
  const allSidebarItems = computed<DefaultTheme.SidebarItem[]>(() => {
    const s = sidebar.value
    if (!s) return []
    if (Array.isArray(s)) return s
    if (typeof s === 'object') {
      return Object.values(s).flatMap(v => (Array.isArray(v) ? v : []))
    }
    return []
  })

  // 根据 route.path 找出当前 NAV_TAB
  function findTab(currentPath: string) {
    const { rest: p } = stripPrefixes(currentPath)
    return NAV_TABS.find(tab =>
      tab.path !== '/' &&
      (p === tab.path || tab.categories.some(c => p.startsWith('/' + c + '/'))),
    )
  }

  // 当前页标题：frontmatter > page.title > sidebar 中查 link > url 末段
  function currentTitleFor(path: string, lastSeg: string): string {
    if (frontmatter.value?.title) return frontmatter.value.title
    if (page.value?.title) return page.value.title
    const fromSidebar = findTitleByLink(allSidebarItems.value, path)
    if (fromSidebar) return fromSidebar
    return lastSeg.replace(/-/g, ' ')
  }

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const currentPath = route.path
    const { rest: noPrefix } = stripPrefixes(currentPath)

    // 当前是主页 / 区域根 → 不显示面包屑
    if (noPrefix === '/' || noPrefix === '') return []

    // 面包屑规则：非叶子节点跳转目标统一为 `<path>/overview`（调用方在
    // withRegionAndLocale() 基础上叠加的定制逻辑）；withRegionAndLocale() 负责加 region + locale。

    // 1) 当前 tab —— 作为面包屑首位
    const tab = findTab(currentPath)
    const tabItem: BreadcrumbItem | null = tab
      ? {
        text: t(tab.label) || tab.key,
        link: withRegionAndLocale(`${tab.path}overview`),
      }
      : null

    // 2) 拆 URL 段，剔除末段（末段是当前页本身）
    const segments = noPrefix.replace(/^\/+/, '').split('/').filter(Boolean)
    const lastSeg = segments[segments.length - 1] || ''
    const intermediate = segments.slice(0, -1)

    // 3) 每段：dirNames 翻译 + 统一指向同级 /overview
    const intermediateItems: BreadcrumbItem[] = []
    for (let i = 0; i < intermediate.length; i++) {
      const seg = intermediate[i]
      const key = `data.dirNames.${seg}`
      const translated = t(key)
      const text = translated && translated !== key ? translated : seg
      const subPath = '/' + intermediate.slice(0, i + 1).join('/')
      intermediateItems.push({ text, link: withRegionAndLocale(`${subPath}/overview`) })
    }

    // 4) 当前页（无 link）
    const currentTitle = currentTitleFor(currentPath, lastSeg)
    const currentItem: BreadcrumbItem = { text: String(currentTitle) }

    // 5) 拼装：Tab / intermediate... / current
    //    Home 与 region（hk/sg）不属于文章层级，不参与面包屑
    const result: BreadcrumbItem[] = []
    if (tabItem) result.push(tabItem)

    // 去重：如果首段 intermediate 的显示文本与 tab 完全相同（多见于英文 locale，
    // nav.label 与 dirNames 翻译都是同一个词），跳过这段，避免「Derivatives / Derivatives」
    let working = intermediateItems
    if (tabItem && working[0]?.text === tabItem.text) {
      working = working.slice(1)
    }
    result.push(...working)

    // 去重：currentItem 文本与列表最后一项相同（如 tab overview 页 frontmatter.title === tab）
    const last = result[result.length - 1]
    if (!last || last.text !== currentItem.text) {
      result.push(currentItem)
    }
    return result
  })

  return { breadcrumbItems }
}
