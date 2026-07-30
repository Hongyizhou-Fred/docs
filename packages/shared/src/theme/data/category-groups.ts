export interface CategoryItem {
  label: string
  path: string
}

export interface CategoryGroup {
  name: string
  items: CategoryItem[]
}

export const categoryGroups: CategoryGroup[] = [
  {
    name: 'data.categoryGroups.trading',
    items: [
      { label: 'data.categoryGroups.tradingItems.stock', path: '/stock-trading/' },
      { label: 'data.categoryGroups.tradingItems.options', path: '/derivatives/options/' },
      { label: 'data.categoryGroups.tradingItems.warrants', path: '/derivatives/warrants' },
      { label: 'data.categoryGroups.tradingItems.cbbc', path: '/derivatives/cbbc' },
      { label: 'data.categoryGroups.tradingItems.margin', path: '/margin/' },
      { label: 'data.categoryGroups.tradingItems.ipo', path: '/ipo/' },
    ],
  },
  {
    name: 'data.categoryGroups.finance',
    items: [
      { label: 'data.categoryGroups.financeItems.funds', path: '/funds-and-wealth/funds/' },
      { label: 'data.categoryGroups.financeItems.cashPlus', path: '/funds-and-wealth/cash-plus/' },
      { label: 'data.categoryGroups.financeItems.idle', path: '/funds-and-wealth/' },
      { label: 'data.categoryGroups.financeItems.structured', path: '/funds-and-wealth/' },
    ],
  },
  {
    name: 'data.categoryGroups.marketData',
    items: [
      { label: 'data.categoryGroups.marketDataItems.packages', path: '/market-data/' },
      { label: 'data.categoryGroups.marketDataItems.financial', path: '/market-data/' },
      { label: 'data.categoryGroups.marketDataItems.technical', path: '/market-data/' },
      { label: 'data.categoryGroups.marketDataItems.flow', path: '/market-data/' },
    ],
  },
  {
    name: 'data.categoryGroups.account',
    items: [
      { label: 'data.categoryGroups.accountItems.openAccount', path: '/account/' },
      { label: 'data.categoryGroups.accountItems.deposit', path: '/deposit/' },
      { label: 'data.categoryGroups.accountItems.withdrawal', path: '/withdrawal/' },
      { label: 'data.categoryGroups.accountItems.transfers', path: '/transfers-and-fx/' },
      { label: 'data.categoryGroups.accountItems.portfolio', path: '/portfolio-and-statements/' },
    ],
  },
  {
    name: 'data.categoryGroups.help',
    items: [
      { label: 'data.categoryGroups.helpItems.appGuide', path: '/app-guide/' },
      { label: 'data.categoryGroups.helpItems.compliance', path: '/compliance-and-tax/' },
      { label: 'data.categoryGroups.helpItems.troubleshooting', path: '/troubleshooting/' },
      { label: 'data.categoryGroups.helpItems.rewards', path: '/rewards/' },
    ],
  },
]
