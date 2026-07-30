import { fileURLToPath } from 'node:url'
import { createDocsConfig } from '../../../../packages/shared/src/config/create-docs-config'
import { NAV_TABS_US } from '../../../../packages/shared/src/config/tabs.config'

// US app:内容主源 en(Zendesk 同步产物,见 apps/us/scripts),zh-HK 由
// sync 脚本 / 启动期 mirror 从 en 镜像;URL 上 /us/ 前缀由 base 提供。
export default createDocsConfig({
  region: 'us',
  docsDir: fileURLToPath(new URL('..', import.meta.url)),
  locales: ['en', 'zh-HK'],
  sourceLocale: 'en',
  navTabs: NAV_TABS_US,
})
