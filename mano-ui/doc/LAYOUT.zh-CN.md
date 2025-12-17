# Mano IDE 布局架构

## 概述

Mano 采用了 **VS Code 风格的工作台布局**，实现了经典的 IDE 结构，通过多面板组合方式构建。布局使用 `react-resizable-panels` 实现动态面板调整大小，使用 `dnd-kit` 实现拖放交互，提供专业级桌面应用体验。

## 布局层级

```
IDELayout（根容器）
├── ActivityBar（固定宽度：48px）
├── ResizablePanelGroup（水平方向）
│   ├── PrimarySidebar（可调整：15-40%，可折叠）
│   ├── ResizableHandle
│   └── ResizablePanelGroup（垂直方向）
│       ├── EditorContainer（可调整：30%+，主内容区）
│       ├── ResizableHandle
│       └── BottomPanel（可调整：10-60%，可折叠）
└── StatusBar（固定高度：24px）
```

---

## 工作区生命周期与存储

- 工作区配置保存在 `mano.conf.json`，缺失时会自动生成，包含 `__trash__` 目录节点。
- 节点名称必须在全树范围唯一（包含目录）。加载时如有重名会被阻塞并提示。
- 文本节点对应物理文件：SlateText 为 `.mano`，Markdown 为 `.md`，打开时若不存在会创建（Markdown 预填标题）。
- 删除即移动到垃圾篓：内容以 base64 写入 `mano.conf.json` 并删除物理文件。垃圾篓内只读；“移出”会重建文件，“删除”会移除配置。
- 文件系统策略：桌面端走 Tauri 插件；浏览器使用 Chrome File System Access；Safari 明确不支持并抛出错误提示。

---

## 核心组件与行为

### 1. IDELayout（主协调器）

**文件**: `src/components/ide/IDELayout.tsx`

**作用**: 根级布局控制器，管理全局状态、文件系统操作并协调所有子组件。

**核心职责**:
- **状态管理**: 集成 `EditorContext` 实现集中式编辑器状态管理（标签页、组、布局）
- **文件系统抽象**: 通过 `getFileSystem()` 策略模式处理跨平台文件操作
- **树操作**: 管理工作区文件树（增删改查操作、拖放重排序）
- **面板协调**: 通过 `ImperativePanelHandle` 引用控制侧边栏/面板的折叠/展开
- **拖放上下文**: 为编辑器组之间的标签页重排序提供拖放上下文

**状态**:
- `fileTree: ManoNode[]` - 工作区树结构
- `selectedFile: string | null` - 当前选中的文件 ID
- `configFileHandle: IFileHandle` - `mano.conf.json` 文件引用
- `isSidebarCollapsed: boolean` - 侧边栏可见性状态
- `isPanelCollapsed: boolean` - 底部面板可见性状态

---

### 2. ActivityBar（导航条）

**文件**: `src/components/ide/ActivityBar.tsx`

**尺寸**: 固定宽度 `48px`，全高度

**作用**: 主导航栏，用于在工作台活动之间切换和控制面板可见性。

**组件**:

#### 活动图标（顶部区域）
- **资源管理器**（Files 图标）- 默认激活，导航到文件树视图
- **搜索**（Search 图标）- *已禁用*，显示"即将推出..."
- **源代码管理**（GitBranch 图标）- *已禁用*，显示"即将推出..."
- **运行和调试**（Play 图标）- *已禁用*，显示"即将推出..."
- **扩展**（Package 图标）- *已禁用*，显示"即将推出..."

#### 控制按钮（底部区域）
- **切换侧边栏**（PanelLeft/PanelLeftClose）- 折叠/展开主侧边栏（快捷键：`⌘B`）
- **切换面板**（PanelBottom/PanelBottomClose）- *已禁用*（提示“即将推出...”）；可通过拖拽分隔条或快捷键 `⌘J` 展开
- **设置**（Settings 图标）- *已禁用*，显示"即将推出..."

