<script setup lang="ts">
// 通用"回到顶部"悬浮按钮(圆形+箭头,可拖动)。
// - 小屏(<768px)专用:替代 VitePress 移动端 local-nav 的 "Return to top"
//   文字条(首页 empty 形态已由 tailwind.css 隐藏);桌面端继续用右侧
//   aside 的返回顶部链接,本组件不显示
// - 滚动超过阈值才出现;点击平滑回顶
// - 可拖动:pointer 事件 + 视口内夹取;拖动超过阈值不触发点击;
//   位置在会话内保留(组件常驻 Layout,跨路由不重置)
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { inBrowser } from 'vitepress'
import { useI18n } from '../../i18n/useI18n'

const { t } = useI18n()

const SHOW_AFTER = 320 // 滚动多少 px 后出现
const DRAG_THRESHOLD = 6 // 位移超过视为拖动,抑制 click
const MARGIN = 8 // 距视口边缘最小间距

const visible = ref(false)
const btnRef = ref<HTMLButtonElement | null>(null)

// 自定义位置(拖动后生效);null = 使用 CSS 默认位置
const pos = ref<{ x: number; y: number } | null>(null)

let dragging = false
let moved = false
let startX = 0
let startY = 0
let originX = 0
let originY = 0

function onScroll() {
  visible.value = window.scrollY > SHOW_AFTER
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

function onPointerDown(e: PointerEvent) {
  const el = btnRef.value
  if (!el) return
  dragging = true
  moved = false
  startX = e.clientX
  startY = e.clientY
  const rect = el.getBoundingClientRect()
  originX = rect.left
  originY = rect.top
  el.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
  moved = true
  const el = btnRef.value
  if (!el) return
  const size = el.offsetWidth
  pos.value = {
    x: clamp(originX + dx, MARGIN, window.innerWidth - size - MARGIN),
    y: clamp(originY + dy, MARGIN, window.innerHeight - size - MARGIN),
  }
}

function onPointerUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  btnRef.value?.releasePointerCapture(e.pointerId)
}

function onClick() {
  // 刚发生过拖动 → 本次 click 是拖动收尾,不回顶
  if (moved) {
    moved = false
    return
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 视口尺寸变化(旋转/键盘)时把自定义位置夹回可视范围
function onResize() {
  if (!pos.value || !btnRef.value) return
  const size = btnRef.value.offsetWidth
  pos.value = {
    x: clamp(pos.value.x, MARGIN, window.innerWidth - size - MARGIN),
    y: clamp(pos.value.y, MARGIN, window.innerHeight - size - MARGIN),
  }
}

onMounted(() => {
  if (!inBrowser) return
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  if (!inBrowser) return
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <Transition name="btt-fade">
    <button
      v-show="visible"
      ref="btnRef"
      type="button"
      class="btt"
      :style="pos ? { left: pos.x + 'px', top: pos.y + 'px', right: 'auto', bottom: 'auto' } : undefined"
      :aria-label="t('common.backToTop')"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="onClick"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.btt {
  position: fixed;
  right: 16px;
  bottom: 96px; /* 让开文章页右下角的 AI 悬浮球(bottom-7 = 28px,48px 高) */
  z-index: 998;
  width: 44px; /* 移动端触摸目标下限 */
  height: 44px;
  border-radius: 50%;
  border: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.14);
  display: none; /* 桌面隐藏,小屏显示(见下方 media) */
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: none; /* pointer 拖动需要接管手势 */
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 767px) {
  .btt {
    display: flex;
  }
}

.btt:active {
  transform: scale(0.94);
}

.btt-fade-enter-active,
.btt-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.btt-fade-enter-from,
.btt-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .btt-fade-enter-active,
  .btt-fade-leave-active {
    transition: none;
  }
}
</style>
