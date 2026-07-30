<script setup lang="ts">
import { useBreadcrumb } from '../../composables/useBreadcrumb'
import { useI18n } from '../../../i18n/useI18n'
const { breadcrumbItems } = useBreadcrumb()
const { t } = useI18n()
</script>

<template>
  <div v-if="breadcrumbItems.length >= 1" class="lb-breadcrumb">
    <nav class="flex items-center" :aria-label="t('common.breadcrumbAria')">
      <ol class="flex items-center flex-wrap gap-y-1 m-0 p-0 list-none">
        <li
          v-for="(item, index) in breadcrumbItems"
          :key="index"
          class="flex items-center text-sm"
        >
          <a
            v-if="item.link && index !== breadcrumbItems.length - 1"
            :href="item.link"
            class="lb-breadcrumb__link"
          >{{ item.text }}</a>
          <span
            v-else
            class="lb-breadcrumb__current"
          >{{ item.text }}</span>
          <span v-if="index < breadcrumbItems.length - 1" class="lb-breadcrumb__sep" aria-hidden="true">/</span>
        </li>
      </ol>
    </nav>
  </div>
</template>

<style scoped>
.lb-breadcrumb {
  margin-bottom: 14px;
}
.lb-breadcrumb__link {
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}
.lb-breadcrumb__link:hover {
  color: var(--vp-c-brand-1);
}
.lb-breadcrumb__current {
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.lb-breadcrumb__sep {
  margin: 0 8px;
  color: var(--vp-c-text-3);
}
</style>
