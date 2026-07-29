export interface NavTab {
  key: string
  label: string
  path: string
  categories: string[]
}

// HK / SG 共用的顶部导航 tabs。tab.path 是"当 tab 高亮时的 URL 前缀",categories
// 是该 tab 承接的顶级目录 slug 列表 (sidebar 拼装时会给每个 category 别名到同一
// 组 items)。REGION_CATEGORIES 在 config.mts 里注入，visibleNavTabs 会按实际存
// 在的目录过滤，不存在的 tab 自动隐藏。
export const NAV_TABS_HK_SG: NavTab[] = [
  {
    key: 'home',
    label: 'data.navTabs.home',
    path: '/',
    categories: [],
  },
  {
    key: 'getting-started',
    label: 'data.navTabs.getting-started',
    path: '/getting-started/',
    categories: [
      'getting-started', 'app-guide', 'account',
      'deposit', 'withdrawal', 'transfers-and-fx', 'troubleshooting',
    ],
  },
  {
    key: 'stock-trading',
    label: 'data.navTabs.stock-trading',
    path: '/stock-trading/',
    categories: ['stock-trading', 'ipo', 'margin', 'portfolio-and-statements'],
  },
  {
    key: 'derivatives',
    label: 'data.navTabs.derivatives',
    path: '/derivatives/',
    categories: ['derivatives'],
  },
  {
    key: 'crypto',
    label: 'data.navTabs.crypto',
    path: '/crypto/',
    categories: ['crypto'],
  },
  {
    key: 'funds-and-wealth',
    label: 'data.navTabs.funds-and-wealth',
    path: '/funds-and-wealth/',
    categories: ['funds-and-wealth', 'rewards'],
  },
  {
    key: 'compliance-and-tax',
    label: 'data.navTabs.compliance-and-tax',
    path: '/compliance-and-tax/',
    categories: ['compliance-and-tax'],
  },
  {
    key: 'market-data',
    label: 'data.navTabs.market-data',
    path: '/market-data/',
    categories: ['market-data'],
  },
]

// US 版 tabs:分类命名直接沿用 Zendesk category name 的 kebab-case slug
// (由 fetch 脚本 slugify 产出)。因为 Zendesk 分类粒度与 HK/SG 不一样，这里手工
// 归并成 5 个业务 tab(+ home)。新 category 增/删只需改这一处。
export const NAV_TABS_US: NavTab[] = [
  {
    key: 'home',
    label: 'data.navTabs.home',
    path: '/',
    categories: [],
  },
  {
    key: 'getting-started',
    label: 'data.navTabs.getting-started',
    path: '/opening-an-account/',
    categories: ['opening-an-account'],
  },
  {
    key: 'trading',
    label: 'data.navTabs.stock-trading',
    path: '/trading-and-investing/',
    categories: ['trading-and-investing'],
  },
  {
    key: 'funding',
    label: 'data.navTabs.funding',
    path: '/funding-your-account-withdrawals-and-transfer/',
    categories: ['funding-your-account-withdrawals-and-transfer'],
  },
  {
    key: 'account',
    label: 'data.navTabs.account',
    path: '/account-and-security/',
    categories: ['account-and-security'],
  },
  {
    key: 'about',
    label: 'data.navTabs.about',
    path: '/longbridge-community/',
    categories: ['longbridge-community', 'campaigns'],
  },
]

export type Region = 'hk' | 'sg' | 'us'

export const NAV_TABS_BY_REGION: Record<Region, NavTab[]> = {
  hk: NAV_TABS_HK_SG,
  sg: NAV_TABS_HK_SG,
  us: NAV_TABS_US,
}

// 向后兼容：未 region-aware 的地方仍可 import NAV_TABS，拿到 HK/SG 版本。
// 新代码应该走 NAV_TABS_BY_REGION[region]。
export const NAV_TABS = NAV_TABS_HK_SG
