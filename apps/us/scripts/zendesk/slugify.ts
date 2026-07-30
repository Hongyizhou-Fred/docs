import GithubSlugger from 'github-slugger'

// 单次 slugify：把任意字符串转成 kebab-case slug。
// & → " and "，逗号/分号/冒号 → 空格，再交给 github-slugger 做 kebab-case。
// 直接扔给 github-slugger 会把 & 吃成空导致双连字符 (account--security)。
// 用于 category / section 名。多次同名调用会返回同一个 slug (无 dedupe
// counter);dir 级 dedupe 用 createSlugScope。
export function slugify(input: string): string {
  const slugger = new GithubSlugger()
  const cleaned = input
    .replace(/&/g, ' and ')
    .replace(/[,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return slugger.slug(cleaned)
}

// 从 Zendesk article 的 html_url 提取文章 slug，格式形如：
//   https://longbridgeus.zendesk.com/hc/en-us/articles/12345678-how-to-trade
// 返回 "how-to-trade";没有 slug 段 (纯数字) 时回退到 article ID 字符串。
export function slugFromHtmlUrl(htmlUrl: string, fallbackId: number): string {
  const m = htmlUrl.match(/\/articles\/\d+(?:-([^/?#]+))?/)
  if (m && m[1]) return m[1].toLowerCase()
  return String(fallbackId)
}

// 为一批 slug 做同目录内去重：相同 slug 会被追加 -1 / -2 后缀。
// 用法：每个目录 new 一个 dedupe scope，在向该目录写文件前调用。
export function createSlugScope() {
  const slugger = new GithubSlugger()
  return {
    /** 给一个 candidate slug 分配同目录内唯一的 slug */
    unique(candidate: string): string {
      return slugger.slug(candidate)
    },
    reset(): void {
      slugger.reset()
    },
  }
}
