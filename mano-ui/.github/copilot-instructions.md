# Mano IDE - AI Coding Agent Instructions

## Project Overview

Mano is a cross-platform rich text editor IDE built with React + TypeScript + Vite, deployable as both a web app and desktop app via Tauri. It features a VS Code-like interface with tree navigation, split editors, and Plate.js-powered rich text editing.

## Architecture Principles

### Cross-Platform File System (Strategy Pattern)

**Critical**: File operations use a strategy pattern to support both browser and Tauri environments. Always use `getFileSystem()` from `@/services/fileSystem/index`:

```typescript
import { getFileSystem } from '@/services/fileSystem/index'

// Auto-detects browser vs Tauri and uses appropriate strategy
const fileSystem = getFileSystem()
await fileSystem.saveToFile(fileHandle, content)
```

**Environment Detection**: Use `isTauri()` from `@/lib/utils` to check runtime environment. The strategy auto-initializes but never assume which strategy is active.

**File Handles**: Use `IFileHandle` and `IDirectoryHandle` types (not native browser types) for cross-platform compatibility. These are wrappers that work in both environments.

### Editor State Management (Context + Reducer)

State lives in `EditorContext` (see `src/contexts/EditorContext.tsx`). All editor operations go through dispatched actions:

- `OPEN_FILE` - Opens file in tab (checks for duplicates, creates new tab if needed)
- `UPDATE_TAB_CONTENT` - Updates content (marks isDirty=true)
- `MARK_TAB_SAVED_TO_DISK` - Confirms disk write (sets isSavedToDisk=true)
- `CLOSE_TAB`, `SPLIT_GROUP`, `MOVE_TAB_BETWEEN_GROUPS` - Layout operations

**Important**: Never modify state directly. Always dispatch actions via `useEditor()` hook.

### File Type System

Two file types with distinct rendering:
- **`slate`**: Rich text (`.mano` files) - Rendered by `PlateEditor` with Slate.js JSON format
- **`text`**: Plain text - Rendered in `ScrollArea` (read-only preview)

File type determined in `IDELayout.handleFileClick()` based on extension. Content format:
```typescript
// slate type: Slate.js JSON (array of block objects)
[{ type: 'p', children: [{ text: 'content' }] }]

// text type: plain string
"plain text content"
```

### Auto-Save Architecture

Uses `useFileSystemAutoSave` hook (see `src/hooks/useFileSystemAutoSave.ts`):
- 1-second debounced saves to prevent excessive writes
- Deep comparison via `JSON.stringify` to detect real changes
- Cross-platform via `getFileSystem()` strategy
- Manages `isDirty` and `isSavedToDisk` states through context actions

**Pattern**:
```typescript
useFileSystemAutoSave(
  fileHandle,
  content,
  1000,  // debounce delay
  () => dispatch({ type: 'MARK_TAB_SAVED_TO_DISK', tabId, groupId }),
  (error) => toast.error('Save failed')
)
```

## Naming Conventions

### ManoNode Tree Structure

The project uses `ManoNode` (defined in `src/types/mano-config.ts`) as the universal tree node type:

```typescript
interface ManoNode {
  id: string              // Unique identifier
  name: string            // Display name (user-editable)
  nodeType: NodeType      // 'Directory' | 'SlateText' | 'Markdown'
  children?: ManoNode[]   // For directories only
  content?: string        // Base64 for deleted nodes in trash
  metadata?: Record<string, unknown>
  readOnly?: boolean
}
```

**Critical Naming**:
- **Type Name**: Always `ManoNode` (not `FileNode`, `TreeNode`, etc.)
- **File Naming**: Use `nameToFilename()` to convert display names to safe filenames (replaces invalid chars like `/\:*?"<>|` with underscores)
- **Extensions**: Auto-added by `getNodeFilename()` - `.mano` for SlateText, `.md` for Markdown, no extension for Directory
- **Reserved IDs**: `__trash__` is the trash node (readOnly=true, cannot be deleted)

### Tree Utilities Pattern

All tree operations use `src/lib/tree-utils.ts` functions. Never manually traverse trees:

```typescript
import { findNodePath, insertInto, removeAtPath } from '@/lib/tree-utils'

// Find node by ID → returns path array
const path = findNodePath(tree, nodeId)  // [0, 2, 1] = tree[0].children[2].children[1]

// Insert as child
const newTree = insertInto(tree, parentId, newNode)

// Remove node
const { removed, newTree } = removeAtPath(tree, path)
```

**Path-Based Operations**: All mutations work with index paths (`number[]`), not direct node references. This ensures immutability.

## Component Patterns

### IDE Layout Structure

Fixed height components:
- `TitleBar` (48px) - Menus + window controls
- `StatusBar` (24px) - Git info, errors, cursor position

Resizable areas (via `react-resizable-panels`):
- `ActivityBar` (48px fixed) + `PrimarySidebar` (15-40% width)
- `EditorContainer` (flex-1)
- `BottomPanel` (10-60% height, collapsible)

