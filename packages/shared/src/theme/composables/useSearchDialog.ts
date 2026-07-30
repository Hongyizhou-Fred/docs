import { ref } from 'vue'
import { inBrowser } from 'vitepress'

const isOpen = ref(false)

export function useSearchDialog() {
  function open() {
    if (inBrowser) {
      window.dispatchEvent(new CustomEvent('lb:search:toggle'))
    } else {
      isOpen.value = true
    }
  }

  function close() {
    isOpen.value = false
  }

  return { isOpen, open, close }
}
