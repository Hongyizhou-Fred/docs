<script setup lang="ts">
import { useRouter } from 'vitepress'
import { categoryGroups } from '../../data/category-groups'
import { useI18n } from '../../../i18n/useI18n'
import { useRegion } from '../../composables/useRegion'

const router = useRouter()
const { t } = useI18n()
const { withRegionAndLocale } = useRegion()
</script>

<template>
  <section class="category-groups">
    <div class="category-groups__inner">
      <h2 class="category-groups__title">{{ t('category.heading') }}</h2>
      <div class="category-groups__list">
        <div
          v-for="group in categoryGroups"
          :key="group.name"
          class="category-groups__row"
        >
          <span class="category-groups__group-name">{{ t(group.name) }}</span>
          <div class="category-groups__chips">
            <button
              v-for="item in group.items"
              :key="item.path"
              class="category-groups__chip"
              @click="router.go(withRegionAndLocale(item.path))"
            >
              {{ t(item.label) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.category-groups {
  background: var(--vp-c-bg);
  padding: 96px 48px;
}

.category-groups__inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.category-groups__title {
  font-size: 28px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  letter-spacing: -0.01em;
}

.category-groups__list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.category-groups__row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.category-groups__row:last-child {
  border-bottom: none;
}

.category-groups__group-name {
  flex-shrink: 0;
  width: 80px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  padding-top: 2px;
}

.category-groups__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-groups__chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: none;
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  cursor: pointer;
  transition: background 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out;
  line-height: 1;
}

.category-groups__chip:hover {
  background: var(--vp-c-bg-alt);
  border-color: var(--vp-c-text-3);
  color: var(--vp-c-text-1);
}

@media (max-width: 768px) {
  .category-groups {
    padding: 64px 16px;
  }

  .category-groups__row {
    flex-direction: column;
    gap: 12px;
  }

  .category-groups__group-name {
    width: auto;
  }
}
</style>