**交互**:
- 使用 `Tooltip` 组件，延迟 `300ms` 显示悬浮提示
- 激活状态用 `bg-accent` 样式高亮显示
- 禁用按钮渲染为 `opacity-50` 和 `pointer-events-none`

---

### 3. PrimarySidebar（文件浏览器）

**文件**: `src/components/ide/PrimarySidebar.tsx`

**尺寸**: 可调整宽度 `15-40%`，可折叠

**作用**: 显示工作区文件树，支持层级导航、增删改查操作和拖放重排序。

**功能特性**:

#### 头部区域
- **Mano Logo + 标题**: 打开工作区（对话框或 Tauri `workspace_updated` 事件）
  - 未加载工作区时显示 `animate-pulse` 呼吸效果（视觉提示）

#### 文件树（递归组件）
- **节点类型**:
  - `Directory` - 可展开/折叠的文件夹（ChevronRight/ChevronDown 图标）
  - `SlateText` - 富文本文件（`.mano` 扩展名，TextAlignStart 图标）
  - `Markdown` - Markdown 文件（`.md` 扩展名，TextQuote 图标）

- **命名规则**:
  - 节点名称必须全局唯一，新建从“新建文档”开始，若冲突会自动递增编号。

- **交互操作**:
  - **单击**: 目录折叠/展开；文件在编辑器打开
  - **双击**: 进入内联重命名（垃圾篓/只读节点禁止）
  - **拖放**: 重排节点；垃圾篓内节点不可拖动，也不可将节点拖入垃圾篓
  - **右键菜单**:
    - `Move up/down/left/right` - 无拖拽情况下调整顺序
    - `Create Mano Text` - 添加子文本节点
    - `Remove` - 移入垃圾篓并删除对应文件（写入 base64 内容）
    - *垃圾篓专用*: `Move out` 恢复文件，`Delete` 彻底移除配置

- **状态指示器**:
  - 选中文件: `bg-accent` 背景
  - 拖放悬浮: `bg-accent/50` 并显示位置指示线
  - 编辑模式: 内联 `<input>` 替换节点标签

#### 垃圾篓节点
- **ID**: `__trash__`（保留标识，只读）
- **行为**: 
  - 不能被删除、重命名或移动
  - 通过为文件添加 `.bak` 后缀来存储已删除节点
  - 支持恢复（`移出`）和永久删除

---

### 4. EditorContainer（内容区域）

**文件**: `src/components/ide/EditorContainer.tsx`

**尺寸**: 弹性增长，最小高度 `30%`

**作用**: 主要的文件编辑工作区，支持分屏视图和标签页组。

**架构**:

#### 布局类型
- **组布局**: 单个 `EditorGroup` 带标签栏
- **分屏布局**: 递归的 `ResizablePanelGroup` 包含嵌套子元素

#### EditorGroup 组件
- **标签栏**: 水平排列的打开文件列表
  - 标签指示器: 文件名、关闭按钮（`X`）
  - 激活标签: `bg-accent` 样式
  - 脏状态: 橙色小点（落盘前）
- **内容区域**: 基于 plate.js 的 `AutoSaveTextEditor`
  - 插件集合对齐 plate 基础示例（表格、媒体、Markdown、评论、Slash 等）
  - 1 秒防抖自动保存到 IndexedDB 与文件系统；`⌘/Ctrl+S` 立即保存
  - 垃圾篓文件以只读方式打开

#### 分屏视图
- **方向**: 水平或垂直分屏
- **调整大小**: 面板之间的可拖动手柄
- **最小尺寸**: 每个面板 20%
- **拖放区域**: 面板边缘的放置区域，用于通过拖动创建新分屏

---

### 5. BottomPanel（控制台和工具）

**文件**: `src/components/ide/BottomPanel.tsx`

**尺寸**: 可调整高度 `10-60%`，可折叠

**作用**: 多标签面板，用于终端、诊断信息和调试输出（目前为静态占位）。

**标签页**:
- **终端**（TerminalIcon）
- **问题**（AlertCircle）
- **输出**（FileOutput）
- **调试控制台**（Bug）

