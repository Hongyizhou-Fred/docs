<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vitepress'
// Phosphor 不区分 BarChart2/3，统一 PhChartBar；FileCheck 用 PhSealCheck 表达"已验证"
import {
  PhUserPlus as UserPlus,
  PhUsers as Users,
  PhStack as Layers,
  PhQuestion as CircleHelp,
  PhArrowsLeftRight as ArrowLeftRight,
  PhArrowLineDown as ArrowDownToLine,
  PhLightning as Zap,
  PhArrowsClockwise as RefreshCw,
  PhArrowsCounterClockwise as RefreshCcw,
  PhPaperPlaneTilt as Send,
  PhDeviceMobile as Smartphone,
  PhGlobe as Globe,
  PhGlobeSimple as Globe2,
  PhTrendUp as TrendingUp,
  PhTrendDown as TrendingDown,
  PhBookOpen as BookOpen,
  PhReceipt as Receipt,
  PhChartBar as BarChart2,
  PhTimer as Timer,
  PhListNumbers as ListOrdered,
  PhChartPie as PieChart,
  PhFileText as FileText,
  PhArrowLineUp as ArrowUpFromLine,
  PhBuildingOffice as Building2,
  PhShuffle as Shuffle,
  PhFire as Flame,
  PhShieldCheck as ShieldCheck,
  PhSealCheck as FileCheck,
  PhWrench as Wrench,
} from '@phosphor-icons/vue'
const BarChart3 = BarChart2 // Phosphor 单一 ChartBar，两个 lucide 变体共用
import { categories, type Market } from '../../data/journey'
import { useI18n } from '../../../i18n/useI18n'
import { useRegion } from '../../composables/useRegion'

const iconMap: Record<string, unknown> = {
  UserPlus, Users, Layers, CircleHelp, ArrowLeftRight,
  ArrowDownToLine, Zap, RefreshCw, RefreshCcw, Send, Smartphone, Globe, Globe2,
  TrendingUp, TrendingDown, BookOpen, Receipt, BarChart2, BarChart3, Timer, ListOrdered,
  PieChart, FileText,
  ArrowUpFromLine, Building2, Shuffle,
  Flame, ShieldCheck, FileCheck, Wrench,
}

const router = useRouter()
const { t } = useI18n()
const { withRegionAndLocale, region, articleExists } = useRegion()

// region → 显示哪些 market 的任务：
//   hk 用户能买港股 + 美股 → ['hk', 'us']
//   sg 用户能买新加坡 + 美股 → ['sg', 'us']
const regionMarkets = computed<Market[]>(() =>
  region.value === 'sg' ? ['sg', 'us'] : ['hk', 'us']
)

const activeCat = ref<'all' | string>('all')
const expanded = ref(false)

watch(region, () => {
  activeCat.value = 'all'
  expanded.value = false
})

function matchesRegion(task: { markets: Market[]; href: string }) {
  return task.markets.some(m => regionMarkets.value.includes(m)) && articleExists(task.href)
}

const filteredTasks = computed(() => {
  if (activeCat.value === 'all') {
    return categories.flatMap(c => c.tasks).filter(matchesRegion)
  }
  const cat = categories.find(c => c.id === activeCat.value)
  return cat ? cat.tasks.filter(matchesRegion) : []
})

const MAX_VISIBLE = 8 // 4 列 × 2 行
const visibleTasks = computed(() => filteredTasks.value.slice(0, MAX_VISIBLE))
const hiddenTasks = computed(() => filteredTasks.value.slice(MAX_VISIBLE))

const catList = computed<{ id: string; label: string }[]>(() => [
  { id: 'all', label: t('category.all') },
  ...categories
    .filter(c => c.tasks.some(matchesRegion))
    .map(c => ({ id: c.id, label: t(c.label) })),
])

function countOf(catId: string): number {
  if (catId === 'all') {
    return categories.flatMap(c => c.tasks).filter(matchesRegion).length
  }
  const cat = categories.find(c => c.id === catId)
  return cat ? cat.tasks.filter(matchesRegion).length : 0
}

function goTask(href: string) {
  if (href.startsWith('http')) {
    window.open(href, '_blank')
  } else {
    router.go(withRegionAndLocale(href))
  }
}

// 滑动下划线：跟踪当前激活 tab 的位置
const tabsRef = ref<HTMLElement | null>(null)
const indicator = ref({ left: 0, width: 0, ready: false })

async function updateIndicator() {
  await nextTick()
  if (!tabsRef.value) return
  const active = tabsRef.value.querySelector<HTMLElement>('[data-active="true"]')
  if (!active) return
  indicator.value = { left: active.offsetLeft, width: active.offsetWidth, ready: true }
}

watch([activeCat, region, catList], updateIndicator, { flush: 'post' })
onMounted(updateIndicator)

function selectCat(id: string, e: MouseEvent) {
  activeCat.value = id
  const btn = e.currentTarget as HTMLElement | null
  const wrap = tabsRef.value
  if (!btn || !wrap) return
  const target = btn.offsetLeft - (wrap.clientWidth - btn.offsetWidth) / 2
  wrap.scrollTo({ left: target, behavior: 'smooth' })
}
</script>

