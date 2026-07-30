// 字符串字段统一使用 i18n key（消费方调 t()），翻译在 i18n/locales/zh-CN.ts:newUserPath.steps
export interface UserPathStep {
  id: string
  num: string
  /** i18n key */
  title: string
  /** i18n key */
  subtitle: string
  path: string
  /** i18n key */
  durationLabel: string
}

export const newUserSteps: UserPathStep[] = [
  {
    id: 'download-app',
    num: '01',
    title: 'newUserPath.steps.downloadApp.title',
    subtitle: 'newUserPath.steps.downloadApp.subtitle',
    path: '/getting-started/download-app',
    durationLabel: 'newUserPath.steps.downloadApp.duration',
  },
  {
    id: 'register',
    num: '02',
    title: 'newUserPath.steps.register.title',
    subtitle: 'newUserPath.steps.register.subtitle',
    path: '/account/opening/open-account',
    durationLabel: 'newUserPath.steps.register.duration',
  },
  {
    id: 'kyc',
    num: '03',
    title: 'newUserPath.steps.kyc.title',
    subtitle: 'newUserPath.steps.kyc.subtitle',
    path: '/account/opening/open-account',
    durationLabel: 'newUserPath.steps.kyc.duration',
  },
  {
    id: 'deposit',
    num: '04',
    title: 'newUserPath.steps.deposit.title',
    subtitle: 'newUserPath.steps.deposit.subtitle',
    path: '/deposit/how-to-choose-deposit-method',
    durationLabel: 'newUserPath.steps.deposit.duration',
  },
  {
    id: 'buy-stock',
    num: '05',
    title: 'newUserPath.steps.buyStock.title',
    subtitle: 'newUserPath.steps.buyStock.subtitle',
    path: '/stock-trading/trading-hours-and-rules/hk-trading-rules',
    durationLabel: 'newUserPath.steps.buyStock.duration',
  },
]
