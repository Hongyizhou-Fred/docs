<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter, useData, inBrowser } from 'vitepress'
import {
  PhDotsThreeVertical as MoreVertical,
  PhArrowSquareOut as ExternalLink,
  PhSun as Sun,
  PhMoon as Moon,
  PhGlobe as Globe,
  PhGithubLogo as Github,
  PhCaretDown as ChevronDown,
} from '@phosphor-icons/vue'
import { NAV_TABS_BY_REGION, type NavTab } from '../../../.vitepress/tabs.config'

// 由 config.mts 通过 vite define 注入：每 region 实际存在的顶级分类目录列表
declare const __LB_REGION_CATEGORIES__: Record<string, string[]>
const REGION_CATEGORIES: Record<string, string[]> =
  typeof __LB_REGION_CATEGORIES__ !== 'undefined' ? __LB_REGION_CATEGORIES__ : {}
import { useAIModal } from '../composables/useAIModal'
import { useSearchDialog } from '../composables/useSearchDialog'
import { useColorMode } from '../composables/useColorMode'
import { useRegion } from '../composables/useRegion'
import { useI18n } from '../../i18n/useI18n'

const route = useRoute()
const { lang } = useData()
const { toggleAIModal } = useAIModal()
const { open: openSearch } = useSearchDialog()
const { region, withRegionAndLocale } = useRegion()
const router = useRouter()
const { isDark, toggle: toggleTheme } = useColorMode()
const { t } = useI18n()

// ── API & SDK 下拉 ─────────────────────────────────────────────
const API_SDK_ITEMS = [
  { label: 'Skill',   href: 'https://open.longbridge.com/skill' },
  { label: 'CLI',     href: 'https://open.longbridge.com/docs/cli' },
  { label: 'MCP',     href: 'https://open.longbridge.com/docs/mcp' },
  { label: 'Pricing', href: 'https://open.longbridge.com/pricing' },
]
const apiOpen = ref(false)
const apiBtnRef = ref<HTMLButtonElement>()
const apiPopoverRef = ref<HTMLElement>()
function toggleApi() { apiOpen.value = !apiOpen.value }

// ── Region / Language switcher ─────────────────────────────────
const REGIONS = [
  { code: 'hk', labelKey: 'common.regionHK'},
  { code: 'sg', labelKey: 'common.regionSG' },
  { code: 'us', labelKey: 'common.regionUS' },
]

const ALL_LANGS = [
  { code: 'en',    label: 'English',   link: '/' },
  { code: 'zh-CN', label: '简体中文', link: '/zh-CN/' },
  { code: 'zh-HK', label: '繁體中文', link: '/zh-HK/' },
]

// 每个 region 实际暴露给用户的 locale。跟 config.mts:REGION_LOCALES 逻辑相关但
// 不完全一致:config 里 US 是 ['en', 'zh-HK'](zh-HK 从 en 镜像作为 URL 兜底),
// 而这里 UI switcher 只显 ['en'] —— 因为 Zendesk 没提供 zh-tw 翻译,给用户
// 「繁體中文」选项等于骗他们(切过去还是英文正文)。等 Zendesk 补内容后,再把
// zh-HK 加回来。
const REGION_LANG_CODES: Record<string, string[]> = {
  hk: ['en', 'zh-CN', 'zh-HK'],
  sg: ['en', 'zh-CN', 'zh-HK'],
  us: ['en'],
}
const LANGS = computed(() => {
  const allowed = new Set(REGION_LANG_CODES[region.value] ?? ['en', 'zh-CN', 'zh-HK'])
  return ALL_LANGS.filter(l => allowed.has(l.code))
})

const langOpen = ref(false)
const langBtnRef = ref<HTMLButtonElement>()
const langPopoverRef = ref<HTMLElement>()

function toggleLang() {
  langOpen.value = !langOpen.value
}

