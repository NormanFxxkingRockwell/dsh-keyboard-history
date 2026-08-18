# dsh-keyboard-history

English | [中文](README.md)

![license](https://img.shields.io/badge/license-MIT-green)
![dsh](https://img.shields.io/badge/dsh-plugin-4B32C3)
[![repo](https://img.shields.io/badge/repo-github-181717?logo=github)](https://github.com/NormanFxxkingRockwell/dsh-keyboard-history)

**A minimal input-history plugin for the DSH web composer: with an empty input box, press ↑/↓ to walk through messages you have sent. Nothing else.**

## Install

```sh
dsh plugin --profile <your-profile-name> add dsh-keyboard-history
```

Then restart `dsh web`.

## Usage

- **↑**: on an empty input, recall the newest sent message; keep pressing to walk older
- **↓**: walk newer; one press past the newest clears back to an empty box
- editing or sending exits the browse state automatically; never interferes with the slash menu, IME input, or a busy session

## License

MIT