# LexicalEditor 使用指南

## 概述

LexicalEditor 现在已经支持文件加载和保存功能，并成为项目中唯一的富文本/高级文本编辑解决方案。

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

// 在 renderEditor 函数中添加对 LexicalText 类型的支持
const renderEditor = () => {
  if (!selectedNode) {
    return <Welcome />;
  }

  const nodeType = selectedNode.nodeType || 'PlainText';
  const uniqueKey = `${selectedNode.id}-${Date.now()}`;
  
  if (nodeType === 'Directory') {
    return <DirectoryPanel key={uniqueKey} node={selectedNode} onClose={handleCloseEditor} />;
  } else if (nodeType === 'LexicalText') {
    // 使用 LexicalEditor 打开高级文本
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

1. 富文本内容统一保存为 `.lexical.json`，确保与 LexicalEditor 功能匹配
2. 自动保存延迟为 1 秒，避免频繁 IO 操作
3. 如果文件不存在，会创建新的空文档
4. 需要 Tauri 环境支持文件系统操作

## 浮层 Portal 经验记录

- **背景**：Lexical Playground 自带的大量浮层组件（格式工具条、链接编辑器、拖拽菜单、表格操作面板等）默认都会通过 `document.body` 上的 portal Host 渲染，而不是直接挂在 `ContentEditable` DOM 里。我们在自定义改造过程中，让部分浮层直接出现在 `.editor ContentEditable__root` 下，导致 React 卸载节点时频繁抛出 `NotFoundError: Failed to execute 'removeChild'`。
- **症状**：切换侧边栏节点或关闭编辑器时，控制台持续输出 `removeChild mismatch`（由 `src/main.tsx` 中的 `patchedRemoveChild` instrumentation 打印），定位到的 `childHTML` 就是诸如 `div.floating-text-format-popup`、`div.draggable-block-menu` 等浮层 DOM。
- **根因**：这些浮层既被 React 当作编辑器内容的子节点管理，又被插件内部的 `ReactDOM.createPortal`/手写 DOM 操作独立处理，最终进入 “React 想删除，但真实父节点已经被改动” 的冲突状态。
- **解决方案**：
  1. 在 `src/components/LexicalEditor/utils/portalRoot.ts` 中实现 `getPortalRoot/acquirePortalRoot`，保证所有浮层公用一个稳定的宿主元素。
  2. 替换问题插件，让其渲染层统一指向该宿主。例如：自定义 `DraggableBlockPlugin` 内联了官方实现但将 `createPortal(..., portalContainer)` 指向 `getPortalRoot()`；`FloatingTextFormatToolbarPlugin` 也新增 `portalContainer`，默认使用共享 host。
  3. 保留 `patchedRemoveChild` 调试逻辑，以便快速发现后续新加入的浮层是否又插入了 ContentEditable。
- **实操建议**：新增浮层插件时，第一步确认 `createPortal` 目标是否来自 `getPortalRoot()`；若插件本身无法指定 portal，则需要像 `DraggableBlockPlugin` 一样复制/封装官方逻辑，使 UI 与定位 anchor 解耦。
- **Playground 正常的原因**：Lexical 官方 Playground 里的所有浮层组件（源码在 `packages/lexical-playground`）默认已经调用 `createPortal(..., document.body)` 或内部的共享 host，因此它们从未进入内容树，也就不会触发我们的 `removeChild mismatch`。问题完全源自我们改造过程中把浮层直接渲染在 `ContentEditable` 下的自定义行为。
- **什么是 Portal**：在 React 中，Portal 是指 `ReactDOM.createPortal(children, container)` 这种“把 React 子树渲染到父组件 DOM 层次之外”的机制。它允许我们逻辑上仍由某个组件控制 UI（含生命周期与事件冒泡），但真实 DOM 被挂在 `container`（通常是 `document.body` 下的某个固定元素）内。利用 portal，可以让浮层、模态框等脱离内容 DOM，既确保定位自由，也避免 React 卸载时与编辑器 DOM 互相干扰。

