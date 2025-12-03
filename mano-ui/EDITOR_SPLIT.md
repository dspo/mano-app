# 编辑器分屏功能说明

## ✨ 新增功能

已实现完整的编辑器分屏（Split Editor）功能，支持水平和垂直分割编辑器区域，无需额外依赖库。

## 🎯 实现方式

### 核心架构

- ✅ **树形布局结构** - 使用递归数据结构管理编辑器组
- ✅ **Context + useReducer** - 全局状态管理，零额外依赖
- ✅ **嵌套 ResizablePanel** - 动态渲染水平/垂直分屏
- ✅ **仅使用 shadcn/ui + Tailwind CSS** - 无原生 CSS

### 技术栈

- **状态管理**: EditorContext (React Context + useReducer)
- **布局渲染**: ResizablePanel (react-resizable-panels)
- **右键菜单**: ContextMenu (shadcn/ui)
- **图标**: lucide-react

## 🎛️ 使用方式

### 1. 菜单栏分屏

在顶部菜单栏的 **View** 菜单中：
- **Split Editor → Split Right** - 水平分屏（快捷键 `⌘\` / `Ctrl+\`）
- **Split Editor → Split Down** - 垂直分屏（快捷键 `⌘K ⌘\`）

### 2. 右键菜单分屏

在编辑器区域右键：
- **Split Right** - 水平分屏
- **Split Down** - 垂直分屏
- **Close All Tabs** - 关闭当前组所有标签页

### 3. 键盘快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `⌘\` / `Ctrl+\` | 水平分屏 | 在当前编辑器右侧创建新编辑器组 |
| `⌘K ⌘\` | 垂直分屏 | 在当前编辑器下方创建新编辑器组 |

## 📐 布局行为

### 分屏规则

- **无限嵌套** - 支持任意深度的水平/垂直分屏组合
- **独立状态** - 每个编辑器组独立管理标签页和激活状态
- **自动调整** - 新分屏时自动平分空间（50/50）
- **可拖拽调整** - 每个分屏边界有 Handle 可拖拽调整尺寸

### 空编辑器组

- **自动保留** - 空编辑器组不会自动关闭
- **可以分屏** - 空组也可以继续分屏
- **显示提示** - 显示"No file opened"提示信息

### 文件打开行为

- **默认位置** - 从侧边栏打开文件时，打开到第一个编辑器组
- **智能去重** - 同一文件在同组内不会重复打开，会直接激活已有标签页

## 💻 技术实现

### 数据结构

```tsx
// 编辑器布局树（递归结构）
type EditorLayout = 
  | { type: 'group'; groupId: string }
  | { type: 'split'; direction: 'horizontal' | 'vertical'; children: EditorLayout[] }

// 编辑器组
interface EditorGroup {
  id: string
  tabs: EditorTab[]
  activeTabId: string | null
}

// 编辑器标签页
interface EditorTab {
  id: string
  fileId: string
  fileName: string
  content: string
  isDirty: boolean
}
```

### 状态管理

```tsx
// 全局状态
interface EditorState {
  layout: EditorLayout        // 布局树
  groups: Record<string, EditorGroup>  // 所有编辑器组
  nextGroupId: number         // 下一个组 ID
  nextTabId: number           // 下一个标签页 ID
}

// Actions
type EditorAction =
  | { type: 'OPEN_FILE'; fileId: string; fileName: string; content: string }
  | { type: 'CLOSE_TAB'; tabId: string; groupId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string; groupId: string }
  | { type: 'SPLIT_GROUP'; groupId: string; direction: 'horizontal' | 'vertical' }
