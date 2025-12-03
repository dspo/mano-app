# 边栏切换功能说明

## ✨ 新增功能

已为 IDE 布局添加了完整的边栏显示/隐藏控制功能，采用 shadcn/ui 最佳实践。

## 🎯 实现方式

### 核心特性

- ✅ 使用 `collapsible` 属性而非条件渲染
- ✅ 使用 `ImperativePanelHandle` ref 控制面板
- ✅ 使用 `autoSaveId` 持久化用户布局到 localStorage
- ✅ 使用 `onCollapse` / `onExpand` 回调同步状态
- ✅ 面板始终存在，通过 `collapse()` / `expand()` 切换

### 技术优势

相比条件渲染方式：
- **更流畅**：面板折叠/展开有平滑动画
- **更高效**：不需要重新计算布局和挂载组件
- **持久化**：用户调整的尺寸自动保存
- **符合规范**：遵循 shadcn/ui 官方文档推荐

## 🎛️ 控制方式

### 1. 键盘快捷键（推荐）

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `⌘B` / `Ctrl+B` | 切换左侧边栏 | 显示/隐藏文件浏览器等主侧边栏 |
| `⌘J` / `Ctrl+J` | 切换底部面板 | 显示/隐藏终端、问题列表等面板 |

**注意**：Mac 使用 `⌘` (Command)，Windows/Linux 使用 `Ctrl`

### 2. 菜单栏

在顶部菜单栏的 **View** 菜单中：
- **Sidebar** - 切换左侧边栏（带快捷键提示和选中状态 ✓）
- **Panel** - 切换底部面板（带快捷键提示和选中状态 ✓）

### 3. 活动栏按钮

左侧活动栏底部新增两个切换按钮：

1. **侧边栏切换按钮**（倒数第三个）
   - 图标：`⫷` (PanelLeftClose) / `⫸` (PanelLeft)
   - 工具提示显示当前状态和快捷键
   - 点击切换左侧边栏显示/隐藏

2. **底部面板切换按钮**（倒数第二个）
   - 图标：`⊟` (PanelBottomClose) / `⊞` (PanelBottom)
   - 工具提示显示当前状态和快捷键
   - 点击切换底部面板显示/隐藏

### 4. 面板关闭按钮

底部面板右上角新增 **×** 关闭按钮：
- 点击快速隐藏底部面板
- 可通过快捷键 `⌘J` 或其他方式重新打开

## 📐 布局行为

### 左侧边栏折叠时
- 活动栏保持显示
- 编辑器区域平滑扩展
- ResizablePanel 自动调整尺寸（有动画）
- 面板仍在 DOM 中，只是宽度为 0

### 底部面板折叠时
- 编辑器高度平滑扩展
- 面板折叠但不从 DOM 移除
- 保持 ResizableHandle 可见
- 可拖拽 Handle 重新展开

### 持久化行为
- 用户调整的面板尺寸自动保存到 localStorage
- 使用 `ide-layout-horizontal` 和 `ide-layout-vertical` 作为存储键
- 下次打开自动恢复用户的布局偏好
- 折叠状态也会被记住

## 🎨 视觉反馈

### 图标状态
- **显示状态**：使用 `PanelLeft` / `PanelBottom` 图标
- **隐藏状态**：使用 `PanelLeftClose` / `PanelBottomClose` 图标

### 菜单选中标记
- 显示中的边栏在菜单中显示 ✓ 勾选标记
- 隐藏的边栏不显示勾选标记

### 工具提示
- 鼠标悬停显示详细提示
- 包含当前状态和快捷键信息
- 例如："Hide Sidebar ⌘B" 或 "Show Sidebar ⌘B"

## 💻 技术实现

### 面板引用（Refs）
```tsx
const sidebarRef = useRef<ImperativePanelHandle>(null)
const panelRef = useRef<ImperativePanelHandle>(null)
```

### 状态管理
```tsx
// 跟踪折叠状态用于 UI 更新（图标、菜单等）
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
```

### 可折叠面板配置
```tsx
<ResizablePanel 
  ref={sidebarRef}
  defaultSize={20} 
  minSize={15} 
  maxSize={40}
  collapsible={true}  // 允许折叠
  onCollapse={() => setIsSidebarCollapsed(true)}
  onExpand={() => setIsSidebarCollapsed(false)}
>
  <PrimarySidebar />
</ResizablePanel>
```

### 持久化配置
```tsx
<ResizablePanelGroup 
  direction="horizontal"
  autoSaveId="ide-layout-horizontal"  // 自动保存到 localStorage
>
```

### 快捷键控制
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      const panel = sidebarRef.current
      if (panel) {
        if (panel.isCollapsed()) {
          panel.expand()
        } else {
          panel.collapse()
        }
      }
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### 切换函数
```tsx
const toggleSidebar = () => {
  const panel = sidebarRef.current
  if (panel) {
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }
}
```

## 📊 组件更新

### 修改的组件

1. **resizable.tsx（新增）**
   - 导出 `ImperativePanelHandle` 类型
   - 提供 ref 访问面板的 `collapse()`, `expand()`, `isCollapsed()` 方法

2. **TitleBar.tsx**
   - `showSidebar`, `showPanel` 现在反映折叠状态
   - `onToggleSidebar`, `onTogglePanel` 调用 ref 的 collapse/expand

3. **ActivityBar.tsx**
   - 图标根据 `showSidebar`, `showPanel` 动态更新
   - 按钮点击调用 toggle 函数

4. **BottomPanel.tsx**
   - 移除 `if (!isVisible) return null` 条件
   - 面板始终渲染，由 ResizablePanel 控制显示

