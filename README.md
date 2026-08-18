# dsh-keyboard-history

纯净的 DSH Web 输入历史插件：在会话输入框用 **↑ / ↓** 翻阅之前发过的消息，仅此而已。

A pure ↑/↓ input-history plugin for the DeepSeek Harness web composer. Nothing else.

## 理念 / Philosophy

- 只做一件事：↑ / ↓ 翻阅本会话内已发送的消息
- 不引入反搜 / 片段 / 下拉面板 / 跨会话持久 / 位置指示等任何附加能力
- 纯浏览器端 client 插件，不改 DSH 任何源码

## 交互 / Behavior

| 按键 | 行为 |
|---|---|
| `↑`（空草稿） | 召回最新一条已发送消息 |
| `↑`（翻阅中） | 向更早的消息回翻 |
| `↓`（翻阅中） | 向更新的消息前进 |
| `↓`（越过最新一条） | 清空草稿，退出翻阅 |
| 编辑 / 回车发送 | 自动退出翻阅态 |

历史直接取自会话快照里的用户消息节点（相邻重复折叠、空消息跳过）；
刷新页面或恢复会话后历史自然重建，无需额外存储。

**绝不打扰的场景**：草稿非空（含斜杠菜单打开——菜单开着意味着草稿必非空）、
输入法组合输入（IME）、会话忙碌/锁定、按了 Ctrl/Cmd/Alt 修饰键、焦点不在交流输入框。

## 安装 / Install

当前 DSH 是 `npx @deepseek-ai/dsh web` 启动、profile 位于 `~/.dsh/profiles/web`，
直接运行对接脚本：

```sh
node scripts/install-profile.mjs web
# 或指定 profile / 插件路径：
node scripts/install-profile.mjs <profileName> <pluginPath>
```

脚本会向 profile 的 `package.json` 写入依赖（`file:` 指向本仓库）并加入
`dsh.profile.bundles`，然后执行安装。**之后需要重启对应 `dsh web` 实例**——
client bundle 只在启动时进入模块图。注意：实例运行期间 pnpm 可能因其它包
（如 harmonyos-dev-mcp-for-dsh）被进程占用而报 `EPERM`，安装请在实例停止后
进行。

发布到 npm / GitHub 后，把依赖改成对应来源即可（同一 bundle 机制）。

## 验证 / Verify

```sh
npm install        # devDeps: jsdom, react, react-dom
npm run verify     # jsdom 行为验证：16 项断言
```

验证挂载真实的 `lib/client.js` bundle 到 jsdom，模拟会话标准套件并以真实
DOM `KeyboardEvent` 驱动输入框，覆盖：召回/回翻/前进/越界清空、非空草稿、
忙碌 phase、IME（isComposing 与 keyCode 229）、修饰键、失焦、历史去重、
编辑退出翻阅。

## 实现 / How it works

- 通过 `dsh.client` 声明为 web client 插件（bundle: `exports["./client"]` → `lib/client.js`）
- 在 `conversation.input.overlay`（session 级 list seat）注册一个不渲染任何
  UI 的组件，仅以捕获阶段监听 `window` 的 `keydown`
- 触发条件：焦点在 composer textarea（`[data-composer-card]` 内）+ 空草稿 +
  `plain` phase + 非 IME + 无修饰键
- 召回写入走 `inputActions.setDraft`（会话标准套件唯一的公开草稿写入路径）；
  判定「焦点 + 草稿 + 菜单互斥」全在插件侧完成，与核心的斜杠管线零耦合

## 边界 / Non-goals

不做：跨会话历史、持久化历史文件、下拉候选面板、反向搜索（Ctrl+R）、
片段保存、命令 `/xxx` 专属处理、位置/计数指示、设置项。

## License

MIT