// Zendesk Help Center API 响应对象类型 (仅保留我们用到的字段)。
// 参考：docs/*(未维护) 或 https://developer.zendesk.com/api-reference/help_center/
// 及项目根 us-zendesk-dump.json(每次同步刷新)。

export interface Category {
  id: number
  name: string
  position: number
  description: string
  html_url: string
  source_locale: string
}

export interface Section {
  id: number
  name: string
  category_id: number
  position: number
  description: string
  html_url: string
  source_locale: string
}

export interface Article {
  id: number
  section_id: number
  title: string
  body: string // HTML
  locale: string
  html_url: string
  created_at: string
  updated_at: string
  edited_at: string
  draft: boolean
  promoted: boolean
  position: number
  label_names: string[]
  vote_count: number
  vote_sum: number
}

// Cursor + offset pagination 都支持的返回信封公共字段。
export interface ZdPage {
  count?: number | null
  page_count?: number | null
  next_page?: string | null
  previous_page?: string | null
  meta?: { has_more: boolean; after_cursor?: string; before_cursor?: string }
  links?: { next?: string; prev?: string }
}

export type CategoriesResponse = ZdPage & { categories: Category[] }
export type SectionsResponse = ZdPage & { sections: Section[] }
export type ArticlesResponse = ZdPage & { articles: Article[] }
