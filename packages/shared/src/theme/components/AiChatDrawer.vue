<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useLocalStorage, useMediaQuery, useScrollLock } from '@vueuse/core'
import { useData } from 'vitepress'
import { PhArrowsOutSimple, PhArrowsInSimple, PhX } from '@phosphor-icons/vue'
import { useI18n } from '../../i18n/useI18n'
import { useRegion } from '../composables/useRegion'

// initialQuery 通过 Helora.sendQuestion() 注入（仅游客路由消费，ready 前自动排队）
const props = defineProps<{
  modelValue: boolean
  initialQuery?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
const { t } = useI18n()
const { isDark, lang } = useData()
const { region } = useRegion()

// ── Helora Embed SDK（inline 模式）──────────────────────────
// SDK 直接渲染进 .ai-drawer-inline 容器（width/height 100%，尺寸由容器 CSS
// 决定），无右下角浮窗、无 SDK 侧 resize；登录握手（x-bridge-token postMessage）、
// 游客模式与 bubble 模式一致。boot 必须在容器 DOM 就绪后调用，否则会
// throw "[Helora] inlineTarget not found"，因此放在 onMounted 动态加载。
const HELORA_SDK_SRC = 'https://assets.lbkrs.com/h5hub/helora-embed/helora-embed-1.0.0.dev.iife.js'

declare global {
  interface Window {
    Helora?: {
      boot: (options: {
        proxy: string
        source: string
        configPlatform: string
        configKey: string
        locale?: string
        guest?: boolean
        region?: 'HK' | 'SG'
        theme?: { mode?: 'light' | 'dark'; color?: string }
        hostCapabilities?: string[]
        question?: string
        mode: 'inline'
        inlineTarget: string | HTMLElement
      }) => void
      setRegion?: (region: 'HK' | 'SG' | null) => void
      setLocale?: (locale: string) => void
      setThemeMode?: (mode: 'light' | 'dark') => void
      sendQuestion?: (text: string) => void
      open?: () => void
      close?: () => void
      destroy?: () => void
    }
  }
}

const inlineEl = ref<HTMLElement>()

// useRegion 是小写 'hk' | 'sg'，SDK 约定大写
const heloraRegion = () => (region.value === 'sg' ? 'SG' : 'HK')

function bootHelora() {
  if (!window.Helora || !inlineEl.value) return
  window.Helora.boot({
    proxy: 'staging', // 验收通过后切 'prod'
    configPlatform: 'web',
    configKey: 'helora-agent-docs',
    source: 'web_docs',
    guest: true,
    // guest 专用市场 region（大写），落到 iframe 路径段 /helora/agent/hk|sg
    region: heloraRegion(),
    locale: lang.value,
    theme: { mode: isDark.value ? 'dark' : 'light' },
    hostCapabilities: ['theme:update', 'user:update'],
    mode: 'inline',
    inlineTarget: inlineEl.value,
  })
}

function loadHelora() {
  if (window.Helora) {
    bootHelora()
    return
  }
  const script = document.createElement('script')
  script.src = HELORA_SDK_SRC
  script.onload = bootHelora
  document.body.appendChild(script)
}

// ── 宿主状态 → Helora 通信（SDK 专用 setter，热切换无需重 boot）──
watch(isDark, (dark) => {
  window.Helora?.setThemeMode?.(dark ? 'dark' : 'light')
})

watch(lang, (locale) => {
  console.log(55555, locale)
  window.Helora?.setLocale?.(locale)
})

watch(region, () => {
  window.Helora?.setRegion?.(heloraRegion())
})

// 初始问题：仅游客路由消费；ready 前调用会自动排队，AI 流进行中后发覆盖先发
watch(
  () => props.initialQuery,
  (q) => {
    const text = q?.trim()
    if (text) window.Helora?.sendQuestion?.(text)
  },
)

// ── 桌面 drawer 宽度 + 拖拽 ──────────────────────────────────
const MIN_WIDTH = 320
const HARD_MAX = 900
// 内容区最低保留宽度：vitepress 设计稿断点 768px，留出这个值 + 一点 margin
// 才能让 home page 的 hero / NewUserPath 等响应式样式不被挤裂
const MIN_CONTENT_WIDTH = 820
const DEFAULT_WIDTH = 420
const drawerWidth = useLocalStorage('lb-ai-drawer-width', DEFAULT_WIDTH)
// maxAllowed() 的响应式镜像：模板用它判断展开/收起按钮形态，
// 在 mount 和窗口 resize 时同步
const maxWidth = ref(HARD_MAX)

function maxAllowed(): number {
  if (typeof window === 'undefined') return HARD_MAX
  return Math.max(MIN_WIDTH, Math.min(HARD_MAX, window.innerWidth - MIN_CONTENT_WIDTH))
}

function clampWidth(w: number): number {
  return Math.min(maxAllowed(), Math.max(MIN_WIDTH, w))
}

function syncWidthVar(w: number) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--ai-drawer-width', `${w}px`)
}

