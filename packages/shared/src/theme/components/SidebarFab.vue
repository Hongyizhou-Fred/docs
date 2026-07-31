<script setup lang="ts">
// 移动端"文档菜单"悬浮按钮(圆形+目录 icon),与 BackToTop 同一设计语言。
// 背景:VPLocalNav 顶部通栏(☰ Menu / Return to top)视觉陈旧,已在
// tailwind.css 整条隐藏;菜单入口由本组件承接。
// 实现:VPLocalNav 仍在 DOM 中(仅 display:none),其 .menu 按钮持有
// VitePress Layout 的 open-menu 事件绑定 —— 代理 .click() 即可打开原生
// 侧边抽屉(带 backdrop/滚动锁),不必复刻抽屉状态机。
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { inBrowser, useRoute } from 'vitepress'
import { useI18n } from '../../i18n/useI18n'

const { t } = useI18n()
const route = useRoute()

// 仅当前页面存在 sidebar(即 VPLocalNav 渲染出 .menu 按钮)时显示
const hasSidebarMenu = ref(false)

function detectMenu() {
  if (!inBrowser) return
  // 路由切换后等 VitePress 完成 VPLocalNav 的重渲染
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      hasSidebarMenu.value = !!document.querySelector('.VPLocalNav .menu')
    }),
  )
}

watch(() => route.path, detectMenu)
onMounted(detectMenu)

// 抽屉打开期间隐藏自己(避免悬浮在 backdrop 之上);抽屉关闭后恢复。
// 打开状态跟随 .menu 按钮的 aria-expanded,用 MutationObserver 监听。
const drawerOpen = ref(false)
let observer: MutationObserver | null = null

function watchDrawerState() {
  if (!inBrowser || typeof MutationObserver === 'undefined') return
  observer?.disconnect()
  const menuBtn = document.querySelector('.VPLocalNav .menu')
  if (!menuBtn) return
  observer = new MutationObserver(() => {
    drawerOpen.value = menuBtn.getAttribute('aria-expanded') === 'true'
  })
  observer.observe(menuBtn, { attributes: true, attributeFilter: ['aria-expanded'] })
}

watch(hasSidebarMenu, (has) => {
  if (has) watchDrawerState()
  else {
    observer?.disconnect()
    drawerOpen.value = false
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

function openMenu() {
  document.querySelector<HTMLElement>('.VPLocalNav .menu')?.click()
}
</script>

<template>
  <Transition name="sfab-fade">
    <button
      v-show="hasSidebarMenu && !drawerOpen"
      type="button"
      class="sfab"
      :aria-label="t('common.openMenu')"
      @click="openMenu"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="21" x2="3" y1="6" y2="6" />
        <line x1="15" x2="3" y1="12" y2="12" />
        <line x1="17" x2="3" y1="18" y2="18" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.sfab {
  position: fixed;
  left: 16px;
  bottom: 28px; /* 与右下 AI 悬浮球(bottom-7)同一行,左右呼应 */
  z-index: 998;
  width: 44px; /* 移动端触摸目标下限 */
  height: 44px;
  border-radius: 50%;
  border: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.14);
  display: none; /* ≥960px sidebar 常驻,无需菜单入口(见下方 media) */
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 959px) {
  .sfab {
    display: flex;
  }
}

.sfab:active {
  transform: scale(0.94);
}

.sfab-fade-enter-active,
.sfab-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.sfab-fade-enter-from,
.sfab-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .sfab-fade-enter-active,
  .sfab-fade-leave-active {
    transition: none;
  }
}
</style>