<template>
  <section class="ti">
    <div class="ti__inner">
      <div class="ti__top">
        <h2 class="ti__title">{{ t('journey.headingExperienced') }}</h2>
      </div>

      <div ref="tabsRef" class="ti__tabs">
        <div
          v-if="indicator.ready"
          class="ti__tab-underline"
          :style="{ left: indicator.left + 'px', width: indicator.width + 'px' }"
        />
        <button
          v-for="c in catList"
          :key="c.id"
          type="button"
          class="ti__tab"
          :class="{ 'is-active': activeCat === c.id }"
          :data-active="activeCat === c.id"
          @click="selectCat(c.id, $event)"
        >
          {{ c.label }}
          <span class="ti__count" :class="{ 'is-active': activeCat === c.id }">{{ countOf(c.id) }}</span>
        </button>
      </div>

      <div :key="region + '-' + activeCat" class="ti__grid ti__fade">
        <button
          v-for="task in visibleTasks"
          :key="task.id"
          type="button"
          class="ti__card"
          @click="goTask(task.href)"
        >
          <div class="ti__card-head">
            <div class="ti__card-title-wrap">
              <component
                :is="iconMap[task.icon] ?? FileText"
                :size="15"
                class="ti__card-icon"
                aria-hidden="true"
              />
              <span class="ti__card-title">{{ t(task.title) }}</span>
            </div>
            <svg class="ti__card-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
          <p class="ti__card-sub">{{ t(task.subtitle) }}</p>
        </button>
      </div>

      <div v-if="visibleTasks.length === 0" class="ti__empty">
        {{ t('journey.taskIndex.noMatch') }}
      </div>

      <div v-if="expanded && hiddenTasks.length" :key="'hid-' + region + '-' + activeCat" class="ti__hidden ti__fade">
        <button
          v-for="task in hiddenTasks"
          :key="task.id"
          type="button"
          class="ti__hidden-row"
          @click="goTask(task.href)"
        >
          <span class="ti__hidden-title">{{ t(task.title) }}</span>
          <span class="ti__hidden-sub">{{ t(task.subtitle) }}</span>
          <svg class="ti__hidden-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      <button
        v-if="hiddenTasks.length > 0"
        type="button"
        class="ti__expand"
        @click="expanded = !expanded"
      >
        {{ expanded ? t('journey.taskIndex.collapseAll') : t('journey.taskIndex.expandAll', { count: hiddenTasks.length }) }}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
.ti {
  padding: 72px 32px 80px;
  background: var(--vp-c-bg);
}

.ti__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.ti__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.ti__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

.ti__market {
  position: relative;
  display: inline-flex;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  padding: 3px;
}

.ti__market-pill {
  position: absolute;
  top: 3px;
  bottom: 3px;
  background: var(--vp-c-bg-elv);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.ti__market-btn {
  position: relative;
  z-index: 1;
  padding: 6px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.2s;
}

.ti__market-btn.is-active {
  color: var(--vp-c-text-1);
}

.ti__market-btn:hover:not(.is-active) {
  color: var(--vp-c-text-2);
}

.ti__tabs {
  position: relative;
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 24px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.ti__tabs::-webkit-scrollbar {
  display: none;
}

.ti__tab-underline {
  position: absolute;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--vp-c-brand-1);
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.ti__tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  background: transparent;
  color: var(--vp-c-text-1);
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.2s;
}

.ti__tab.is-active {
  color: var(--vp-c-brand-1);
}

.ti__tab:hover:not(.is-active) {
  color: var(--vp-c-brand-1);
}

.ti__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11.5px;
  line-height: 1;
  border-radius: 999px;
  font-weight: 600;
  background: transparent;
  color: var(--vp-c-text-3);
  transition: background 0.2s, color 0.2s;
}

.ti__count.is-active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.ti__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.ti__card {
  display: flex;
  flex-direction: column;
  gap: 9px;
  text-align: left;
  padding: 18px 18px 16px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-elv);
  cursor: pointer;
  transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
}

.ti__card:hover {
  box-shadow: 0 6px 24px rgba(43, 62, 92, 0.14);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.ti__card:active {
  transform: translateY(0) scale(0.98);
}

.ti__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.ti__card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ti__card-icon {
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.ti__card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.ti__card-arrow {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.ti__card-sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  line-height: 1.45;
}

.ti__empty {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

.ti__hidden {
  margin-top: 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
}

.ti__hidden-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 20px;
  background: var(--vp-c-bg-elv);
  text-align: left;
  border: 0;
  border-top: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: background 0.15s;
}

.ti__hidden-row:first-child {
  border-top: 0;
}

.ti__hidden-row:hover {
  background: var(--vp-c-bg-soft);
}

.ti__hidden-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.ti__hidden-sub {
  flex: 1;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.ti__hidden-arrow {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.ti__expand {
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.ti__expand:hover {
  opacity: 0.75;
}

@keyframes ti-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ti__fade {
  animation: ti-fade 0.28s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}

@media (max-width: 1024px) {
  .ti__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .ti {
    padding: 56px 20px 64px;
  }
  .ti__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .ti__title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .ti__grid {
    grid-template-columns: 1fr;
  }
}
</style>
