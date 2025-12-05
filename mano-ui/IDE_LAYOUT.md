# Mano - 编辑器布局实现

基于 React + Tailwind CSS 4.x + shadcn/ui 实现的现代代码编辑器/IDE 布局。

## 🎨 功能特性

### 已实现的布局组件

1. **Title Bar（标题栏）**
   - 应用图标与名称
   - 菜单栏（File、Edit、View、Terminal）
   - 窗口控制按钮
   - 固定高度 48px

2. **Activity Bar（活动栏）**
   - 主功能图标按钮（Explorer、Search、Source Control、Run & Debug、Extensions）
   - 工具提示显示
   - 高亮选中状态
   - 固定宽度 48px

3. **Primary Sidebar（主侧边栏）**
   - 文件树导航（支持展开/折叠）
   - 多视图切换（Explorer、Search、Source Control 等）
   - 可调整宽度（15%-40%）
   - 滚动区域

4. **Editor Group（编辑器组）**
   - Tab 标签页管理
   - 多文件同时打开
   - 文件修改状态指示（圆点）
   - 关闭按钮
   - 代码显示区域

5. **Bottom Panel（底部面板）**
   - Terminal（终端）
   - Problems（问题列表）
   - Output（输出日志）
   - Debug Console（调试控制台）
   - 可调整高度（10%-60%）
   - 可显示/隐藏

6. **Status Bar（状态栏）**
   - Git 分支信息
   - 错误/警告计数
   - 光标位置（行/列）
   - 编码格式
   - 语言模式
   - 固定高度 24px

## 🛠️ 技术栈

- **React 19.2.0** - UI 框架
- **Tailwind CSS 4.x** - 样式系统（无需配置文件）
- **shadcn/ui** - UI 组件库
  - `ResizablePanel` - 可调整大小的面板
  - `Tabs` - 标签页组件
  - `ScrollArea` - 滚动区域
  - `DropdownMenu` - 下拉菜单
  - `Tooltip` - 工具提示
  - `Button` - 按钮组件
- **lucide-react** - 图标库
- **TypeScript** - 类型安全

## 📁 项目结构

```
src/
├── components/
│   ├── ide/
│   │   ├── TitleBar.tsx          # 标题栏
│   │   ├── ActivityBar.tsx       # 活动栏
│   │   ├── PrimarySidebar.tsx    # 主侧边栏（文件树）
│   │   ├── EditorGroup.tsx       # 编辑器组（标签页）
│   │   ├── BottomPanel.tsx       # 底部面板
│   │   ├── StatusBar.tsx         # 状态栏
│   │   └── IDELayout.tsx         # 主布局组件
│   └── ui/                       # shadcn/ui 组件
├── App.tsx                       # 应用入口
└── index.css                     # 全局样式
```

## 🚀 运行项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 💡 核心实现要点

### 1. 全屏布局

```css
/* index.css */
html, body, #root {
  @apply h-full w-full overflow-hidden;
}
```

### 2. Flexbox 主布局

```tsx
<div className="flex flex-col h-screen">
  <TitleBar />                    {/* 固定高度 */}
  <div className="flex flex-1">   {/* 弹性区域 */}
    <ActivityBar />
    <ResizablePanelGroup>...</ResizablePanelGroup>
  </div>
  <StatusBar />                   {/* 固定高度 */}
</div>
```

### 3. 可调整面板

使用 shadcn/ui 的 `ResizablePanel`：

```tsx
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
    <PrimarySidebar />
  </ResizablePanel>
  
  <ResizableHandle withHandle />
  
  <ResizablePanel defaultSize={80}>
    <EditorGroup />
  </ResizablePanel>
</ResizablePanelGroup>
```

### 4. 状态管理

```tsx
const [activeActivity, setActiveActivity] = useState('explorer')
const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
const [activeFile, setActiveFile] = useState<string | null>(null)
```

### 5. 文件树导航

递归组件实现文件夹展开/折叠：

```tsx
function FileTreeItem({ node, level }) {
  const [isOpen, setIsOpen] = useState(true)
  
  if (node.type === 'file') {
    return <FileItem />
  }
  
  return (
    <>
      <FolderItem onClick={() => setIsOpen(!isOpen)} />
      {isOpen && node.children?.map(child => (
        <FileTreeItem node={child} level={level + 1} />
      ))}
    </>
  )
}
```

## 🎯 Tailwind 关键类

| 功能 | Tailwind 类 |
|------|------------|
| 全屏容器 | `h-screen`, `w-screen` |
| 弹性布局 | `flex`, `flex-1`, `flex-col` |
| 固定尺寸 | `h-12`, `w-12`, `h-6` |
| 溢出控制 | `overflow-hidden`, `overflow-auto` |
| 边框 | `border-r`, `border-b`, `border-t` |
| 主题色 | `bg-background`, `text-foreground` |
| 交互状态 | `hover:bg-accent`, `data-[state=active]:bg-accent` |

## 🔧 可扩展功能

以下功能可在此基础上扩展：

- [ ] 集成 Monaco Editor 或 CodeMirror
- [ ] 实现代码语法高亮
- [ ] 添加搜索功能
- [ ] 集成 Git 操作
- [ ] 实现终端交互
- [ ] 添加快捷键系统
- [ ] 实现拖拽分栏
- [ ] 添加主题切换
- [ ] 文件保存/自动保存
- [ ] 多光标编辑

## 📝 组件 Props 说明

### IDELayout
主布局组件，无 props，内部管理所有状态。

### ActivityBar
```tsx
interface ActivityBarProps {
  activeActivity: string
  onActivityChange: (activity: string) => void
}
```

### PrimarySidebar
```tsx
interface PrimarySidebarProps {
  activity: string
  onFileClick: (file: FileNode) => void
  selectedFile: string | null
}
```

### EditorGroup
```tsx
interface EditorGroupProps {
  openFiles: OpenFile[]
  activeFile: string | null
  onFileSelect: (fileId: string) => void
  onFileClose: (fileId: string) => void
}
```

### StatusBar
```tsx
interface StatusBarProps {
  branch: string
  errors: number
  warnings: number
  line: number
  column: number
  language: string
}
```

## 🎨 样式定制

所有颜色使用 CSS 变量，可在 `src/index.css` 中自定义：

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --accent: oklch(0.97 0 0);
  /* ... */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

## 📱 响应式支持

当前为桌面端优化。移动端适配需调整：
- 隐藏 ActivityBar
- 侧边栏改为抽屉模式
- 底部面板改为全屏模式

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
