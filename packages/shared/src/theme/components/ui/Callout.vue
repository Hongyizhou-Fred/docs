<script setup lang="ts">
import { computed } from 'vue'
import {
  PhLightbulb as Lightbulb,
  PhWarning as AlertTriangle,
  PhWarningOctagon as AlertOctagon,
  PhInfo as Info,
  PhCheckCircle as CheckCircle2,
  PhShieldWarning as ShieldAlert,
} from '@phosphor-icons/vue'

interface Props {
  type?: 'tip' | 'warning' | 'danger' | 'info' | 'caution' | 'success'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'tip',
  title: '',
})

const tokenByType = {
  tip:     { icon: Lightbulb,    accent: 'var(--vp-c-brand-1)',  soft: 'var(--vp-c-brand-soft)' },
  info:    { icon: Info,         accent: 'var(--lb-c-info)',     soft: 'rgba(42, 153, 254, 0.08)' },
  warning: { icon: AlertTriangle,accent: 'var(--lb-c-warning)',  soft: 'rgba(255, 151, 40, 0.08)' },
  caution: { icon: ShieldAlert,  accent: 'var(--lb-c-warning)',  soft: 'rgba(255, 151, 40, 0.08)' },
  danger:  { icon: AlertOctagon, accent: 'var(--lb-c-danger)',   soft: 'rgba(247, 65, 95, 0.08)' },
  success: { icon: CheckCircle2, accent: 'var(--lb-c-success)',  soft: 'rgba(0, 204, 146, 0.08)' },
} as const

const cfg = computed(() => tokenByType[props.type])
const headerText = computed(() => props.title || props.type.toUpperCase())
</script>

<template>
  <div
    class="lb-callout"
    :style="{ '--callout-accent': cfg.accent, '--callout-soft': cfg.soft }"
  >
    <header class="lb-callout__header">
      <component :is="cfg.icon" :size="16" :stroke-width="2" class="lb-callout__icon" />
      <span class="lb-callout__title">{{ headerText }}</span>
    </header>
    <div class="lb-callout__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lb-callout {
  --at-apply: my-4 rounded-lg overflow-hidden;
  background: var(--callout-soft);
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--callout-accent);
}

.lb-callout__header {
  --at-apply: flex items-center gap-2 px-4 pt-3 pb-1;
  color: var(--callout-accent);
}

.lb-callout__icon {
  flex-shrink: 0;
}

.lb-callout__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.lb-callout__body {
  --at-apply: px-4 pb-3 leading-relaxed;
  color: var(--vp-c-text-1);
}

.lb-callout__body :deep(p) {
  margin: 0.5em 0;
}

.lb-callout__body :deep(p:first-child) {
  margin-top: 0;
}

.lb-callout__body :deep(p:last-child) {
  margin-bottom: 0;
}

.lb-callout__body :deep(code) {
  background: rgba(0, 0, 0, 0.06);
}

.lb-callout__body :deep(pre) {
  margin: 0.75em 0;
}

.lb-callout__body :deep(ul),
.lb-callout__body :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.lb-callout__body :deep(li) {
  margin: 0.25em 0;
}
</style>
