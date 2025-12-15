# Plate 可编辑模式 DOM→Slate 报错排查与修复记录

## 概要
- 报错：`Error: Cannot resolve a Slate node from DOM node: [object HTMLHeadingElement]`
- 触发：在可编辑器中点击/选中标题时抛出。
- 根因：可编辑实例误用 static 组件（`platejs/static`），DOM ref 未注册到 Slate，导致 DOM↔Slate 映射缺失。

## 可编辑 vs 静态：两条渲染通路
- 可编辑模式：`platejs/react`，组件基于 `PlateElement`，会把 DOM ref 回填给 Slate，维护 DOM↔Slate 映射，适用于交互编辑。
- 静态模式：`platejs/static`，组件基于 `SlateElement`，面向 SSR/导出/只读展示，不会为可编辑模式注册 DOM ref。
- 混用说明：可编辑实例如果用了 static 组件（如 `BaseEditorKit` 的 static 版本），DOM 节点不会注册到 Slate，`toSlateNode` 反查失败就会报本错误。

## 定位过程
1. 从报错定位 `ReactEditor.toSlateNode`，判断为 DOM 未注册。
2. 查看 `src/components/editor/editor-kit.tsx`，发现使用 `BaseEditorKit`（static 路径）。
3. 阅读 `platejs/static` 的 `SlateElement`，其 `props.attributes.ref` 被覆盖，不会用于可编辑注册。
4. 确认：可编辑模式误用了 static 组件，导致 heading/p 等 DOM 未注册。

## 修复方案（原理、利弊）
- 方案 A（已采用）：切换为 React 版插件集合（全量 `platejs/react`），补齐 React 版 LinkKit，确保所有节点渲染 `PlateElement`。
  - 原理：完全走可编辑通路，DOM ref 回填生效。
  - 优势：与 plate.js 官方可编辑示例一致，升级/维护成本低，避免 Base/React 混用。
  - 劣势：改动面较大，需要补齐缺失的 React 插件（如 LinkKit）。
- 方案 B（未采用）：保留原 `EditorKit` 结构，但将 Base kits 的 static 组件逐个替换为 React 组件（如 `H1Element`、`ParagraphElement` 等）。
  - 原理：只要最终渲染 `PlateElement`，DOM 注册就恢复。
  - 优势：改动范围更小。
  - 劣势：需逐一替换，易遗漏；组合与官方推荐不一致，后续升级/维护成本高。
  
> 采用方案 A：贴近官方可编辑路径，减少混用隐患。

## 已实施改动
- `src/components/editor/editor-kit.tsx`：用 React 版基础块/标记、表格、媒体、对齐、字体、列表等插件重组 `EditorKit`，不再引用 `BaseEditorKit`。
- `src/components/editor/plugins/link-kit.tsx`：新增 React 版 LinkKit（`LinkPlugin` + `LinkElement`）。

## 验证
1. `pnpm build`（已通过）。
2. `pnpm dev` 本地交互，点击/编辑标题/链接，确认不再出现报错。

## 官方可编辑路径参考
- 可编辑（React）文档：https://platejs.org/docs/editor
- 静态（Static）文档：https://platejs.org/docs/static
