# Mano UI

Mano 的前端代码（React 19 + Vite 7 + Tailwind 4 + plate.js + shadcn/ui），同时服务于浏览器模式与 Tauri 2 桌面端。

## 开发
```bash
pnpm install
pnpm dev          # 浏览器预览，默认 5173
pnpm dev --port 1420   # Tauri dev 会调用此命令
pnpm lint
pnpm build
pnpm preview
```

> 已启用 React Compiler。保持函数式组件，避免滥用 `useMemo`/`useCallback`/`React.memo`。

## 核心特性
- plate.js 编辑器：完整插件套件（表格、媒体、公式、Slash 命令、评论等），自动保存到 IndexedDB 与文件系统（1s 防抖），`⌘/Ctrl+S` 触发立即保存
- IDE 布局：ActivityBar + 文件树 + 可分屏编辑器 + Bottom Panel（分隔条或 `⌘/Ctrl+J` 展开，内容目前为占位）
- 文件树：全局唯一节点名，右键 “Create Mano Text” 新建，双击重命名，拖拽排序，删除会写入垃圾篓（内容 base64）并删除对应文件；垃圾篓只读，可恢复或彻底删除
- 拖放与分屏：标签可在分屏间拖动；落在边缘创建新分屏；`⌘/Ctrl+\\` 快速向右分屏
- 工作区存储：使用 `mano.conf.json` 记录树结构，缺失时自动生成，内含 `__trash__` 节点

## 文件系统策略
- Tauri：通过 `@tauri-apps/plugin-dialog` / `plugin-fs` 处理文件与重命名
- Chrome：使用 File System Access API（需读写权限）
- Safari：不支持文件系统操作，会抛出错误提示改用桌面端或 Chrome

## 使用流程
1. 首次进入点击 Sidebar 顶部的 “Mano” 打开文件夹（或由 Tauri 菜单发送 `workspace_updated` 事件）。
2. 选择/创建 `mano.conf.json` 后即可在树上右键新建或双击重命名；Markdown 会以 `.md`，其余文本以 `.mano` 落盘。
3. 删除节点 → 写入垃圾篓并移除物理文件；在垃圾篓右键 “Move out” 还原文件，“Delete” 彻底删除配置。
4. 从垃圾篓打开的文件只读（预览用途）。

## 约束与约定
- 全局唯一名称：同一工作区任意节点名不得重复（包括目录）
- 样式：仅 Tailwind 4 + shadcn/ui，不引入自定义 CSS
- 浏览器依赖：需要支持 File System Access API 的环境，或运行在 Tauri
