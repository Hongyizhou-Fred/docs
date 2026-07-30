<script setup lang="ts">
import { provide } from 'vue'
import AskHero from './sections/AskHero.vue'
import DividerCopy from './sections/DividerCopy.vue'
import AnswerShowcase from './sections/AnswerShowcase.vue'
import NewUserPath from './sections/NewUserPath.vue'
import TaskIndex from './sections/TaskIndex.vue'
import FooterMini from './sections/FooterMini.vue'
import { useAIModal } from '../composables/useAIModal'

const { openAIModal } = useAIModal()

provide('openAIModal', openAIModal)
</script>

<template>
  <div class="home-support">
    <AskHero />
    <DividerCopy />
    <AnswerShowcase />
    <NewUserPath />
    <TaskIndex />
    <FooterMini />
  </div>
</template>

<style scoped>
.home-support {
  min-height: 100vh;
}
</style>
