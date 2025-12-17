# Mano

Mano 是一款基于 **Tauri 2** 的本地小说写作 IDE，采用 VS Code 式布局和 plate.js 富文本编辑器，专注离线写作与本地存储。
前端位于 `mano-ui/`，宿主与插件位于 `mano-tauri/`。

## 功能特性
- VS Code 风格工作台：ActivityBar、可伸缩 Sidebar/Bottom Panel、编辑器分屏，支持标签拖放与跨分组移动
- plate.js 富文本：完整插件套件（表格、公式、媒体、Slash 命令等），自动保存到 IndexedDB 与文件系统
- 工作区文件树：`mano.conf.json` 驱动，全局唯一节点名，创建/重命名/拖拽排序，删除会写入垃圾篓并删除物理文件，垃圾篓可恢复
- 跨平台文件系统：Tauri 插件（桌面）、Chrome File System Access（浏览器），Safari 明确不支持
- 快捷键：⌘/Ctrl+S 保存、⌘/Ctrl+B 侧边栏、⌘/Ctrl+J 底部面板、⌘/Ctrl+\\ 分屏；ActivityBar 中搜索/SCM/调试入口暂未启用

## 环境要求
- Node.js ≥ 18、pnpm
- Rust toolchain 与 `cargo tauri`（Tauri 2），按操作系统安装对应依赖
- 浏览器模式需支持 File System Access API（推荐 Chrome）；Safari 会提示不支持

## 快速开始
1) 安装依赖
```bash
cd mano-ui && pnpm install
```

2) 开发
- Tauri（前端 + 桌面容器）：`make dev`（等价 `cargo tauri dev`，会自动以 `pnpm dev --port 1420` 启动前端）
- 仅前端：`cd mano-ui && pnpm dev`
- Makefile 额外提供 `make mano-ui-dev`

3) 构建
- 桌面产物：`make build` 或 `cargo tauri build`（产物在 `mano-tauri/target/release`）
- 清理：`make clean`

## 使用提示
- 启动后点击 Sidebar 顶部的 “Mano” 打开工作区（或在 Tauri 菜单触发 `workspace_updated` 事件）；首次会自动生成含 `__trash__` 的 `mano.conf.json`。
- 节点名称在全树范围必须唯一；新建节点通过树节点右键“Create Mano Text”，重命名用双击进入编辑。打开文件会保证磁盘存在对应 `.mano`/`.md` 文件。
- 删除节点会将内容 base64 写入 `mano.conf.json` 并删除对应文件；在垃圾篓右键“Move out”可恢复文件，“Delete”会彻底移除配置。
- 底部面板的 ActivityBar 按钮暂不可用，可通过分隔条拖动或快捷键 ⌘/Ctrl+J 展开；面板内容目前为占位数据。

## 目录
- `mano-ui/`：前端（React 19 + Vite 7 + Tailwind 4 + plate.js + shadcn/ui）
- `mano-tauri/`：Tauri 2 宿主、插件与配置
- `doc/`：布局与编辑器相关文档

## 许可证
见根目录的 LICENSE_* 文件。
