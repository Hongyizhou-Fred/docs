import { ref } from 'vue'
import MiniSearch from 'minisearch'

export interface DocSearchItem {
  id: string
  title: string
  titles: string[]
  text?: string
  score: number
}

let miniSearchInstance: MiniSearch | null = null
let loadPromise: Promise<MiniSearch | null> | null = null

async function loadIndex(lang: string): Promise<MiniSearch | null> {
  if (miniSearchInstance) return miniSearchInstance
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      // @ts-ignore — VitePress virtual module, generated when provider:'local' is set
      const allIndexes = await import('@localSearchIndex')
      const loaderFn = allIndexes.default?.[lang] ?? allIndexes.default?.['root']
      if (!loaderFn) return null

      const data = await loaderFn()
      const json: string = typeof data === 'string' ? data : (data?.default ?? '')

      miniSearchInstance = MiniSearch.loadJSON(json, {
        fields: ['title', 'titles', 'text'],
        storeFields: ['title', 'titles', 'text'],
      })
      return miniSearchInstance
    } catch (e) {
      console.warn('[SearchDialog] Failed to load search index:', e)
      loadPromise = null
      return null
    }
  })()

  return loadPromise
}

export function useDocsSearch() {
  const results = ref<DocSearchItem[]>([])
  const isSearching = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout>

  async function search(query: string, lang = 'root') {
    clearTimeout(debounceTimer)

    if (!query.trim()) {
      results.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      isSearching.value = true
      const ms = await loadIndex(lang)

      if (!ms) {
        isSearching.value = false
        return
      }

      const raw = ms.search(query, {
        fuzzy: 0.2,
        prefix: true,
        boost: { title: 4, text: 2, titles: 1 },
      })

      results.value = raw.slice(0, 8).map((r) => ({
        id: String(r.id),
        title: String(r.title ?? ''),
        titles: Array.isArray(r.titles) ? r.titles : [],
        text: r.text ? String(r.text) : undefined,
        score: r.score,
      }))
      isSearching.value = false
    }, 100)
  }

  function clear() {
    clearTimeout(debounceTimer)
    results.value = []
  }

  return { results, isSearching, search, clear }
}
