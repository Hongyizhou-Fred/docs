/**
 * Whale App(长桥 App WebView) 环境探测工具集。
 *
 * 移植自 h5hub `packages/trade-pwd/src/env/index.ts`(该实现是纯 UA/query
 * 探测，不依赖 WhaleSDK),去掉了 url-parse / lodash / js-cookie 等三方依赖，
 * 全部换成原生 API;所有函数 SSR 安全 (VitePress 构建期渲染直接返回兜底值)。
 *
 * 约定的 App 注入信号 (与 h5hub 一致):
 *   - UA 含 `lbcommitid`            → Whale App 内
 *   - UA 含 `lbtheme/<mode>`        → App 主题 (light/dark)
 *   - UA 含 `lblang/<locale>`       → App 语言
 *   - UA 含 `lbaccountchannel/<ch>` → 租户渠道
 *   - query `?theme= / ?locale=`    → 显式覆盖 (优先级最高)
 */

// ── 基础 ─────────────────────────────────────────────────────────

export const isClient = () => typeof window !== 'undefined'
export const isServer = () => typeof window === 'undefined'

const ua = () => (isClient() ? window.navigator.userAgent || '' : '')

const searchParams = () =>
  isClient() ? new URLSearchParams(window.location.search) : new URLSearchParams()

