<!-- docs/.vitepress/theme/components/sections/HeroSection.vue -->
<script setup lang="ts">
import { ref, inject } from 'vue'
import { inBrowser } from 'vitepress'
import { useI18n } from '../../../i18n/useI18n'

const { t } = useI18n()
const openAIModal = inject<(query?: string) => void>('openAIModal')

const query = ref('')

function handleSearch() {
  openAIModal?.(query.value.trim() || undefined)
}

function scrollToTopics() {
  if (!inBrowser) return
  document.getElementById('topics-section')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-badge">{{ t('hero.badge') }}</div>
      <h1 class="hero-h1">
        {{ t('hero.title') }}<br>
        <span class="hero-accent">{{ t('hero.titleEm') }}</span>
      </h1>
      <p class="hero-sub">
        {{ t('hero.subtitle') }}
      </p>
      <div class="hero-search-wrap">
        <input
          v-model="query"
          type="text"
          class="hero-input"
          :placeholder="t('hero.placeholder')"
          :aria-label="t('hero.searchAriaLabel')"
          @keydown.enter="handleSearch"
        />
        <button class="hero-search-btn" @click="handleSearch">{{ t('hero.search') }}</button>
      </div>
      <div class="hero-actions">
        <button class="hero-btn-primary" @click="openAIModal?.()">
          {{ t('hero.askAi') }}
        </button>
        <button class="hero-btn-outline" @click="scrollToTopics">
          {{ t('hero.browse') }}
        </button>
      </div>
    </div>
  </section>
</template>
