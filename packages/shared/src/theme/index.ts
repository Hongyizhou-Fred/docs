import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { inBrowser } from 'vitepress'
import 'virtual:uno.css'
import './tailwind.css'
import './style/index.css'
import Layout from './layouts/Layout.vue'
import HomeCards from './components/HomeCards.vue'
import Tabs from './components/Tabs.vue'
import TabItem from './components/TabItem.vue'
import LinkGraph from './components/LinkGraph.vue'
import HomeSupport from './components/HomeSupport.vue'
import HomeNavbar from './components/HomeNavbar.vue'
import Callout from './components/ui/Callout.vue'
import CliCommand from './components/ui/CliCommand.vue'
import Stepper from './components/ui/Stepper.vue'
import StepperPanel from './components/ui/StepperPanel.vue'
import QuickstartList from './components/ui/QuickstartList.vue'
import QuickstartItem from './components/ui/QuickstartItem.vue'
import { i18n } from '../i18n'

// Register Cmd/Ctrl+K interceptor BEFORE any VitePress component mounts,
// so our handler always wins the capture-phase race.
if (inBrowser) {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      e.stopImmediatePropagation()
      window.dispatchEvent(new CustomEvent('lb:search:toggle'))
    }
  }, { capture: true, passive: false })

  // 必须在 VitePress router 注册其全局 click 拦截之前监听，否则点 group link
  // 时 VitePress 会先 router.go() 跳转，我们的 preventDefault 已经晚了。
  // 行为：点击 group 文字 →
  //   收起态：补 caret 展开 + 让 VitePress 跳转 overview
  //   展开态且点击会跳转（不在该 group 的 overview 页）：只跳转、不收起——
  //     跳转后 group 变 active 会被 VitePress watchPostEffect 强制展开，
  //     先收起会出现"收起 0.28s 动画 → 立刻重新展开"的整栏闪烁
  //   展开态且已在 overview 页（点击无导航发生）：toggle 收起
  window.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const link = target.closest<HTMLAnchorElement>('.VPSidebar a.link')
    if (!link) return
    const item = link.parentElement
    if (!item || !item.classList.contains('item')) return
    const group = item.parentElement as HTMLElement | null
    if (!group || !group.classList.contains('VPSidebarItem')) return
    if (!group.classList.contains('collapsible')) return
    if (!group.classList.contains('collapsed')) {
      const norm = (p: string) => p.replace(/\.html$/, '').replace(/\/$/, '')
      if (norm(link.pathname) !== norm(location.pathname)) return
    }
    const caret = group.querySelector<HTMLElement>(':scope > .item > .caret')
    if (!caret) return
    caret.click()
    window.dispatchEvent(new CustomEvent('lb:sidebar:group-toggled', { detail: { group } }))
  }, { capture: true })

  // 文章正文内 markdown 链接重写：VitePress 默认会给 absolute link 补 base
  // （region 段），但不补 locale。zh-CN 页面里的 [xx](/account/foo) 渲染后是
  // `/hk/account/foo`，缺 /zh-CN。capture 阶段把 href 改写成
  // `<region>/<locale>/<path>(/overview)`——先 strip 已有 region+locale 再用
  // 当前 URL 的前缀重组，幂等。VitePress router click handler 在 bubble 阶段
  // 读 link.getAttribute('href') 拿到我们的重写值。
  window.addEventListener('click', (e: MouseEvent) => {
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a')
    if (!link) return
    // 仅文章正文链接；侧边栏 / 顶部 nav / 其他自定义组件不动
    if (!link.closest('.vp-doc, .VPDoc')) return
    if (link.hasAttribute('download') || link.hasAttribute('target')) return
    const href = link.getAttribute('href')
    if (!href || !href.startsWith('/') || href.startsWith('//')) return
    // 从当前 URL 推断 region + locale
    const m = location.pathname.match(/^\/(hk|sg|us)(?:\/(zh-CN|zh-HK))?/)
    if (!m) return
    const regionSeg = `/${m[1]}`
    const localeSeg = m[2] ? `/${m[2]}` : ''
    // strip 已有的 region + locale 前缀（幂等）
    let bare = href.replace(/^\/(hk|sg|us)(\/(zh-CN|zh-HK))?/, '')
    if (!bare.startsWith('/')) bare = '/' + bare
    // 目录类（/foo/）补 overview
    if (bare !== '/' && bare.endsWith('/')) bare = `${bare}overview`
    const next = `${regionSeg}${localeSeg}${bare}`
    if (next !== href) link.setAttribute('href', next)
  }, { capture: true })

  // 移动端「页面导航」dropdown 的当前激活项高亮：VitePress 自带的 useActiveAnchor
  // 只给桌面 aside 跑（!isAsideEnabled 时早退），移动 dropdown 永远拿不到 .active
  // 类。这里在 dropdown 出现时自己跑一个 scroll observer，找到当前视口最上方的
  // heading 给对应 outline-link 加 .active。逻辑同 vitepress 内部简化版。
  let mobileScrollHandler: (() => void) | null = null

  function syncMobileActive(container: HTMLElement) {
    const scrollY = window.scrollY
    const offset = 100 // 近似 VitePress 的 scroll-offset
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>('.vp-doc :where(h2,h3,h4,h5,h6)[id]'),
    )
    let active: string | null = null
    for (const h of headings) {
      const top = h.getBoundingClientRect().top + scrollY
      if (top > scrollY + offset + 4) break
      active = h.id
    }
    container.querySelectorAll<HTMLAnchorElement>('.outline-link').forEach((l) => {
      const href = l.getAttribute('href') ?? ''
      l.classList.toggle('active', active != null && href === `#${active}`)
    })
  }

  function attachMobileDropdown(dropdownOutline: HTMLElement) {
    if (mobileScrollHandler) return // 已挂载
    const handler = () => syncMobileActive(dropdownOutline)
    mobileScrollHandler = handler
    syncMobileActive(dropdownOutline)
    window.addEventListener('scroll', handler, { passive: true })
  }

  function detachMobileDropdown() {
    if (!mobileScrollHandler) return
    window.removeEventListener('scroll', mobileScrollHandler)
    mobileScrollHandler = null
  }

  // dropdown 是 v-if 控制的，每次打开/关闭都会出现/消失。监听 body 子树看到
  // .VPLocalNavOutlineDropdown .items .outline 出现/消失时挂/解 scroll handler。
  const dropdownWatcher = new MutationObserver(() => {
    const node = document.querySelector<HTMLElement>(
      '.VPLocalNavOutlineDropdown .items .outline',
    )
    if (node) attachMobileDropdown(node)
    else detachMobileDropdown()
  })
  dropdownWatcher.observe(document.body, { childList: true, subtree: true })
}

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.use(i18n)
    app.component('HomeSupport', HomeSupport)
    app.component('HomeNavbar', HomeNavbar)
    app.component('HomeCards', HomeCards)
    app.component('Tabs', Tabs)
    app.component('TabItem', TabItem)
    app.component('LinkGraph', LinkGraph)
    app.component('Callout', Callout)
    app.component('CliCommand', CliCommand)
    app.component('Stepper', Stepper)
    app.component('StepperPanel', StepperPanel)
    app.component('QuickstartList', QuickstartList)
    app.component('QuickstartItem', QuickstartItem)
  },
} satisfies Theme
