/// <reference path="./turndown-plugin-gfm.d.ts" />
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

// Zendesk `article.body` 是 HTML，统一转 Markdown。
// 策略：白名单化基础语义标签 + GFM 扩展 (表格 / 删除线 / 任务列表)。
// 内部链接改写走 rewriteLink 回调：调用方可传入把 `/hc/en-us/articles/12345`
// 转成本仓路径的函数。
export interface HtmlToMdOptions {
  /** 内部链接改写：输入原 href，返回新 href;返回 null 表示保留原样 */
  rewriteLink?: (href: string) => string | null
}

export function htmlToMarkdown(html: string, opts: HtmlToMdOptions = {}): string {
  const td = createTurndown()
  if (opts.rewriteLink) {
    // 覆盖 a 标签规则，做内链改写后再走默认渲染
    td.addRule('rewrite-link', {
      filter: 'a',
      replacement(content, node) {
        const el = node as HTMLAnchorElement
        const rawHref = el.getAttribute('href') ?? ''
        const title = el.getAttribute('title')
        const newHref = opts.rewriteLink!(rawHref) ?? rawHref
        const linkText = content.trim() || rawHref
        if (!newHref) return linkText
        return title ? `[${linkText}](${newHref} "${title}")` : `[${linkText}](${newHref})`
      },
    })
  }
  const md = td.turndown(html)
  // 归一化：去掉行尾空格 + 合并 3+ 空行 → 2 空行
  return md.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  })
  td.use(gfm)

  // 移除 Zendesk 常见的样式属性 / class / id，让 md 干净
  td.addRule('strip-inline-styles', {
    filter: node => node.nodeType === 1 && (node as Element).hasAttribute('style'),
    replacement(content) {
      return content
    },
  })

  // 空段落 / 空 div 直接吞掉
  td.addRule('empty-block', {
    filter(node) {
      if (node.nodeType !== 1) return false
      const el = node as Element
      const tag = el.tagName.toLowerCase()
      if (!['p', 'div', 'span'].includes(tag)) return false
      return el.textContent?.trim() === '' && el.querySelector('img, iframe, video, audio') === null
    },
    replacement() {
      return ''
    },
  })

  // Zendesk 有时候会插 `<div class="notice">…</div>` 之类的告警块，先转成普通引用
  // (未来可以映射到本仓的 ::: tip container，这里第一版保守走 blockquote)
  td.addRule('notice-to-blockquote', {
    filter(node) {
      if (node.nodeType !== 1) return false
      const cls = (node as Element).getAttribute('class') ?? ''
      return /\b(notice|callout|alert|admonition|warning|tip)\b/.test(cls)
    },
    replacement(content) {
      return '\n\n> ' + content.trim().replace(/\n/g, '\n> ') + '\n\n'
    },
  })

  return td
}
