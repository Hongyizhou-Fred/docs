<script setup lang="ts">
import { ref } from 'vue'
import {
  PhCopy as Copy,
  PhCheck as Check,
  PhArrowSquareOut as ExternalLinkIcon,
} from '@phosphor-icons/vue'

interface Props {
  command: string
  label?: string
  href?: string
  hrefLabel?: string
  prompt?: string
}

const props = withDefaults(defineProps<Props>(), {
  prompt: '$',
})

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function copy() {
  try {
    await navigator.clipboard.writeText(props.command)
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { copied.value = false }, 1500)
  } catch (e) {
    console.warn('Failed to copy command:', e)
  }
}
</script>

<template>
  <div class="lb-cli">
    <div v-if="label" class="lb-cli__label">{{ label }}</div>
    <div class="lb-cli__row">
      <code class="lb-cli__code">
        <span class="lb-cli__prompt" aria-hidden="true">{{ prompt }}</span>
        <span class="lb-cli__command">{{ command }}</span>
      </code>
      <div class="lb-cli__actions">
        <a
          v-if="href"
          :href="href"
          target="_blank"
          rel="noopener"
          class="lb-cli__btn"
          :title="hrefLabel || 'Open'"
        >
          <ExternalLinkIcon :size="14" />
          <span v-if="hrefLabel">{{ hrefLabel }}</span>
        </a>
        <button
          type="button"
          class="lb-cli__btn"
          :aria-label="copied ? 'Copied' : 'Copy command'"
          @click="copy"
        >
          <component :is="copied ? Check : Copy" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lb-cli {
  --at-apply: my-4 rounded-lg overflow-hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.lb-cli__label {
  --at-apply: px-4 pt-3 pb-1 text-xs font-medium;
  color: var(--vp-c-text-2);
  letter-spacing: 0.02em;
}

.lb-cli__row {
  --at-apply: flex items-center gap-3 px-4 py-2.5;
  min-height: 44px;
}

.lb-cli__code {
  --at-apply: flex-1 flex items-center gap-2 font-mono text-sm;
  background: transparent;
  color: var(--vp-c-text-1);
  overflow-x: auto;
  white-space: nowrap;
  border: none;
  padding: 0;
}

.lb-cli__prompt {
  color: var(--vp-c-text-3);
  user-select: none;
}

.lb-cli__command {
  color: var(--vp-c-text-1);
}

.lb-cli__actions {
  --at-apply: flex items-center gap-1 flex-shrink-0;
}

.lb-cli__btn {
  --at-apply: inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md;
  background: transparent;
  border: 1px solid transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.lb-cli__btn:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}
</style>
