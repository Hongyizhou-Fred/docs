import { ref } from 'vue'

// 项目所有 AI 入口（HomeNavbar Ask AI 按钮、SearchDialog AI row、首页 section
// 等）都通过 useAIModal 控制右侧 AiChatDrawer 的可见性与初始 query。
// 内容由 Helora Embed SDK（inline 模式）渲染进抽屉内的容器。
const modalOpen = ref(false)
const initialQuery = ref('')

export function useAIModal() {
  function openAIModal(query?: string) {
    initialQuery.value = query ?? ''
    modalOpen.value = true
  }

  function toggleAIModal() {
    modalOpen.value = !modalOpen.value
  }

  function closeAIModal() {
    modalOpen.value = false
  }

  return { modalOpen, initialQuery, openAIModal, toggleAIModal, closeAIModal }
}
