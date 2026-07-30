import type MarkdownIt from 'markdown-it'

interface MarkdownItCoreState {
  tokens: any[]
  src: string
  env: Record<string, any>
  inlineMode: boolean
  md: MarkdownIt
}

function hasH1Tag(tokens: any[]): boolean {
  return tokens.some((token) => token.type === 'heading_open' && token.tag === 'h1')
}

function createH1Tokens(title: string): any[] {
  return [
    {
      type: 'heading_open', tag: 'h1', attrs: null, map: null, nesting: 1,
      level: 0, children: null, content: '', markup: '#', info: '',
      meta: null, block: true, hidden: false,
    },
    {
      type: 'inline', tag: '', attrs: null, map: null, nesting: 0,
      level: 1, content: title, markup: '', info: '', meta: null,
      block: true, hidden: false,
      children: [
        {
          type: 'text', tag: '', attrs: null, map: null, nesting: 0,
          level: 0, children: null, content: title, markup: '',
          info: '', meta: null, block: false, hidden: false,
        },
      ],
    },
    {
      type: 'heading_close', tag: 'h1', attrs: null, map: null, nesting: -1,
      level: 0, children: null, content: '', markup: '#', info: '',
      meta: null, block: true, hidden: false,
    },
  ]
}

/**
 * 如果 md 文档没有 H1 但 frontmatter 有 title,自动注入 H1。
 * 只对未指定 layout 或 `layout: doc` 的文档生效。
 */
export function normalizeMdPlugin(md: MarkdownIt) {
  md.core?.ruler.push('normalize-md', (state: MarkdownItCoreState) => {
    const layout = state.env.frontmatter?.layout
    if (layout && layout !== 'doc') return

    if (hasH1Tag(state.tokens)) return

    const title = state.env.frontmatter?.title || state.env.title
    if (title && typeof title === 'string' && title.trim()) {
      state.tokens.unshift(...createH1Tokens(title.trim()))
    }
  })
}
