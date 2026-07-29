import type {
  ArticlesResponse,
  CategoriesResponse,
  SectionsResponse,
  Category,
  Section,
  Article,
} from './types'

// Zendesk Help Center API client(只读)。
// 认证:Basic Auth `{email}/token:{api_token}`。
// 分页:cursor(优先，`page[size]`)。文档说 offset 上限 100 页 × 100 条 = 1w,
// cursor 无此限制;US 目前 < 100 篇，双方都能跑。
// Rate limit:跟随 Support API RPM(700/min),全量拉一次 ~10 次调用，不做限流层。

export interface ZendeskClientOpts {
  subdomain: string
  email: string
  token: string
  /** 超时 (ms),默认 30s */
  timeoutMs?: number
  /** 单请求最大重试次数 (仅对 429 / 5xx 生效),默认 3 */
  maxRetries?: number
}

export class ZendeskClient {
  private readonly baseUrl: string
  private readonly authHeader: string
  private readonly timeoutMs: number
  private readonly maxRetries: number

  constructor(opts: ZendeskClientOpts) {
    if (!opts.subdomain || !opts.email || !opts.token) {
      throw new Error('ZendeskClient: subdomain / email / token 全部必填')
    }
    this.baseUrl = `https://${opts.subdomain}.zendesk.com/api/v2/help_center`
    // 注意 `/token` 是字面后缀，不是变量。用 btoa(全局可用于 Bun / Node 16+),
    // 避免依赖 Node-only 的 Buffer(项目未装 @types/node)。
    this.authHeader = 'Basic ' + btoa(`${opts.email}/token:${opts.token}`)
    this.timeoutMs = opts.timeoutMs ?? 30_000
    this.maxRetries = opts.maxRetries ?? 3
  }

  /** 拉某 locale 下所有 category */
  async listCategories(locale: string): Promise<Category[]> {
    return this.paginate<CategoriesResponse, Category>(
      `/${locale}/categories.json`,
      { 'page[size]': '100' },
      r => r.categories,
    )
  }

  /** 拉某 locale 下所有 section */
  async listSections(locale: string): Promise<Section[]> {
    return this.paginate<SectionsResponse, Section>(
      `/${locale}/sections.json`,
      { 'page[size]': '100' },
      r => r.sections,
    )
  }

  /** 拉某 locale 下所有 article。可选增量：传 startTimeUnix(秒级 unix ts)。 */
  async listArticles(
    locale: string,
    opts: { startTimeUnix?: number; sortBy?: 'position' | 'title' | 'created_at' | 'updated_at'; sortOrder?: 'asc' | 'desc' } = {},
  ): Promise<Article[]> {
    const params: Record<string, string> = { 'page[size]': '100' }
    if (opts.startTimeUnix != null) params.start_time = String(opts.startTimeUnix)
    if (opts.sortBy) params.sort_by = opts.sortBy
    if (opts.sortOrder) params.sort_order = opts.sortOrder
    return this.paginate<ArticlesResponse, Article>(
      `/${locale}/articles.json`,
      params,
      r => r.articles,
    )
  }

  // ── internals ─────────────────────────────────────────────────

  private async paginate<R extends { meta?: { has_more: boolean; after_cursor?: string } }, T>(
    endpoint: string,
    initialParams: Record<string, string>,
    pick: (r: R) => T[],
  ): Promise<T[]> {
    const acc: T[] = []
    let params = { ...initialParams }
    // safety: 硬上限 200 页，防止 API bug 无限翻页
    for (let page = 0; page < 200; page++) {
      const resp = await this.get<R>(endpoint, params)
      acc.push(...pick(resp))
      if (!resp.meta?.has_more || !resp.meta.after_cursor) break
      params = { ...initialParams, 'page[after]': resp.meta.after_cursor }
    }
    return acc
  }

  private async get<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl + endpoint)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return this.fetchWithRetry<T>(url.toString(), 0)
  }

  private async fetchWithRetry<T>(url: string, attempt: number): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (attempt < this.maxRetries) {
          const retryAfterHeader = res.headers.get('retry-after')
          const retryAfter = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 1000 * (attempt + 1) ** 2
          await sleep(retryAfter)
          return this.fetchWithRetry<T>(url, attempt + 1)
        }
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        // 注意:body 里绝不会含 token(token 只放 Authorization header),可直接打印
        throw new ZendeskApiError(res.status, res.statusText, redactUrl(url), body)
      }
      return (await res.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }
}

export class ZendeskApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
    public body: string,
  ) {
    super(`Zendesk API ${status} ${statusText} on ${url}: ${body.slice(0, 300)}`)
    this.name = 'ZendeskApiError'
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// 打日志前 redact URL 里可能出现的敏感 query(现阶段没有，但保守起见)
function redactUrl(url: string): string {
  try {
    const u = new URL(url)
    // 保留 path + query key，不打印 query value(page cursor 之类的无所谓，统一保守)
    return `${u.origin}${u.pathname}?${[...u.searchParams.keys()].join('&')}`
  } catch {
    return url
  }
}
