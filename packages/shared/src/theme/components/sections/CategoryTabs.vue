<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { Ref } from 'vue'
import Tabs from '../ui/Tabs.vue'
import { getMarketCount, type Category, type Market } from '../../data/journey'
import { useI18n } from '../../../i18n/useI18n'

const { t } = useI18n()

const props = defineProps<{
  categories: Category[]
  activeCategory: string
}>()

const emit = defineEmits<{
  'update:activeCategory': [id: string]
}>()

const activeMarket = inject<Ref<Market>>('journeyMarket', ref('hk') as Ref<Market>)

const tabList = computed(() => [
  { value: 'all', label: t('category.all'), badge: getMarketCount('all', activeMarket.value) },
  ...props.categories.map(cat => ({
    value: cat.id,
    label: t(cat.label),
    badge: getMarketCount(cat.id, activeMarket.value),
  })),
])
</script>

<template>
  <div class="mb-6">
    <Tabs
      :model-value="activeCategory"
      :tabs="tabList"
      :aria-label="t('category.ariaLabel')"
      @update:model-value="emit('update:activeCategory', $event)"
    />
  </div>
</template>
