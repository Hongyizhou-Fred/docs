<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from '../../../i18n/useI18n'

const openAIModal = inject<(query?: string) => void>('openAIModal')
const { t } = useI18n()

function callOpenAI() {
  openAIModal?.()
}
</script>

<template>
  <section class="footer-cta">
    <div class="footer-cta-inner">
      <h2 class="fc-title">{{ t('footerCta.headline') }}</h2>
      <p class="fc-sub">{{ t('footerCta.subhead') }}</p>
      <button type="button" class="fc-btn" @click="callOpenAI">
        {{ t('footerCta.askAi') }}
      </button>
    </div>
  </section>
</template>
