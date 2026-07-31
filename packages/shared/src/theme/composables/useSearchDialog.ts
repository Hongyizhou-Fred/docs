import { ref } from 'vue'
import { inBrowser } from 'vitepress'

const isOpen = ref(false)

// 带初始 query 打开时的暂存值:SearchDialog 在 open 时消费一次并清空。
// 场景:US whale-embed 下 AI 关闭，hero 输入框的提问 fallback 到搜索弹窗，
// 用户已输入的内容要预填进搜索框，不能丢。
const pendingQuery = ref<string | null>(null)

export function useSearchDialog() {
  function open(query?: string) {
    pendingQuery.value = query?.trim() ? query : null
    if (inBrowser) {
      window.dispatchEvent(new CustomEvent('lb:search:toggle'))
    } else {
      isOpen.value = true
    }
  }

  function close() {
    isOpen.value = false
  }

  /** SearchDialog 专用：取走并清空待预填的 query(一次性) */
  function consumePendingQuery(): string | null {
    const q = pendingQuery.value
    pendingQuery.value = null
    return q
  }

  return { isOpen, open, close, consumePendingQuery }
}
