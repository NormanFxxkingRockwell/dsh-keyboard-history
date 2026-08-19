# dsh-keyboard-history

[English](README.en.md) | 中文

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)
![license](https://img.shields.io/badge/license-MIT-green)
![dsh](https://img.shields.io/badge/dsh-plugin-4B32C3)
[![repo](https://img.shields.io/badge/repo-github-181717?logo=github)](https://github.com/NormanFxxkingRockwell/dsh-keyboard-history)

**DSH Web 会话输入框的极简输入历史插件：空输入框时按 ↑/↓ 翻阅之前发过的消息，仅此而已。**

## 安装

```sh
dsh plugin --profile <你的profile名> add dsh-keyboard-history
```

装好后重启 `dsh web` 即可生效。

## 使用

- **↑**：空输入框时召回上一条已发送的消息，继续按回翻更早
- **↓**：向新翻，越过最新一条回到空框
- 编辑、发送后自动退出翻阅；斜杠菜单、中文输入法、会话忙碌等场景下不打扰你

## License

MIT