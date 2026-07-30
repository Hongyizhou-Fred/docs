<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, provide, ref, watch } from 'vue'
import { PhCheck as Check } from '@phosphor-icons/vue'

interface Step {
  id: string
  title: string
}

interface Props {
  steps: Step[]
  /** URL query 同步当前 step 的 key,设为 null 关闭同步 */
  syncKey?: string | null
  /** 默认激活的 step id,缺省时使用 steps[0].id */
  defaultStep?: string
}

const props = withDefaults(defineProps<Props>(), {
  syncKey: 'step',
  defaultStep: '',
})

const activeId = ref<string>('')

function activate(id: string) {
  if (!props.steps.some((s) => s.id === id)) return
  activeId.value = id
  if (props.syncKey && typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set(props.syncKey, id)
    window.history.replaceState({}, '', url.toString())
  }
}

function readFromUrl(): string | null {
  if (!props.syncKey || typeof window === 'undefined') return null
  return new URL(window.location.href).searchParams.get(props.syncKey)
}

function onPopState() {
  const fromUrl = readFromUrl()
  if (fromUrl && props.steps.some((s) => s.id === fromUrl)) {
    activeId.value = fromUrl
  }
}

onMounted(() => {
  const fromUrl = readFromUrl()
  const initial = fromUrl || props.defaultStep || props.steps[0]?.id || ''
  if (initial) activate(initial)
  window.addEventListener('popstate', onPopState)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('popstate', onPopState)
  }
})

watch(() => props.steps, () => {
  if (!props.steps.some((s) => s.id === activeId.value)) {
    activate(props.steps[0]?.id || '')
  }
}, { deep: true })

const stepIndex = computed(() => props.steps.findIndex((s) => s.id === activeId.value))

provide('stepper:activeId', activeId)

function statusOf(idx: number): 'done' | 'active' | 'todo' {
  if (idx < stepIndex.value) return 'done'
  if (idx === stepIndex.value) return 'active'
  return 'todo'
}
</script>

<template>
  <div class="lb-stepper">
    <ol class="lb-stepper__track">
      <li
        v-for="(s, i) in steps"
        :key="s.id"
        class="lb-stepper__step"
        :class="`is-${statusOf(i)}`"
      >
        <button
          type="button"
          class="lb-stepper__btn"
          :aria-current="s.id === activeId ? 'step' : undefined"
          @click="activate(s.id)"
        >
          <span class="lb-stepper__dot" aria-hidden="true">
            <Check v-if="statusOf(i) === 'done'" :size="12" :stroke-width="2.5" />
            <span v-else class="lb-stepper__index">{{ i + 1 }}</span>
          </span>
          <span class="lb-stepper__label">{{ s.title }}</span>
        </button>
        <span v-if="i < steps.length - 1" class="lb-stepper__line" aria-hidden="true" />
      </li>
    </ol>
    <div class="lb-stepper__panels">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lb-stepper {
  --at-apply: my-6 rounded-xl;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  overflow: hidden;
}

.lb-stepper__track {
  --at-apply: flex items-center px-4 py-4 m-0 list-none;
  gap: 0;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.lb-stepper__step {
  --at-apply: flex items-center flex-1 min-w-0;
}

.lb-stepper__step:last-child {
  flex: 0 0 auto;
}

.lb-stepper__btn {
  --at-apply: inline-flex items-center gap-2 px-1 py-1 bg-transparent border-0 cursor-pointer;
  color: var(--vp-c-text-2);
  text-align: left;
  transition: color 0.15s;
}

.lb-stepper__btn:hover {
  color: var(--vp-c-text-1);
}

.lb-stepper__dot {
  --at-apply: inline-flex items-center justify-center rounded-full flex-shrink-0;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: 600;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.lb-stepper__index {
  line-height: 1;
}

.lb-stepper__label {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.lb-stepper__line {
  --at-apply: flex-1 mx-3;
  height: 1px;
  background: var(--vp-c-divider);
  transition: background 0.15s;
}

.lb-stepper__step.is-active .lb-stepper__dot {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

.lb-stepper__step.is-active .lb-stepper__label {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.lb-stepper__step.is-done .lb-stepper__dot {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.lb-stepper__step.is-done .lb-stepper__line {
  background: var(--vp-c-brand-1);
}

.lb-stepper__panels {
  --at-apply: px-6 py-6;
}
</style>