const getCookie = (name: string): string => {
  if (isServer()) return ''
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

// ── App / 平台探测 ───────────────────────────────────────────────

/** 是否在 Whale App(长桥 App)WebView 内 */
export const isWhaleApp = (userAgent = ua()) => /lbcommitid/i.test(userAgent)

/** 是否 LongPort 品牌 App */
export const isLongPort = (userAgent = ua()) => /longport/i.test(userAgent)

/** 是否微信内置浏览器 */
export const isWeChat = (userAgent = ua()) => /micromessenger/i.test(userAgent)

export const isIOS = (userAgent = ua()) => /iPhone|iPad|iPod/i.test(userAgent)

export const isIPad = (userAgent = ua()) => {
  if (/iPad/i.test(userAgent)) return true
  // iPadOS 13+ 桌面模式 UA 伪装成 Mac，靠触点数识别
  return isClient() && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export const isAndroid = (userAgent = ua()) => /Android|Adr/.test(userAgent)

/** 是否长桥桌面端容器 (注入 window.$LB_DESKTOP) */
export const isLongbridgeDesktop = () =>
  isClient() && Boolean((window as any).$LB_DESKTOP)

/** 是否 GPUI 桌面容器 */
export const isGPUI = (userAgent = ua()) => userAgent.includes('gpui-desktop')

/** 纯浏览器 H5(不在任何 App/桌面容器内) */
export const isPlainBrowser = () => !isWhaleApp() && !isLongbridgeDesktop()

// ── 主题 ─────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark'

/** query `?theme=` 显式指定 */
export const getThemeModeByQuery = () => searchParams().get('theme') || ''

/** App UA `lbtheme/<mode>` */
export const getThemeModeByUA = (userAgent = ua()) => {
  const m = userAgent.match(/lbtheme\/(\S+)/)
  return m?.[1] || ''
}

/** html 的 theme / data-theme 属性 */
export const getThemeModeByHtml = () => {
  if (isServer()) return ''
  const html = document.documentElement
  return html.getAttribute('theme') || html.getAttribute('data-theme') || ''
}

/**
 * 获取当前环境主题。优先级:query > App UA > html 属性 > 'light'。
 * App 内嵌 WebView 场景由 App 通过 UA 注入，浏览器场景由站点自身管理。
 */
export const getAppThemeMode = (): ThemeMode => {
  if (isServer()) return 'light'
  const mode = getThemeModeByQuery() || getThemeModeByUA() || getThemeModeByHtml()
  return mode === 'dark' ? 'dark' : 'light'
}

/** 把主题写回 html 属性 (与 getThemeModeByHtml 对应) */
export const setAppThemeMode = (theme: ThemeMode) => {
  if (isServer() || !theme) return
  document.documentElement.setAttribute('theme', theme)
}

/** App UA / query 注入的 whale 主题名 (细分皮肤，非 light/dark) */
export const getWhaleThemeName = (userAgent = ua()) =>
  searchParams().get('whale_theme') || userAgent.match(/whale_theme\/(\S+)/)?.[1] || ''

/** App 注入的 WebView 背景色 (query `app_bg_color` / UA 同名段) */
export const getWhaleBackground = (userAgent = ua()) =>
  searchParams().get('app_bg_color') || userAgent.match(/app_bg_color\/(\S+)/)?.[1] || ''

// ── 语言 ─────────────────────────────────────────────────────────

export const SUPPORT_LOCALES = ['en', 'zh-CN', 'zh-HK'] as const
export type AppLocale = (typeof SUPPORT_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = 'en'

const isSupportedLocale = (v: string): v is AppLocale =>
  (SUPPORT_LOCALES as readonly string[]).includes(v)

// 浏览器 navigator.language → 站点 locale(zh-TW 归入繁体)
const BROWSER_LANG_MAP: Record<string, AppLocale> = {
  'en': 'en', 'en-us': 'en',
  'zh-hk': 'zh-HK', 'zh_hk': 'zh-HK', 'zh-tw': 'zh-HK',
  'zh-cn': 'zh-CN', 'zh_cn': 'zh-CN', 'zh': 'zh-CN',
}

/** query `?locale=` 显式指定 */
export const getLocaleByQuery = () => {
  const v = searchParams().get('locale') || ''
  return isSupportedLocale(v) ? v : ''
}

/** App UA `lblang/<locale>` */
export const getLocaleByAppUA = (userAgent = ua()) => {
  const v = userAgent.match(/lblang\/(\S+)/)?.[1] || ''
  return isSupportedLocale(v) ? v : ''
}

/** html lang 属性 */
export const getLocaleByHtml = () => {
  if (isServer()) return ''
  const v = document.documentElement.getAttribute('lang') || ''
  return isSupportedLocale(v) ? v : ''
}

/** cookie `locale` */
export const getLocaleByCookie = () => {
  const v = getCookie('locale')
  return isSupportedLocale(v) ? v : ''
}

/**
 * 从 pathname 提取 locale。本站 URL 形如 /{region}/{locale}/...
 * (en 是默认 locale,URL 不带语言段),先剥 region 段再匹配。
 */
export const getLocaleFromPathname = (pathname?: string): AppLocale | '' => {
  if (isServer() && pathname == null) return ''
  const p = (pathname ?? window.location.pathname).replace(/^\/(hk|sg|us)(?=\/|$)/, '')
  const seg = p.split('/').filter(Boolean)[0] || ''
  return isSupportedLocale(seg) ? seg : ''
}

/** 浏览器语言 (兜底用，永远返回受支持的 locale) */
export const getLocaleByBrowserUA = (): AppLocale => {
  if (isServer()) return DEFAULT_LOCALE
  const lang = (navigator.language || '').toLowerCase()
  return BROWSER_LANG_MAP[lang] || BROWSER_LANG_MAP[lang.split('-')[0]] || DEFAULT_LOCALE
}

/**
 * 获取当前环境语言。
 * 优先级:query > URL 路径 > App UA > cookie > 浏览器语言 > html lang > 'en'。
 */
export const getAppLocale = (): AppLocale => {
  if (isServer()) return DEFAULT_LOCALE
  return (
    getLocaleByQuery() ||
    getLocaleFromPathname() ||
    getLocaleByAppUA() ||
    getLocaleByCookie() ||
    getLocaleByBrowserUA()
  )
}

// ── 租户 / App 标识 ───────────────────────────────────────────────

/** query `?account_channel=` */
export const getAccountChannelByQuery = () => searchParams().get('account_channel') || ''

/** App UA `lbaccountchannel/<channel>` */
export const getAccountChannelByUA = (userAgent = ua()) =>
  userAgent.match(/lbaccountchannel\/(\S*)/)?.[1] || ''

export const getAccountChannelByCookie = () =>
  getCookie('account-channel') || getCookie('account_channel')

/** 获取租户渠道。优先级:query > App UA > cookie > sessionStorage */
export const getAccountChannel = (): string => {
  if (isServer()) return ''
  return (
    getAccountChannelByQuery() ||
    getAccountChannelByUA() ||
    getAccountChannelByCookie() ||
    window.sessionStorage.getItem('account_channel') ||
    ''
  )
}

/** query `?app_id=` */
export const getAppIdByQuery = () => searchParams().get('app_id') || ''

/** App UA `<app_id>/(ios|android)/...` */
export const getAppIdByUA = (userAgent = ua()) =>
  userAgent.match(/(\S*)\/(ios|android)\//)?.[1] || ''

/** 获取 App ID。优先级:query > App UA > sessionStorage */
export const getAppId = (): string => {
  if (isServer()) return ''
  return getAppIdByQuery() || getAppIdByUA() || window.sessionStorage.getItem('app_id') || ''
}