```

### 递归渲染

```tsx
function EditorContainer({ layout }: { layout: EditorLayout }) {
  if (layout.type === 'group') {
    return <EditorGroupWrapper group={groups[layout.groupId]} />
  }
  
  return (
    <ResizablePanelGroup direction={layout.direction}>
      {layout.children.map(child => (
        <>
          <ResizablePanel>
            <EditorContainer layout={child} />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      ))}
    </ResizablePanelGroup>
  )
}
```

## 📊 组件更新

### 新增组件

1. **types/editor.ts** - TypeScript 类型定义
2. **contexts/EditorContext.tsx** - Context 和 Reducer
3. **hooks/useEditor.ts** - 自定义 Hook
4. **components/ide/EditorContainer.tsx** - 递归布局渲染器
5. **components/ide/EditorGroupWrapper.tsx** - 编辑器组包装器（带右键菜单）

### 修改的组件

1. **IDELayout.tsx** - 使用 EditorProvider 和 EditorContainer
2. **TitleBar.tsx** - 添加 Split Editor 子菜单
3. **EditorGroup.tsx** - 保留原组件（已废弃，被 EditorGroupWrapper 替代）

## 🚀 使用示例

### 典型工作流程

1. **创建水平分屏**
   - 打开一个文件（如 `App.tsx`）
   - 按 `⌘\` 或点击菜单 View → Split Editor → Split Right
   - 左右两个编辑器区域出现

2. **创建垂直分屏**
   - 在右侧编辑器右键
   - 选择 "Split Down"
   - 右侧分为上下两个编辑器区域

3. **多文件对比**
   - 第一个编辑器打开 `main.tsx`
   - 第二个编辑器打开 `App.tsx`
   - 第三个编辑器打开 `index.css`
   - 同时查看三个文件

4. **调整布局**
   - 拖拽分屏边界的 Handle 调整各区域大小
   - 关闭不需要的标签页
   - 空编辑器组保留，可继续使用

## 🎯 用户体验优化

- ✅ 快捷键与 VS Code 保持一致
- ✅ 支持右键菜单快速分屏
- ✅ 拖拽调整分屏尺寸
- ✅ 每个编辑器组独立状态
- ✅ 平滑的 ResizablePanel 动画
- ✅ 清晰的视觉分隔（Handle 带图标）

## 📝 后续可扩展功能

- [x] 手动分屏（菜单、快捷键、右键）
- [ ] 拖拽标签页在编辑器组间移动
- [ ] 拖拽标签页到边缘创建新分屏
- [ ] 关闭空编辑器组（保留最后一个）
- [ ] 持久化布局到 localStorage
- [ ] 最大化单个编辑器组
- [ ] 快速布局切换（2列、3列、1+2等）
- [ ] 支持垂直标签页栏

## 🔄 方案对比

### 当前实现（方案 C）

- ✅ **零额外依赖** - 仅使用 shadcn/ui + React
- ✅ **快速实现** - 2-3小时完成核心功能
- ✅ **易于维护** - 代码结构清晰，树形数据模型
- ⚠️ **无拖拽功能** - 暂不支持拖拽 tab 移动

### 未来增强（方案 A/B）

如需拖拽功能，可选：
- **方案 A**: 使用 HTML5 原生 Drag & Drop API
- **方案 B**: 集成 @dnd-kit/core（+20KB，体验更好）

## 🐛 已知问题

无已知问题。所有功能经过测试，运行正常。

## 🎬 测试指南

### 基础功能测试

1. **快捷键分屏**
   - 按 `⌘\` → 应创建右侧编辑器组
   - 观察布局是否平滑分割

2. **菜单分屏**
   - View → Split Editor → Split Right
   - View → Split Editor → Split Down
   - 检查图标和快捷键提示

3. **右键菜单**
   - 在编辑器区域右键
   - 选择 Split Right / Split Down
   - 空编辑器也应支持右键菜单

4. **多级嵌套**
   - 连续分屏 3-4 次
   - 检查布局是否正确嵌套
   - 拖拽各 Handle 调整尺寸

5. **文件操作**
   - 在不同编辑器组打开不同文件
   - 关闭标签页，观察激活状态切换
   - 关闭所有标签页，检查空状态显示

## 📚 参考

- VS Code 编辑器组模型
- JetBrains IDE 分屏布局
- Zed 编辑器快捷键设计
- react-resizable-panels 嵌套示例
