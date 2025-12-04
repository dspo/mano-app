# Mano

Mano 是一个基于 Tauri 构建的小说写作应用。

## ✨ 功能特性

### 核心功能
- 📝 **富文本编辑器** - 基于 Plate.js 的强大富文本编辑器，支持标题、列表、表格、代码块、数学公式等多种格式
- 🎨 **现代化界面** - 使用 shadcn/ui 构建的优雅 IDE 风格界面，包含活动栏、侧边栏、编辑器组、底部面板和状态栏
- 📁 **文件管理系统** - 树形文件浏览器，支持文件夹展开/折叠和拖拽操作
- 💾 **自动保存** - 编辑器内容变化后 1 秒自动保存，防止数据丢失
- 🖥️ **多标签页编辑** - 同时打开和编辑多个文件，灵活切换
- 🎯 **文件类型支持** - `.mano` 文件使用富文本编辑器，其他文件以文本形式预览
- 🔒 **本地存储** - 所有数据存储在本地文件系统，保护隐私安全

### 界面特性
- **Activity Bar** - 快速访问资源管理器、搜索、源代码管理等功能
- **可调整面板** - 侧边栏和底部面板宽度/高度可自由调整
- **响应式布局** - 基于 ResizablePanel 的灵活布局系统
- **状态栏** - 显示 Git 分支、错误/警告计数、光标位置等信息

## 📋 环境要求

### 必需工具
- **Node.js** (推荐 v18 或更高版本)
- **pnpm** (包管理器)
- **Rust** (用于构建 Tauri 应用)
- **Cargo** (Rust 包管理器)

### 系统要求
- 支持的操作系统：Windows、macOS、Linux
- 参考 [Tauri Prerequisites](https://tauri.app/v2/guides/prerequisites/) 了解完整系统依赖

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/dspo/mano-app.git
cd mano-app
```

### 2. 安装依赖

```bash
cd mano-ui
pnpm install
```

### 3. 运行开发环境

**方式 1：使用 Makefile (推荐)**

```bash
# 运行 Tauri 开发服务 (同时启动前端和 Tauri)
make dev

# 或仅运行前端开发服务器
make mano-ui-dev
```

**方式 2：使用命令行**

```bash
# 进入前端目录并启动开发服务器
cd mano-ui && pnpm dev
```

```bash
# 在项目根目录运行 Tauri 开发服务
cargo tauri dev
```

## 🔨 构建应用

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

## 🛠️ 技术栈

### 核心框架
- **[React](https://react.dev/)** ^19.2.0 - UI 框架
- **[TypeScript](https://www.typescriptlang.org/)** ~5.9.3 - 类型安全
- **[Vite](https://vitejs.dev/)** ^7.2.4 - 构建工具
- **[Tailwind CSS](https://tailwindcss.com/)** ^4.1.17 - 样式系统
- **[shadcn/ui](https://ui.shadcn.com/)** - UI 组件库

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

请查看项目根目录的 LICENSE 文件了解许可证信息。
