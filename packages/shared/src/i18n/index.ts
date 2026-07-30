import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import en from './locales/en'
import zhHK from './locales/zh-HK'

export const i18n = createI18n({
  legacy: false,
  globalInjection: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  silentFallbackWarn: true,
  silentTranslationWarn: true,
  messages: {
    'zh-CN': zhCN,
    en,
    'zh-HK': zhHK,
  },
})
