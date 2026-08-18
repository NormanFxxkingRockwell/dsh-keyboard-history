# dsh-keyboard-history

Pure ↑/↓ input-history for the DeepSeek Harness web composer. Nothing else.

纯净的 DSH Web 输入历史插件：在会话输入框用 **↑ / ↓** 翻阅之前发过的消息，仅此而已。

## 特性 / Features

- **↑** 空草稿时召回最新一条；翻阅中继续回翻，可一路翻到会话开头（自动分页补载更早窗口）
- **↓** 向新翻；越过最新一条清空草稿，退出翻阅
- **自动退出**：编辑草稿、回车发送后恢复普通输入
- **绝不打扰**：斜杠菜单打开、输入法组合输入（IME）、会话忙碌/锁定、修饰键（Ctrl/Cmd/Alt）、焦点不在输入框时均交还原生行为

## 安装 / Install

```sh
# 官方方式：解析 npm 包、安装并自动并入 profile bundles
dsh plugin --profile <profileName> add dsh-keyboard-history
# 例如：dsh plugin --profile web add dsh-keyboard-history
```

然后重启 `dsh web`（client bundle 在启动时进入模块图）。

本地开发（未发布、用 `file:` 依赖）可用仓库内脚本接线：

```sh
node scripts/install-profile.mjs <profileName> <pluginPath>
```

> 实例运行期间安装可能因其它包被占用报 `EPERM`，请在停止后执行。

## 设计 / Design

纯浏览器端 client 插件，不改 DSH 源码：

- 通过 `dsh.client` 声明，bundle 为 `exports["./client"]` → `lib/client.js`
- 在 `conversation.input.overlay`（session 级）注册零渲染组件，仅以捕获阶段监听 `window` 的 `keydown`
- 历史取自会话快照的用户消息节点（相邻重复折叠、空消息跳过），刷新/恢复会话自动重建，不落任何存储
- 翻到窗口最旧一条时经 `ctx.sessions.provide` 注入的 `loadHistoryOlder` 自动请求更早窗口，按文本重锚定位置

## 限制 / Limits

被 DSH 压缩（compaction）替换为摘要的旧轮次只剩摘要文本，原始逐条消息在浏览器端不可恢复。

## 开发 / Development

```sh
npm install        # devDeps: jsdom, react, react-dom
npm run verify     # jsdom 行为验证：31 项断言
```

## License

MIT