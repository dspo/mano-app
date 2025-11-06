# mano-app

本项目尝试实现一个小说写作 App。基于 GPUI 框架和 wry。

## 目前进度

已经写了一行 "Hello World"，离成功指日可待了 😂。

# GPUI-WRY

GPUI-Wry 尝试将 [GPUI](https://www.gpui.rs/) 和 [Tauri](https://tauri.app/) 结合起来。

## 项目简介

GPUI-WRY 类似一个 "mini Tauri"，它允许开发者使用前端技术构建部分用户界面，同时利用 GPUI 处理主要的 GUI 逻辑。该框架结合了：

- **[GPUI](https://www.gpui.rs/)**：用于构建原生 GUI 应用的 Rust 库
- **[GPUI Component](https://longbridge.github.io/gpui-component/)**: gpui-component 基于 Wry 为 GPUI 实现了一个 Webview 组件
- **[Wry](https://github.com/tauri-apps/wry)**：跨平台 WebView 封装库

通过这种组合，在进行 GPUI 开发时，可以将 Webview 嵌入原生窗口的任意地方。

GPUI-Wry 尽量实现 Tauri 的一些能力，比如从 Webview 中调用 Rust 函数等，以实现两种 UI 间的交互。
但目前很多工作才刚刚开始。

实现过程中拷贝了一些 Tauri 代码，可能是不规范的，后续将通过 License 声明。
向 Tauri 致敬。

## 运行示例

项目包含一个示例应用，跟 Tauri 默认的示例非常相似，你可以通过以下命令运行：

```bash
# 运行 greet 示例
cargo run --example greet
```

![img.png](examples/apps/greet/public/example.png)

---

<p align="center">Made with ❤️ using Tauri and GPUI</p>
