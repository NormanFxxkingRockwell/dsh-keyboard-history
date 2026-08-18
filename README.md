# dsh-keyboard-history

纯净的 DSH Web 输入历史插件：在会话输入框用 **↑ / ↓** 翻阅之前发过的消息，仅此而已。

A pure ↑/↓ input-history plugin for the DeepSeek Harness web composer. Nothing else.

## 理念 / Philosophy

- 只做一件事：空输入框时按 ↑ 召回上一条已发送消息，↓ 向新翻，翻过最新一条回到空框
- 不引入反搜、片段、下拉面板、跨会话持久、位置指示等任何附加能力
- 纯浏览器端 client 插件，不改 DSH 任何源码

## 状态 / Status

- [x] 插件骨架（package.json、server half、client bundle 入口）
- [ ] 核心交互（↑/↓ 翻阅会话内历史）
- [ ] 安装对接与验证

## 安装 / Install

> 待补充（随验证步骤完善）

## License

MIT