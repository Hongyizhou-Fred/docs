import { ref } from 'vue'
import { inBrowser } from 'vitepress'
import type { DocSearchItem } from './useDocsSearch'

const STORAGE_KEY = 'lb-search-history'
const MAX_ITEMS = 6

type HistoryItem = Pick<DocSearchItem, 'id' | 'title' | 'titles' | 'text'>

const history = ref<HistoryItem[]>([])

function load(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HistoryItem[]) : []
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