**Layout State**: Controlled by refs (`sidebarRef`, `panelRef`) for imperative panel collapse/expand. Check `IDELayout.tsx` for toggle patterns.

### Plate.js Editor Integration

Wrap `PlateEditor` with auto-save logic (see `src/components/plate/AutoSavePlateEditor.tsx`):

```typescript
<PlateEditor
  value={slateValue}
  onChange={(newValue) => dispatch({ type: 'UPDATE_TAB_CONTENT', content: newValue })}
  readOnly={false}
/>
```

**Content Flow**:
1. User edits → `onChange` fires
2. Dispatch `UPDATE_TAB_CONTENT` (marks isDirty)
3. `useFileSystemAutoSave` detects change
4. After 1s debounce → saves to disk
5. On success → dispatch `MARK_TAB_SAVED_TO_DISK`

### Drag-and-Drop (dnd-kit)

Tree reordering uses `@dnd-kit/core` with custom collision detection:

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
)
// 8px movement required to activate drag (prevents accidental drags)
```

**Drag Data Pattern**:
```typescript
// Attach to draggable
data: { type: 'tree-node', node: manoNode }

// Check in onDragEnd
if (dragData?.type === 'tree-node') { /* handle */ }
```

## Development Workflows

### Running the App

```bash
# Web development (http://localhost:5174)
pnpm dev

# Tauri desktop development (auto-opens window)
cargo tauri dev  # Run from parent directory (mano/)

# Build for production
pnpm build                    # Web
cargo tauri build             # Desktop
```

### Debugging Cross-Platform Issues

Check environment: `console.log('isTauri:', isTauri())`

Browser strategy uses `window.showDirectoryPicker()` (requires HTTPS or localhost). Tauri uses `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs`.

**Common Issue**: Path separators - Tauri handles detect OS separator automatically (see `TauriDirectoryHandle.joinPath()`). Never hardcode `/` or `\`.

### Testing File Operations

Create test `.mano` files in `examples/` directory:
```json
[
  { "type": "h1", "children": [{ "text": "Test Title" }] },
  { "type": "p", "children": [{ "text": "Test content" }] }
]
```

Open via "Open Directory" button in sidebar, select directory containing `mano.conf.json`.

## Configuration Files

### mano.conf.json Structure

Lives in project root, managed by file system strategies:

```json
{
  "data": [
    {
      "id": "1",
      "name": "我的连载...",
      "nodeType": "Directory",
      "readOnly": false,
      "metadata": { "连载中": true },
      "children": [...]
    },
    {
      "id": "__trash__",
      "name": "垃圾篓",
      "nodeType": "Directory",
      "readOnly": true,
      "children": []
    }
  ],
  "lastUpdated": "2025-12-04T10:30:00.000Z"
}
```

**Auto-Creation**: If missing, `createDefaultManoConfig()` generates default structure with empty project + trash.

**Update Pattern**: Always set `lastUpdated` to `new Date().toISOString()` when saving config.

## Styling Conventions

**Tailwind CSS 4.x only** - No native CSS files (except global `index.css` for resets). Use `cn()` utility for conditional classes:

```typescript
import { cn } from '@/lib/utils'

className={cn(
  'base-class',
  isDirty && 'text-orange-500',
  isActive ? 'font-bold' : 'font-normal'
)}
```

**shadcn/ui Components**: All UI components in `src/components/ui/`. Never modify these directly - they're generated. Override via className prop.

## Common Pitfalls

1. **File Handle Type Errors**: Always use `IFileHandle`, not `FileSystemFileHandle` - the former works cross-platform.

2. **Direct State Mutation**: Never do `state.groups[id].tabs.push(...)`. Always dispatch actions through reducer.

3. **Ignoring Tree Utils**: Don't manually loop through `children` arrays. Use `findNodePath()`, `getNodeByPath()`, etc.

4. **Hardcoded Paths**: Use `getNodeFilename()` and `nameToFilename()` for all file naming. Never construct paths like `${name}.mano` directly.

5. **Duplicate Saves**: `useFileSystemAutoSave` already handles debouncing. Don't add extra save calls in `onChange` handlers.

6. **Missing TypeScript Types**: All editor state types are in `src/types/editor.ts`, config types in `src/types/mano-config.ts`. Import from these, don't redeclare.

## Key Files Reference

- `src/types/mano-config.ts` - Core config types, node types, filename utilities
- `src/types/editor.ts` - Editor state, tabs, actions
- `src/contexts/EditorContext.tsx` - State management reducer (all 12 action handlers)
- `src/services/fileSystem/index.ts` - Strategy pattern entry point
- `src/lib/tree-utils.ts` - Immutable tree operations
- `src/components/ide/IDELayout.tsx` - Main layout orchestrator (995 lines, handles most user interactions)
- `src/hooks/useFileSystemAutoSave.ts` - Cross-platform auto-save with debouncing
