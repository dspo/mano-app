# 编辑器架构快速参考

## 核心概念

### EditorModel
**表示**：文件的实际内容和状态（单一真实来源）

```typescript
interface EditorModel {
  id: string              // "model-1"
  fileId: string          // 对应 ManoNode 的 ID
  fileName: string        // 显示名称
  fileType: 'text' | 'slate'
  content: unknown        // 文件内容
  isDirty: boolean        // 是否有未保存的修改
  isSavedToDisk: boolean  // 是否已保存到磁盘
  version: number         // 内容版本号,每次修改递增
  fileHandle?: FileSystemFileHandle | IFileHandle  // 文件句柄
  readOnly?: boolean      // 是否只读(如垃圾篓中的文件)
}
```

### EditorTab
**表示**：对 EditorModel 的轻量级引用（可以有多个）

```typescript
interface EditorTab {
  id: string              // "tab-1"
  modelId: string         // 指向 EditorModel.id
}
```

### EditorGroup
**表示**：一个编辑器窗口，包含多个标签页

```typescript
interface EditorGroup {
  id: string
  tabs: EditorTab[]
  activeTabId: string | null  // 当前激活的标签页
}
```

## 常见操作

### 打开文件
```typescript
dispatch({
  type: 'OPEN_FILE',
  fileId: 'node-123',      // ManoNode 的 ID
  fileName: 'my-file.mano',
  fileType: 'slate',
  content: [...],          // 文件内容
  groupId: 'group-1',      // 可选，默认为当前组
  fileHandle: handle,      // 可选，文件句柄
  readOnly: false,         // 可选，是否只读
})
```

**发生的事**：
1. 检查是否已存在 `fileId: 'node-123'` 的 model
2. 如果存在，创建新 tab 指向该 model
3. 如果不存在，创建新 model + tab

**结果**：相同文件的多个标签页会自动同步内容

### 更新文件内容（编辑）
```typescript
const { dispatch } = useEditor()

dispatch({
  type: 'UPDATE_MODEL_CONTENT',
  modelId: 'model-1',
  content: newSlateValue,  // 编辑后的内容
})
```

**发生的事**：
1. 更新 model.content
2. 设置 model.isDirty = true
3. 所有引用此 model 的 tab 都立即看到新内容

### 关闭标签页
```typescript
dispatch({
  type: 'CLOSE_TAB',
  tabId: 'tab-1',
  groupId: 'group-1',
})
```

**发生的事**：
1. 移除标签页
2. Model 保留（供其他 tab 使用）
3. 如果是最后一个标签页，清空内容

### 删除文件（来自侧边栏）
```typescript
dispatch({
  type: 'CLOSE_FILE_IN_ALL_GROUPS',
  fileId: 'node-123',  // ManoNode 的 ID
})
```

**发生的事**：
1. 删除所有 model.fileId === 'node-123' 的 models
2. 关闭所有相关的 tabs
3. 从磁盘删除文件（调用方负责）

### 拖拽标签页到另一个组
```typescript
dispatch({
  type: 'MOVE_TAB_BETWEEN_GROUPS',
  tabId: 'tab-1',
  sourceGroupId: 'group-1',
  targetGroupId: 'group-2',
})
```

**特殊处理**：如果 group-2 已有相同文件的标签页，显示提示并激活现有标签页

### 拖拽标签页创建分割
```typescript
dispatch({
  type: 'MOVE_TAB_TO_EDGE',
  tabId: 'tab-1',
  sourceGroupId: 'group-1',
  edge: 'right',  // 或 'left'
})
```

**发生的事**：
1. 创建新的编辑器组
2. 移动 tab 到新组

## 在组件中使用

### 读取 Model 内容
```typescript
const { state } = useEditor()

function EditorContainer() {
  const tab = activeTab  // EditorTab
  const model = state.models[tab.modelId]  // EditorModel
  
  return (
    <PlateEditor
      value={model.content}  // 直接使用 model.content
      onChange={(newValue) => dispatch({
        type: 'UPDATE_MODEL_CONTENT',
        modelId: tab.modelId,
        content: newValue,
      })}
    />
  )
}
```

### 侦听 Model 变化
```typescript
// Model 变化时，组件自动重新渲染
// （因为 state 变化，自动通过 useEditor() 获取新值）

useEffect(() => {
  const model = state.models[tab.modelId]
  if (model?.isDirty) {
    // Model 被标记为脏（有未保存的修改）
  }
}, [state.models, tab.modelId])
```