**头部**:
- 带图标 + 标签的标签列表
- 右上角关闭按钮（`X`）用于折叠面板

**内容**:
- 静态示例内容，无实时数据
- 尽管 ActivityBar 按钮禁用，仍可拖动分隔条或用 `⌘/Ctrl+J` 展开

---

### 6. StatusBar（信息条）

**文件**: `src/components/ide/StatusBar.tsx`

**尺寸**: 固定高度 `24px`

**作用**: 显示工作区和活动文件的上下文信息（当前为静态值）。

**区域划分**:

#### 左侧
- **Git 分支**（GitBranch 图标）: 当前仓库分支（如 `main`）
- **错误计数**（AlertCircle）: 编译错误数量
- **警告计数**（AlertCircle）: 警告数量

#### 右侧
- **光标位置**: 行号和列号（如 `Ln 42, Col 18`）
- **编码**: 字符编码（如 `UTF-8`）
- **语言模式**: 文件类型标识（如 `TypeScript`、`Markdown`）
- **行尾符**: EOL 格式（如 `LF`、`CRLF`）
- **连接状态**（Wifi 图标）: 网络/同步指示器

**样式**:
- 背景: `bg-primary` 配合 `text-primary-foreground`
- 交互区域: `hover:bg-primary-foreground/10` 带圆角

---

## 布局机制

### 可调整大小的面板

**库**: `react-resizable-panels`（`@/components/ui/resizable`）

**实现**:
- `ResizablePanelGroup`: 定义调整大小方向的容器（`horizontal` | `vertical`）
- `ResizablePanel`: 带尺寸约束的独立面板
- `ResizableHandle`: 可拖动的分隔符，可选视觉手柄

**持久化**:
- 使用 `autoSaveId` 属性在 localStorage 中持久化面板尺寸
- 示例: `ide-layout-horizontal`、`ide-layout-vertical`

**可折叠面板**:
- 侧边栏: `collapsible={true}` 配合 `ref={sidebarRef}`
- 底部面板: `collapsible={true}` 配合 `ref={panelRef}`
- 通过 `ImperativePanelHandle` 方法控制: `collapse()`、`expand()`、`isCollapsed()`

### 拖放系统

**库**: `@dnd-kit/core`

**上下文**:
1. **树重排序**（PrimarySidebar）
   - 拖动节点在文件树内重新排序
   - 放置模式: `before`（之前）、`after`（之后）、`into`（到文件夹内）
   - 视觉反馈: 拖动覆盖层 + 放置位置指示线

2. **标签页管理**（EditorContainer）
   - 在编辑器组之间拖动标签页
   - 面板边缘的放置区域用于创建分屏
   - 拖动覆盖层显示文件名徽章

**传感器**:
- `PointerSensor` 配合 `activationConstraint: { distance: 8 }`
- 防止意外拖动（8px 移动阈值）

---

## 状态管理

### EditorContext

**文件**: `src/contexts/EditorContext.tsx`

**模式**: Context API + Reducer

**状态结构**:
```typescript
{
  groups: Record<string, EditorGroup>  // 按 ID 索引的标签页组
  layout: EditorLayout                 // 分屏/组树结构
  lastFocusedGroupId: string           // 活动编辑器组
}
```

**操作类型**:
- `OPEN_FILE` - 在标签页中打开文件（检查重复）
- `UPDATE_TAB_CONTENT` - 更新内容（标记 `isDirty=true`）
- `MARK_TAB_SAVED_TO_DISK` - 确认磁盘写入（`isSavedToDisk=true`）
- `CLOSE_TAB` - 从组中移除标签页
- `SPLIT_GROUP` - 创建水平/垂直分屏
- `MOVE_TAB_BETWEEN_GROUPS` - 在组之间拖放

### 自动保存

**Hook**: `useFileSystemAutoSave`（`src/hooks/useFileSystemAutoSave.ts`）

