# Mano 项目文档

## 📚 文档列表

### 核心架构文档

1. **QUICKSTART.md** - 5分钟快速入门
   - 核心概念：EditorModel、EditorTab、EditorGroup
   - 4个基本操作示例
   - 适合：新开发者快速了解架构

2. **EDITOR_ARCHITECTURE_GUIDE.md** - 架构参考指南
   - 完整的概念讲解
   - 常见操作代码示例
   - 常见错误和解决方案
   - 适合：日常开发参考

3. **LAYOUT.md** / **LAYOUT.zh-CN.md** - IDE布局架构
   - VS Code风格布局实现
   - 面板系统、拖拽交互
   - 适合：UI/布局相关开发

4. **MULTI_TAB_SYNC_IMPLEMENTATION.md** / **.zh-CN.md** - 多标签同步实现
   - 技术实现细节
   - 与行业最佳实践对比
   - 适合：深入理解核心功能

### 推荐阅读顺序

#### 新开发者
1. QUICKSTART.md (5分钟) - 快速理解核心概念
2. EDITOR_ARCHITECTURE_GUIDE.md (20分钟) - 学习常用操作
3. 源码：`src/types/editor.ts` 和 `src/contexts/EditorContext.tsx`

#### 架构审查
1. MULTI_TAB_SYNC_IMPLEMENTATION.md - 了解核心实现
2. LAYOUT.md - 了解整体布局设计
3. `.github/copilot-instructions.md` - 完整开发指南

## 🎯 快速链接

### 关键概念
- **EditorModel**: 文件内容的单一数据源（一个文件一个model）
- **EditorTab**: 对model的轻量引用（多个tab可共享一个model）
- **多标签同步**: 同一文件的多个标签页自动同步内容

### 关键文件
- `src/types/editor.ts` - 类型定义
- `src/contexts/EditorContext.tsx` - 状态管理reducer
- `src/components/plate/PlateEditor.tsx` - 富文本编辑器(含外部变化检测)
- `src/components/ide/EditorGroupWrapper.tsx` - 标签页渲染逻辑

## 🔧 开发规范

### 状态更新
```typescript
// ✅ 正确：通过dispatch更新
dispatch({ type: 'UPDATE_MODEL_CONTENT', modelId, content })

// ❌ 错误：直接修改state
state.models[modelId].content = newContent
```

### React最佳实践
- ✅ 依赖React 19 Compiler自动优化，不使用`useMemo`/`useCallback`
- ✅ 使用`key={model.id}`控制组件重新挂载
- ✅ 使用ref追踪非渲染状态（如`isInternalChange`）

## 📝 文档维护

- 所有技术文档位于 `doc/` 目录
- 英文文档需要对应的`.zh-CN.md`中文版
- 根目录仅保留 `README.md`
- 开发指南位于 `.github/copilot-instructions.md`
