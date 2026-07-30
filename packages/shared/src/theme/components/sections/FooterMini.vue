<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from '../../../i18n/useI18n'
import { useRegion } from '../../composables/useRegion'
import { categoryGroups } from '../../data/category-groups'

const openAIModal = inject<(q: string) => void>('openAIModal', () => {})
const { t } = useI18n()
const { withRegionAndLocale, articleExists } = useRegion()

// 三列基础数据：交易类 / 账户支撑 / 帮助
const baseCols = [
  categoryGroups[0],
  categoryGroups[3],
  categoryGroups[4],
]

// 按当前 region 过滤：item.path 对应文章不存在则隐藏；整列被清空也不再渲染
const cols = computed(() =>
  baseCols
    .map((c) => ({ ...c, items: c.items.filter((it) => articleExists(it.path)) }))
    .filter((c) => c.items.length > 0),
)

// 底部行的隐私 / 合规链接同样按 region 过滤
const showPrivacy = computed(() => articleExists('/compliance-and-tax/privacy-policy'))
const showCompliance = computed(() => articleExists('/compliance-and-tax/'))

function askAi() {
  openAIModal('')
}
</script>

<template>
  <footer class="ftm">
    <div class="ftm__inner">
      <div class="ftm__grid">
        <div class="ftm__brand">
          <div class="ftm__brand-name">Longbridge Docs</div>
          <p class="ftm__tagline">{{ t('footerMini.tagline') }}</p>
          <button type="button" class="ftm__ai" @click="askAi">
            {{ t('footerMini.askAi') }}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <div v-for="col in cols" :key="col.name" class="ftm__col">
          <div class="ftm__col-title">{{ t(col.name) }}</div>
          <ul class="ftm__list">
            <li v-for="item in col.items" :key="item.path">
              <a :href="withRegionAndLocale(item.path)" class="ftm__link">{{ t(item.label) }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="ftm__bottom">
        <span class="ftm__copy">{{ t('footerMini.copyright') }}</span>
        <nav class="ftm__bottom-nav" :aria-label="t('footerMini.navAriaLabel')">
          <a href="https://longbridge.com" target="_blank" rel="noopener" class="ftm__bottom-link">{{ t('footerMini.official') }}</a>
          <a v-if="showPrivacy" :href="withRegionAndLocale('/compliance-and-tax/privacy-policy')" class="ftm__bottom-link">{{ t('footerMini.privacy') }}</a>
          <a v-if="showCompliance" :href="withRegionAndLocale('/compliance-and-tax/')" class="ftm__bottom-link">{{ t('footerMini.compliance') }}</a>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.ftm {
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
}

.ftm__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 56px 32px 0;
}

.ftm__grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 52px;
}

.ftm__brand-name {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.ftm__tagline {
  margin: 0 0 22px;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  line-height: 1.7;
  max-width: 220px;
}

.ftm__ai {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1.5px solid var(--vp-c-text-1);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.ftm__ai:hover {
  background: var(--vp-c-text-1);
  color: #fff;
}

.ftm__col-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ftm__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.ftm__link {
  font-size: 14px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.15s;
}

.ftm__link:hover {
  color: var(--vp-c-text-1);
}

.ftm__bottom {
  border-top: 1px solid var(--vp-c-divider);
  padding: 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.ftm__copy {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.ftm__bottom-nav {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.ftm__bottom-link {
  font-size: 13px;
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color 0.15s;
}

.ftm__bottom-link:hover {
  color: var(--vp-c-text-1);
}

@media (max-width: 900px) {
  .ftm__grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .ftm__inner {
    padding: 36px 20px 0;
  }
  .ftm__grid {
    grid-template-columns: 1fr 1fr;
    gap: 28px 20px;
    padding-bottom: 32px;
  }
  .ftm__brand {
    grid-column: 1 / -1;
  }
  .ftm__tagline {
    max-width: none;
    margin-bottom: 16px;
  }
  .ftm__col-title {
    margin-bottom: 10px;
  }
  .ftm__list {
    gap: 9px;
  }
  .ftm__link {
    font-size: 13.5px;
  }
  .ftm__bottom {
    padding: 16px 0;
  }
}

@media (max-width: 420px) {
  .ftm__grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .ftm__list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 16px;
  }
}
</style>
