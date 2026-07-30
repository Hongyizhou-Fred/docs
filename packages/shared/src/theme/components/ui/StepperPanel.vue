<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'

interface Props {
  id: string
}

const props = defineProps<Props>()
const activeId = inject<Ref<string>>('stepper:activeId')
const isActive = computed(() => activeId?.value === props.id)
</script>

<template>
  <div v-show="isActive" class="lb-stepper-panel">
    <slot />
  </div>
</template>

<style scoped>
.lb-stepper-panel {
  --at-apply: max-w-full;
}

.lb-stepper-panel :deep(p:first-child) {
  margin-top: 0;
}

.lb-stepper-panel :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
