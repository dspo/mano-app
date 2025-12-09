# 编辑器架构 - 5 分钟快速入门

## ⚡ 超快速概览

### 之前的问题
```typescript
❌ 同一文件在两个标签页中打开
  → 编辑标签页 A
  → 标签页 B 的内容没有更新
  → 每个标签页都有一份独立的副本
```

### 现在的解决方案
```typescript
✅ 同一文件在两个标签页中打开
  → 编辑标签页 A
  → 标签页 B 自动同步！
  → 文件内容只存储一份（Model）
```

---

## 🎯 3 个核心概念

### 1️⃣ EditorModel（内容）
```typescript
// 文件的真实内容和状态，只存一份
{
  id: 'model-1',
  fileId: 'node-abc',
  content: [...],      // 实际内容
  isDirty: true,       // 有未保存的修改？
  isSavedToDisk: false,// 已保存到磁盘？
  version: 5,          // 内容版本号
  fileHandle: handle,  // 文件句柄(可选)
  readOnly: false      // 是否只读(可选)
}
```
**记住**：这是"唯一的真实来源"

### 2️⃣ EditorTab（标签页）
```typescript
// 对 Model 的引用，很轻量
{
  id: 'tab-1',
  modelId: 'model-1'   // 指向 Model
}
```
**记住**：Tab 只是个指针，不是拷贝

### 3️⃣ EditorGroup（编辑器窗口）
```typescript
// 一个编辑器窗口，包含多个标签页
{
  id: 'group-1',
  tabs: [tab-1, tab-2],
  activeTabId: 'tab-1'
}
```
**记住**：一个 Group 可以显示多个 Tab

---

## 💡 4 个基本操作

### 打开文件
```typescript
dispatch({
  type: 'OPEN_FILE',
  fileId: 'node-123',
  fileName: 'article.mano',
  fileType: 'slate',
  content: [...]
})
```
✅ 自动处理：如果文件已打开，直接创建新标签页指向现有 Model

### 编辑内容
```typescript
dispatch({
  type: 'UPDATE_MODEL_CONTENT',
  modelId: 'model-1',
  content: newValue  // 编辑后的内容
})
```
✅ 自动处理：所有引用此 Model 的标签页都立即更新

### 关闭标签页
```typescript
dispatch({
  type: 'CLOSE_TAB',
  tabId: 'tab-1',
  groupId: 'group-1'
})
```
✅ 自动处理：Model 保留，供其他标签页使用

### 删除文件
```typescript
dispatch({
  type: 'CLOSE_FILE_IN_ALL_GROUPS',
  fileId: 'node-123'  // 从所有地方删除
})
```
✅ 自动处理：关闭所有相关标签页并清理 Model

---

## 🔴 5 个常见错误和修正

### ❌ 错误 1: 读取 `tab.content`
```typescript
// ❌ 错误（不存在）
const content = tab.content

// ✅ 正确
const model = state.models[tab.modelId]
const content = model.content
```

### ❌ 错误 2: 调用旧的 action 名称
```typescript
// ❌ 错误（已废弃）
dispatch({ type: 'UPDATE_TAB_CONTENT', ... })

// ✅ 正确
dispatch({ type: 'UPDATE_MODEL_CONTENT', ... })
```

### ❌ 错误 3: 直接修改 state
```typescript
// ❌ 错误（违反不可变性）
state.models[modelId].content = newValue

// ✅ 正确
dispatch({ type: 'UPDATE_MODEL_CONTENT', modelId, content: newValue })
```

### ❌ 错误 4: 忘记 `modelId`
```typescript
// ❌ 错误（不知道要更新哪个 Model）
dispatch({ type: 'UPDATE_MODEL_CONTENT', content: newValue })

// ✅ 正确
dispatch({ type: 'UPDATE_MODEL_CONTENT', modelId: 'model-1', content: newValue })
```

