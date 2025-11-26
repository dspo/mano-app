# Mano

Mano 是一个基于 Tauri 构建的现代化小说写作应用。它提供了强大的富文本编辑功能，支持多种文档格式，并通过桌面应用的形式提供流畅的写作体验。

## 功能特性

- 📝 基于 Lexical 的富文本编辑器，支持代码高亮、表格、列表等多种格式
- 🎨 使用 shadcn/ui 构建的优雅现代化界面
- 📁 树形文件管理器，方便组织小说章节和内容
- 🎨 支持 Excalidraw 绘图功能
- 🚀 基于 Tauri 的轻量级桌面应用，性能优异
- 💾 本地文件系统存储，保护数据隐私

## 开发环境

### 环境要求

- Node.js (推荐使用 LTS 版本)
- pnpm
- Rust (用于构建 Tauri 应用)
- Cargo

### 安装依赖

```bash
pnpm install
```

### 运行开发服务

有两种方式运行开发服务：

**方式 1：使用 Makefile (推荐)**

```bash
# 运行 Tauri 开发服务 (同时启动前端和 Tauri)
make dev

# 或仅运行前端开发服务器
make mano-app-dev
```

**方式 2：使用命令行**

```bash
# 进入前端目录并启动开发服务器
cd mano-app && pnpm dev
```

```bash
# 在项目根目录运行 Tauri 开发服务
cargo tauri dev
```

## 构建应用

### 生产构建

使用 Makefile：

```bash
make build
```

或直接使用 Tauri CLI：

```bash
cargo tauri build
```

构建完成后，可执行文件将位于 `mano-tauri/target/release` 目录下。

### 清理构建产物

```bash
make clean
```

## 技术栈

### 核心框架

- **[Tauri](https://tauri.app/)** - 使用 Web 技术构建轻量级桌面应用的框架
- **[React](https://react.dev/)** (v19.1.0) - 用户界面构建库
- **[TypeScript](https://www.typescriptlang.org/)** (v5.8.3) - 类型安全的 JavaScript 超集
- **[Vite](https://vitejs.dev/)** (v7.0.4) - 现代化的前端构建工具
- **[Rust](https://www.rust-lang.org/)** - Tauri 后端开发语言

### UI 框架与组件库

- **[Tailwind CSS](https://tailwindcss.com/)** (v4.1.17) - 实用优先的 CSS 框架
- **[shadcn/ui](https://ui.shadcn.com/)** - 基于 Radix UI 的高质量 React 组件库
- **[Radix UI](https://www.radix-ui.com/)** - 无样式、可访问的 UI 组件原语
- **[Autoprefixer](https://github.com/postcss/autoprefixer)** - CSS 自动添加浏览器前缀

### 富文本编辑器

- **[Lexical](https://lexical.dev/)** (v0.38.2) - Meta 开发的可扩展文本编辑框架
  - @lexical/react - React 集成
  - @lexical/rich-text - 富文本功能
  - @lexical/markdown - Markdown 支持
  - @lexical/code - 代码块支持
  - @lexical/table - 表格支持
  - @lexical/list - 列表支持
  - @lexical/link - 链接功能
  - @lexical/yjs - 协同编辑支持
  - 等多个 Lexical 插件

### 特色功能库

- **[@excalidraw/excalidraw](https://excalidraw.com/)** (v0.18.0) - 手绘风格的图表和白板工具
- **[react-arborist](https://react-arborist.netlify.app/)** (v3.4.3) - 强大的树形视图组件
- **[Shiki](https://shiki.style/)** (v3.15.0) - 优雅的代码语法高亮器
- **[Prism.js](https://prismjs.com/)** (v1.30.0) - 轻量级语法高亮库
- **[KaTeX](https://katex.org/)** (v0.16.25) - 数学公式渲染

### 状态管理与工具库

- **[@reduxjs/toolkit](https://redux-toolkit.js.org/)** (v2.10.1) - Redux 状态管理工具集
- **[React Redux](https://react-redux.js.org/)** (v9.2.0) - React 的 Redux 绑定
- **[Lodash](https://lodash.com/)** (v4.17.21) - JavaScript 实用工具库
- **[Yjs](https://yjs.dev/)** (v13.6.27) - CRDT 协同编辑框架
- **[date-fns](https://date-fns.org/)** (v4.1.0) - 现代 JavaScript 日期工具库
- **[uuid](https://github.com/uuidjs/uuid)** (v13.0.0) - UUID 生成器

### UI 增强库

- **[@floating-ui/react](https://floating-ui.com/)** (v0.27.16) - 浮动定位引擎（用于工具提示、下拉菜单等）
- **[react-day-picker](https://react-day-picker.js.org/)** (v9.11.2) - 日期选择器组件
- **[react-icons](https://react-icons.github.io/react-icons/)** (v5.5.0) - 流行图标库集合
- **[react-error-boundary](https://github.com/bvaughn/react-error-boundary)** (v6.0.0) - React 错误边界组件
- **[use-resize-observer](https://github.com/ZeeCoder/use-resize-observer)** (v9.1.0) - 元素大小变化监听 Hook

### Tauri 插件

- **@tauri-apps/plugin-fs** - 文件系统访问
- **@tauri-apps/plugin-dialog** - 系统对话框
- **@tauri-apps/plugin-opener** - 打开文件和 URL

### 工具链

- **[class-variance-authority](https://cva.style/)** - CSS 类变体管理
- **[clsx](https://github.com/lukeed/clsx)** - 条件类名构建工具
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Tailwind 类名合并工具
- **[Prettier](https://prettier.io/)** (v3.6.2) - 代码格式化工具
- **[Jest](https://jestjs.io/)** (v30.2.0) - JavaScript 测试框架
- **[ts-jest](https://kulshekhar.github.io/ts-jest/)** - Jest 的 TypeScript 支持

## 项目结构

```
mano-app/
├── mano-app/          # React 前端应用
│   ├── src/          # 源代码
│   ├── package.json  # 前端依赖配置
│   └── vite.config.ts # Vite 构建配置
├── mano-tauri/       # Tauri 后端
│   ├── src/         # Rust 源代码
│   ├── Cargo.toml   # Rust 依赖配置
│   └── tauri.conf.json # Tauri 配置
├── Makefile         # 便捷构建命令
└── README.md        # 项目说明文档
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

请查看项目根目录的 LICENSE 文件了解许可证信息。
