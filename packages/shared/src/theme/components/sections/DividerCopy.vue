<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from '../../../i18n/useI18n'

const openAIModal = inject<(q: string) => void>('openAIModal', () => {})
const { t } = useI18n()

function handleClick() {
  openAIModal('')
}
</script>

<template>
  <div class="divider-copy">
    <div class="divider-copy__inner">
      <div class="divider-copy__line" />
      <button type="button" class="divider-copy__text" @click="handleClick">
        {{ t('divider.pre') }}<span class="divider-copy__highlight">{{ t('divider.highlight') }}</span>
      </button>
      <div class="divider-copy__line" />
    </div>
  </div>
</template>

<style scoped>
.divider-copy {
  background: var(--vp-c-bg);
  padding: 36px 32px;
}

.divider-copy__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
}

.divider-copy__line {
  flex: 1;
  height: 1px;
  background: var(--vp-c-border);
}

.divider-copy__text {
  flex-shrink: 0;
  font-size: 15px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  letter-spacing: 0.01em;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: color 0.15s;
}

.divider-copy__text:hover .divider-copy__highlight {
  color: var(--vp-c-brand-1);
}

.divider-copy__highlight {
  color: var(--vp-c-text-1);
  font-weight: 600;
  transition: color 0.15s;
}

@media (max-width: 768px) {
  .divider-copy {
    padding: 28px 20px;
  }
  .divider-copy__inner {
    flex-direction: column;
    gap: 16px;
  }
  .divider-copy__line {
    display: none;
  }
  .divider-copy__text {
    white-space: normal;
    text-align: center;
    font-size: 14px;
    line-height: 1.5;
    max-width: 100%;
  }
}
</style>
