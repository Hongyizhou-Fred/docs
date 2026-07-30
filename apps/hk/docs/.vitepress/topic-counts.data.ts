// docs/.vitepress/topic-counts.data.ts
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
    const zhCNDir = path.resolve(__dirname, '../zh-CN')
    return Object.fromEntries(
      TOPICS.map(topic => [topic, countMdFiles(path.join(zhCNDir, topic))])
    ) as TopicCounts
  },
}