onMounted(() => {
  // 启动时按当前窗口宽度 clamp（localStorage 可能存了旧的、当前窗口装不下的值）
  maxWidth.value = maxAllowed()
  drawerWidth.value = clampWidth(drawerWidth.value)
  syncWidthVar(drawerWidth.value)
  window.addEventListener('resize', onWindowResize)
  loadHelora()
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', onWindowResize)
})
watch(drawerWidth, syncWidthVar)

function onWindowResize() {
  // 窗口缩小到放不下当前 drawer 时，自动 clamp
  maxWidth.value = maxAllowed()
  const clamped = clampWidth(drawerWidth.value)
  if (clamped !== drawerWidth.value) drawerWidth.value = clamped
}

// 拖拽期间挂一层全屏透明遮罩（z-index 高于 Helora widget 的 9999），物理
// 隔离 SDK iframe——鼠标事件永远打不到 iframe，两个方向都稳定。不用
// setPointerCapture：capture 丢失/释放异常会让清理逻辑短路，导致 ai-resizing
// class 和监听器卡死（拖一次后整个抽屉失灵）。
function startResize(e: PointerEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startW = drawerWidth.value
  document.documentElement.classList.add('ai-resizing')
  const overlay = document.createElement('div')
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;cursor:ew-resize;pointer-events:auto'
  document.body.appendChild(overlay)
  function onMove(ev: PointerEvent) {
    const next = clampWidth(startW + (startX - ev.clientX))
    drawerWidth.value = next
    syncWidthVar(next)
  }
  function stop() {
    overlay.remove()
    document.documentElement.classList.remove('ai-resizing')
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    window.removeEventListener('blur', stop)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
  // 拖拽中切窗口（cmd+tab）收不到 pointerup，blur 兜底
  window.addEventListener('blur', stop)
}

function toggleExpand() {
  const max = maxAllowed()
  // restore 分支也必须 ≤ maxAllowed，否则窄窗口下 DEFAULT_WIDTH 可能 > 拖拽上限，
  // 出现"按钮把抽屉撑得比拖拽允许的还宽"——违背"拖拽最大 = 按钮最大"原则
  const restored = Math.min(DEFAULT_WIDTH, max)
  drawerWidth.value = drawerWidth.value >= max ? restored : max
}

function close() {
  emit('update:modelValue', false)
}

// ── 移动 bottom sheet ────────────────────────────────────────
const isMobile = useMediaQuery('(max-width: 639.98px)')

// sheet 打开时锁定背景滚动：聊天内容在跨域 iframe 内，滚到底后滚动链会
// 穿透到宿主页面，宿主侧无法对 iframe 内部用 overscroll-behavior 阻断，
// 只能锁 body（useScrollLock 自带 iOS touchmove 兜底）
const bodyScrollLock = useScrollLock(typeof document !== 'undefined' ? document.body : null)
watch(
  [isMobile, () => props.modelValue],
  ([mobile, open]) => {
    bodyScrollLock.value = mobile && open
  },
)
const SNAP_POINTS = [0.5, 0.9]
const DEFAULT_SHEET = 0.9
const CLOSE_THRESHOLD = 0.3
const VELOCITY_THRESHOLD = 0.8

const sheetRatio = ref(DEFAULT_SHEET)
const isDragging = ref(false)
const sheetStyle = computed(() => ({ '--ai-sheet-height': `${sheetRatio.value * 100}vh` }))

let dragStartY = 0
let dragStartRatio = 0
let dragStartTime = 0

function onDragStart(e: TouchEvent) {
  dragStartY = e.touches[0].clientY
  dragStartRatio = sheetRatio.value
  dragStartTime = Date.now()
  isDragging.value = true
}
function onDragMove(e: TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  const dy = e.touches[0].clientY - dragStartY
  sheetRatio.value = Math.max(0.05, Math.min(0.95, dragStartRatio - dy / window.innerHeight))
}
function onDragEnd(e: TouchEvent) {
  if (!isDragging.value) return
  const dy = e.changedTouches[0].clientY - dragStartY
  const dt = Math.max(1, Date.now() - dragStartTime)
  const velocity = (dy / window.innerHeight) * 100 / dt
  isDragging.value = false
  if (sheetRatio.value < CLOSE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
    close()
    sheetRatio.value = DEFAULT_SHEET
    return
  }
  const candidates = velocity < -VELOCITY_THRESHOLD ? [SNAP_POINTS[SNAP_POINTS.length - 1]] : SNAP_POINTS
  sheetRatio.value = candidates.reduce(
    (best, p) => (Math.abs(p - sheetRatio.value) < Math.abs(best - sheetRatio.value) ? p : best),
    candidates[0],
  )
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) sheetRatio.value = DEFAULT_SHEET
  },
)
</script>

