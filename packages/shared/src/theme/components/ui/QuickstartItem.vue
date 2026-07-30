<script setup lang="ts">
interface Props {
  id: string
  title?: string
}

defineProps<Props>()
</script>

<template>
  <section :id="`qs-${id}`" class="lb-quickstart-item">
    <h3 v-if="title" class="lb-quickstart-item__title">{{ title }}</h3>
    <div class="lb-quickstart-item__content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.lb-quickstart-item {
  scroll-margin-top: calc(var(--hn-height, 104px) + 32px);
}

.lb-quickstart-item__title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.lb-quickstart-item__content :deep(p:first-child) {
  margin-top: 0;
}
</style>
