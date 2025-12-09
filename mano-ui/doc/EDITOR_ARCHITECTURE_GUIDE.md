# Mano Editor Architecture Guide

## Overview

The Mano editor implements a sophisticated multi-tab, multi-pane architecture with real-time content synchronization across tabs editing the same file. This guide explains the core architectural patterns and how they work together.

## Core Concepts

### EditorModel - Single Source of Truth

Each opened file is represented by a single `EditorModel` instance, regardless of how many tabs display it:

```typescript
interface EditorModel {
  id: string              // Unique identifier for the file
  fileHandle: IFileHandle // Reference to the file on disk
  content: SlateValue     // Content in Slate.js JSON format
  version: number         // Incremented on each change (enables multi-tab sync detection)
  isDirty: boolean        // Has unsaved changes
  isSavedToDisk: boolean  // Last change was persisted
  language: string        // For syntax highlighting
}
```

**Key Principle**: Multiple tabs pointing to the same file share ONE model. When tab A edits, tab B automatically sees the changes through the shared model.

### EditorTab - Lightweight View Reference

Each tab is a lightweight reference to an EditorModel:

```typescript
interface EditorTab {
  id: string              // Unique tab identifier
  modelId: string         // Reference to EditorModel.id (same model = same file)
  name: string            // Display name
  isDirty: boolean        // Visual indicator
  isActive: boolean       // Currently selected tab
}
```

### EditorGroup - Tab Container

Editor groups organize tabs (split pane):

```typescript
interface EditorGroup {
  id: string
  tabs: EditorTab[]
  activeTabId: string
}
```

## Multi-Tab Content Synchronization

### How Same-File Tabs Stay Synchronized

**Scenario**: User opens `document.mano` in two tabs (left and right panes), edits in the left tab.

**Flow**:

1. **Edit in Tab A (Left Pane)**:
   ```typescript
   // PlateEditor onChange fires
   dispatch({
     type: 'UPDATE_MODEL_CONTENT',
     modelId: 'file-1',
     content: newSlateValue  // Slate.js JSON
   })
   ```

2. **Model Update**:
   ```typescript
   // EditorContext reducer
   const model = state.models[modelId]
   model.content = content
   model.version++           // Increment version
   model.isDirty = true
   ```

3. **Tab B (Right Pane) Detects Change**:
   ```typescript
   // PlateEditor.tsx useEffect monitors model.version
   useEffect(() => {
     if (!isInternalChange.current && editor) {
       // External change detected (different tab)
       editor.children = newValue
       editor.onChange()  // Update cursor position
     }
     isInternalChange.current = false
   }, [value])  // watches model.content indirectly through value prop
   ```

4. **Result**: Both tabs display the same content with cursor positions preserved.

### Preventing Infinite Loops

The `isInternalChange` ref prevents feedback loops:

```typescript
// Internal edit (this tab changed it)
isInternalChange.current = true
dispatch({ type: 'UPDATE_MODEL_CONTENT', ... })

// External edit (another tab changed it)
isInternalChange.current = false
// useEffect will sync editor state
```

## State Management Architecture

### Context Reducer Pattern

The `EditorContext` uses a reducer with these key actions:

```typescript
type EditorAction =
  | { type: 'OPEN_FILE'; modelId: string; fileHandle: IFileHandle; content: SlateValue }
  | { type: 'UPDATE_MODEL_CONTENT'; modelId: string; content: SlateValue }
  | { type: 'MARK_MODEL_SAVED'; modelId: string }
  | { type: 'CLOSE_TAB'; tabId: string; groupId: string }
  | { type: 'SPLIT_GROUP'; sourceGroupId: string; direction: 'vertical' | 'horizontal' }
  | { type: 'MOVE_TAB_BETWEEN_GROUPS'; tabId: string; fromGroupId: string; toGroupId: string }
```

**All state changes go through dispatch**: Never modify state directly. This ensures:
- Single point of truth
- Debuggability (all changes logged)
- Multi-tab consistency
- Proper cleanup on close

### Critical: CLOSE_TAB Cleanup Logic

When closing a tab, we must check if the model is still in use by other tabs:

```typescript
case 'CLOSE_TAB': {
  const { tabId, groupId } = action
  
  // Build newTabs for current group (tab removed)
  const newTabs = state.groups[groupId].tabs.filter(t => t.id !== tabId)
  const newGroups = { ...state.groups, [groupId]: { ...state.groups[groupId], tabs: newTabs } }
  
  // Check if modelId is used in ANY tab across ALL groups
  const closingTab = state.groups[groupId].tabs.find(t => t.id === tabId)
  const modelIsInUse = Object.entries(newGroups).some(([grpId, grp]) => 
    grp.tabs.some(t => t.modelId === closingTab.modelId)
  )
  
  // Only delete model if no other tabs reference it
  if (!modelIsInUse) {
    delete newState.models[closingTab.modelId]
  }
  
  return { ...newState, groups: newGroups }
}
```

