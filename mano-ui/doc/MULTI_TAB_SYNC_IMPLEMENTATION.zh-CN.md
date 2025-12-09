# 多标签内容同步实现方案

## 问题描述

当同一文件在多个编辑器标签页中打开时，在一个标签页中的编辑应立即反映到所有其他查看该文件的标签页中。

## 解决方案架构

### 1. 单一数据源 - EditorModel

**模式**: 每个唯一文件对应一个 `EditorModel`，多个 `EditorTab` 实例可以引用同一个 model。

```typescript
// 状态结构
{
  models: {
    'model-1': {
      id: 'model-1',
      fileId: 'unique-file-id',
      content: [...],  // Slate.js JSON
      version: 5,      // 每次编辑时递增
      isDirty: true,
      // ... 其他字段
    }
  },
  groups: {
    'group-1': {
      tabs: [
        { id: 'tab-1', modelId: 'model-1' },  // 引用 model-1
        { id: 'tab-3', modelId: 'model-1' },  // 同一个 model！
      ]
    }
  }
}
```

### 2. 内容更新流程

**用户在标签页 A 中编辑**:
```
PlateEditor onChange
  ↓
dispatch({ type: 'UPDATE_MODEL_CONTENT', modelId, content })
  ↓
Reducer 更新 model.content 并递增 model.version
  ↓
标签页 A 和标签页 B 都接收到新的 value prop
  ↓
标签页 B 的 PlateEditor 检测到外部变化 → 同步编辑器状态
```

### 3. PlateEditor 中的外部变化检测

**核心实现** (`src/components/plate/PlateEditor.tsx`):

```typescript
export function PlateEditor({ value, onChange, readOnly = false }: PlateEditorProps) {
  const editor = usePlateEditor({ value: value as never, readOnly })
  
  const isInternalChange = useRef(false)
  const prevValue = useRef(value)

  useEffect(() => {
    // 如果 value 发生外部变化（不是来自我们自己的 onChange）
    if (!isInternalChange.current && prevValue.current !== value) {
      // 直接更新编辑器状态
      editor.children = value as never
      editor.onChange()
    }
    prevValue.current = value
    isInternalChange.current = false
  }, [value, editor])

  return (
    <Plate 
      editor={editor}
      value={value as never}
      onChange={({ value: newValue }) => {
        if (!readOnly) {
          isInternalChange.current = true  // 标记为内部变化
          onChange(newValue)
        }
      }}
    >
      <PlateContent />
    </Plate>
  )
}
```

**工作原理**:
- `isInternalChange` ref 跟踪当前渲染是否来自我们自己的编辑
- 当 `onChange` 触发时 → 设置 `isInternalChange.current = true`
- 当 `value` prop 变化时 → `useEffect` 检查:
  - 如果 `isInternalChange.current === false` → 外部变化 → 同步编辑器
  - 如果 `isInternalChange.current === true` → 自己的变化 → 忽略
- 每次渲染后重置 `isInternalChange` 为 `false`

### 4. 组件重新挂载策略

**关键属性** 在 `EditorGroupWrapper.tsx` 中:

```typescript
<AutoSavePlateEditor
  key={model.id}  // 仅在切换文件时重新挂载
  value={model.content}
  onChange={...}
/>
```

**为什么使用 `key={model.id}` 而不是 `key={model.version}`**:
- `key={model.id}`: 仅在切换到不同文件时重新挂载 → **在编辑期间保留光标位置**
- `key={model.version}`: 每次编辑时都会重新挂载 → **光标重置，破坏用户体验**

切换文件时，React 会卸载旧编辑器并用全新状态创建新编辑器。

## 与行业最佳实践对比

### VS Code / Monaco Editor 模式

**Monaco 的方法**:
```typescript
// Monaco 使用基于模型的架构
const model = monaco.editor.createModel(content, 'javascript')
editor1.setModel(model)  // 编辑器 1 使用模型
editor2.setModel(model)  // 编辑器 2 使用相同模型

// editor1 中的编辑通过共享模型自动反映到 editor2
```

**我们的方法** (Plate.js 适配):
- Monaco 通过 `setModel()` 内置多视图支持
- Plate.js 没有此 API → 我们通过以下方式实现:
  1. React Context 用于共享状态（模型）
  2. `useEffect` 检测外部 value 变化
  3. 直接操作 `editor.children` 来同步状态

### React 最佳实践对齐

✅ **单一数据源**: 每个文件一个 EditorModel
✅ **单向数据流**: State → View（无双向绑定）
✅ **受控组件**: `value` 和 `onChange` props
✅ **非渲染状态使用 Ref**: `isInternalChange` ref 不会触发重新渲染
✅ **Key Prop 用于标识**: `key={model.id}` 实现正确的协调
✅ **无手动记忆化**: React 19 Compiler 处理优化

### 与传统方法的区别

**传统方法（对 Plate.js 不起作用）**:
```typescript
// ❌ Value prop 变化不会自动更新 Plate 编辑器
<PlateEditor value={model.content} />  // 编辑器忽略 value 变化
```

**我们的解决方案**:
```typescript
// ✅ 检测到外部变化时手动同步
useEffect(() => {
  if (external_change) {
    editor.children = value  // 强制更新
    editor.onChange()
  }
}, [value])
```

**为什么必要**: Plate.js（基于 Slate.js）维护内部编辑器状态，初始化后不会自动与 prop 变化同步。这是为了性能而设计的（避免输入时不必要的重新渲染）。

## 权衡和限制

### ✅ 优势
1. **最小化重新渲染**: 仅在真正必要时同步
2. **光标保持**: 在一个标签页中输入不会重置其他标签页的光标
3. **内存高效**: 多个标签页共享一个模型实例
4. **自动保存集成**: 防抖保存无缝工作

### ⚠️ 限制
1. **Slate.js 特定**: 解决方案针对 Plate/Slate 架构定制
2. **无操作转换**: 两个标签页同时编辑 → 最后写入获胜（对于单用户桌面应用可接受）
3. **光标位置不同步**: 每个标签页维护独立的光标位置（预期行为）

## 考虑过的替代方案

### 1. 基于 Key 的强制重新挂载
```typescript
<PlateEditor key={`${model.id}-${model.version}`} />
```
**拒绝**: 每次编辑都重新挂载 → 光标重置 → 糟糕的用户体验

### 2. 仅受控组件
```typescript
<PlateEditor value={model.content} onChange={...} />
```
**拒绝**: Plate.js 在挂载后不遵守 `value` prop 变化

### 3. 事件总线模式
```typescript
eventBus.on('content-changed', (modelId) => { ... })
```
**拒绝**: 增加复杂性，违反 React 模式，难以调试

## 测试清单

✅ 在两个标签页中打开同一文件
✅ 在标签页 A 中编辑 → 在标签页 B 中立即可见
✅ 在标签页 B 中编辑 → 在标签页 A 中立即可见
✅ 编辑期间光标位置保持不变
✅ 自动保存正常工作
✅ 切换标签页显示正确内容
✅ 输入时没有不必要的重新渲染

## 相关文件

- `src/types/editor.ts` - EditorModel 和 EditorTab 类型
- `src/contexts/EditorContext.tsx` - 状态管理（UPDATE_MODEL_CONTENT 操作）
- `src/components/plate/PlateEditor.tsx` - 外部变化检测逻辑
- `src/components/plate/AutoSavePlateEditor.tsx` - 自动保存包装器
- `src/components/ide/EditorGroupWrapper.tsx` - 使用 key={model.id} 的标签页渲染
