<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import { hotSearchTags } from '../../data/featured-asks'
import HeroGridBg from '../HeroGridBg.vue'
import { useI18n } from '../../../i18n/useI18n'

const openAIModal = inject<(q: string) => void>('openAIModal', () => {})
const { t } = useI18n()

const inputValue = ref('')
const searchPlaceholder = computed(() => t('askHero.placeholder'))
const searchExample = computed(() => t('askHero.placeholderExample'))

function submit() {
  const q = inputValue.value.trim()
  openAIModal(q || searchExample.value)
  inputValue.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function askHot(tag: { q: string; initialPrompt: string }) {
  // initialPrompt 现在也是 i18n key（data.featuredAsks.prompts.<id>），按当前 locale 解析
  openAIModal(t(tag.initialPrompt))
}
</script>

<template>
  <section class="ask-hero">
    <HeroGridBg class="ask-hero__bg" />

    <div class="ask-hero__inner">
      <h1 class="ask-hero__title">
        <span class="ask-hero__title-line ask-hero__title-dark">{{ t('askHero.title') }}</span>
        <span class="ask-hero__title-line ask-hero__title-brand">{{ t('askHero.titleEm') }}</span>
      </h1>
      <p class="ask-hero__subtitle">{{ t('askHero.subtitle') }}</p>

      <div class="ask-hero__search">
        <svg
          class="ask-hero__search-icon"
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="inputValue"
          class="ask-hero__input"
          :placeholder="searchPlaceholder"
          @keydown="handleKeydown"
        />
        <button class="ask-hero__btn" type="button" @click="submit">
          {{ t('askHero.search') }}
        </button>
      </div>

      <div class="ask-hero__hot">
        <svg
          class="ask-hero__hot-icon"
          width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <span class="ask-hero__hot-label">{{ t('askHero.hotSearchLabel') }}</span>
        <button
          v-for="tag in hotSearchTags"
          :key="tag.q"
          type="button"
          class="ask-hero__hot-tag"
          @click="askHot(tag)"
        >
          {{ t(tag.q) }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ask-hero {
  position: relative;
  overflow: hidden;
  padding: 88px 32px 100px;
  text-align: center;
  background: linear-gradient(170deg, #f0fdfb 0%, #ffffff 55%);
}

.ask-hero__bg {
  position: absolute;
  inset: 0;
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.ask-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 660px;
  margin: 0 auto;
}

.ask-hero__title {
  margin: 0;
  font-size: clamp(48px, 7.4vw, 76px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.035em;
}

.ask-hero__title-line {
  display: block;
}

.ask-hero__title-dark {
  color: var(--vp-c-text-1);
}

.ask-hero__title-brand {
  color: var(--vp-c-brand-1);
}

.ask-hero__subtitle {
  margin: 22px 0 0;
  font-size: 16px;
  line-height: 1.75;
  color: var(--vp-c-text-2);
}

.ask-hero__search {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 16px;
  background: var(--vp-c-bg-elv);
  border-radius: 14px;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
}

.ask-hero__search-icon {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
}

.ask-hero__input {
  flex: 1;
  min-width: 0;
  height: 36px;
  font-size: 15px;
  color: var(--vp-c-text-1);
  background: transparent;
  border: none;
  outline: none;
}

.ask-hero__input::placeholder {
  color: var(--vp-c-text-3);
}

.ask-hero__btn {
  flex-shrink: 0;
  padding: 9px 22px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-bg);
  background: var(--vp-c-text-1);
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}

.ask-hero__btn:hover {
  opacity: 0.85;
}

.ask-hero__btn:active {
  opacity: 0.75;
  transform: scale(0.97);
}

.ask-hero__hot {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ask-hero__hot-icon {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.ask-hero__hot-label {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.ask-hero__hot-tag {
  padding: 5px 13px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-border);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.ask-hero__hot-tag:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .ask-hero {
    padding: 64px 20px 72px;
  }
  .ask-hero__title {
    font-size: clamp(40px, 9vw, 56px);
  }
  .ask-hero__btn {
    padding: 8px 16px;
  }
}
</style>
