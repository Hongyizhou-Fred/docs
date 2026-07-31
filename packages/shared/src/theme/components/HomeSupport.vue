<script setup lang="ts">
import { provide } from 'vue'
import AskHero from './sections/AskHero.vue'
import DividerCopy from './sections/DividerCopy.vue'
import AnswerShowcase from './sections/AnswerShowcase.vue'
import NewUserPath from './sections/NewUserPath.vue'
import TaskIndex from './sections/TaskIndex.vue'
import FooterMini from './sections/FooterMini.vue'
import { useAIModal } from '../composables/useAIModal'
import { useWhaleEmbed } from '../composables/useWhaleEmbed'
import { useRegion } from '../composables/useRegion'

const { openAIModal } = useAIModal()
// US 站内嵌 Whale App 时 AI 整体关闭,首页的 AI 宣传模块(DividerCopy 的
// "Ask AI in one sentence" 文案、AnswerShowcase 的 AI Assistant 展示)一并隐藏
const { isUsWhaleEmbed } = useWhaleEmbed()
// NewUserPath(新手 5 步引导)按整个 US region 隐藏:步骤链接指向 HK 的
// 业务文档路径,US(Zendesk 内容)没有对应文章
const { region } = useRegion()

provide('openAIModal', openAIModal)
</script>

<template>
  <div class="home-support">
    <AskHero />
    <template v-if="!isUsWhaleEmbed">
      <DividerCopy />
      <AnswerShowcase />
    </template>
    <NewUserPath v-if="region !== 'us'" />
    <TaskIndex />
    <FooterMini />
  </div>
</template>

<style scoped>
.home-support {
  min-height: 100vh;
}
</style>
