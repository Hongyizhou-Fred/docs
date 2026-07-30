// 由各 app 的 createDocsConfig 通过 vite define 注入的构建期常量。
// shared theme 源码直接引用这些全局，无需运行时探测。

/** 本 app 的 region(单 app 单 region，构建期定死) */
declare const __LB_REGION__: 'hk' | 'sg' | 'us'

/** 本 region 实际存在的顶级分类目录列表 (单 key: 当前 region) */
declare const __LB_REGION_CATEGORIES__: Record<string, string[]>

/** 本 region 实际存在的文章路径列表 (无 .md 后缀，以 / 开头;单 key: 当前 region) */
declare const __LB_REGION_ARTICLES__: Record<string, string[]>

declare module '@app/link-graph.json' {
  const graph: { nodes: any[]; links: any[] }
  export default graph
}

declare module '@app/topic-counts.data' {
  export type TopicKey =
    | 'getting-started' | 'account' | 'deposit' | 'withdrawal'
    | 'transfers-and-fx' | 'stock-trading' | 'compliance-and-tax'
    | 'rewards' | 'portfolio-and-statements'
  export type TopicCounts = Record<TopicKey, number>
  export const data: TopicCounts
}
