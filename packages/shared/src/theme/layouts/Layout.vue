<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useData, useRoute, inBrowser } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomeNavbar from '../components/HomeNavbar.vue'
import PageHero from '../components/PageHero.vue'
import PageFeedback from '../components/PageFeedback.vue'
import SearchDialog from '../components/SearchDialog.vue'
import AiChatDrawer from '../components/AiChatDrawer.vue'
import { useAIModal } from '../composables/useAIModal'
import { useI18n } from '../../i18n/useI18n'

const { frontmatter } = useData()

const isDocPage = computed(() => {
  const layout = frontmatter.value.layout
  return !layout || layout === 'doc'
})

const isHomePage = computed(() => frontmatter.value.layout === 'page')

const { modalOpen, initialQuery, openAIModal } = useAIModal()
const { t } = useI18n()

// 抽屉打开时给 html 加 .ai-drawer-open，tailwind.css 里有现成的规则把 main
// 内容、navbar 右侧 padding 挤开 var(--ai-drawer-width)，保证抽屉不遮挡正文
watch(modalOpen, (open) => {
  if (!inBrowser) return
  document.documentElement.classList.toggle('ai-drawer-open', open)
}, { immediate: true })

function syncHomeClass(val: boolean) {
  if (!inBrowser) return
  document.documentElement.classList.toggle('home-page-layout', val)
}
watch(isHomePage, syncHomeClass, { immediate: true })
// 动态测 navbar 实际高度（hn-top-bar + hn-sub-bar），写到 --hn-height CSS 变量。
// 避免靠手算导致 sidebar/VPDoc padding-top 估算偏小、被 nav 遮挡。
function syncNavHeight() {
  if (!inBrowser) return
  const nav = document.querySelector<HTMLElement>('.hn-root')
  if (!nav) return
  const h = nav.offsetHeight
  if (h > 0) document.documentElement.style.setProperty('--hn-height', h + 'px')
}

let navResizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!inBrowser) return
  document.documentElement.classList.add('custom-nav-layout')
  syncHomeClass(isHomePage.value)
  // 首次同步 + 监听 nav 自身尺寸变化（语言切换/字号变化/响应式）
  requestAnimationFrame(syncNavHeight)
  const nav = document.querySelector<HTMLElement>('.hn-root')
  if (nav && typeof ResizeObserver !== 'undefined') {
    navResizeObserver = new ResizeObserver(syncNavHeight)
    navResizeObserver.observe(nav)
  }
  window.addEventListener('resize', syncNavHeight)
})
onBeforeUnmount(() => {
  if (!inBrowser) return
  document.documentElement.classList.remove('custom-nav-layout')
  document.documentElement.classList.remove('home-page-layout')
  navResizeObserver?.disconnect()
  navResizeObserver = null
  window.removeEventListener('resize', syncNavHeight)
})

// 文章页：把侧边栏激活项滚动到视口中间（仅初次进入或路由切换时执行一次）
const route = useRoute()
function centerActiveSidebarItem() {
  if (!inBrowser) return
  // 等 VitePress 完成激活计算 + .items max-height transition (~0.28s) 完全结束
  setTimeout(() => {
    const sidebar = document.querySelector<HTMLElement>('.VPSidebar')
    if (!sidebar) return
    // 不排除 collapsible：group 本身指向 overview 时，VitePress 把它标为 is-active，
    // 应该跟普通 leaf 一样滚到屏幕中间（is-active 始终是当前页本身；ancestor 是 has-active）
    const active = sidebar.querySelector<HTMLElement>(
      '.VPSidebarItem.is-active > .item > .link, ' +
      '.VPSidebarItem.is-active > .item > .VPLink'
    )
    if (!active) return
    const aRect = active.getBoundingClientRect()
    if (aRect.height === 0) return
    const sRect = sidebar.getBoundingClientRect()
    // sidebar top:0；顶部 padding-top(--hn-height) 区被 nav 遮挡，可见区
    // 中心 = navHeight + (sidebar.height - navHeight)/2
    const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hn-height')) || 0
    const visibleHeight = sRect.height - navHeight
    const target = sidebar.scrollTop + (aRect.top - sRect.top) - navHeight - visibleHeight / 2 + aRect.height / 2
    sidebar.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, 50)
}
watch(() => route.path, centerActiveSidebarItem, { immediate: true })
onMounted(centerActiveSidebarItem)

// 点击 group link 的拦截逻辑挪到 theme/index.ts 顶层，
// 必须先于 VitePress router click 拦截注册才能 stopImmediatePropagation 生效。
// 这里只接收它派出的事件，rAF 后持久化用户偏好
function onGroupToggled(e: Event) {
  const detail = (e as CustomEvent<{ group: HTMLElement }>).detail
  if (!detail?.group) return
  requestAnimationFrame(() => persistGroupState(detail.group))
}

// ── client-side 持久化用户折叠偏好 ─────────────────────────────────────
// 二级及以下 group 默认展开；localStorage 记录"被用户主动收起"的 key 集合。
// 未主动收起的 group 保持展开；含 active 后代的 group 始终展开（VitePress 默认）。
const COLLAPSED_KEY = 'lb-sidebar-collapsed-groups'

function loadCollapsed(): Set<string> {
  if (!inBrowser) return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '[]'))
  } catch { return new Set() }
}