<template>
  <!-- Helora inline 容器常驻 DOM（首次挂载即 boot SDK），靠 transform 控制显隐，
       打开抽屉零等待。ClientOnly 控制 SSR：浏览器端再渲染避免 hydration 警告。 -->
  <ClientOnly>
    <div
      class="ai-drawer"
      :class="{ 'is-sheet': isMobile, 'is-dragging': isDragging, 'is-open': modelValue }"
      :style="isMobile ? sheetStyle : { width: drawerWidth + 'px' }"
      :aria-hidden="!modelValue"
    >
      <div v-if="!isMobile" class="ai-resize-handle" @pointerdown="startResize" />

      <div
        v-if="isMobile"
        class="ai-sheet-handle"
        @touchstart.passive="onDragStart"
        @touchmove="onDragMove"
        @touchend="onDragEnd"
      >
        <div class="ai-sheet-grabber" />
      </div>

      <div class="ai-drawer-header">
        <div class="ai-drawer-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M7.111 2.34728C7.29334 1.80026 8.06709 1.80026 8.24942 2.34728L9.5054 6.1152C9.56512 6.29437 9.70571 6.43496 9.88487 6.49468L13.6528 7.75065C14.1998 7.93299 14.1998 8.70673 13.6528 8.88907L9.88487 10.145C9.70571 10.2048 9.56512 10.3454 9.5054 10.5245L8.24942 14.2924C8.06709 14.8395 7.29334 14.8395 7.111 14.2924L5.85503 10.5245C5.79531 10.3454 5.65472 10.2048 5.47556 10.145L1.70763 8.88907C1.16061 8.70673 1.16061 7.93299 1.70763 7.75065L5.47556 6.49468C5.65472 6.43496 5.79531 6.29437 5.85503 6.1152L7.111 2.34728Z" fill="currentColor" />
            <path d="M13.0648 1.0138C13.1937 0.665555 13.6862 0.665555 13.8151 1.0138L14.0676 1.69612C14.1081 1.80561 14.1944 1.89194 14.3039 1.93245L14.9862 2.18493C15.3345 2.31379 15.3345 2.80635 14.9862 2.93521L14.3039 3.18769C14.1944 3.22821 14.1081 3.31453 14.0676 3.42402L13.8151 4.10634C13.6862 4.45459 13.1937 4.45459 13.0648 4.10634L12.8123 3.42402C12.7718 3.31453 12.6855 3.22821 12.576 3.18769L11.8937 2.93521C11.5454 2.80635 11.5454 2.31379 11.8937 2.18493L12.576 1.93245C12.6855 1.89194 12.7718 1.80561 12.8123 1.69612L13.0648 1.0138Z" fill="currentColor" />
          </svg>
          <span>{{ t('ai.title') }}</span>
        </div>
        <div class="ai-drawer-header-actions">
          <button
            v-if="!isMobile"
            class="ai-header-btn"
            :title="drawerWidth >= maxWidth ? t('ai.collapse') : t('ai.expand')"
            @click="toggleExpand"
          >
            <PhArrowsInSimple v-if="drawerWidth >= maxWidth" :size="15" />
            <PhArrowsOutSimple v-else :size="15" />
          </button>
          <button class="ai-header-btn" :aria-label="t('ai.close')" @click="close">
            <PhX :size="15" />
          </button>
        </div>
      </div>

      <div ref="inlineEl" class="ai-drawer-inline" />
    </div>
  </ClientOnly>