### ❌ 错误 5: 混淆 `fileId` 和 `modelId`
```typescript
// ❌ 错误（用错了 ID）
const model = state.models[fileId]

// ✅ 正确
const model = state.models[modelId]
// 或者通过 fileId 查找：
const model = Object.values(state.models).find(m => m.fileId === fileId)
```

---

## 📋 5 分钟内你应该知道的

| 概念 | 是什么 | 你的任务 |
|------|--------|---------|
| **Model** | 文件的真实内容 | 通过 dispatch 更新，不要直接修改 |
| **Tab** | 对 Model 的引用 | 使用 `tab.modelId` 获取 Model |
| **Group** | 编辑器窗口 | 包含多个 Tab，其中一个是激活的 |
| **dispatch** | 发送 action | 更新状态的唯一方式 |
| **state** | 全局编辑器状态 | 通过 `useEditor()` 读取 |

---

## 🚀 立即开始

### 在组件中使用

```typescript
import { useEditor } from '@/hooks/useEditor'

function MyComponent() {
  // 第 1 步：获取 state 和 dispatch
  const { state, dispatch } = useEditor()
  
  // 第 2 步：找到 Model（通过 tab.modelId）
  const model = state.models[tab.modelId]
  
  // 第 3 步：读取内容
  const content = model.content
  const isDirty = model.isDirty
  
  // 第 4 步：编辑时更新 Model
  const handleChange = (newValue) => {
    dispatch({
      type: 'UPDATE_MODEL_CONTENT',
      modelId: tab.modelId,
      content: newValue
    })
  }
  
  return (
    <Editor value={content} onChange={handleChange} />
  )
}
```

---

## ❓ 常见问题

**Q: 为什么要拆分 Model 和 Tab？**
A: 为了避免重复。一个文件 = 一个 Model。多个标签页指向同一个 Model，所以内容自动同步。

**Q: Model 什么时候删除？**
A: 当调用 `CLOSE_FILE_IN_ALL_GROUPS` 时删除（例如从侧边栏删除文件）。仅关闭标签页不删除。

**Q: 如何检查内容是否已保存？**
A: 看 `model.isSavedToDisk`。如果是 `false` 就是未保存。自动保存会自动设置为 `true`。

**Q: 拖拽标签页到另一个编辑器会怎样？**
A: 调用 `MOVE_TAB_BETWEEN_GROUPS`。如果目标编辑器已有相同文件的标签页，显示提示。

**Q: 需要学多久才能上手？**
A: 15-20 分钟。掌握 Model/Tab/Group 三个概念，学会 4 个基本操作，就能独立开发了。

---

## 📚 想深入学习？

- ⏱️ **20 分钟** → 读 `EDITOR_ARCHITECTURE_GUIDE.md`
- ⏱️ **40 分钟** → 读 `REFACTOR_SUMMARY.md`
- ⏱️ **20 分钟** → 阅读 `src/contexts/EditorContext.tsx` 源代码

---

## ✅ 学习清单

完成下面的检查，证明你掌握了：

- [ ] 能解释 Model、Tab、Group 的区别
- [ ] 能写出打开文件的 dispatch
- [ ] 能写出编辑内容的 dispatch
- [ ] 能说出 3 个常见错误
- [ ] 能用代码读取 Model 的内容
- [ ] 能在实际组件中修改内容

全部✅？恭喜！你已经掌握了 80% 的知识。

---

## 🆘 遇到问题？

| 问题 | 查看 |
|------|------|
| 不理解某个概念 | EDITOR_ARCHITECTURE_GUIDE.md 核心概念 |
| 错误信息 | EDITOR_ARCHITECTURE_GUIDE.md 常见错误 |
| 需要代码示例 | EDITOR_ARCHITECTURE_GUIDE.md 常见操作 |
| 想理解实现细节 | REFACTOR_SUMMARY.md |
| 想看源代码 | src/contexts/EditorContext.tsx |

---

**这是最简短的入门指南。5 分钟快速了解，然后深入细节。**

✨ **开始编码吧！** ✨
