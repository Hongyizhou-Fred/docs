<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, inBrowser } from 'vitepress'
import { useI18n } from '../../i18n/useI18n'

const route = useRoute()
const submitted = ref(false)

watch(() => route.path, () => {
  if (!inBrowser) return
  const stored = localStorage.getItem(`lb-feedback:${route.path}`)
  submitted.value = !!stored
}, { immediate: true })

const { t } = useI18n()

function vote(type: 'up' | 'down') {
  if (!inBrowser) return
  localStorage.setItem(`lb-feedback:${route.path}`, type)
  submitted.value = true
}
</script>

<template>
  <div v-if="!submitted" class="lb-page-feedback">
    <span>{{ t('feedback.question') }}</span>
    <button class="lb-pfb-btn" @click="vote('up')">{{ t('feedback.helpful') }}</button>
    <button class="lb-pfb-btn" @click="vote('down')">{{ t('feedback.needWork') }}</button>
  </div>
  <div v-else class="lb-page-feedback lb-page-feedback--done">
    {{ t('feedback.thanks') }}
  </div>
</template>
