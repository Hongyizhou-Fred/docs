import { computed } from 'vue'
import { useData } from 'vitepress'

// 由 createDocsConfig 通过 vite define 注入：本 region 实际存在的文章路径列表
// (无 .md 后缀，以 / 开头),用于判断"目标页面是否存在"以隐藏失效链接
const REGION_ARTICLES: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(typeof __LB_REGION_ARTICLES__ !== 'undefined' ? __LB_REGION_ARTICLES__ : {})
    .map(([k, v]) => [k, new Set(v)]),
)

export type Region = 'hk' | 'sg' | 'us'

// 单 app 单 region:region 是构建期常量 (vite define __LB_REGION__),
// 不再需要 URL 解析 / cookie 兜底。dev 环境未注入时回退 'hk'。
const CURRENT_REGION: Region =
  typeof __LB_REGION__ !== 'undefined' ? __LB_REGION__ : 'hk'

export function useRegion() {
  const { lang } = useData()

  const region = computed<Region>(() => CURRENT_REGION)

  /**
   * 项目内"跳转 URL 构造"的唯一公共方法。规则：
   *   1. 外链 / mailto / # / 相对路径：原样透传
   *   2. 目录路径 (以 / 结尾，且非根 /):自动补 overview
   *   3. lang === 'en'(root locale):路径不带语言段
   *   4. lang === 'zh-CN' / 'zh-HK':前缀 /<lang>
   *   5. 显式前缀当前 region(= VitePress base 段;theme 内手写 href 不经
   *      VitePress 链接归一化，所以要自己带上)
   *
   * 调用方传入"裸"路径 (不带 region 与 locale 前缀),如 `/account/dormant-account`
   * 或 `/account/`。输出:`/hk/account/dormant-account`(en)/
   * `/hk/zh-CN/account/overview`(zh-CN 目录)。
   *
   * 幂等:href 已含 region/locale 前缀也能安全处理 (先 strip 再重组)。
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
    return `/${CURRENT_REGION}${localeSegment}${bare}`
  }

  // 跨 region:构造目标 region 的绝对 URL(忽略当前 region/locale)。
  // 注意：跨 region = 跨 app，消费方必须用 window.location 整页跳转，
  // 不能走 VitePress router(目标页面不在当前 app 的路由表里)。
  function toRegion(target: Region, pathWithinRegion = '/'): string {
    const rest = pathWithinRegion.startsWith('/') ? pathWithinRegion : '/' + pathWithinRegion
    return `/${target}${rest === '/' ? '/' : rest}`
  }

  /**
   * 当前 region 下指定文章是否存在。规则：
   *   - 外链 / 锚点 / mailto / 相对路径：直接放行 (无法判断，默认存在)
   *   - 索引为空 (SSR 或 define 未注入):放行 (避免误隐藏)
   *   - 目录路径 (以 / 结尾，非根):检查 `${path}overview`
   *   - 其他:strip region/locale 前缀后查 Set
   */
  function articleExists(href: string | undefined | null): boolean {
    if (!href) return false
    if (/^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) return true
    if (!href.startsWith('/')) return true
    const articles = REGION_ARTICLES[CURRENT_REGION]
    if (!articles || articles.size === 0) return true
    let bare = href.replace(/^\/(hk|sg|us)(\/(zh-CN|zh-HK))?/, '')
    if (bare !== '/' && bare.endsWith('/')) bare = `${bare}overview`
    if (!bare.startsWith('/')) bare = '/' + bare
    return articles.has(bare)
  }

  return { region, withRegionAndLocale, toRegion, articleExists }
}
