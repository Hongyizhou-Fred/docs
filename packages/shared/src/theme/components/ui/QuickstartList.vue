<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'

interface Item {
  id: string
  title: string
}

interface Props {
  items: Item[]
}

const props = defineProps<Props>()
const activeId = ref<string>('')
provide('quickstart:registerActive', activeId)

let observer: IntersectionObserver | null = null

function scrollTo(id: string) {
  const el = document.getElementById(`qs-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  if (props.items.length) activeId.value = props.items[0].id

  const ids = new Set(props.items.map((i) => i.id))
  const targets = props.items
    .map((i) => document.getElementById(`qs-${i.id}`))
    .filter((el): el is HTMLElement => !!el)

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .map((e) => ({ id: e.target.id.replace(/^qs-/, ''), top: e.boundingClientRect.top }))
        .filter((v) => ids.has(v.id))
        .sort((a, b) => a.top - b.top)
      if (visible[0]) activeId.value = visible[0].id
    },
    { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.5, 1] }
  )

  targets.forEach((t) => observer?.observe(t))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="lb-quickstart">
    <aside class="lb-quickstart__nav" aria-label="Quickstart steps">
      <ol>
        <li
          v-for="(item, i) in items"
          :key="item.id"
          class="lb-quickstart__row"
          :class="{ 'is-active': item.id === activeId, 'is-past': items.findIndex(x => x.id === activeId) > i }"
        >
          <button
            type="button"
            class="lb-quickstart__btn"
            @click="scrollTo(item.id)"
          >
            <span class="lb-quickstart__badge" aria-hidden="true">{{ i + 1 }}</span>
            <span class="lb-quickstart__title">{{ item.title }}</span>
          </button>
          <span v-if="i < items.length - 1" class="lb-quickstart__rail" aria-hidden="true" />
        </li>
      </ol>
    </aside>
    <div class="lb-quickstart__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lb-quickstart {
  --at-apply: my-8 grid gap-10;
  grid-template-columns: minmax(180px, 220px) 1fr;
}

.lb-quickstart__nav {
  position: sticky;
  top: calc(var(--hn-height, 104px) + 24px);
  align-self: start;
  max-height: calc(100vh - var(--hn-height, 104px) - 48px);
  overflow-y: auto;
}

.lb-quickstart__nav ol {
  --at-apply: m-0 p-0 list-none;
}

.lb-quickstart__row {
  position: relative;
}

.lb-quickstart__btn {
  --at-apply: flex items-center gap-3 w-full py-2 px-0 bg-transparent border-0 cursor-pointer;
  color: var(--vp-c-text-2);
  text-align: left;
  transition: color 0.15s;
}

.lb-quickstart__btn:hover {
  color: var(--vp-c-text-1);
}

.lb-quickstart__badge {
  --at-apply: inline-flex items-center justify-center rounded-full flex-shrink-0;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 600;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.lb-quickstart__title {
  font-size: 14px;
  font-weight: 500;
}

.lb-quickstart__rail {
  position: absolute;
  left: 11px;
  top: 30px;
  bottom: -10px;
  width: 1px;
  background: var(--vp-c-divider);
  transition: background 0.15s;
}

.lb-quickstart__row.is-active .lb-quickstart__badge {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

.lb-quickstart__row.is-active .lb-quickstart__title {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.lb-quickstart__row.is-past .lb-quickstart__badge {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.lb-quickstart__row.is-past .lb-quickstart__rail,
.lb-quickstart__row.is-active .lb-quickstart__rail {
  background: var(--vp-c-brand-1);
}

.lb-quickstart__body :deep(.lb-quickstart-item) {
  padding-bottom: 64px;
}

.lb-quickstart__body :deep(.lb-quickstart-item:last-child) {
  padding-bottom: 0;
}

@media (max-width: 768px) {
  .lb-quickstart {
    grid-template-columns: 1fr;
  }

  .lb-quickstart__nav {
    position: static;
    max-height: none;
    border-bottom: 1px solid var(--vp-c-divider);
    padding-bottom: 12px;
    margin-bottom: 12px;
  }
}
</style>
