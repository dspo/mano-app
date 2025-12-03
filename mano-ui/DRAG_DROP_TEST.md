# Tab 拖拽功能测试清单

## 已实现功能 ✅

### 核心拖拽系统
- ✅ @dnd-kit/core 集成完成
- ✅ PointerSensor 配置 (8px 激活距离)
- ✅ DndContext 包裹 EditorContainer
- ✅ handleDragStart 和 handleDragEnd 事件处理

### Tab 可拖拽
- ✅ useDraggable hook 集成到 DraggableTab 组件
- ✅ 拖拽时 opacity: 0.5 视觉反馈
- ✅ 携带数据: tab 对象 + sourceGroupId

### Editor Group 可放置
- ✅ useDroppable hook 集成到 EditorGroupWrapper
- ✅ 悬停时 ring-2 ring-primary 高亮效果
- ✅ 携带数据: type='group' + groupId

### 边缘检测区域
- ✅ EdgeDropZone 组件实现
- ✅ 4 个边缘区域: left, right, top, bottom
- ✅ 仅在拖拽时显示 (useDndMonitor)
- ✅ 悬停时高亮: bg-primary/30 + border-primary
- ✅ 携带数据: type='edge' + position

### 拖拽视觉反馈
- ✅ DragOverlay 浮动预览
- ✅ 显示 tab 文件名
- ✅ 带边框阴影的卡片样式

### Reducer 逻辑
- ✅ MOVE_TAB_BETWEEN_GROUPS: 跨组移动 tab
  - 从源组移除 tab
  - 添加到目标组
  - 自动关闭空源组 (保留至少 1 组)
  - 焦点切换到目标组
- ✅ MOVE_TAB_TO_EDGE: 拖拽到边缘创建分栏
  - 创建新编辑器组
  - 移动 tab 到新组
  - 插入新布局节点到指定边缘
  - 自动关闭空源组
  - 焦点切换到新组

## 测试场景

### 1. Tab 跨组拖拽 🧪
**步骤:**
1. 打开 3 个文件在组 A
2. 使用 Split Editor Right 创建组 B
3. 拖拽组 A 的 tab 到组 B 的 TabsList 区域
4. 观察 tab 移动和焦点变化

**预期:**
- 拖拽时显示 DragOverlay (文件名卡片)
- 悬停组 B 时显示蓝色 ring 高亮
- 松开鼠标后 tab 出现在组 B
- 组 A 仍显示剩余 tabs
- 焦点自动切换到组 B

### 2. 拖拽到左边缘 (水平分栏) 🧪
**步骤:**
1. 打开 2 个文件在单组
2. 拖拽一个 tab 到屏幕左边缘
3. 观察左边缘蓝色区域高亮
4. 松开鼠标

**预期:**
- 左边缘出现 16px 宽的蓝色区域
- 松开后创建新组在左侧
- 原组在右侧
- 水平分栏 (左右布局)
- Tab 移动到新左侧组

### 3. 拖拽到顶部边缘 (垂直分栏) 🧪
**步骤:**
1. 打开 2 个文件
2. 拖拽一个 tab 到屏幕顶部边缘
3. 松开鼠标

**预期:**
- 顶部出现 16px 高的蓝色区域
- 创建垂直分栏 (上下布局)
- Tab 移动到顶部新组

### 4. 自动关闭空组 🧪
**步骤:**
1. 创建 2 个组,每组 1 个 tab
2. 将组 A 的唯一 tab 拖拽到组 B
3. 观察组 A 是否自动关闭

**预期:**
- 组 A 自动关闭 (不显示空组)
- 布局自动调整为单组
- 焦点在组 B

### 5. 保留最后一组 🧪
**步骤:**
1. 只有 1 个组,1 个 tab
2. 尝试拖拽到边缘创建新分栏
3. 再将原组的 tab 全部移走

**预期:**
- 始终保留至少 1 个编辑器组
- 即使没有 tabs,也显示 "No file opened" 占位符

### 6. 取消拖拽 (ESC) 🧪
**步骤:**
1. 开始拖拽一个 tab
2. 按 ESC 键取消
3. 观察状态

**预期:**
- Tab 回到原位置
- 无任何状态改变
- EdgeDropZones 消失

## 已知特性

### 拖拽激活
- 需要移动 **8px** 才激活拖拽 (防止误触)
- 激活后显示 DragOverlay

### 视觉反馈层次
1. **拖拽的 Tab**: opacity: 0.5 (半透明原位 tab)
2. **DragOverlay**: 跟随鼠标的浮动卡片
3. **目标 Group**: ring-2 ring-primary (蓝色描边)
4. **边缘区域**: bg-primary/30 悬停时, bg-primary/10 默认

### 焦点管理
- 拖拽后焦点自动切换到目标组
- 点击编辑器区域也能更新焦点
- 未聚焦组 opacity-60 + bg-muted/50

## 性能优化

### @dnd-kit 优势
- ✅ 零 CSS 依赖 (完全使用 Tailwind)
- ✅ 仅 ~30KB (gzipped)
- ✅ React 19 兼容
- ✅ 无冲突 (shadcn/ui 生态)

### 激活约束
- `distance: 8px` 防止意外拖拽
- 减少不必要的拖拽状态更新

## 下一步优化 (可选)

### 增强功能
- [ ] Tab 在组内排序 (useSortable from @dnd-kit/sortable)
- [ ] 拖拽动画 (spring physics)
- [ ] 预览拖拽后的布局 (虚线边框)
- [ ] 支持多 tab 同时拖拽

### 键盘支持
- [ ] KeyboardSensor 添加键盘导航
- [ ] 无障碍功能 (ARIA attributes)

### 持久化
- [ ] 保存拖拽后的布局到 localStorage
- [ ] 恢复上次布局状态

## 技术架构总结

### 状态管理流
```
拖拽开始 (onDragStart)
  ↓
保存 activeTab 到 state
  ↓
拖拽中 (边缘区域/目标组显示高亮)
  ↓
拖拽结束 (onDragEnd)
  ↓
判断 dropData.type:
  - 'group' → dispatch MOVE_TAB_BETWEEN_GROUPS
  - 'edge'  → dispatch MOVE_TAB_TO_EDGE
  ↓
editorReducer 处理 action
  ↓
更新 state.groups + state.layout
  ↓
EditorContainer 重新渲染
```

### 关键文件
- `src/types/editor.ts` - Action 类型定义
- `src/contexts/EditorContext.tsx` - Reducer 逻辑 + insertLayoutNodeAtEdge 辅助函数
- `src/components/ide/IDELayout.tsx` - DndContext + 事件处理
- `src/components/ide/EditorGroupWrapper.tsx` - DraggableTab + useDroppable
- `src/components/ide/EdgeDropZone.tsx` - 边缘区域检测

### 样式规范
- ✅ 仅使用 Tailwind CSS classes
- ✅ 无 native CSS files
- ✅ 遵循 shadcn/ui 设计语言
- ✅ Transition classes 用于流畅动画

## 测试完成标志 ✅

当以下所有场景通过测试后,即可标记为完成:
- [ ] 跨组拖拽 tab 正常工作
- [ ] 4 个边缘方向全部可用
- [ ] 空组自动关闭
- [ ] 最后一组保留
- [ ] 焦点正确切换
- [ ] 无 console 错误
- [ ] 拖拽动画流畅 (无卡顿)

---

**实现时间:** 2024
**开发者:** GitHub Copilot (Claude Sonnet 4.5)
**依赖版本:**
- @dnd-kit/core: 6.3.1
- @dnd-kit/sortable: 8.0.0
- @dnd-kit/utilities: 3.2.2
