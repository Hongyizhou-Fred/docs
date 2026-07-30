import type MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'

/**
 * `:::tip / :::warning / :::danger / :::info / :::caution / :::success` 容器
 * 渲染成 docs 自有的 <Callout> 组件(基于 shadcn-vue + Lucide icon),
 * 替代 VitePress 默认的 .custom-block div,统一对齐 Calm Technical 视觉。
 */
export function tipContainerPlugin(md: MarkdownIt) {
  const types = ['tip', 'warning', 'danger', 'info', 'caution', 'success']

  types.forEach((name) => {
    md.use(container, name, {
      render(tokens: any[], idx: number) {
        const token = tokens[idx]
        if (token.nesting === 1) {
          const info = token.info.trim().slice(name.length).trim()
          const escapedTitle = info
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
          const titleAttr = escapedTitle ? ` title="${escapedTitle}"` : ''
          return `<Callout type="${name}"${titleAttr}>\n`
        }
        return '</Callout>\n'
      },
    })
  })
}
