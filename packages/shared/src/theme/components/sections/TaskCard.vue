<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vitepress'
import { useI18n } from '../../../i18n/useI18n'
import { useRegion } from '../../composables/useRegion'
// Phosphor 不区分 BarChart2/3，统一用 PhChartBar；FileCheck 无对等，用 PhSealCheck
// 表达"已验证文件"语义
import {
  PhUserPlus, PhUsers, PhStack, PhQuestion, PhArrowsLeftRight,
  PhArrowLineDown, PhLightning, PhArrowsClockwise, PhArrowsCounterClockwise, PhPaperPlaneTilt,
  PhDeviceMobile, PhGlobe, PhGlobeSimple,
  PhTrendUp, PhTrendDown, PhBookOpen, PhReceipt, PhChartBar, PhTimer, PhListNumbers,
  PhChartPie, PhFileText,
  PhArrowLineUp, PhBuildingOffice, PhShuffle,
  PhFire, PhShieldCheck, PhSealCheck, PhWrench,
} from '@phosphor-icons/vue'
import type { TaskCard } from '../../data/journey'

const props = defineProps<{ task: TaskCard }>()

const router = useRouter()
const { t } = useI18n()
const { withRegionAndLocale } = useRegion()

const iconMap: Record<string, unknown> = {
  UserPlus: PhUserPlus, Users: PhUsers, Layers: PhStack, CircleHelp: PhQuestion, ArrowLeftRight: PhArrowsLeftRight,
  ArrowDownToLine: PhArrowLineDown, Zap: PhLightning, RefreshCw: PhArrowsClockwise, RefreshCcw: PhArrowsCounterClockwise,
  Send: PhPaperPlaneTilt, Smartphone: PhDeviceMobile, Globe: PhGlobe, Globe2: PhGlobeSimple,
  TrendingUp: PhTrendUp, TrendingDown: PhTrendDown, BookOpen: PhBookOpen, Receipt: PhReceipt,
  BarChart2: PhChartBar, BarChart3: PhChartBar, Timer: PhTimer, ListOrdered: PhListNumbers,
  PieChart: PhChartPie, FileText: PhFileText,
  ArrowUpFromLine: PhArrowLineUp, Building2: PhBuildingOffice, Shuffle: PhShuffle,
  Flame: PhFire, ShieldCheck: PhShieldCheck, FileCheck: PhSealCheck, Wrench: PhWrench,
}

const iconComponent = computed(() => iconMap[props.task.icon] ?? null)
</script>

<template>
  <article
    class="task-card"
    role="article"
    @click="router.go(withRegionAndLocale(task.href))"
  >
    <div class="task-card__header">
      <component
        :is="iconComponent"
        v-if="iconComponent"
        :size="16"
        class="task-card__icon"
      />
      <h3 class="task-card__title">{{ t(task.title) }}</h3>
    </div>
    <p class="task-card__subtitle">{{ t(task.subtitle) }}</p>
    <span class="task-card__arrow" aria-hidden="true">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </span>
  </article>
</template>

<style scoped>
.task-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  cursor: pointer;
  transition: transform 150ms ease-out,
              border-color 150ms ease-out,
              box-shadow 150ms ease-out;
  overflow: hidden;
}

.task-card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.task-card:active {
  transform: scale(0.98);
  transition-duration: 80ms;
}

.task-card__header {
  display: flex;
  align-items: center;
  gap: 7px;
}

.task-card__icon {
  flex-shrink: 0;
  color: var(--vp-c-brand-1);
  opacity: 0.7;
  transition: opacity 150ms ease-out;
}

.task-card:hover .task-card__icon {
  opacity: 1;
}

.task-card__title {
  font-size: 16px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-card__subtitle {
  font-size: 13px;
  color: var(--vp-c-text-3);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.task-card__arrow {
  display: flex;
  align-items: center;
  margin-top: 4px;
  color: var(--vp-c-brand-1);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.task-card:hover .task-card__arrow {
  opacity: 1;
  transform: translateX(0);
}
</style>
