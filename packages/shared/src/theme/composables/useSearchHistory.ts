import { ref } from 'vue'
import { inBrowser } from 'vitepress'
import type { DocSearchItem } from './useDocsSearch'

// 按 region 隔离：三个 region 站点在生产是同一域名 (localStorage 同源共享),
// 不隔离的话 HK 的搜索记录会出现在 US 弹窗里，点击后被改写成 /us/<hk路径> → 404。
const REGION = typeof __LB_REGION__ !== 'undefined' ? __LB_REGION__ : 'hk'
const STORAGE_KEY = `lb-search-history:${REGION}`
const MAX_ITEMS = 6

type HistoryItem = Pick<DocSearchItem, 'id' | 'title' | 'titles' | 'text'>

const history = ref<HistoryItem[]>([])

// monorepo 拆分前的全局 key。首次以 region key 访问时做一次性迁移，让用户
// 之前的搜索记录 (含本 region 的) 不丢;跨 region 条目由展示层 articleExists
// 过滤隐藏。不删老 key —— 其他 region 首访时还要从它迁移，残留无害。
const LEGACY_STORAGE_KEY = 'lb-search-history'

function load(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as HistoryItem[]
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, legacy)
      return JSON.parse(legacy) as HistoryItem[]
    }
    return []
  } catch {
    return []
  }
}

function persist(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

if (inBrowser) {
  history.value = load()
}

export function useSearchHistory() {
  function addToHistory(item: DocSearchItem) {
    const deduped = history.value.filter((h) => h.id !== item.id)
    const next: HistoryItem[] = [
      { id: item.id, title: item.title, titles: item.titles, text: item.text },
      ...deduped,
    ].slice(0, MAX_ITEMS)
    history.value = next
    persist(next)
  }

  function removeFromHistory(id: string) {
    const next = history.value.filter((h) => h.id !== id)
    history.value = next
    persist(next)
  }

  function clearHistory() {
    history.value = []
    persist([])
  }

  return { history, addToHistory, removeFromHistory, clearHistory }
}
