<script setup lang="ts">
import { useI18n } from '../../../i18n/useI18n'
const { t } = useI18n()
</script>

<template>
  <section class="quick-topics">
    <div class="qt-inner">
      <h2 class="qt-title">{{ t('findWays.title') }}</h2>
      <div class="qt-grid">
        <div class="qt-col">
          <span class="qt-cat">{{ t('findWays.col1.cat') }}</span>
          <ul class="qt-list">
            <li><a href="/account/">{{ t('findWays.col1.links.0') }}</a></li>
            <li><a href="/deposit/">{{ t('findWays.col1.links.1') }}</a></li>
            <li><a href="/withdrawal/">{{ t('findWays.col1.links.2') }}</a></li>
            <li><a href="/transfers-and-fx/">{{ t('findWays.col1.links.3') }}</a></li>
          </ul>
          <a class="qt-more" href="/getting-started/">{{ t('findWays.col1.more') }}</a>
        </div>
        <div class="qt-col">
          <span class="qt-cat">{{ t('findWays.col2.cat') }}</span>
          <ul class="qt-list">
            <li><a href="/stock-trading/">{{ t('findWays.col2.links.0') }}</a></li>
            <li><a href="/stock-trading/">{{ t('findWays.col2.links.1') }}</a></li>
            <li><a href="/stock-trading/">{{ t('findWays.col2.links.2') }}</a></li>
            <li><a href="/portfolio-and-statements/">{{ t('findWays.col2.links.3') }}</a></li>
          </ul>
          <a class="qt-more" href="/stock-trading/">{{ t('findWays.col2.more') }}</a>
        </div>
        <div class="qt-col">
          <span class="qt-cat">{{ t('findWays.col3.cat') }}</span>
          <ul class="qt-list">
            <li><a href="/compliance-and-tax/">{{ t('findWays.col3.links.0') }}</a></li>
            <li><a href="/compliance-and-tax/">{{ t('findWays.col3.links.1') }}</a></li>
            <li><a href="/compliance-and-tax/">{{ t('findWays.col3.links.2') }}</a></li>
            <li><a href="/compliance-and-tax/">{{ t('findWays.col3.links.3') }}</a></li>
          </ul>
          <a class="qt-more" href="/compliance-and-tax/">{{ t('findWays.col3.more') }}</a>
        </div>
      </div>
    </div>
  </section>
</template>
