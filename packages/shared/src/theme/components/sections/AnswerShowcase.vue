<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, inject, computed } from 'vue'
import { useI18n } from '../../../i18n/useI18n'

const openAIModal = inject<(q: string) => void>('openAIModal', () => {})
const { t } = useI18n()

interface Demo {
  q: string
  intro: string
  steps: string[]
  cite: string
}

const DEMO_KEYS = ['deposit', 'optionPcp', 'w8ben']
const demos = computed<Demo[]>(() => DEMO_KEYS.map(k => ({
  q: t(`answerShowcase.demos.${k}.q`),
  intro: t(`answerShowcase.demos.${k}.intro`),
  steps: [
    t(`answerShowcase.demos.${k}.s1`),
    t(`answerShowcase.demos.${k}.s2`),
    t(`answerShowcase.demos.${k}.s3`),
  ],
  cite: t(`answerShowcase.demos.${k}.cite`),
})))

const idx = ref(0)
const current = computed(() => demos.value[idx.value])
const features = computed(() => [
  t('answerShowcase.feat0'),
  t('answerShowcase.feat1'),
  t('answerShowcase.feat2'),
])

let timer: ReturnType<typeof setInterval> | null = null

function start() {
  stop()
  timer = setInterval(() => {
    idx.value = (idx.value + 1) % demos.value.length
  }, 3200)
}
function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

onMounted(start)
onBeforeUnmount(stop)

function jump(i: number) {
  idx.value = i
}

function askDemo() {
  openAIModal(current.value.q)
}
</script>

<template>
  <section
    class="answer-showcase"
    @mouseenter="stop"
    @mouseleave="start"
  >
    <div class="answer-showcase__inner">
      <div class="answer-showcase__left">
        <span class="answer-showcase__eyebrow">{{ t('answerShowcase.eyebrow') }}</span>
        <h2 class="answer-showcase__title">
          {{ t('answerShowcase.title') }}<br />{{ t('answerShowcase.titleEm') }}
        </h2>
        <ul class="answer-showcase__feats">
          <li v-for="f in features" :key="f" class="answer-showcase__feat">
            <span class="answer-showcase__check">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4.5 8l2.5 2.5 4.5-4.5" />
              </svg>
            </span>
            {{ f }}
          </li>
        </ul>
        <button type="button" class="answer-showcase__cta" @click="askDemo">
          {{ t('answerShowcase.cta') }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="answer-showcase__demo">
        <div :key="'q-' + idx" class="answer-showcase__bubble-row answer-showcase__fade">
          <div class="answer-showcase__user">{{ current.q }}</div>
        </div>
        <div :key="'a-' + idx" class="answer-showcase__ai answer-showcase__fade answer-showcase__fade--delay">
          <div class="answer-showcase__ai-head">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {{ t('answerShowcase.aiName') }}
          </div>
          <p class="answer-showcase__intro">{{ current.intro }}</p>
          <ol class="answer-showcase__steps">
            <li v-for="(s, i) in current.steps" :key="i">{{ s }}</li>
          </ol>
          <div class="answer-showcase__cite">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {{ t('answerShowcase.source') }}：<span class="answer-showcase__cite-link">{{ current.cite }}</span>
          </div>
        </div>
        <div class="answer-showcase__dots">
          <button
            v-for="(_, i) in demos"
            :key="i"
            type="button"
            class="answer-showcase__dot"
            :class="{ 'is-active': i === idx }"
            :aria-label="t('answerShowcase.dotsAriaLabel')"
            @click="jump(i)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.answer-showcase {
  padding: 80px 32px;
  background: var(--vp-c-bg);
}

.answer-showcase__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 72px;
  align-items: center;
}

.answer-showcase__eyebrow {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  letter-spacing: 0.02em;
  margin-bottom: 14px;
}

.answer-showcase__title {
  margin: 0 0 22px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
}

.answer-showcase__feats {
  list-style: none;
  margin: 0 0 34px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.answer-showcase__feat {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  color: var(--vp-c-text-1);
}

.answer-showcase__check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.answer-showcase__cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  border-radius: 999px;
  border: 1.5px solid var(--vp-c-text-1);
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.answer-showcase__cta:hover {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
}

.answer-showcase__demo {
  background: var(--vp-c-bg-soft);
  border-radius: 20px;
  padding: 24px 24px 20px;
  min-height: 460px;
  display: flex;
  flex-direction: column;
}

.answer-showcase__bubble-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.answer-showcase__user {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-radius: 18px 18px 4px 18px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  max-width: 80%;
  line-height: 1.4;
}

.answer-showcase__ai {
  background: var(--vp-c-bg-elv);
  border-radius: 4px 18px 18px 18px;
  padding: 16px;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  flex: 1;
}

.answer-showcase__ai-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 9px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.answer-showcase__intro {
  margin: 0 0 10px;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.answer-showcase__steps {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.answer-showcase__steps li {
  font-size: 13.5px;
  color: var(--vp-c-text-1);
  line-height: 1.55;
}

.answer-showcase__cite {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.answer-showcase__cite-link {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.answer-showcase__dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
}

.answer-showcase__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--vp-c-border);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.25s;
}

.answer-showcase__dot.is-active {
  width: 18px;
  background: var(--vp-c-brand-1);
}

.answer-showcase__dot:hover {
  opacity: 0.7;
}

@keyframes fade-slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.answer-showcase__fade {
  animation: fade-slide-in 0.28s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}

.answer-showcase__fade--delay {
  animation-delay: 0.08s;
}

@media (max-width: 900px) {
  .answer-showcase__inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .answer-showcase {
    padding: 56px 20px;
  }
  .answer-showcase__title {
    font-size: 26px;
  }
  .answer-showcase__demo {
    min-height: 420px;
  }
}
</style>
