<script setup lang="ts">
import { data as _topicCountsRaw } from '@app/topic-counts.data'
import type { TopicKey, TopicCounts } from '@app/topic-counts.data'
import {
  PhLightning as Zap,
  PhUser as User,
  PhArrowCircleDown as ArrowDownCircle,
  PhArrowCircleUp as ArrowUpCircle,
  PhArrowsLeftRight as ArrowLeftRight,
  PhTrendUp as TrendingUp,
  PhShield as Shield,
  PhGift as Gift,
  PhClipboardText as ClipboardList,
} from '@phosphor-icons/vue'
import { useI18n } from '../../../i18n/useI18n'

const { t } = useI18n()

const topicCounts = _topicCountsRaw as TopicCounts

const TOPICS: { key: TopicKey; icon: typeof Zap; path: string }[] = [
  { key: 'getting-started',          icon: Zap,             path: '/getting-started/'          },
  { key: 'account',                  icon: User,            path: '/account/'                  },
  { key: 'deposit',                  icon: ArrowDownCircle, path: '/deposit/'                  },
  { key: 'withdrawal',               icon: ArrowUpCircle,   path: '/withdrawal/'               },
  { key: 'transfers-and-fx',         icon: ArrowLeftRight,  path: '/transfers-and-fx/'         },
  { key: 'stock-trading',            icon: TrendingUp,      path: '/stock-trading/'            },
  { key: 'compliance-and-tax',       icon: Shield,          path: '/compliance-and-tax/'       },
  { key: 'rewards',                  icon: Gift,            path: '/rewards/'                  },
  { key: 'portfolio-and-statements', icon: ClipboardList,   path: '/portfolio-and-statements/' },
]

const featuredTopic = TOPICS[0]
const restTopics = TOPICS.slice(1)
</script>

<template>
  <section id="topics-section" class="topics">
    <div class="topics-inner">
      <h2 class="topics-title">{{ t('topics.heading') }}</h2>

      <!-- 首位精选大卡 -->
      <a :href="featuredTopic.path" class="featured-card" :aria-label="`${t('data.topics.' + featuredTopic.key)}，${topicCounts[featuredTopic.key]} 篇文档`">
        <span class="featured-icon-wrap">
          <component :is="featuredTopic.icon" :size="36" :stroke-width="1.5" />
        </span>
        <div class="featured-body">
          <div class="featured-badge">{{ t('topics.recommended') }}</div>
          <h3 class="featured-name">{{ t('data.topics.' + featuredTopic.key) }}</h3>
          <p class="featured-count">{{ topicCounts[featuredTopic.key] }}{{ t('topics.fromHereCount') }}</p>
        </div>
        <span class="featured-arrow">→</span>
      </a>

      <!-- 其余 8 个，4 列小网格 -->
      <div class="small-grid">
        <a
          v-for="topic in restTopics"
          :key="topic.key"
          :href="topic.path"
          class="small-card"
          :aria-label="`${t('data.topics.' + topic.key)}，${topicCounts[topic.key]} 篇文档`"
        >
          <span class="small-icon-wrap">
            <component :is="topic.icon" :size="22" :stroke-width="1.5" />
          </span>
          <span class="small-name">{{ t('data.topics.' + topic.key) }}</span>
          <span class="small-count">{{ topicCounts[topic.key] }}{{ t('topics.docCountSuffix') }}</span>
        </a>
      </div>
    </div>
  </section>
</template>