**机制**:
- 1 秒防抖保存（防止过度写入）
- 通过 `JSON.stringify` 深度比较检测真实更改
- 通过 `getFileSystem()` 策略模式实现跨平台
- 通过上下文操作更新 `isDirty` 和 `isSavedToDisk` 状态

---

## 响应式行为

### 固定尺寸
- **ActivityBar**: `48px` 宽度（不可调整）
- **StatusBar**: `24px` 高度（不可调整）

### 可调整范围
- **PrimarySidebar**: 视口宽度的 `15-40%`
- **BottomPanel**: 编辑器区域高度的 `10-60%`
- **编辑器分屏**: 每个面板最小 `20%`

### 折叠状态
- **侧边栏折叠**: ActivityBar 保持可见，内容区域扩展
- **面板折叠**: StatusBar 保持可见，编辑器区域扩展

---

## 键盘快捷键

| 快捷键 | 操作 |
|--------|------|
| `⌘/Ctrl+B` | 切换主侧边栏 |
| `⌘/Ctrl+J` | 切换底部面板 |
| `⌘/Ctrl+S` | 立即保存当前文件 |
| `⌘/Ctrl+\\` | 向右分屏 |

---

## 文件类型系统

### 支持的类型
- **`text`**: 以字符串形式保存的 plate JSON；解析失败时退化为逐行纯文本。垃圾篓中只读。

### 文件命名
- **显示名称**: 用户可编辑的标签（存储在 `ManoNode.name`）
- **文件名**: 通过 `getNodeFilename()` 函数自动生成
  - 将无效字符（`/\:*?"<>|`）替换为下划线
  - 自动添加扩展名（SlateText 为 `.mano`，Markdown 为 `.md`）

---

## 配置

### 工作区配置

**文件**: `mano.conf.json`（根目录）

**结构**:
```json
{
  "data": ManoNode[],
  "lastUpdated": "ISO 8601 时间戳"
}
```

**特殊节点**:
- **垃圾篓**: `id: "__trash__"`，`readOnly: true`
- **根目录**: 顶层节点，`nodeType: "Directory"`

**自动创建**: 如果缺失，由 `createDefaultManoConfig()` 生成；每次保存会刷新 `lastUpdated`

---

## 跨平台支持

### 文件系统抽象

**策略模式**: `src/services/fileSystem/index.ts`

**策略实现**:
- **Chrome/浏览器**: 使用 `window.showDirectoryPicker()`（File System Access API）
- **Tauri**: 使用 `@tauri-apps/plugin-dialog` 和 `@tauri-apps/plugin-fs`
- **Safari**: 明确不支持，抛出错误提示切换到桌面端或 Chrome

**检测**: `isTauri()` 工具函数检查 `window.__TAURI__`

**类型**:
- `IFileHandle` / `IDirectoryHandle` - 跨平台包装器
- 绝不使用原生 `FileSystemFileHandle` / `FileSystemDirectoryHandle`

---

## 样式系统

### 设计系统
- **框架**: Tailwind CSS 4.x（严格要求）
- **组件**: shadcn/ui 库
- **约束**: 不允许原生 CSS 或第三方 CSS

### 主题变量
- `--background` / `--foreground` - 基础颜色
- `--accent` - 高亮颜色（选中项、活动标签）
- `--border` - 分隔线
- `--primary` - StatusBar 背景
- `--muted` - 次要 UI 元素
- `--destructive` - 错误状态

### 常用模式
- **激活状态**: `bg-accent` 背景
- **悬停状态**: `hover:bg-accent hover:text-accent-foreground`
- **禁用状态**: `disabled:opacity-50 disabled:pointer-events-none`
- **过渡效果**: `transition-all`，默认 150ms 时长

---

## 未来增强功能（已禁用功能）

以下功能当前已禁用，显示"即将推出..."提示：

### ActivityBar 图标
- 搜索功能
- 源代码管理集成
- 运行和调试工具
- 扩展市场

### 面板功能
- 底部面板切换（终端、问题、输出、调试控制台）
- 设置面板

这些控件以禁用状态渲染（`disabled` 属性），透明度降低，等待未来版本的完整实现。
