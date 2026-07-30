// Zendesk US 帮助中心同步配置 (非机密)。
// 机密 (subdomain / email / api_token) 走 .env.local，由 fetch-zendesk.ts 读取。

// 从 Zendesk 拉哪些 locale。zh-tw 实际内容为空 (2026-07-29 验证),等运营
// 补内容再加进来。us-zendesk 后端启用了 en-us + zh-tw 两种 locale，可通过
// GET /api/v2/help_center/locales.json 校验。
export const LOCALES_TO_PULL = ['en-us'] as const

// Zendesk locale → 本仓 locale 目录映射。US 主源是 en(见 config.mts
// REGION_SOURCE_LOCALE),zh-tw 落到 zh-HK(繁体兼容)。
export const LOCALE_TO_FS: Record<string, string> = {
  'en-us': 'en',
  'zh-tw': 'zh-HK',
}

// 内容落地根目录 (相对 apps/us,脚本经 `bun run sync` 在 app 根执行)。
// fetch 脚本会往 `${CONTENT_ROOT}/${fs_locale}/…` 写。
export const CONTENT_ROOT = 'docs'

// 过滤规则：只拉线上能访问的、非草稿的文章。等价于匿名用户在 Zendesk 上看
// 到的内容。project memory: project_us_zendesk_published_only.md。
export const ARTICLE_FILTER = {
  includeDrafts: false, // 永远 false;有变更请更新 project memory
} as const

// 一些 Zendesk 分类 / section 名 slugify 之后不好看或不稳定，可以在这里显式指定
// 目标 slug 覆盖默认 slugify 结果。Key 是 Zendesk 的 category_id / section_id
// (字符串;放到同一个 map 里，ID 不会重复)。
export const SLUG_OVERRIDES: Record<string, string> = {
  // 例 (等真数据出来再补):
  // '15933128752783': 'funding-options',  // "What Options Do I Have to FundMy Account?"
}

// Zendesk 分类 / section 有历史遗留的"两套并行"结构 (老 15003xxx + 新 15933xxx),
// 首版全拉;slug 相同 (比如 Trading & Investing → trading-investing) 会自动合并
// 内容到同一目录。若要显式排除某个 category_id / section_id，加进这里。
export const ID_BLOCKLIST: Set<string> = new Set([
  // 例:'15003309540367',  // 老 "Trading & Investing "(带尾空格) 想弃用
])
