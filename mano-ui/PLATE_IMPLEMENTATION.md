# Plate.js 富文本编辑功能实现说明

## ✅ 已实现功能

### 1. 文件类型支持
- **`.slate.json`** - 富文本文件（使用 Plate.js 编辑器）
- **其他文件** - 普通文本（使用只读预览）

### 2. 自动文件类型检测
- 打开 `.slate.json` 文件时自动使用 Plate.js 编辑器
- 其他文件使用普通文本查看器

### 3. 实时自动保存
- **延迟保存**: 内容变化后 1 秒自动保存
- **防抖机制**: 连续编辑时不会频繁触发保存
- **控制台日志**: 可在浏览器控制台查看保存记录

### 4. Slate JSON 格式
富文本内容使用 Slate.js 的 JSON 格式存储：

```json
[
  {
    "type": "h1",
    "children": [{ "text": "标题" }]
  },
  {
    "type": "p",
    "children": [
      { "text": "这是" },
      { "text": "粗体", "bold": true },
      { "text": "文本" }
    ]
  }
]
```

## 📂 测试步骤

1. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   访问: http://localhost:5174/

2. **打开富文本文件**
   - 在左侧文件树中找到 `document.slate.json`
   - 点击打开文件

3. **编辑内容**
   - 直接在编辑器中输入文本
   - 每次修改后等待 1 秒，会自动保存
   - 打开浏览器控制台查看保存日志

4. **验证自动保存**
   - 修改文本 → 等待 1 秒 → 查看控制台 `[AutoSave] Saved...`
   - Tab 标题会显示 `isDirty` 状态（未实现视觉反馈）

## 🏗️ 技术架构

### 核心组件

1. **PlateEditor.tsx**
   - 基础 Plate.js 编辑器封装
   - 处理内容变化回调

2. **AutoSavePlateEditor.tsx**
   - 包装 PlateEditor
   - 集成自动保存逻辑
   - 使用 `useAutoSave` hook

3. **useAutoSave.ts**
   - 防抖自动保存 hook
   - 1 秒延迟触发
   - 避免重复保存

### 数据流

```
文件点击 → IDELayout.handleFileClick()
  ↓
检测 .slate.json → 解析 JSON → dispatch OPEN_FILE (fileType: 'slate')
  ↓
EditorContext → 创建 EditorTab (content: Slate JSON)
  ↓
EditorGroupWrapper → 条件渲染
  ↓
fileType === 'slate' ? AutoSavePlateEditor : ScrollArea
  ↓
用户编辑 → onChange → dispatch UPDATE_TAB_CONTENT
  ↓
useAutoSave → 1秒后 → handleSave() → console.log
```

## 🎨 样式约束

✅ **仅使用 Tailwind CSS**
- 所有样式通过 `className` 实现
- 无原生 CSS 文件
- 遵循 shadcn/ui 设计规范

## 📝 文件清单

### 新增文件
- `src/components/plate/PlateEditor.tsx` - 基础编辑器
- `src/components/plate/AutoSavePlateEditor.tsx` - 自动保存包装器
- `src/hooks/useAutoSave.ts` - 自动保存 hook

### 修改文件
- `src/types/editor.ts` - 添加 `fileType` 和 `content: unknown`
- `src/components/ide/EditorGroupWrapper.tsx` - 条件渲染编辑器
- `src/components/ide/IDELayout.tsx` - 文件类型检测 + 示例数据
- `src/components/ide/PrimarySidebar.tsx` - 添加 `document.slate.json`

## 🔧 配置

### 已安装依赖
```json
{
  "platejs": "^52.0.1",
  "@platejs/basic-nodes": "^52.0.1"
}
```

### 自动保存延迟
在 `AutoSavePlateEditor.tsx` 中修改：
```tsx
useAutoSave(value, handleSave, 1000) // 1000ms = 1秒
```

## ⚠️ 注意事项

### 1. 保存逻辑未实现
当前仅在控制台打印日志，需要实现：
```tsx
// TODO: 在 AutoSavePlateEditor.tsx 的 handleSave 中
await fetch('/api/files/save', {
  method: 'POST',
  body: JSON.stringify({
    fileName,
    content: JSON.stringify(content, null, 2)
  })
})
```

### 2. 文件加载逻辑
当前使用 mock 数据 `fileContents`，生产环境需要：
```tsx
// TODO: 在 IDELayout.tsx 的 handleFileClick 中
const response = await fetch(`/api/files/${file.id}`)
const content = await response.json()
```

### 3. isDirty 状态
Tab 已标记为 `isDirty: true`，但未显示视觉反馈（如 `*` 号）

### 4. 错误处理
需要添加：
- 文件解析失败时的错误提示
- 保存失败时的重试机制
- 网络错误时的离线保存队列

## 🚀 下一步优化

### 功能增强
- [ ] 实现真实的文件读写 API
- [ ] 添加 `⌘S` 手动保存快捷键
- [ ] Tab 标题显示 `*` 表示未保存
- [ ] 保存成功/失败的视觉反馈
- [ ] 支持 Markdown 格式（安装 `@udecode/plate-markdown`）
- [ ] 添加撤销/重做功能
- [ ] 富文本工具栏（粗体、斜体、标题等）

### 性能优化
- [ ] 大文件延迟加载
- [ ] 虚拟滚动（长文档）
- [ ] 缓存机制（避免重复解析）

### 用户体验
- [ ] 保存动画/进度指示器
- [ ] 离线编辑支持
- [ ] 多人协作（WebSocket）
- [ ] 版本历史记录

## 📚 相关文档

- [Plate.js 官方文档](https://platejs.org/)
- [Slate.js 数据模型](https://docs.slatejs.org/concepts/02-nodes)
- [shadcn/ui 组件库](https://ui.shadcn.com/)

---

**实现时间**: 2025年12月3日  
**开发者**: GitHub Copilot (Claude Sonnet 4.5)  
**分支**: feat/shadcn-plate
