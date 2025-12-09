# Multi-Tab Content Sync Implementation

## Problem Statement

When the same file is opened in multiple editor tabs, edits in one tab should immediately reflect in all other tabs viewing that file.

## Solution Architecture

### 1. Single Source of Truth - EditorModel

**Pattern**: One `EditorModel` per unique file, multiple `EditorTab` instances can reference the same model.

```typescript
// State structure
{
  models: {
    'model-1': {
      id: 'model-1',
      fileId: 'unique-file-id',
      content: [...],  // Slate.js JSON
      version: 5,      // Increments on every edit
      isDirty: true,
      // ... other fields
    }
  },
  groups: {
    'group-1': {
      tabs: [
        { id: 'tab-1', modelId: 'model-1' },  // References model-1
        { id: 'tab-3', modelId: 'model-1' },  // Same model!
      ]
    }
  }
}
```

### 2. Content Update Flow

**User Edits in Tab A**:
```
PlateEditor onChange
  ↓
dispatch({ type: 'UPDATE_MODEL_CONTENT', modelId, content })
  ↓
Reducer updates model.content and increments model.version
  ↓
Both Tab A and Tab B receive new value prop
  ↓
Tab B's PlateEditor detects external change → syncs editor state
```

### 3. External Change Detection in PlateEditor

**Key Implementation** (`src/components/plate/PlateEditor.tsx`):

```typescript
export function PlateEditor({ value, onChange, readOnly = false }: PlateEditorProps) {
  const editor = usePlateEditor({ value: value as never, readOnly })
  
  const isInternalChange = useRef(false)
  const prevValue = useRef(value)

  useEffect(() => {
    // If value changed externally (not from our own onChange)
    if (!isInternalChange.current && prevValue.current !== value) {
      // Directly update editor state
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
          isInternalChange.current = true  // Mark as internal
          onChange(newValue)
        }
      }}
    >
      <PlateContent />
    </Plate>
  )
}
```

**How it works**:
- `isInternalChange` ref tracks whether the current render is from our own edit
- When `onChange` fires → set `isInternalChange.current = true`
- When `value` prop changes → `useEffect` checks:
  - If `isInternalChange.current === false` → external change → sync editor
  - If `isInternalChange.current === true` → our own change → ignore
- Reset `isInternalChange` to `false` after each render

### 4. Component Remounting Strategy

**Key Prop** in `EditorGroupWrapper.tsx`:

```typescript
<AutoSavePlateEditor
  key={model.id}  // Only remount when switching files
  value={model.content}
  onChange={...}
/>
```

**Why `key={model.id}` not `key={model.version}`**:
- `key={model.id}`: Remounts only when switching to different file → **preserves cursor position during edits**
- `key={model.version}`: Would remount on every edit → **cursor resets, breaks UX**

When switching files, React unmounts old editor and creates new one with fresh state.

## Comparison with Industry Best Practices

### VS Code / Monaco Editor Pattern

**Monaco's approach**:
```typescript
// Monaco uses model-based architecture
const model = monaco.editor.createModel(content, 'javascript')
editor1.setModel(model)  // Editor 1 uses model
editor2.setModel(model)  // Editor 2 uses same model

// Edits in editor1 automatically reflect in editor2 via shared model
```

**Our approach** (Plate.js adaptation):
- Monaco has built-in multi-view support through `setModel()`
- Plate.js doesn't have this API → we implement it via:
  1. React Context for shared state (model)
  2. `useEffect` to detect external value changes
  3. Direct manipulation of `editor.children` to sync state

### React Best Practices Alignment

✅ **Single Source of Truth**: One EditorModel per file
✅ **Unidirectional Data Flow**: State → View (no two-way binding)
✅ **Controlled Components**: `value` and `onChange` props
✅ **Ref for Non-Rendering State**: `isInternalChange` ref doesn't trigger re-renders
✅ **Key Prop for Identity**: `key={model.id}` for correct reconciliation
✅ **No Manual Memoization**: React 19 Compiler handles optimization

### Differences from Traditional Approach

**Traditional (doesn't work with Plate.js)**:
```typescript
// ❌ Value prop changes don't update Plate editor automatically
<PlateEditor value={model.content} />  // Editor ignores value changes
```

**Our solution**:
```typescript
// ✅ Manually sync when detecting external changes
useEffect(() => {
  if (external_change) {
    editor.children = value  // Force update
    editor.onChange()
  }
}, [value])
```

**Why necessary**: Plate.js (built on Slate.js) maintains internal editor state that doesn't automatically sync with prop changes after initialization. This is by design for performance (avoids unnecessary re-renders during typing).

## Trade-offs and Limitations

### ✅ Advantages
1. **Minimal Re-renders**: Only syncs when truly necessary
2. **Cursor Preservation**: Typing in one tab doesn't reset cursor in other tabs
3. **Memory Efficient**: One model instance shared by multiple tabs
4. **Auto-save Integration**: Debounced saves work seamlessly

### ⚠️ Limitations
1. **Slate.js Specific**: Solution tailored to Plate/Slate architecture
2. **No Operational Transform**: Concurrent edits in both tabs → last write wins (acceptable for single-user desktop app)
3. **Cursor Position Not Synced**: Each tab maintains independent cursor position (expected behavior)

## Alternative Approaches Considered

### 1. Key-Based Forced Remounting
```typescript
<PlateEditor key={`${model.id}-${model.version}`} />
```
**Rejected**: Remounts on every edit → cursor resets → terrible UX

### 2. Controlled Component Only
```typescript
<PlateEditor value={model.content} onChange={...} />
```
**Rejected**: Plate.js doesn't respect `value` prop changes after mount

### 3. Event Bus Pattern
```typescript
eventBus.on('content-changed', (modelId) => { ... })
```
**Rejected**: Adds complexity, breaks React patterns, harder to debug

## Testing Checklist

✅ Open same file in two tabs
✅ Edit in tab A → immediately visible in tab B
✅ Edit in tab B → immediately visible in tab A
✅ Cursor position preserved during edits
✅ Auto-save works correctly
✅ Switching tabs shows correct content
✅ No unnecessary re-renders during typing

## Related Files

- `src/types/editor.ts` - EditorModel and EditorTab types
- `src/contexts/EditorContext.tsx` - State management (UPDATE_MODEL_CONTENT action)
- `src/components/plate/PlateEditor.tsx` - External change detection logic
- `src/components/plate/AutoSavePlateEditor.tsx` - Auto-save wrapper
- `src/components/ide/EditorGroupWrapper.tsx` - Tab rendering with key={model.id}
