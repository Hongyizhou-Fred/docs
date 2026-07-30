// 字符串字段统一使用 i18n key（消费方调 t()）；翻译在 i18n/locales/zh-CN.ts:data.tasks
export type Market = 'hk' | 'us' | 'sg'

export interface TaskCard {
  id: string
  /** i18n key */
  title: string
  /** i18n key */
  subtitle: string
  href: string
  markets: Market[]
  featured: boolean
  icon: string
}

export interface Category {
  id: string
  num: string
  /** i18n key */
  label: string
  tasks: TaskCard[]
}

const ALL: Market[] = ['hk', 'us', 'sg']

function task(
  id: string,
  href: string,
  markets: Market[],
  featured: boolean,
  icon: string,
): TaskCard {
  return {
    id,
    title: `data.tasks.${id}.title`,
    subtitle: `data.tasks.${id}.subtitle`,
    href,
    markets,
    featured,
    icon,
  }
}

export const categories: Category[] = [
  {
    id: 'account',
    num: '01',
    label: 'data.journey.account.title',
    tasks: [
      task('account-personal', '/account/opening/open-account', ALL, true, 'UserPlus'),
      task('account-types', '/account/account-types/comprehensive-account', ALL, true, 'Layers'),
      task('account-faq', '/account/account-faq', ALL, true, 'CircleHelp'),
      task('account-joint', '/account/account-types/comprehensive-account', ALL, false, 'Users'),
      task('account-switching', '/account/account-switching', ALL, false, 'ArrowLeftRight'),
    ],
  },
  {
    id: 'deposit',
    num: '02',
    label: 'data.journey.deposit.title',
    tasks: [
      task('deposit-choose', '/deposit/how-to-choose-deposit-method', ALL, true, 'ArrowDownToLine'),
      task('deposit-fps', '/deposit/hk-methods/fps', ['hk'], true, 'Zap'),
      task('deposit-edda', '/deposit/hk-methods/edda', ['hk', 'us'], true, 'RefreshCw'),
      task('deposit-wire', '/deposit/hk-methods/wire-transfer', ['hk', 'us'], false, 'Send'),
      task('deposit-paynow', '/deposit/sg-methods/paynow', ['sg'], true, 'Smartphone'),
      task('deposit-dda-sg', '/deposit/sg-methods/dda-authorization', ['sg'], false, 'RefreshCcw'),
      task('deposit-wise', '/deposit/sg-methods/wise', ['sg'], false, 'Globe'),
    ],
  },
  {
    id: 'trade',
    num: '03',
    label: 'data.journey.trade.title',
    tasks: [
      task('trade-first-hk', '/getting-started/buy-first-hk-stock', ['hk'], true, 'TrendingUp'),
      task('trade-rules-hk', '/stock-trading/trading-hours-and-rules/hk-trading-rules', ['hk'], true, 'BookOpen'),
      task('trade-fees', '/stock-trading/trading-fees/fee-schedule', ALL, true, 'Receipt'),
      task('trade-rules-us', '/stock-trading/trading-hours-and-rules/us-trading-rules', ['us'], true, 'BarChart2'),
      task('trade-regular-us', '/stock-trading/trading-hours-and-rules/us-regular-investment', ['us'], false, 'Timer'),
      task('trade-short-us', '/stock-trading/trading-hours-and-rules/us-short-selling', ['us'], false, 'TrendingDown'),
      task('trade-rules-sg', '/stock-trading/trading-hours-and-rules/sg-trading-rules', ['sg'], true, 'Globe2'),
      task('trade-order-types', '/stock-trading/order-types/', ALL, false, 'ListOrdered'),
    ],
  },
  {
    id: 'portfolio',
    num: '04',
    label: 'data.journey.portfolio.title',
    tasks: [
      task('portfolio-overview', '/portfolio-and-statements/overview', ALL, true, 'PieChart'),
      task('portfolio-pnl', '/portfolio-and-statements/pnl', ALL, true, 'BarChart3'),
      task('portfolio-statement', '/portfolio-and-statements/statement', ALL, true, 'FileText'),
    ],
  },
  {
    id: 'withdrawal',
    num: '05',
    label: 'data.journey.withdrawal.title',
    tasks: [
      task('withdrawal-hk-bank', '/withdrawal/to-hk-bank-card', ALL, true, 'ArrowUpFromLine'),
      task('withdrawal-online', '/withdrawal/hk-online-banking', ['hk'], true, 'Building2'),
      task('withdrawal-wire', '/withdrawal/wire-transfer', ALL, false, 'Send'),
      task('withdrawal-transfers', '/transfers-and-fx/cross-account-transfer', ['sg'], false, 'Shuffle'),
    ],
  },
  {
    id: 'advanced',
    num: '06',
    label: 'data.journey.advanced.title',
    tasks: [
      task('advanced-options', '/derivatives/options/enable-options', ALL, true, 'Flame'),
      task('advanced-margin', '/margin/margin-requirements', ALL, true, 'ShieldCheck'),
      task('advanced-us-tax', '/compliance-and-tax/us-stock-tax', ['us'], false, 'FileCheck'),
      task('advanced-troubleshoot', '/troubleshooting/', ALL, true, 'Wrench'),
    ],
  },
]

export function getMarketTasks(categoryId: string, market: Market): TaskCard[] {
  if (categoryId === 'all') {
    return categories.flatMap(c => c.tasks).filter(t => t.markets.includes(market) && t.featured)
  }
  const cat = categories.find(c => c.id === categoryId)
  return cat ? cat.tasks.filter(t => t.markets.includes(market)) : []
}

export function getMarketCount(categoryId: string, market: Market): number {
  return getMarketTasks(categoryId, market).length
}

export const markets: { value: Market; label: string }[] = [
  { value: 'hk', label: 'journey.markets.hk' },
  { value: 'us', label: 'journey.markets.us' },
  { value: 'sg', label: 'journey.markets.sg' },
]