// ── Region (cookie) ──
function readCookie(name: string): string {
  if (!inBrowser) return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

function writeCookie(name: string, value: string) {
  if (!inBrowser) return
  // 1 年有效，全站可见
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`
}

// region 来自 useRegion()——computed 读 useRoute().path 实时跟随 SPA 导航。
// 这里不再维护单独的 currentRegion 本地 ref。

function switchRegion(target: typeof REGIONS[number]) {
  if (target.code === region.value) {
    langOpen.value = false
    return
  }
  writeCookie('region', target.code)
  if (!inBrowser) return
  // SPA 切 region：把 URL 第一段 region 换掉，保留 locale + 剩余路径，
  // 然后 router.go 走 VitePress 内部导航（替代以前的全页刷新）
  const p = window.location.pathname
  const next = p.replace(/^\/(hk|sg|us)(?=\/|$)/, `/${target.code}`)
  const targetUrl = next === p ? `/${target.code}/` : next
  router.go(targetUrl)
  langOpen.value = false
}

const currentLang = computed(() => {
  const p = route.path
  // URL 形如 /<region>/<locale>(/...)?；与 currentRegion 对齐，
  // 允许 /hk/zh-CN 这类语言根 URL（无尾斜杠）也命中
  const m = p.match(/^\/(hk|sg|us)\/(zh-CN|zh-HK)(\/|$)/)
  if (m) return m[2]
  return 'en'
})

function switchLang(target: typeof ALL_LANGS[number]) {
  if (target.code === currentLang.value) {
    langOpen.value = false
    return
  }
  if (!inBrowser) return
  const r = region.value
  // 剥掉当前 region + locale 前缀，得到 region 内剩余路径
  const p = route.path
  let rest = p.replace(/^\/(hk|sg|us)(\/(zh-CN|zh-HK))?/, '')
  if (!rest.startsWith('/')) rest = '/' + rest
  // 目标 locale 在该 region 下的前缀（按 LANGS.link 推断，默认语言 en 不带 locale 段）
  const langSegment = target.code === 'en' ? '' : `/${target.code}`
  router.go(`/${r}${langSegment}${rest === '/' ? '/' : rest}`)
}

// tabs 按 region 拆开;HK/SG 共用,US 用 Zendesk 分类 slug 归并出的一套。
const navTabs = computed<NavTab[]>(() => NAV_TABS_BY_REGION[region.value] ?? NAV_TABS_BY_REGION.hk)

const activeTab = computed(() => {
  // 剥掉 URL 中的 region/locale 前缀（如 /hk/、/hk/zh-CN/、/hk/zh-HK/），
  // 再按当前 region 的 NAV_TABS 配置匹配相对 path
  let p = route.path.replace(/^\/(hk|sg|us)(\/(zh-CN|zh-HK))?/, '') || '/'
  if (!p.startsWith('/')) p = '/' + p
  // 先做非 home 匹配；home 用 categories=[] 兜底，避免它把所有 / 开头路径都吞掉
  const tab = navTabs.value.find(t =>
    t.path !== '/' && (p === t.path || t.categories.some(c => p.startsWith('/' + c + '/')))
  )
  if (tab) return tab.path
  // 没有任何业务 tab 命中 → 视为首页
  return '/'
})

// 当前 region 下实际有内容的 tab 才显示；Home（path '/'）始终保留。
// tab.path 指向的主分类在 region 里可能不存在（例如 sg 没 getting-started），
// 此时回退到该 tab.categories 里第一个实际存在的分类的 overview，避免 404。
type VisibleTab = NavTab & { landingHref: string }
const visibleNavTabs = computed<VisibleTab[]>(() => {
  const cats = new Set(REGION_CATEGORIES[region.value] ?? [])
  const out: VisibleTab[] = []
  for (const t of navTabs.value) {
    if (t.path === '/') {
      out.push({ ...t, landingHref: '/' })
      continue
    }
    // tab.path 形如 '/stock-trading/'，主分类即去掉前后斜杠
    const primary = t.path.replace(/^\/|\/$/g, '')
    const firstAvail = cats.has(primary)
      ? primary
      : t.categories.find((c) => cats.has(c))
    if (!firstAvail) continue
    out.push({ ...t, landingHref: `/${firstAvail}/overview` })
  }
  return out
})

// sub-bar 激活 tab 的滑动下划线位置
// 用 sessionStorage 持久化上一次位置，跨路由切换/组件重挂载也能保留起点 → 触发 CSS 过渡
const SUB_INDICATOR_KEY = 'hn:sub-indicator'

function readSavedIndicator(): { left: number; width: number; ready: boolean } {
  if (typeof window === 'undefined') return { left: 0, width: 0, ready: false }
  try {
    const raw = sessionStorage.getItem(SUB_INDICATOR_KEY)
    if (!raw) return { left: 0, width: 0, ready: false }
    const parsed = JSON.parse(raw)
    if (typeof parsed.left === 'number' && typeof parsed.width === 'number') {
      return { left: parsed.left, width: parsed.width, ready: true }
    }
  } catch {}
  return { left: 0, width: 0, ready: false }
}

const subInnerRef = ref<HTMLElement | null>(null)
const subIndicator = ref(readSavedIndicator())

async function updateSubIndicator() {
  await nextTick()
  const wrap = subInnerRef.value
  if (!wrap) return
  const active = wrap.querySelector<HTMLElement>(`.hn-sub-tab.is-active`)
  if (!active) {
    subIndicator.value = { ...subIndicator.value, ready: false }
    return
  }
  // 对齐文字本体：减去左右 padding，下划线宽度 = 文字实际宽度
  const cs = window.getComputedStyle(active)
  const padL = parseFloat(cs.paddingLeft) || 0
  const padR = parseFloat(cs.paddingRight) || 0
  const next = {
    left: active.offsetLeft + padL,
    width: active.offsetWidth - padL - padR,
    ready: true,
  }
  subIndicator.value = next
  try {
    sessionStorage.setItem(SUB_INDICATOR_KEY, JSON.stringify({ left: next.left, width: next.width }))
  } catch {}
}

watch(activeTab, updateSubIndicator, { flush: 'post' })
onMounted(() => {
  // 先用 saved 位置渲染（已在 setup 中读取），下一帧再写入真实位置
  // 这样浏览器有「起点 → 终点」两组样式，CSS transition 才能补帧
  requestAnimationFrame(() => updateSubIndicator())
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateSubIndicator)
  }
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateSubIndicator)
  }
})

// ── Kebab "more" menu ─────────────────────────────────────────
const moreOpen = ref(false)
const moreBtnRef = ref<HTMLButtonElement>()
const morePopoverRef = ref<HTMLElement>()

function toggleMore() {
  moreOpen.value = !moreOpen.value
}

function onDocClick(e: MouseEvent) {
  const target = e.target as Node
  if (moreOpen.value) {
    if (!moreBtnRef.value?.contains(target) && !morePopoverRef.value?.contains(target)) {
      moreOpen.value = false
    }
  }
  if (langOpen.value) {
    if (!langBtnRef.value?.contains(target) && !langPopoverRef.value?.contains(target)) {
      langOpen.value = false
    }
  }
  if (apiOpen.value) {
    if (!apiBtnRef.value?.contains(target) && !apiPopoverRef.value?.contains(target)) {
      apiOpen.value = false
    }
  }
}

function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    moreOpen.value = false
    langOpen.value = false
    apiOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKey)
})
</script>

<template>
  <nav class="hn-root" :aria-label="t('brand.mainNavAriaLabel')">
    <!-- 第一行 -->
    <div class="hn-top-bar">
      <div class="hn-container">
        <!-- Logo -->
        <a :href="withRegionAndLocale('/')" class="hn-logo" :aria-label="t('brand.homeAriaLabel')">
          <img
            src="https://assets.lbctrl.com/uploads/34ee0a83-6f70-4aea-aa49-7ba5df3c64c4/longbridge-light.png"
            :alt="t('brand.logoAlt')"
            class="hn-logo-img hn-logo-img--light"
          />
          <img
            src="https://assets.lbctrl.com/uploads/e8c481df-25aa-4e17-baee-953f9ae2cecf/longbridge-dark.png"
            :alt="t('brand.logoAlt')"
            class="hn-logo-img hn-logo-img--dark"
          />
        </a>

        <!-- 搜索 + Ask AI -->
        <div class="hn-center">
          <button class="hn-search-btn" @click="openSearch" :aria-label="t('common.search')">
            <svg class="hn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="4.5"/>
              <path d="m10.5 10.5 2.5 2.5" stroke-linecap="round"/>
            </svg>
            <span class="hn-search-label">{{ t('common.search') }}</span>
            <kbd class="hn-kbd">⌘K</kbd>
          </button>
          <button class="hn-askai-btn" @click="toggleAIModal()" :aria-label="t('common.askAi')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" class="hn-sparkle flex-shrink-0" aria-hidden="true">
              <path d="M7.111 2.34728C7.29334 1.80026 8.06709 1.80026 8.24942 2.34728L9.5054 6.1152C9.56512 6.29437 9.70571 6.43496 9.88487 6.49468L13.6528 7.75065C14.1998 7.93299 14.1998 8.70673 13.6528 8.88907L9.88487 10.145C9.70571 10.2048 9.56512 10.3454 9.5054 10.5245L8.24942 14.2924C8.06709 14.8395 7.29334 14.8395 7.111 14.2924L5.85503 10.5245C5.79531 10.3454 5.65472 10.2048 5.47556 10.145L1.70763 8.88907C1.16061 8.70673 1.16061 7.93299 1.70763 7.75065L5.47556 6.49468C5.65472 6.43496 5.79531 6.29437 5.85503 6.1152L7.111 2.34728Z" fill="currentColor"/>
              <path d="M13.0648 1.0138C13.1937 0.665555 13.6862 0.665555 13.8151 1.0138L14.0676 1.69612C14.1081 1.80561 14.1944 1.89194 14.3039 1.93245L14.9862 2.18493C15.3345 2.31379 15.3345 2.80635 14.9862 2.93521L14.3039 3.18769C14.1944 3.22821 14.1081 3.31453 14.0676 3.42402L13.8151 4.10634C13.6862 4.45459 13.1937 4.45459 13.0648 4.10634L12.8123 3.42402C12.7718 3.31453 12.6855 3.22821 12.576 3.18769L11.8937 2.93521C11.5454 2.80635 11.5454 2.31379 11.8937 2.18493L12.576 1.93245C12.6855 1.89194 12.7718 1.80561 12.8123 1.69612L13.0648 1.0138Z" fill="currentColor"/>
            </svg>
            <span class="max-md:hidden">{{ t('brand.askAiBtn') }}</span>
          </button>
        </div>

        <!-- 右侧操作区 -->
        <div class="hn-actions">
          <!-- 语言切换（点击展开） -->
          <div class="hn-lang">
            <button
              ref="langBtnRef"
              type="button"
              class="hn-icon-btn"
              :aria-label="t('common.switchLanguage')"
              :aria-expanded="langOpen"
              aria-haspopup="true"
              @click="toggleLang"
            >
              <Globe :size="16" />
            </button>
            <Transition name="hn-lang-fade">
              <div
                v-if="langOpen"
                ref="langPopoverRef"
                class="hn-lang-popover"
                role="menu"
              >
                <div class="hn-lang-section-title">{{ t('common.selectRegion') }}</div>
                <button
                  v-for="r in REGIONS"
                  :key="r.code"
                  type="button"
                  class="hn-lang-item hn-lang-item--region"
                  :class="{ 'is-active': r.code === region }"
                  role="menuitem"
                  @click="switchRegion(r)"
                >
                  <span class="hn-lang-text">{{ t(r.labelKey) }}</span>
                  <svg v-if="r.code === region" class="hn-lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>

                <div class="hn-lang-divider" />

                <div class="hn-lang-section-title">{{ t('common.selectLanguage') }}</div>
                <a
                  v-for="l in LANGS"
                  :key="l.code"
                  href="#"
                  class="hn-lang-item"
                  :class="{ 'is-active': l.code === currentLang }"
                  role="menuitem"
                  @click.prevent="switchLang(l)"
                >
                  <span class="hn-lang-text">{{ l.label }}</span>
                  <svg v-if="l.code === currentLang" class="hn-lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </a>
              </div>
            </Transition>
          </div>

          <!-- 主题切换：v-show 用 inline display:none，避免被 VitePress 默认
               theme 的 unlayered svg 规则覆盖（class 切换失败导致双图标叠加） -->
          <button
            type="button"
            class="hn-icon-btn hn-theme-toggle"
            :aria-label="isDark ? t('common.switchToLight') : t('common.switchToDark')"
            @click="toggleTheme"
          >
            <Sun v-show="isDark" :size="16" class="hn-theme-icon" />
            <Moon v-show="!isDark" :size="16" class="hn-theme-icon" />
          </button>

          <!-- GitHub -->
          <a
            class="hn-icon-btn"
            href="https://github.com/longbridge/docs"
            target="_blank"
            rel="noopener"
            aria-label="GitHub"
          >
            <Github :size="16" />
          </a>

          <!-- 移动端：高频菜单触发器（md 以下显示，复用 kebab popover） -->
          <div class="hn-more">
            <button
              ref="moreBtnRef"
              class="hn-more-btn"
              :aria-label="t('common.more')"
              :aria-expanded="moreOpen"
              aria-haspopup="true"
              @click="toggleMore"
            >
              <MoreVertical :size="18" />
            </button>
            <Transition name="hn-more-fade">
              <div v-if="moreOpen" ref="morePopoverRef" class="hn-more-popover" role="menu">
                <a
                  href="https://open.longbridge.com"
                  class="hn-more-item"
                  target="_blank"
                  rel="noopener"
                  role="menuitem"
                  @click="moreOpen = false"
                >
                  {{ t('brand.devPlatformLabel') }}
                  <ExternalLink :size="13" />
                </a>
                <div class="hn-more-divider" />
                <a
                  v-for="tab in visibleNavTabs"
                  :key="tab.path"
                  :href="withRegionAndLocale(tab.landingHref)"
                  class="hn-more-item"
                  :class="{ 'is-active': activeTab === tab.path }"
                  role="menuitem"
                  @click="moreOpen = false"
                >{{ t(tab.label) }}</a>
              </div>
            </Transition>
          </div>

        </div>
      </div>
    </div>

    <!-- 第二行：高频菜单组（NAV_TABS） -->
    <div class="hn-sub-bar">
      <div ref="subInnerRef" class="hn-sub-inner">
        <div
          class="hn-sub-underline"
          :style="{
            left: subIndicator.left + 'px',
            width: subIndicator.width + 'px',
            opacity: subIndicator.ready ? 1 : 0,
          }"
        />
        <a
          v-for="tab in visibleNavTabs"
          :key="tab.path"
          :href="withRegionAndLocale(tab.landingHref)"
          class="hn-sub-tab"
          :class="{ 'is-active': activeTab === tab.path }"
          :data-tab-path="tab.path"
        >
          {{ t(tab.label) }}
        </a>

        <!-- API 和 SDK 下拉，靠右 -->
        <div class="hn-api-dropdown">
          <button
            ref="apiBtnRef"
            type="button"
            class="hn-sub-tab hn-api-trigger"
            :class="{ 'is-open': apiOpen }"
            :aria-expanded="apiOpen"
            aria-haspopup="true"
            @click="toggleApi"
          >
            {{ t('common.apiSdk') }}
            <ChevronDown :size="14" class="hn-api-chevron" />
          </button>
          <Transition name="hn-lang-fade">
            <div v-if="apiOpen" ref="apiPopoverRef" class="hn-api-popover" role="menu">
              <a
                v-for="item in API_SDK_ITEMS"
                :key="item.label"
                :href="item.href"
                target="_blank"
                rel="noopener"
                class="hn-api-item"
                role="menuitem"
                @click="apiOpen = false"
              >
                {{ item.label }}
                <ExternalLink :size="12" class="hn-api-ext" />
              </a>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </nav>
</template>
