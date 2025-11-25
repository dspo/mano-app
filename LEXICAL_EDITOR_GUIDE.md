# LexicalEditor 使用指南

## 概述

LexicalEditor 现在已经支持文件加载和保存功能，使用方式与 RichTextEditor 类似。

## 主要功能

1. **自动加载文件**: 当传入 `node` 和 `workspace` 参数时，编辑器会自动从工作区加载对应的 `.lexical.json` 文件
2. **自动保存**: 编辑内容后 1 秒自动保存（防抖处理）
3. **富文本格式**: 使用 Lexical 原生 JSON 格式保存，完整保留所有格式、样式和节点结构
4. **关闭按钮**: 工具栏右侧自动添加关闭按钮
5. **完整功能**: 保留所有 Lexical Playground 的功能

## 使用示例

### 在 App.tsx 中使用

```typescript
import LexicalEditor from './components/LexicalEditor';

// 在 renderEditor 函数中添加对 LexicalRichText 类型的支持
const renderEditor = () => {
  if (!selectedNode) {
    return <Welcome />;
  }

  const nodeType = selectedNode.nodeType || 'PlainText';
  const uniqueKey = `${selectedNode.id}-${Date.now()}`;
  
  if (nodeType === 'Directory') {
    return <DirectoryPanel key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} />;
  } else if (nodeType === 'RichText') {
    return <RichTextEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} workspace={workspace} />;
  } else if (nodeType === 'LexicalRichText') {
    // 新增：使用 LexicalEditor
    return <LexicalEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} workspace={workspace} />;
  } else if (nodeType === 'PlainText') {
    return <PlainTextEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} />;
  } else if (nodeType === 'Markdown') {
    return <MarkdownEditor key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} />;
  }

  return (
    <div className="editor-content-placeholder">
      <div className="placeholder-text">未知的编辑器类型</div>
    </div>
  );
};
```

### 独立使用

```typescript
import LexicalEditor from './components/LexicalEditor';

function MyComponent() {
  const handleClose = () => {
    console.log('Editor closed');
  };

  return (
    <LexicalEditor 
      node={myNode}
      workspace="/path/to/workspace"
      onClose={handleClose}
    />
  );
}
```

## 文件格式

文件以 `节点名称.lexical.json` 格式保存，例如：
- `我的文档.lexical.json`
- `会议记录.lexical.json`

文件内容为 Lexical 编辑器状态的 JSON 序列化，包含：
- 文档根节点
- 所有子节点（段落、标题、列表等）
- 文本格式（粗体、斜体、颜色等）
- 自定义节点（表格、图片、代码块等）

示例 JSON 结构：
```json
{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 1,
            "mode": "normal",
            "style": "",
            "text": "这是粗体文本",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}
```

## Props 说明

### LexicalEditorProps

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| node | GmailItem | 否 | 包含文件信息的节点对象 |
| workspace | string | 否 | 工作区路径，文件保存位置 |
| onClose | () => void | 否 | 编辑器关闭时的回调函数 |
| className | string | 否 | 自定义 CSS 类名 |

## 技术实现

### FilePlugin

负责文件的加载和保存：

1. **加载**：在组件挂载时读取 `.lexical.json` 文件，解析并恢复编辑器状态
2. **保存**：监听编辑器更新事件，使用防抖机制自动保存

### CloseButtonPlugin

在工具栏右侧添加关闭按钮，点击时调用 `onClose` 回调。

## 注意事项

1. 文件格式为 `.lexical.json`，不同于 RichTextEditor 的 `.rtf` 格式
2. 自动保存延迟为 1 秒，避免频繁 IO 操作
3. 如果文件不存在，会创建新的空文档
4. 需要 Tauri 环境支持文件系统操作

## 与 RichTextEditor 的区别

| 特性 | RichTextEditor | LexicalEditor |
|------|----------------|---------------|
| 编辑器引擎 | Quill | Lexical |
| 文件格式 | .rtf (纯文本) | .lexical.json (JSON) |
| 功能丰富度 | 基础富文本 | 完整富文本 + 高级功能 |
| 表格支持 | 无 | 完整支持 |
| 协作编辑 | 无 | 支持 |
| 自定义节点 | 有限 | 完全可扩展 |

## 下一步

可以在 `model.ts` 中添加新的节点类型：

```typescript
export type NodeType = "Directory" | "RichText" | "LexicalRichText" | "PlainText" | "Markdown";
export const LexicalRichText: NodeType = "LexicalRichText";
```

然后在侧边栏中为节点设置此类型，即可使用 LexicalEditor 打开。
