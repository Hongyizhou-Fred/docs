import { useData, inBrowser } from 'vitepress'

export function useColorMode() {
  const { isDark } = useData()

  function toggle() {
    if (!inBrowser) return
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