function saveCollapsed(set: Set<string>) {
  if (!inBrowser) return
  try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set])) } catch { /* ignore */ }
}

function groupKey(el: HTMLElement): string {
  // 优先用 link href（稳定且唯一），fallback 到 text 文本
  const a = el.querySelector<HTMLAnchorElement>(':scope > .item > .link')
  const href = a?.getAttribute('href')
  if (href) return href
  const text = el.querySelector<HTMLElement>(':scope > .item > .text')
  return (text?.textContent || '').trim()
}

function persistGroupState(groupItem: HTMLElement) {
  // 只持久化二级及以下（level-0 默认展开，不参与）
  if (groupItem.classList.contains('level-0')) return
  const k = groupKey(groupItem)
  if (!k) return
  const set = loadCollapsed()
  if (groupItem.classList.contains('collapsed')) set.add(k)
  else set.delete(k)
  saveCollapsed(set)
}

function applyCollapsedPreference() {
  if (!inBrowser) return
  const collapsed = loadCollapsed()
  document.querySelectorAll<HTMLElement>('.VPSidebar .VPSidebarItem.collapsible').forEach(el => {
    // 一级菜单（level-0）始终展开，不参与
    if (el.classList.contains('level-0')) return
    // 当前页所在分支始终展开（is-active = 自身就是 active leaf；
    // has-active = 内部含 active 后代），保持 VitePress 默认"父级展开到当前页"行为
    if (el.classList.contains('is-active') || el.classList.contains('has-active')) return
    const k = groupKey(el)
    if (!k) return
    // 默认展开：只有 localStorage 标记为"用户主动收起"才收起
    const wantCollapsed = collapsed.has(k)
    const isCollapsed = el.classList.contains('collapsed')
    if (wantCollapsed === isCollapsed) return
    const caret = el.querySelector<HTMLElement>(':scope > .item > .caret')
    caret?.click()
  })
}

onMounted(() => {
  if (!inBrowser) return
  window.addEventListener('lb:sidebar:group-toggled', onGroupToggled)
})
onBeforeUnmount(() => {
  if (!inBrowser) return
  window.removeEventListener('lb:sidebar:group-toggled', onGroupToggled)
})

// 路由切换/首次挂载后，把用户偏好应用回去（SSR 期间无 rAF，跳过）
watch(() => route.path, () => {
  if (!inBrowser) return
  requestAnimationFrame(() => requestAnimationFrame(applyCollapsedPreference))
}, { immediate: true })
onMounted(applyCollapsedPreference)
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-top>
      <HomeNavbar />
    </template>
    <template #doc-before>
      <PageHero v-if="isDocPage" />
    </template>
    <template #doc-after>
      <PageFeedback v-if="isDocPage" />
    </template>
    <template #layout-bottom>
      <SearchDialog />
      <AiChatDrawer v-model="modalOpen" :initial-query="initialQuery" />
      <button
        v-if="!isHomePage"
        v-show="!modalOpen"
        class="ai-fab-mobile fixed bottom-7 right-7 w-12 h-12 rounded-full bg-brand-1 text-white border-0 cursor-pointer flex items-center justify-center z-[999] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5"
        style="box-shadow: 0 4px 16px var(--vp-c-brand-soft);"
        @click="openAIModal()"
        :aria-label="t('common.openAiAssistant')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z"
            fill="currentColor" />
        </svg>
      </button>
    </template>
  </DefaultTheme.Layout>
</template>
