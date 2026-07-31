import { ref, onMounted } from 'vue'
import { isWhaleApp } from '../lib/whale-env'

// US 站内嵌 Whale App(长桥 App WebView) 时精简站点 chrome:隐藏语言/主题/
// GitHub/开发者外链等浏览器向元素,并整体关闭 AI 入口 (App 内有自己的容器
// 能力与客服通道)。仅 US region 生效，HK/SG 行为不变。
//
// UA 探测是纯客户端信息:SSR 与 hydration 阶段保持 false(与服务端渲染结构
// 一致，避免 hydration mismatch),onMounted 后才翻转 —— App WebView 首帧
// 可能有一次极短的按钮闪现，属已知取舍。
const isUsWhaleEmbed = ref(false)

const CURRENT_REGION = typeof __LB_REGION__ !== 'undefined' ? __LB_REGION__ : 'hk'

export function useWhaleEmbed() {
  onMounted(() => {
    if (CURRENT_REGION === 'us' && isWhaleApp()) {
      isUsWhaleEmbed.value = true
    }
  })
  return { isUsWhaleEmbed }
}
