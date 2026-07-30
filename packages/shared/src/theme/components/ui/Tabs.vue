<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'
import { useI18n } from '../../../i18n/useI18n'

const props = defineProps<{
  modelValue: string
  tabs: {
    value: string
    label: string
    badge?: string | number
  }[]
  ariaLabel?: string
  variant?: 'underline' | 'pills'
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- pills variant：药丸分段切换（原 SegmentedControl） -->
    <TabsList
      v-if="variant === 'pills'"
      :class="cn('inline-flex items-center rounded-[10px] bg-muted p-[3px] gap-[2px]')"
      :aria-label="ariaLabel"
    >
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :class="cn(
          'relative px-4 py-1.5 text-[13px] font-medium rounded-[8px]',
          'text-muted-foreground transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'select-none cursor-pointer outline-none',
          'hover:text-foreground',
          'data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm',
        )"
      >
        <slot :name="`label-${tab.value}`">{{ t(tab.label) }}</slot>
      </TabsTrigger>
    </TabsList>

    <!-- underline variant（默认）：下划线导航 Tab -->
    <TabsList
      v-else
      :class="cn(
        'flex items-center gap-0',
        'border-b border-border',
        'overflow-x-auto scrollbar-none -webkit-overflow-scrolling-touch',
      )"
      :aria-label="ariaLabel"
    >
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :class="cn(
          'group inline-flex items-center gap-1.5',
          'px-3 py-2 mb-[-1px]',
          'text-base font-medium whitespace-nowrap',
          'text-foreground border-b-2 border-transparent',
          'outline-none select-none cursor-pointer',
          'transition-colors duration-150',
          'hover:text-foreground',
          'data-[state=active]:text-primary data-[state=active]:border-primary',
        )"
      >
        <slot :name="`label-${tab.value}`">{{ tab.label }}</slot>
        <span
          v-if="tab.badge !== undefined"
          :class="cn(
            'text-xs font-medium tabular-nums',
            'px-1.5 py-0.5 rounded-full',
            'text-muted-foreground bg-transparent',
            'transition-colors duration-150',
            'group-data-[state=active]:text-primary group-data-[state=active]:bg-muted',
          )"
        >
          {{ tab.badge }}
        </span>
      </TabsTrigger>
    </TabsList>

    <slot />
  </TabsRoot>
</template>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
