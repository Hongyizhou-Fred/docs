<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vitepress'
import { newUserSteps } from '../../data/new-user-path'
import { useI18n } from '../../../i18n/useI18n'
import { useRegion } from '../../composables/useRegion'

const router = useRouter()
const { t } = useI18n()
const { withRegionAndLocale } = useRegion()

const cur = ref(0)
const current = computed(() => newUserSteps[cur.value])

let timer: ReturnType<typeof setInterval> | null = null
function start() {
  stop()
  timer = setInterval(() => {
    cur.value = (cur.value + 1) % newUserSteps.length
  }, 2800)
}
function stop() {
  if (timer) clearInterval(timer)
  timer = null
}
onMounted(start)
onBeforeUnmount(stop)

function select(i: number) {
  cur.value = i
}

function goDoc() {
  router.go(withRegionAndLocale(current.value.path))
}
</script>

<template>
  <section class="nup" @mouseenter="stop" @mouseleave="start">
    <div class="nup__inner">
      <div class="nup__head">
        <span class="nup__eyebrow">{{ t('newUserPath.eyebrow') }}</span>
        <h2 class="nup__title">{{ t('newUserPath.title') }}</h2>
        <p class="nup__caption">{{ t('newUserPath.caption') }}</p>
      </div>

      <div class="nup__grid">
        <div class="nup__nav">
          <button
            v-for="(st, i) in newUserSteps"
            :key="st.id"
            type="button"
            class="nup__nav-btn"
            :class="{ 'is-active': i === cur }"
            @click="select(i)"
          >
            <span
              class="nup__nav-num"
              :class="{
                'is-active': i === cur,
                'is-done': i < cur,
              }"
            >
              {{ st.num }}
            </span>
            <span class="nup__nav-label" :class="{ 'is-active': i === cur }">{{ t(st.title) }}</span>
          </button>
        </div>

        <div :key="cur" class="nup__card nup__fade">
          <div class="nup__card-body">
            <span class="nup__big-num">{{ current.num }}</span>
            <div class="nup__card-text">
              <div class="nup__step-title">{{ t(current.title) }}</div>
              <div class="nup__step-sub">{{ t(current.subtitle) }}</div>
              <div class="nup__card-foot">
                <span class="nup__duration">{{ t('newUserPath.estimate') }} {{ t(current.durationLabel) }}</span>
                <button type="button" class="nup__cta" @click="goDoc">
                  {{ t('newUserPath.viewDoc') }}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="nup__progress">
            <button
              v-for="(_, i) in newUserSteps"
              :key="i"
              type="button"
              class="nup__progress-dot"
              :class="{ 'is-active': i === cur }"
              @click="select(i)"
            />
          </div>
        </div>
      </div>

      <p class="nup__note">{{ t('newUserPath.note') }}</p>
    </div>
  </section>
</template>

<style scoped>
.nup {
  padding: 80px 32px 88px;
  background: var(--vp-c-bg-soft);
}

.nup__inner {
  max-width: 1100px;
  margin: 0 auto;
}

.nup__head {
  margin-bottom: 44px;
}

.nup__eyebrow {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.nup__title {
  margin: 8px 0;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
}

.nup__caption {
  margin: 0;
  font-size: 15px;
  color: var(--vp-c-text-2);
}

.nup__grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 12px;
  align-items: start;
}

.nup__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nup__nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 12px 16px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.18s;
}

.nup__nav-btn.is-active {
  background: var(--vp-c-bg-elv);
  border-color: var(--vp-c-border);
  box-shadow: 0 2px 10px rgba(43, 62, 92, 0.08);
}

.nup__nav-btn:hover:not(.is-active) {
  background: var(--vp-c-bg);
}

.nup__nav-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  background: var(--vp-c-border);
  color: var(--vp-c-text-3);
  transition: all 0.18s;
}

.nup__nav-num.is-done {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.nup__nav-num.is-active {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.nup__nav-label {
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  line-height: 1.3;
  transition: color 0.18s;
}

.nup__nav-label.is-active {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.nup__card {
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  padding: 44px 52px;
  box-shadow: 0 2px 20px rgba(43, 62, 92, 0.08);
  min-height: 220px;
}

.nup__card-body {
  display: flex;
  align-items: flex-start;
  gap: 36px;
}

.nup__big-num {
  font-size: 72px;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  letter-spacing: -0.05em;
  line-height: 0.95;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.nup__card-text {
  flex: 1;
}

.nup__step-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 10px;
  color: var(--vp-c-text-1);
}

.nup__step-sub {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
  line-height: 1.65;
}

.nup__card-foot {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.nup__duration {
  font-size: 13px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  padding: 5px 12px;
  border-radius: 6px;
}

.nup__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 22px;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  font-size: 13.5px;
  font-weight: 600;
  border: 0;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}

.nup__cta:hover {
  background: var(--vp-c-brand-2);
}

.nup__cta:active {
  transform: scale(0.97);
}

.nup__progress {
  display: flex;
  gap: 6px;
  margin-top: 36px;
}

.nup__progress-dot {
  height: 3px;
  width: 8px;
  border-radius: 999px;
  background: var(--vp-c-border);
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.nup__progress-dot.is-active {
  width: 24px;
  background: var(--vp-c-brand-1);
}

.nup__note {
  margin-top: 16px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  padding-left: 212px;
}

@keyframes nup-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.nup__fade {
  animation: nup-fade 0.28s cubic-bezier(0.25, 0.1, 0.25, 1) both;
}

@media (max-width: 900px) {
  .nup__grid {
    grid-template-columns: 1fr;
  }
  .nup__note {
    padding-left: 0;
  }
  .nup__card {
    padding: 28px 24px;
  }
  .nup__card-body {
    gap: 20px;
  }
  .nup__big-num {
    font-size: 52px;
  }
}

@media (max-width: 768px) {
  .nup {
    padding: 56px 20px;
  }
  .nup__title {
    font-size: 26px;
  }
}
</style>
