<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vitepress'
import { getMarketTasks, type Market } from '../../data/journey'
import { useI18n } from '../../../i18n/useI18n'
import { useRegion } from '../../composables/useRegion'
import TaskCard from './TaskCard.vue'

const { t } = useI18n()
const router = useRouter()
const { withRegionAndLocale } = useRegion()

const props = defineProps<{ categoryId: string }>()

const activeMarket = inject<Ref<Market>>('journeyMarket', ref('hk') as Ref<Market>)
const isExpanded = ref(false)

const CARD_LIMIT = 8

const tasks = computed(() => getMarketTasks(props.categoryId, activeMarket.value))
const visibleCards = computed(() => tasks.value.slice(0, CARD_LIMIT))
const extraRows = computed(() => tasks.value.slice(CARD_LIMIT))
const hasExtra = computed(() => tasks.value.length > CARD_LIMIT)

watch([() => props.categoryId, () => activeMarket.value], () => {
  isExpanded.value = false
})
</script>

<template>
  <div class="task-grid-wrap">
    <!-- Card grid -->
    <TransitionGroup
      name="task-card"
      tag="div"
      class="task-grid"
    >
      <TaskCard
        v-for="(task, i) in visibleCards"
        :key="task.id"
        :task="task"
        :style="{ '--i': i }"
      />
    </TransitionGroup>

    <!-- Empty state when no tasks for this market -->
    <div v-if="tasks.length === 0" class="task-grid__empty">
      <p>{{ t('journey.marketEmpty') }}</p>
    </div>

    <!-- Expand accordion: extra tasks as compact rows -->
    <div v-if="hasExtra" class="expand-wrap" :class="{ 'is-expanded': isExpanded }">
      <div class="expand-inner">
        <div class="expand-list">
          <button
            v-for="task in extraRows"
            :key="task.id"
            class="expand-row"
            @click="router.go(withRegionAndLocale(task.href))"
          >
            <span class="expand-row__title">{{ t(task.title) }}</span>
            <span class="expand-row__subtitle">{{ t(task.subtitle) }}</span>
            <svg class="expand-row__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Expand toggle button -->
    <button
      v-if="hasExtra"
      class="expand-toggle"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <span>{{ isExpanded ? t('journey.taskIndex.collapseAll') : t('journey.taskIndex.expandAll', { count: extraRows.length }) }}</span>
      <svg
        class="expand-toggle__icon"
        :class="{ 'is-open': isExpanded }"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.task-grid-wrap {
  min-height: 120px;
}

/* ── Card grid ─────────────────────────────────────────────────────── */
.task-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 1279px) and (min-width: 1024px) {
  .task-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1023px) and (min-width: 640px) {
  .task-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 639px) {
  .task-grid {
    grid-template-columns: 1fr;
  }
}

/* ── TransitionGroup stagger ───────────────────────────────────────── */
.task-card-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
  transition-delay: calc(var(--i, 0) * 30ms);
}

.task-card-leave-active {
  transition: opacity 100ms ease;
  position: absolute;
}

.task-card-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.task-card-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .task-card-enter-active,
  .task-card-leave-active {
    transition: opacity 80ms ease;
    transition-delay: 0ms;
  }

  .task-card-enter-from {
    transform: none;
  }
}

/* ── Expand accordion ──────────────────────────────────────────────── */
.expand-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 280ms cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 0;
}

.expand-wrap.is-expanded {
  grid-template-rows: 1fr;
}

.expand-inner {
  overflow: hidden;
}

.expand-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 12px;
  padding-top: 4px;
}

.expand-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 9px 4px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: background 120ms ease;
}

.expand-row:last-child {
  border-bottom: none;
}

.expand-row:hover {
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
}

.expand-row__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-row__subtitle {
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.expand-row__icon {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 120ms, color 120ms;
}

.expand-row:hover .expand-row__icon {
  opacity: 1;
  color: var(--vp-c-brand-1);
}

/* ── Expand toggle ─────────────────────────────────────────────────── */
.expand-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  transition: opacity 150ms;
}

.expand-toggle:hover {
  opacity: 0.75;
  text-decoration: underline;
}

.expand-toggle__icon {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-toggle__icon.is-open {
  transform: rotate(180deg);
}

/* ── Empty state ───────────────────────────────────────────────────── */
.task-grid__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  font-size: 14px;
  color: var(--vp-c-text-3);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
}

@media (max-width: 639px) {
  .expand-row {
    grid-template-columns: 1fr auto;
  }

  .expand-row__subtitle {
    display: none;
  }
}
</style>
