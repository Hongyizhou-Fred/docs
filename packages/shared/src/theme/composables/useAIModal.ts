import { computed, ref } from 'vue'
import { isWhaleApp } from '../lib/whale-env'
import { useSearchDialog } from './useSearchDialog'

// 项目所有 AI 入口（HomeNavbar Ask AI 按钮、SearchDialog AI row、首页 section
// 等）都通过 useAIModal 控制右侧 AiChatDrawer 的可见性与初始 query。
// 内容由 Helora Embed SDK（inline 模式）渲染进抽屉内的容器。
const modalOpen = ref(false)
const initialQuery = ref('')

// ── AI 总开关 ────────────────────────────────────────────────────
// US 站内嵌 Whale App 时整体关闭 AI:入口按钮隐藏 (消费方用 aiEnabled 做
// v-if)、AiChatDrawer 不挂载 (Helora SDK 脚本是抽屉内懒加载的，不挂载即
// 不加载任何 AI 资源)。散落各 section 的入口若未及隐藏，open/toggle 会
// fallback 打开搜索弹窗，保证不出现"点了没反应"的死按钮。
const CURRENT_REGION = typeof __LB_REGION__ !== 'undefined' ? __LB_REGION__ : 'hk'
const aiDisabled = () =>
  typeof window !== 'undefined' && CURRENT_REGION === 'us' && isWhaleApp()

export function useAIModal() {
  const { open: openSearch } = useSearchDialog()

  const aiEnabled = computed(() => !aiDisabled())

  function openAIModal(query?: string) {
    if (aiDisabled()) {
      // 用户在 AI 入口 (hero 提问框等) 已输入的内容带进搜索弹窗预填，不丢词
      openSearch(query)
      return
    }
    initialQuery.value = query ?? ''
    modalOpen.value = true
  }

  function toggleAIModal() {
    if (aiDisabled()) {
      openSearch()
      return
    }
    modalOpen.value = !modalOpen.value
  }

  function closeAIModal() {
    modalOpen.value = false
  }

  return { modalOpen, initialQuery, aiEnabled, openAIModal, toggleAIModal, closeAIModal }
}