**Why This Matters**: If we check the old `state.groups` (which still contains the closing tab), we'll incorrectly think the model is still in use, causing memory leaks.

## Auto-Save Architecture

### Debounced Filesystem Persistence

The `useFileSystemAutoSave` hook manages saving to disk:

```typescript
useFileSystemAutoSave(
  fileHandle,           // Where to save
  content,              // What to save
  1000,                 // Debounce delay (1 second)
  onSuccess: () => dispatch({ type: 'MARK_MODEL_SAVED', modelId }),
  onError: (err) => toast.error('Save failed')
)
```

**Why Debounce?**
- User types rapidly → many onChange events
- Without debounce → write to disk 10+ times per second (slow, battery drain)
- With debounce → wait for typing to pause, then save once

### Deep Comparison to Detect Changes

```typescript
// Only save if content actually changed
const contentJson = JSON.stringify(content)
if (contentJson !== lastContentJson.current) {
  // Trigger save
  saveToFile(fileHandle, content)
  lastContentJson.current = contentJson
}
```

## Component Hierarchy

```
IDELayout
├── ActivityBar (file tree navigation)
├── PrimarySidebar (file explorer)
└── EditorContainer
    ├── EditorGroup (Left Pane)
    │   ├── EditorGroupWrapper
    │   │   └── PlateEditor (renders active tab)
    │   └── Editor Tab Bar
    │
    └── EditorGroup (Right Pane)
        ├── EditorGroupWrapper
        │   └── PlateEditor (renders active tab)
        └── Editor Tab Bar
```

**Key Detail**: Each `EditorGroup` has its own `PlateEditor`, but both can reference the same `EditorModel`. When one editor updates the model, the other detects it via `useEffect`.

## Performance Considerations

### Key Optimizations

1. **Shared Model Reference**: No duplicate data in memory. 100 tabs of same file = 1 model + 100 tab refs.

2. **Lazy Editor Creation**: `PlateEditor` only mounts when its tab becomes active. Saves memory when many tabs are open.

3. **Change Detection via Version Number**: Instead of deep-comparing entire content, we watch the `version` number to detect external changes.

4. **React Compiler Optimization**: Leverages React 19's compiler (no manual useMemo/useCallback needed).

## Debugging Multi-Tab Issues

### Common Issues

**Issue**: Content changes in Tab A don't appear in Tab B
- **Check**: Are tabs pointing to same modelId?
- **Debug**: `console.log('Tab A modelId:', tabA.modelId, 'Tab B:', tabB.modelId)`
- **Check**: Is useEffect in PlateEditor firing?
- **Debug**: Add `console.log('External change detected')` in useEffect

**Issue**: Saving to disk fails silently
- **Check**: Browser console for auto-save errors
- **Debug**: Add `console.log()` in useFileSystemAutoSave
- **Check**: File permissions and disk space

**Issue**: Memory usage grows over time
- **Check**: Are closed models properly deleted from state?
- **Debug**: `console.log('Models in state:', Object.keys(state.models).length)`
- **Check**: CLOSE_TAB logic is using newGroups, not state.groups

## File Structure

Key files implementing this architecture:

- `src/types/editor.ts` - Core types (EditorModel, EditorTab, EditorGroup)
- `src/contexts/EditorContext.tsx` - State management reducer (single source of truth)
- `src/components/plate/PlateEditor.tsx` - Slate.js wrapper with external change detection
- `src/hooks/useFileSystemAutoSave.ts` - Debounced save to disk
- `src/components/ide/EditorGroupWrapper.tsx` - Component wrapping PlateEditor with auto-save
- `src/components/ide/IDELayout.tsx` - Main orchestrator coordinating all components

## Summary

Mano's editor architecture achieves real-time multi-tab synchronization through:

1. **Single EditorModel per file** → no duplicate data
2. **Lightweight EditorTab references** → efficient grouping
3. **Context reducer for state** → predictable updates
4. **useEffect for external change detection** → automatic sync
5. **Debounced filesystem saves** → efficient persistence

This pattern scales efficiently whether you have 2 tabs or 100 tabs open, and handles edge cases like model cleanup and version tracking automatically.
