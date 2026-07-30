import { fileURLToPath } from 'node:url'
import { createDocsConfig } from '../../../../packages/shared/src/config/create-docs-config'
import { NAV_TABS_HK_SG } from '../../../../packages/shared/src/config/tabs.config'

// HK app:内容主源 zh-CN,镜像出 en / zh-HK;URL 上 /hk/ 前缀由 base 提供。
export default createDocsConfig({
  region: 'hk',
  docsDir: fileURLToPath(new URL('..', import.meta.url)),
  locales: ['zh-CN', 'en', 'zh-HK'],
  sourceLocale: 'zh-CN',
  navTabs: NAV_TABS_HK_SG,
})
