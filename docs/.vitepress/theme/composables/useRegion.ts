import { computed } from 'vue'
import { inBrowser, useData, useRoute } from 'vitepress'

// 由 config.mts 通过 vite define 注入：每 region 实际存在的文章路径列表
// （无 .md 后缀，以 / 开头），用于判断"目标页面是否存在"以隐藏失效链接
declare const __LB_REGION_ARTICLES__: Record<string, string[]>
const REGION_ARTICLES: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(typeof __LB_REGION_ARTICLES__ !== 'undefined' ? __LB_REGION_ARTICLES__ : {})
    .map(([k, v]) => [k, new Set(v)]),
)

export type Region = 'hk' | 'sg' | 'us'
const REGIONS: readonly Region[] = ['hk', 'sg', 'us'] as const
const REGION_URL_RE = /^\/(hk|sg|us)(\/|$)/
const isRegion = (v: string): v is Region => (REGIONS as readonly string[]).includes(v)

// region 优先级：URL 第一段 > cookie > 'hk' 默认。
// 单 VitePress 实例下 base=/，region 完全由 URL 路径段决定。
// 用 computed 读 useRoute().path 让 region 跟随 SPA 导航实时更新，避免在
// `/hk` 上初次挂载后切到 `/sg` 时 region 还卡在 'hk'。
export function useRegion() {
  const route = useRoute()
  const { lang } = useData()

  const region = computed<Region>(() => {
    const p = route.path.match(REGION_URL_RE)
    if (p) return p[1] as Region
    if (inBrowser) {
      const m = document.cookie.match(/(?:^|; )region=([^;]*)/)
      if (m && isRegion(m[1])) return m[1]
    }
    return 'hk'
  })

  /**
   * 项目内"跳转 URL 构造"的唯一公共方法。规则：
   *   1. 外链 / mailto / # / 相对路径：原样透传
   *   2. 目录路径（以 / 结尾，且非根 /）：自动补 overview
   *   3. lang === 'en'（root locale）：路径不带语言段
   *   4. lang === 'zh-CN' / 'zh-HK'：前缀 /<lang>
   *   5. 显式前缀当前 region（base=/，VitePress 不会自动加 region 段）
   *
   * 调用方传入"裸"路径（不带 region 与 locale 前缀），如 `/account/dormant-account`
   * 或 `/account/`。输出：`/hk/account/dormant-account`（en）/
   * `/hk/zh-CN/account/overview`（zh-CN 目录）。
   *
   * 幂等：href 已含 region/locale 前缀也能安全处理（先 strip 再重组）。
   */
  function withRegionAndLocale(href: string | undefined | null): string {
    if (!href) return ''
    if (/^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('#')) return href
    if (!href.startsWith('/')) return href
    // strip 已有 region + locale 前缀，保证 idempotent
    let bare = href.replace(/^\/(hk|sg|us)(\/(zh-CN|zh-HK))?/, '')
    if (!bare.startsWith('/')) bare = '/' + bare
    if (bare !== '/' && bare.endsWith('/')) bare = `${bare}overview`
    const localeSegment = lang.value === 'en' ? '' : `/${lang.value}`
    return `/${region.value}${localeSegment}${bare}`
  }

  // 跨 region：构造目标 region 的绝对 URL（忽略当前 region/locale）
  function toRegion(target: Region, pathWithinRegion = '/'): string {
    const rest = pathWithinRegion.startsWith('/') ? pathWithinRegion : '/' + pathWithinRegion
    return `/${target}${rest === '/' ? '/' : rest}`
  }

  /**
   * 当前 region 下指定文章是否存在。规则：
   *   - 外链 / 锚点 / mailto / 相对路径：直接放行（无法判断，默认存在）
   *   - 索引为空（SSR 或 define 未注入）：放行（避免误隐藏）
   *   - 目录路径（以 / 结尾，非根）：检查 `${path}overview`
   *   - 其他：strip region/locale 前缀后查 Set
   */
  function articleExists(href: string | undefined | null): boolean {
    if (!href) return false
    if (/^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) return true
    if (!href.startsWith('/')) return true
    const articles = REGION_ARTICLES[region.value]
    if (!articles || articles.size === 0) return true
    let bare = href.replace(/^\/(hk|sg|us)(\/(zh-CN|zh-HK))?/, '')
    if (bare !== '/' && bare.endsWith('/')) bare = `${bare}overview`
    if (!bare.startsWith('/')) bare = '/' + bare
    return articles.has(bare)
  }

  return { region, withRegionAndLocale, toRegion, articleExists }
}
