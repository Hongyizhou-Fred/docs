<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useData, inBrowser } from 'vitepress'
import {
  PhMagnifyingGlass as Search,
  PhHash as Hash,
  PhCaretRight as ChevronRight,
  PhSparkle as Sparkles,
  PhClock as Clock,
  PhX as X,
} from '@phosphor-icons/vue'
import { useSearchDialog } from '../composables/useSearchDialog'
import { useDocsSearch, type DocSearchItem } from '../composables/useDocsSearch'
import { useSearchHistory } from '../composables/useSearchHistory'
import { useAIModal } from '../composables/useAIModal'
import { useRegion } from '../composables/useRegion'
import { useI18n } from '../../i18n/useI18n'

const router = useRouter()
const { lang } = useData()
const { t } = useI18n()
const { withRegionAndLocale } = useRegion()
const { isOpen, close } = useSearchDialog()
const { results, isSearching, search, clear } = useDocsSearch()
const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
const { openAIModal } = useAIModal()

const query = ref('')
const selectedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

// ── Mode ────────────────────────────────────────────────────
const isHistoryMode = computed(() => !query.value.trim() && history.value.length > 0)
const hasAiRow = computed(() => query.value.trim().length > 0)

// Unified list for keyboard navigation
const activeList = computed<DocSearchItem[]>(() => {
  if (isHistoryMode.value) {
    return history.value.map((h) => ({ ...h, score: 0 }))
  }
  return results.value
})

const totalItems = computed(() =>
  activeList.value.length + (hasAiRow.value ? 1 : 0)
)

// AI row is at index 0 when present; results start at offset 1
const resultOffset = computed(() => (hasAiRow.value ? 1 : 0))

const showBody = computed(
  () =>
    isHistoryMode.value ||
    results.value.length > 0 ||
    (query.value.trim() && !isSearching.value)
)

// ── Open/close ───────────────────────────────────────────────
watch(isOpen, async (open) => {
  if (open) {
    query.value = ''
    selectedIndex.value = -1
    clear()
    if (inBrowser) {
      document.body.style.overflow = 'hidden'
      await nextTick()
      inputRef.value?.focus()
    }
  } else {
    if (inBrowser) document.body.style.overflow = ''
  }
})

watch(activeList, (list) => {
  selectedIndex.value = list.length > 0 ? 0 : hasAiRow.value ? 0 : -1
})

// ── Input ────────────────────────────────────────────────────
function handleInput() {
  selectedIndex.value = -1
  search(query.value, lang.value === 'root' ? 'root' : lang.value)
}

// ── Keyboard nav ─────────────────────────────────────────────
function handleKeydown(e: KeyboardEvent) {
  const total = totalItems.value
  if (total === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % total
    scrollSelected()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + total) % total
    scrollSelected()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const i = selectedIndex.value
    if (!isHistoryMode.value && i === 0 && hasAiRow.value) {
      askAI()
    } else {
      const itemIndex = i - resultOffset.value
      if (itemIndex >= 0 && itemIndex < activeList.value.length) {
        navigateTo(activeList.value[itemIndex])
      }
    }
  }
}

function scrollSelected() {
  nextTick(() => {
    listRef.value?.querySelector('[data-sel="true"]')?.scrollIntoView({ block: 'nearest' })
  })
}

// ── Actions ──────────────────────────────────────────────────
function navigateTo(item: DocSearchItem) {
  addToHistory(item)
  close()
  const raw = item.id.startsWith('/') ? item.id : '/' + item.id
  // withRegionAndLocale 幂等：item.id 可能已含 locale 前缀，也可能不含
  router.go(withRegionAndLocale(raw))
}

function askAI() {
  close()
  openAIModal(query.value)
}

function removeHistory(e: MouseEvent, id: string) {
  e.preventDefault()
  e.stopPropagation()
  removeFromHistory(id)
  if (history.value.length === 0) selectedIndex.value = -1
}

// ── Formatting ───────────────────────────────────────────────
function formatBreadcrumb(item: DocSearchItem): string {
  if (item.titles.length === 0) return ''
  return [...item.titles, item.title].join(' › ')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text: string, q: string): string {
  if (!q || !text) return text ?? ''
  const terms = q.trim().split(/\s+/).filter(Boolean)
  if (!terms.length) return text
  const pattern = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi')
  return text.replace(pattern, '<strong>$1</strong>')
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

// ── Global shortcuts ─────────────────────────────────────────
function onSearchToggle() {
  isOpen.value ? close() : (isOpen.value = true)
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault()
    close()
  }
}

onMounted(() => {
  if (!inBrowser) return
  window.addEventListener('lb:search:toggle', onSearchToggle)
  window.addEventListener('keydown', onGlobalKeydown, true)
})

