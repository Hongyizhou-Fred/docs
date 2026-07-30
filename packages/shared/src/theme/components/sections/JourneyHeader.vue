<script setup lang="ts">
import { inject } from 'vue'
import type { Ref } from 'vue'
import Tabs from '../ui/Tabs.vue'
import { markets, type Market } from '../../data/journey'
import { useI18n } from '../../../i18n/useI18n'

const activeMarketRef = inject<Ref<Market>>('journeyMarket')!
const { t } = useI18n()

function updateMarket(value: string) {
  activeMarketRef.value = value as Market
}
</script>

<template>
  <div class="journey-header">
    <div class="journey-header__inner">
      <div class="journey-header__top">
        <h2 class="journey-header__title">{{ t('journey.headingExperienced') }}</h2>
        <Tabs
          variant="pills"
          :model-value="activeMarketRef"
          :tabs="markets"
          class="journey-header__market"
          @update:model-value="updateMarket"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.journey-header {
  padding: 0 48px 0;
}

.journey-header__inner {
  max-width: 1200px;
  margin: 0 auto;
}

.journey-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.journey-header__title {
  font-size: 28px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  letter-spacing: -0.01em;
}

@media (max-width: 768px) {
  .journey-header {
    padding: 0 16px 0;
  }

  .journey-header__top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
