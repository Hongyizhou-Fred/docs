# Longbridge Docs

长桥证券用户知识库，涵盖账户管理、资金操作、交易规则、产品功能等知识领域。

**线上地址**：[docs.longbridge.com](http://docs.longbridge.com/)

## 仓库结构（bun workspaces monorepo）

```
apps/
├── hk/          # 香港站(/hk/*):内容主源 zh-CN,人工维护 markdown
├── sg/          # 新加坡站(/sg/*):内容主源 zh-CN,人工维护 markdown
└── us/          # 美国站(/us/*):内容主源 en,由 Zendesk 同步生成
    └── scripts/ # Zendesk 同步器(bun run sync:us)
packages/
└── shared/      # 共享层:theme 组件 / composables / i18n / VitePress 配置工厂 / UnoCSS
```

三个 region 是互相独立的 VitePress 应用：独立 dev、独立构建。URL 上的
`/hk/ /sg/ /us/` 前缀由各 app 的 `base` 提供，部署时 CI 把三份产物合并到同一
个域名下，对外 URL 与历史完全一致。

## 常用命令（仓库根目录）

```bash
bun install          # 安装(workspace hoisted)

bun run dev:hk       # 起 HK dev server
bun run dev:sg       # 起 SG dev server
bun run dev:us       # 起 US dev server

bun run build:hk     # 单独构建某个 app
bun run build        # 依次构建三个 app

bun run sync:us      # 从 Zendesk 拉取 US 内容(需 apps/us/.env.local 凭据)
```

## 已知限制

- **dev 下跨 region 跳转不可用**：三个 app 是独立 dev server(不同端口)，右上角
  region 切换器指向 `/sg/` 这类绝对路径，在 dev 只会 404。生产环境三份产物
  合并在同一域名下，无此问题。
- **region 切换是整页跳转**：跨 region = 跨应用，没有 SPA 内切换。

## 内容维护

- **HK / SG**：直接改 `apps/{hk,sg}/docs/zh-CN/**` 下的 markdown 提 PR。
  en / zh-HK 目录缺失的文件会在构建时从 zh-CN 自动镜像。
- **US**：内容在 [Zendesk 后台](https://longbridgeus.zendesk.com) 维护，
  不要手改 `apps/us/docs/**`(会被下次同步覆盖)。同步只拉已发布
  (`draft:false`) 文章。