5. **IDELayout.tsx（核心重构）**
   - 使用 `useRef<ImperativePanelHandle>` 创建面板引用
   - 添加 `isSidebarCollapsed`, `isPanelCollapsed` 状态
   - ResizablePanel 添加 `collapsible={true}` 和回调
   - ResizablePanelGroup 添加 `autoSaveId` 持久化
   - 快捷键调用 `panel.collapse()` / `panel.expand()`
   - 移除条件渲染，面板始终存在

## 🔄 状态同步

所有控制方式（快捷键、菜单、按钮）共享同一状态：
- 任意方式切换都会更新全局状态
- 所有 UI 元素实时反映当前状态
- 图标、勾选标记、工具提示自动更新

## 🚀 使用示例

### 典型工作流程

1. **专注编辑模式**
   - 按 `⌘B` 隐藏侧边栏
   - 按 `⌘J` 隐藏底部面板
   - 编辑器占据最大空间

2. **文件浏览模式**
   - 按 `⌘B` 显示侧边栏
   - 点击文件树导航项目

3. **调试模式**
   - 按 `⌘J` 显示底部面板
   - 切换到 Terminal 或 Debug Console 标签

4. **快速切换**
   - 使用快捷键在不同模式间快速切换
   - 无需鼠标操作，提升效率

## 🎯 用户体验优化

- ✅ 快捷键与 VS Code 保持一致
- ✅ 多种控制方式满足不同习惯
- ✅ 视觉反馈清晰直观
- ✅ **平滑的折叠/展开动画**
- ✅ 工具提示提供帮助信息
- ✅ **用户布局自动保存到 localStorage**
- ✅ **拖拽 Handle 也可以展开折叠的面板**
- ✅ **面板尺寸调整自动持久化**

## 🆕 新特性对比

| 特性 | 旧实现（条件渲染） | 新实现（collapsible） |
|------|------------------|---------------------|
| 动画效果 | ❌ 无动画，突然出现/消失 | ✅ 平滑折叠/展开动画 |
| 持久化 | ❌ 不保存尺寸 | ✅ 自动保存到 localStorage |
| 性能 | ❌ 重新挂载组件 | ✅ 组件保持挂载，只改变尺寸 |
| 拖拽恢复 | ❌ 不支持 | ✅ 可拖拽 Handle 展开 |
| 状态管理 | 简单但不完整 | 完整且符合最佳实践 |
| 代码复杂度 | 较低 | 略高但更专业 |

## 📝 后续可扩展功能

- [x] 记住用户的边栏状态（已通过 autoSaveId 实现）
- [x] 平滑动画过渡效果（已通过 collapsible 实现）
- [ ] 添加右侧边栏（Secondary Sidebar）
- [ ] 支持自定义快捷键
- [ ] 支持拖拽边栏位置
- [ ] 全屏模式（隐藏所有边栏）
- [ ] Zen 模式（仅显示编辑器）
- [ ] 布局预设（快速切换不同布局配置）

## 🎓 学习要点

### ImperativePanelHandle API

```tsx
interface ImperativePanelHandle {
  collapse: () => void      // 折叠面板
  expand: () => void        // 展开面板
  isCollapsed: () => boolean // 检查是否折叠
  getSize: () => number     // 获取当前尺寸
  resize: (size: number) => void // 设置尺寸
}
```

### ResizablePanel Props

```tsx
<ResizablePanel
  ref={panelRef}              // ref 用于命令式控制
  defaultSize={20}            // 默认尺寸（百分比）
  minSize={15}                // 最小尺寸
  maxSize={40}                // 最大尺寸
  collapsible={true}          // 允许折叠
  onCollapse={() => {...}}    // 折叠时回调
  onExpand={() => {...}}      // 展开时回调
/>
```

### ResizablePanelGroup Props

```tsx
<ResizablePanelGroup
  direction="horizontal"      // 或 "vertical"
  autoSaveId="unique-id"      // localStorage 存储键
/>
```

## 🐛 已知问题

无已知问题。所有功能经过测试，运行正常。

## 🎬 测试指南

### 基础功能测试

1. **快捷键测试**
   - 按 `⌘B` / `Ctrl+B` → 侧边栏应平滑折叠/展开
   - 按 `⌘J` / `Ctrl+J` → 底部面板应平滑折叠/展开
   - 观察动画效果是否流畅

2. **拖拽测试**
   - 拖拽侧边栏右侧 Handle 调整宽度
   - 将侧边栏拖到最小 → 应自动折叠
   - 拖拽折叠的 Handle 向右 → 应重新展开
   - 底部面板同理

3. **持久化测试**
   - 调整侧边栏和底部面板尺寸
   - 刷新页面 → 尺寸应保持不变
   - 打开浏览器开发工具 → localStorage 中应有 `ide-layout-horizontal` 和 `ide-layout-vertical` 键

4. **按钮测试**
   - 点击活动栏底部的折叠按钮
   - 点击菜单栏 View → Sidebar/Panel
   - 点击底部面板右上角 × 按钮
   - 所有方式应同步状态

5. **状态同步测试**
   - 用任意方式折叠侧边栏
   - 检查图标、菜单勾选、工具提示是否正确更新
   - 所有 UI 元素应实时反映状态

### 清除持久化数据

如需测试默认布局，清除 localStorage：
```javascript
localStorage.removeItem('ide-layout-horizontal')
localStorage.removeItem('ide-layout-vertical')
```

## 📚 参考

- VS Code 快捷键设计
- JetBrains IDE 布局模式
- Zed 编辑器 UI/UX