### 处理拖拽（dnd-kit）
```typescript
// 在 EditorGroup 中
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
)

function handleDragStart(active: Active) {
  const node = active.data.current?.node as ManoNode
  setDragData({
    type: 'tab',
    model: state.models[...],  // 完整的 model
    tab: activeTab,             // 引用的 tab
    sourceGroupId: groupId,
  })
}

function handleDragEnd(event: DragEndEvent) {
  const dragData = event.active.data.current
  const dropData = event.over?.data.current
  
  if (dragData?.type === 'tab' && dropData?.type === 'group') {
    dispatch({
      type: 'MOVE_TAB_BETWEEN_GROUPS',
      tabId: dragData.tab.id,
      sourceGroupId: dragData.sourceGroupId,
      targetGroupId: dropData.groupId,
    })
  }
}
```

## 自动保存

自动保存通过 `useFileSystemAutoSave` 实现：

```typescript
// 在 AutoSavePlateEditor 中
const model = state.models[tab.modelId]

useFileSystemAutoSave(
  model.fileHandle,
  model.content,
  1000,  // 防抖延迟 1 秒
  () => dispatch({
    type: 'MARK_MODEL_SAVED_TO_DISK',
    modelId: tab.modelId,
  }),
  (error) => console.error('Save failed:', error)
)
```

**工作流**：
1. 用户编辑 → dispatch `UPDATE_MODEL_CONTENT`
2. 1 秒内无新编辑 → 调用自动保存
3. 保存成功 → dispatch `MARK_MODEL_SAVED_TO_DISK`
4. `isDirty` 和 `isSavedToDisk` 会自动更新 UI

## 关键差异（相比旧架构）

| 方面 | 旧 | 新 |
|------|----|----|
| **内容存储** | `tab.content` | `models[tab.modelId].content` |
| **多个标签页** | 内容不同步 ❌ | 自动同步 ✅ |
| **编辑 action** | `UPDATE_TAB_CONTENT` | `UPDATE_MODEL_CONTENT` |
| **关闭文件** | 手动关闭每个 tab | `CLOSE_FILE_IN_ALL_GROUPS` |
| **拖拽冲突** | 无处理 | 显示提示，激活现有 tab |

## 常见错误

### ❌ 错误：读取 `tab.content`
```typescript
// 这会出错！EditorTab 不再有 content
const content = tab.content  // undefined
```

### ✅ 正确：使用 `models[tab.modelId]`
```typescript
const model = state.models[tab.modelId]
const content = model.content  // ✓
```

### ❌ 错误：直接修改 state
```typescript
// 不要这样做！
state.models[modelId].content = newValue  // ❌
```

### ✅ 正确：使用 dispatch
```typescript
// 应该这样做
dispatch({
  type: 'UPDATE_MODEL_CONTENT',
  modelId,
  content: newValue,
})  // ✓
```

### ❌ 错误：旧的 action 名称
```typescript
dispatch({ type: 'UPDATE_TAB_CONTENT', ... })  // ❌ 不存在
```

### ✅ 正确：新的 action 名称
```typescript
dispatch({ type: 'UPDATE_MODEL_CONTENT', ... })  // ✓
```

## 状态结构示例

```typescript
{
  models: {
    'model-1': {
      id: 'model-1',
      fileId: 'node-abc',
      fileName: '第一章.mano',
      fileType: 'slate',
      content: [{ type: 'p', children: [...] }],
      isDirty: true,
      isSavedToDisk: false,
    },
    'model-2': {
      id: 'model-2',
      fileId: 'node-def',
      fileName: 'README.md',
      fileType: 'text',
      content: '# 项目说明',
      isDirty: false,
      isSavedToDisk: true,
    },
  },
  layout: {
    type: 'split',
    direction: 'horizontal',
    children: [
      { type: 'group', groupId: 'group-1' },
      { type: 'group', groupId: 'group-2' },
    ],
  },
  groups: {
    'group-1': {
      id: 'group-1',
      tabs: [
        { id: 'tab-1', modelId: 'model-1' },  // 第一章
        { id: 'tab-2', modelId: 'model-2' },  // README
      ],
      activeTabId: 'tab-1',
    },
    'group-2': {
      id: 'group-2',
      tabs: [
        { id: 'tab-3', modelId: 'model-1' },  // 同一个文件！
      ],
      activeTabId: 'tab-3',
    },
  },
  lastFocusedGroupId: 'group-1',
  nextGroupId: 3,
  nextTabId: 4,
  nextModelId: 3,
}
```

注意：`tab-1` 和 `tab-3` 都指向 `model-1`，所以它们的内容总是同步的。

## 下一步

- 阅读完整的 `REFACTOR_SUMMARY.md`
- 查看 `EditorContext.tsx` 了解所有 action 的实现
- 运行测试清单验证功能正常
