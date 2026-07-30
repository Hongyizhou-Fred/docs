<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from '../../../i18n/useI18n'

const openAIModal = inject<(query?: string) => void>('openAIModal')
const { t } = useI18n()

function tryAI() {
  openAIModal?.()
}
</script>

<template>
  <section class="ai-feature">
    <div class="ai-feature-inner">
      <div class="af-text">
        <span class="af-label">{{ t('aiFeature.label') }}</span>
        <h2 class="af-title">{{ t('aiFeature.title') }}</h2>
        <ul class="af-list">
          <li>{{ t('aiFeature.items.0') }}</li>
          <li>{{ t('aiFeature.items.1') }}</li>
          <li>{{ t('aiFeature.items.2') }}</li>
        </ul>
        <button type="button" class="af-btn" @click="tryAI">{{ t('aiFeature.tryBtn') }}</button>
      </div>
      <div class="af-demo" aria-hidden="true">
        <div class="chat-window">
          <div class="chat-bubble chat-bubble--user">{{ t('aiFeature.demo.user1') }}</div>
          <div class="chat-bubble chat-bubble--ai">{{ t('aiFeature.demo.ai1') }}</div>
          <div class="chat-bubble chat-bubble--user">{{ t('aiFeature.demo.user2') }}</div>
          <div class="chat-bubble chat-bubble--ai">{{ t('aiFeature.demo.ai2') }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