</template>

<style scoped>
.ai-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  background: var(--vp-c-bg);
  border-left: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  z-index: 100;
  /* 默认隐藏：移到屏外 + visibility 防止被键盘/鼠标命中 */
  transform: translateX(100%);
  visibility: hidden;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0.25s;
}

.ai-drawer.is-open {
  transform: translateX(0);
  visibility: visible;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0s;
}

.ai-drawer.is-sheet {
  top: auto;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--ai-sheet-height, 90vh);
  border-left: none;
  border-top: 1px solid var(--vp-c-divider);
  border-radius: 16px 16px 0 0;
  /* sheet 与底部页面同色，需要投影区分边界 */
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  transform: translateY(100%);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0.25s;
}

.ai-drawer.is-sheet.is-open {
  transform: translateY(0);
}

/* 暗色下黑色投影对比不足，加深一档 */
:global(html.dark .ai-drawer.is-sheet) {
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.45);
}

.ai-drawer.is-sheet.is-dragging {
  transition: none;
}

.ai-resize-handle {
  position: absolute;
  top: 0;
  left: -3px;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  /* Helora widget 根节点在抽屉 stacking context 内 z-index 9999 且
     pointer-events: all，会盖住 handle 内侧一半；必须压过它整条才可命中 */
  z-index: 10000;
}

/* 注意：:global() 必须包住完整选择器——写成 `:global(html.x) .y` 会被
   scoped 编译器把后代部分丢掉，产出裸 `html.x` 规则（曾导致拖拽期间
   pointer-events/background 整个作用到 <html> 上） */
.ai-resize-handle:hover,
:global(html.ai-resizing .ai-resize-handle) {
  background: linear-gradient(to right, transparent, var(--vp-c-brand-soft));
}

.ai-sheet-handle {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
  cursor: grab;
}
.ai-sheet-grabber {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--vp-c-divider);
}

.ai-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}

.ai-drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.ai-drawer-title svg {
  color: var(--vp-c-brand-1);
}

.ai-drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-header-btn {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ai-header-btn:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

/* SDK 撑满容器（width/height 100%），容器必须有确定高度：
   flex: 1 在固定高度的 flex column 内即满足，min-height: 0 防止内容撑破 */
.ai-drawer-inline {
  flex: 1;
  min-height: 0;
  background: var(--vp-c-bg);
}

:global(html.ai-resizing .ai-drawer-inline) {
  pointer-events: none;
}

</style>
