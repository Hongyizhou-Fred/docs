<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@/lib/utils"

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    v-bind="$attrs"
    :class="cn(
      'flex w-full px-4 py-0 text-[15px] leading-none',
      'bg-background text-foreground placeholder:text-muted-foreground',
      'border border-input rounded-[14px]',
      'outline-none transition-[border-color,box-shadow] duration-150 ease-out',
      'focus:border-ring focus:shadow-[inset_0_0_0_1.5px_var(--ring)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      props.class
    )"
  />
</template>
