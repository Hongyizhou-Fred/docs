import { defineConfig, presetIcons, presetWind3, transformerVariantGroup } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'
import extractorMdc from '@unocss/extractor-mdc'

// Longbridge Docs — UnoCSS 配置
//
// 设计原则：
// 1. preset-wind3 提供 Tailwind v3 兼容的工具类，让 shadcn-vue 源码与 openapi-website
//    的 `--at-apply: rounded-xl px-2 py-1` 写法都能直接工作。
// 2. theme 颜色全部指向 CSS variables，真实色值在 tailwind.css / css-var.scss 中定义，
//    保证 docs 现有的 Longbridge UX 5.0 token 体系 (--vp-c-brand-1 = #00b8b8) 不被破坏。
// 3. transformer-directives 接管 @apply，替换原 tailwindcss 的同名指令。
// 4. extractor-mdc 让 markdown 文件中 (`{.bg-foo}` 形式) 的类也能被扫描到。
export default defineConfig({
  presets: [
    presetWind3(),
    // mintlify-style icon mask 注入:`<span class="i-ph-rocket" />` 自动渲染 SVG
    // 用 mask 模式让 icon 颜色继承 currentColor，大小走 width/height
    presetIcons({
      scale: 1,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  theme: {
    breakpoints: {
      md: '768px',
      lg: '960px',
      xl: '1280px',
      '2xl': '1536px',
    },
    colors: {
      // ── Longbridge brand 色板 (指向 CSS variable，具体值在 tailwind.css 顶部定义) ──
      brand: {
        DEFAULT: 'var(--vp-c-brand-1)',
        1: 'var(--vp-c-brand-1)',
        2: 'var(--vp-c-brand-2)',
        3: 'var(--vp-c-brand-3)',
        soft: 'var(--vp-c-brand-soft)',
        aux: 'var(--vp-c-brand-aux)',
      },
      vp: {
        text1: 'var(--vp-c-text-1)',
        text2: 'var(--vp-c-text-2)',
        text3: 'var(--vp-c-text-3)',
        divider: 'var(--vp-c-divider)',
        border: 'var(--vp-c-border)',
        'default-soft': 'var(--vp-c-default-soft)',
        bg: 'var(--vp-c-bg)',
        'bg-alt': 'var(--vp-c-bg-alt)',
        'bg-soft': 'var(--vp-c-bg-soft)',
      },
      ai: {
        bg: 'var(--lb-ai-bg)',
        surface: 'var(--lb-ai-surface)',
        border: 'var(--lb-ai-border)',
        divider: 'var(--lb-ai-divider)',
        text1: 'var(--lb-ai-text-1)',
        text2: 'var(--lb-ai-text-2)',
        text3: 'var(--lb-ai-text-3)',
        accent: 'var(--lb-ai-accent)',
        'on-accent': 'var(--lb-ai-on-accent)',
      },
      status: {
        up: 'var(--lb-c-up)',
        down: 'var(--lb-c-down)',
        success: 'var(--lb-c-success)',
        warning: 'var(--lb-c-warning)',
        danger: 'var(--lb-c-danger)',
        info: 'var(--lb-c-info)',
      },
      // ── shadcn-vue 标准 token(指向 tailwind.css 中的桥接变量) ──
      background: 'var(--background)',
      foreground: 'var(--foreground)',
      card: {
        DEFAULT: 'var(--card)',
        foreground: 'var(--card-foreground)',
      },
      popover: {
        DEFAULT: 'var(--popover)',
        foreground: 'var(--popover-foreground)',
      },
      primary: {
        DEFAULT: 'var(--primary)',
        foreground: 'var(--primary-foreground)',
      },
      secondary: {
        DEFAULT: 'var(--secondary)',
        foreground: 'var(--secondary-foreground)',
      },
      muted: {
        DEFAULT: 'var(--muted)',
        foreground: 'var(--muted-foreground)',
      },
      accent: {
        DEFAULT: 'var(--accent)',
        foreground: 'var(--accent-foreground)',
      },
      destructive: {
        DEFAULT: 'var(--destructive)',
        foreground: 'var(--destructive-foreground)',
      },
      border: 'var(--border)',
      input: 'var(--input)',
      ring: 'var(--ring)',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
      pill: '12px',
      card: '12px',
    },
  },
  // sidebar 顶级分组 icon 在 config.mts 中是 `i-ph-${name}` 动态拼接，
  // UnoCSS 静态扫描无法发现它们，必须显式 safelist 出来。
  // 与 config.mts:CATEGORY_ICONS 保持同步。
  safelist: [
    // HK / SG business slug icons
    'i-ph-book',
    'i-ph-rocket',
    'i-ph-device-mobile-speaker',
    'i-ph-identification-card',
    'i-ph-hand-deposit',
    'i-ph-hand-withdraw',
    'i-ph-swap',
    'i-ph-chart-line-up',
    'i-ph-function',
    'i-ph-currency-btc',
    'i-ph-star',
    'i-ph-scales',
    'i-ph-vault',
    'i-ph-chart-bar',
    'i-ph-chart-pie-slice',
    'i-ph-gift',
    'i-ph-shield-check',
    'i-ph-bug',
    // US Zendesk-native slug icons (only names not shared with HK/SG above)
    'i-ph-user-plus',
    'i-ph-users',
  ],
  extractors: [extractorMdc()],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  content: {
    pipeline: {
      include: [
        // 默认 globs
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // 也扫描 markdown 内容
        'docs/**/*.md',
        'docs/.vitepress/**/*.{ts,vue}',
      ],
    },
  },
})