onBeforeUnmount(() => {
  if (!inBrowser) return
  window.removeEventListener('lb:search:toggle', onSearchToggle)
  window.removeEventListener('keydown', onGlobalKeydown, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sdlg">
      <div v-if="isOpen" class="sdlg-root" @keydown.stop>
        <div class="sdlg-backdrop" @click="close" />

        <div class="sdlg-panel" role="dialog" :aria-label="t('search.dialogAriaLabel')" aria-modal="true">
          <!-- ── Input row ── -->
          <div class="sdlg-input-row">
            <Search :size="18" class="sdlg-search-icon" aria-hidden="true" />
            <input
              ref="inputRef"
              v-model="query"
              class="sdlg-input"
              type="search"
              :placeholder="t('search.placeholder')"
              autocomplete="off"
              spellcheck="false"
              @input="handleInput"
              @keydown="handleKeydown"
            />
            <kbd class="sdlg-esc" @click="close" role="button" tabindex="-1">{{ t('search.esc') }}</kbd>
          </div>

          <!-- ── Body ── -->
          <div v-if="showBody" class="sdlg-body">

            <!-- ── History mode (empty query) ── -->
            <template v-if="isHistoryMode">
              <div class="sdlg-section-header">
                <span>{{ t('search.recentSearches') }}</span>
                <button type="button" class="sdlg-clear-btn" @click="clearHistory">{{ t('search.clearAll') }}</button>
              </div>
              <div ref="listRef" class="sdlg-list">
                <a
                  v-for="(item, i) in activeList"
                  :key="item.id"
                  class="sdlg-item"
                  :class="{ 'sdlg-item--active': selectedIndex === i }"
                  :data-sel="selectedIndex === i ? 'true' : undefined"
                  :href="item.id"
                  @click.prevent="navigateTo(item)"
                  @mouseenter="selectedIndex = i"
                >
                  <!-- col 1: icon gutter -->
                  <Clock :size="13" class="sdlg-hash" aria-hidden="true" />

                  <!-- col 2 row 1: breadcrumb -->
                  <span v-if="formatBreadcrumb(item)" class="sdlg-breadcrumb">{{ formatBreadcrumb(item) }}</span>
                  <span v-else class="sdlg-breadcrumb-placeholder" />

                  <!-- col 2 row 2: title + excerpt -->
                  <div class="sdlg-item-row">
                    <div class="sdlg-item-text">
                      <span class="sdlg-item-title">{{ item.title }}</span>
                      <span v-if="item.text" class="sdlg-item-excerpt">{{ truncate(item.text, 110) }}</span>
                    </div>
                  </div>

                  <!-- col 3: remove button (visible on hover/select) -->
                  <button
                    type="button"
                    class="sdlg-history-remove"
                    :class="{ 'sdlg-history-remove--visible': selectedIndex === i }"
                    :title="t('search.removeItem')"
                    @click="removeHistory($event, item.id)"
                  >
                    <X :size="12" />
                  </button>
                </a>
              </div>
            </template>

            <!-- ── Search results mode ── -->
            <template v-else>
              <!-- AI row: always first -->
              <div v-if="hasAiRow" class="sdlg-ai-section">
                <span class="sdlg-ai-label">{{ t('search.askAiLabel') }}</span>
                <button
                  type="button"
                  class="sdlg-ai-item"
                  :class="{ 'sdlg-ai-item--active': selectedIndex === 0 }"
                  :data-sel="selectedIndex === 0 ? 'true' : undefined"
                  @click="askAI"
                  @mouseenter="selectedIndex = 0"
                >
                  <Sparkles :size="14" class="sdlg-sparkle" aria-hidden="true" />
                  <span>{{ t('search.askAiTemplate', { query }) }}</span>
                </button>
              </div>

              <div ref="listRef" class="sdlg-list">
                <a
                  v-for="(item, i) in results"
                  :key="item.id"
                  class="sdlg-item"
                  :class="{ 'sdlg-item--active': selectedIndex === i + resultOffset }"
                  :data-sel="selectedIndex === i + resultOffset ? 'true' : undefined"
                  :href="item.id"
                  @click.prevent="navigateTo(item)"
                  @mouseenter="selectedIndex = i + resultOffset"
                >
                  <!-- col 1: hash gutter (grid-row spans 1/3) -->
                  <Hash :size="13" class="sdlg-hash" aria-hidden="true" />

                  <!-- col 2 row 1: breadcrumb (only when parent titles exist) -->
                  <span v-if="formatBreadcrumb(item)" class="sdlg-breadcrumb">{{ formatBreadcrumb(item) }}</span>
                  <!-- placeholder to keep grid rows consistent when no breadcrumb -->
                  <span v-else class="sdlg-breadcrumb-placeholder" />

                  <!-- col 2 row 2: title + excerpt -->
                  <div class="sdlg-item-row">
                    <div class="sdlg-item-text">
                      <span
                        class="sdlg-item-title"
                        v-html="highlight(item.title, query)"
                      />
                      <span
                        v-if="item.text"
                        class="sdlg-item-excerpt"
                        v-html="highlight(truncate(item.text, 110), query)"
                      />
                    </div>
                  </div>

                  <!-- col 3: chevron always in DOM to keep grid stable -->
                  <ChevronRight
                    :size="14"
                    class="sdlg-chevron"
                    :style="{ visibility: selectedIndex === i + resultOffset ? 'visible' : 'hidden' }"
                    aria-hidden="true"
                  />
                </a>

                <div v-if="results.length === 0 && query.trim() && !isSearching" class="sdlg-empty">
                  {{ t('search.empty') }}
                </div>
              </div>
            </template>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ── */
.sdlg-root {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh 16px 0;
}

.sdlg-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

/* ── Panel ── */
.sdlg-panel {
  position: relative;
  width: 100%;
  max-width: 720px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 20px;
  box-shadow:
    0 32px 72px rgba(0, 0, 0, 0.22),
    0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ── Input row ── */
.sdlg-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.sdlg-search-icon {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
}

.sdlg-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--vp-c-text-1);
  line-height: 1.5;
  -webkit-appearance: none;
  appearance: none;
}

.sdlg-input::-webkit-search-decoration,
.sdlg-input::-webkit-search-cancel-button,
.sdlg-input::-webkit-search-results-button {
  display: none;
}

.sdlg-esc {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  letter-spacing: 0.03em;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ── Scrollable body ── */
.sdlg-body {
  border-top: 1px solid var(--vp-c-divider);
  max-height: 58vh;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

/* ── Section header ── */
.sdlg-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  letter-spacing: 0.01em;
}

/* Clear all button */
.sdlg-clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}

.sdlg-clear-btn:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
}

/* ── Result list ── */
.sdlg-list {
  padding: 4px 0;
}

/* Grid layout: [icon 36px] [content 1fr] [action auto] */
.sdlg-item {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  grid-template-rows: auto auto;
  padding: 8px 14px 9px 0;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.08s;
}

.sdlg-item--active {
  background: var(--vp-c-bg-soft);
}

/* Hash / clock icon — spans all rows, centered */
.sdlg-hash {
  grid-column: 1;
  grid-row: 1 / 3;
  align-self: center;
  justify-self: center;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.sdlg-breadcrumb {
  grid-column: 2;
  grid-row: 1;
  display: block;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  line-height: 1.35;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sdlg-breadcrumb-placeholder {
  grid-column: 2;
  grid-row: 1;
  display: block;
  height: 0;
}

.sdlg-item-row {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  align-items: flex-start;
  min-width: 0;
  overflow: hidden;
}

.sdlg-item-text {
  flex: 1;
  min-width: 0;
}

.sdlg-item-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.sdlg-item-title :deep(strong) {
  font-weight: 700;
}

.sdlg-item-excerpt {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sdlg-item-excerpt :deep(strong) {
  font-weight: 600;
  color: var(--vp-c-text-2);
}

/* Chevron (search results) */
.sdlg-chevron {
  grid-column: 3;
  grid-row: 1 / 3;
  align-self: center;
  flex-shrink: 0;
  color: var(--vp-c-text-2);
  margin-left: 4px;
}

/* History remove button */
.sdlg-history-remove {
  grid-column: 3;
  grid-row: 1 / 3;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-3);
  opacity: 0;
  transition: opacity 0.1s, background 0.1s;
  flex-shrink: 0;
  margin-left: 4px;
}

.sdlg-history-remove--visible,
.sdlg-item--active .sdlg-history-remove {
  opacity: 1;
}

.sdlg-history-remove:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}

.sdlg-empty {
  padding: 20px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

/* ── AI section ── */
.sdlg-ai-section {
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 6px;
}

.sdlg-ai-label {
  display: block;
  padding: 10px 16px 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  letter-spacing: 0.01em;
}

.sdlg-ai-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 16px 10px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  transition: background 0.08s;
}

.sdlg-ai-item--active {
  background: var(--vp-c-bg-soft);
}

.sdlg-sparkle {
  flex-shrink: 0;
  color: var(--vp-c-brand-1);
}

/* ── Transition ── */
.sdlg-enter-active {
  transition: opacity 0.15s ease;
}
.sdlg-leave-active {
  transition: opacity 0.12s ease;
}
.sdlg-enter-from,
.sdlg-leave-to {
  opacity: 0;
}
</style>

<style>
/* Panel scale — not scoped so it targets nested .sdlg-panel within transition */
.sdlg-enter-active .sdlg-panel,
.sdlg-leave-active .sdlg-panel {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.sdlg-enter-from .sdlg-panel,
.sdlg-leave-to .sdlg-panel {
  transform: translateY(-6px) scale(0.985);
  opacity: 0;
}
</style>
