// Ambient declaration for turndown-plugin-gfm (no official .d.ts shipped).
// GFM 插件的实际 API 只在导出的三个函数上，我们只用 gfm(它内部聚合了 tables /
// strikethrough / taskListItems)。类型标为 TurndownService.Plugin 就够了。
declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown'
  export const gfm: TurndownService.Plugin
  export const tables: TurndownService.Plugin
  export const strikethrough: TurndownService.Plugin
  export const taskListItems: TurndownService.Plugin
}
