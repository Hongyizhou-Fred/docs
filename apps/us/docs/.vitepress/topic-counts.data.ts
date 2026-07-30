// US app 的 topic 文章计数 data loader:扫描内容主源 en 各分类目录。
// TOPICS 是 HK/SG 业务 slug,US 的 Zendesk 分类不含这些目录 → 计数为 0,
// 与 TopicsGrid 当前 (未被任何页面引用) 的行为一致;保留结构以备后用。
// 被 shared 的 TopicsGrid.vue 经 '@app/topic-counts.data' 别名消费。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TOPICS = [
  'getting-started', 'account', 'deposit', 'withdrawal',
  'transfers-and-fx', 'stock-trading', 'compliance-and-tax',
  'rewards', 'portfolio-and-statements',
] as const

export type TopicKey = typeof TOPICS[number]
export type TopicCounts = Record<TopicKey, number>

function countMdFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countMdFiles(path.join(dir, entry.name))
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      count++
    }
  }
  return count
}

export default {
  load(): TopicCounts {
    const enDir = path.resolve(__dirname, '../en')
    return Object.fromEntries(
      TOPICS.map(topic => [topic, countMdFiles(path.join(enDir, topic))])
    ) as TopicCounts
  },
}
