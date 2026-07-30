<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from '../../../i18n/useI18n'
import Button from '../ui/Button.vue'

const { t } = useI18n()
const openAIModal = inject<(q: string) => void>('openAIModal', () => {})

function handleAsk() {
  openAIModal('')
}
</script>

<template>
  <div class="ask-banner">
    <div class="ask-banner__left">
      <span class="ask-banner__title">{{ t('journey.askBanner.title') }}</span>
      <span class="ask-banner__subtitle">{{ t('journey.askBanner.subtitle') }}</span>
    </div>
    <Button variant="default" size="default" class="ask-banner__cta" @click="handleAsk">
      <span class="ask-banner__spark" aria-hidden="true">✦</span>
      {{ t('journey.askBanner.cta') }}
    </Button>
  </div>
</template>

<style scoped>
.ask-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 32px;
  padding: 18px 24px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--vp-c-bg-soft) 0%,
    var(--vp-c-bg-alt) 100%
  );
  border: 1px solid var(--vp-c-divider);
}

.ask-banner__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ask-banner__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.ask-banner__subtitle {
  font-size: 12px;
  color: var(--vp-c-text-3);
  line-height: 1.5;
}

.ask-banner__cta {
  flex-shrink: 0;
  gap: 6px;
}

.ask-banner__spark {
  display: inline-block;
  font-size: 12px;
  transition: transform 200ms ease-out;
}

.ask-banner__cta:hover .ask-banner__spark {
  transform: rotate(12deg) scale(1.1);
}

@media (max-width: 640px) {
  .ask-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .ask-banner__cta {
    align-self: stretch;
  }
}
</style>
