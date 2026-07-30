import { useI18n as useVueI18n } from 'vue-i18n'
import { useData } from 'vitepress'
import { watchEffect } from 'vue'

export function useI18n() {
  const { lang } = useData()
  const { t, locale } = useVueI18n()

  watchEffect(() => {
    const l = lang.value
    locale.value = (l === 'root' || !l) ? 'zh-CN' : l
  })

  return { t, lang, locale }
}
