# Mano IDE Layout Architecture

## Overview

Mano adopts a **VS Code-inspired workbench layout**, implementing a classic IDE structure with multi-panel composition. The layout leverages `react-resizable-panels` for dynamic panel resizing and `dnd-kit` for drag-and-drop interactions, providing a professional-grade desktop application experience.

## Layout Hierarchy

```
IDELayout (Root Container)
├── ActivityBar (Fixed Width: 48px)
├── ResizablePanelGroup (Horizontal)
│   ├── PrimarySidebar (Resizable: 15-40%, Collapsible)
│   ├── ResizableHandle
│   └── ResizablePanelGroup (Vertical)
│       ├── EditorContainer (Resizable: 30%+, Main Content)
│       ├── ResizableHandle
│       └── BottomPanel (Resizable: 10-60%, Collapsible)
└── StatusBar (Fixed Height: 24px)
```

---

## Workspace Lifecycle & Storage

- Workspace config is stored in `mano.conf.json`; if missing, a default file with `__trash__` is created on open.
- Node names must be globally unique (directories included). Opening a workspace with duplicates will surface a blocking toast.
- Text nodes map to physical files: `.mano` for SlateText, `.md` for Markdown. Opening a node will create the file if needed (Markdown gets a default heading).
- Delete → move to trash: file contents are base64-encoded into `mano.conf.json` and the physical file is removed. Trash items are read-only; “Move out” recreates files, “Delete” removes the config entry.
- File system strategies: Tauri plugins on desktop; Chrome File System Access in browser; Safari throws an unsupported error.

---

## Core Components & Behavior

### 1. IDELayout (Main Orchestrator)

**File**: `src/components/ide/IDELayout.tsx`

**Purpose**: Root-level layout controller that manages global state, file system operations, and coordinates all child components.

**Key Responsibilities**:
- **State Management**: Integrates `EditorContext` for centralized editor state (tabs, groups, layout)
- **File System Abstraction**: Handles cross-platform file operations via `getFileSystem()` strategy pattern
- **Tree Operations**: Manages workspace file tree (CRUD operations, drag-and-drop reordering)
- **Panel Orchestration**: Controls sidebar/panel collapse/expand via `ImperativePanelHandle` refs
- **DnD Context**: Provides drag-and-drop context for tab reordering between editor groups

**State**:
- `fileTree: ManoNode[]` - Workspace tree structure
- `selectedFile: string | null` - Currently selected file ID
- `configFileHandle: IFileHandle` - Reference to `mano.conf.json`
- `isSidebarCollapsed: boolean` - Sidebar visibility state
- `isPanelCollapsed: boolean` - Bottom panel visibility state

---

### 2. ActivityBar (Navigation Strip)

**File**: `src/components/ide/ActivityBar.tsx`

**Dimensions**: Fixed width `48px`, full height

**Purpose**: Primary navigation rail for switching between workbench activities and controlling panel visibility.

**Components**:

#### Activity Icons (Top Section)
- **Explorer** (Files icon) - Active by default, navigates to file tree view
- **Search** (Search icon) - *Disabled*, displays "Coming soon..."
- **Source Control** (GitBranch icon) - *Disabled*, displays "Coming soon..."
- **Run and Debug** (Play icon) - *Disabled*, displays "Coming soon..."
- **Extensions** (Package icon) - *Disabled*, displays "Coming soon..."

#### Control Buttons (Bottom Section)
- **Toggle Sidebar** (PanelLeft/PanelLeftClose) - Collapses/expands Primary Sidebar (Shortcut: `⌘B`)
- **Toggle Panel** (PanelBottom/PanelBottomClose) - *Disabled*, displays "Coming soon..."
- **Settings** (Settings icon) - *Disabled*, displays "Coming soon..."

**Interaction**:
- Uses `Tooltip` component with `300ms` delay for hover hints
- Active state highlighted with `bg-accent` styling
- Disabled buttons rendered with `opacity-50` and `pointer-events-none`

---

### 3. PrimarySidebar (File Explorer)

**File**: `src/components/ide/PrimarySidebar.tsx`

**Dimensions**: Resizable `15-40%` width, collapsible

**Purpose**: Displays workspace file tree with hierarchical navigation, supporting CRUD operations and drag-and-drop reordering.

**Features**:

#### Header Section
- **Mano Logo + Title**: Button to open workspace (dialog or Tauri `workspace_updated` event)
  - Pulses when no workspace loaded (visual hint)

#### File Tree (Recursive Component)
- **Node Types**:
  - `Directory` - Expandable/collapsible folders (ChevronRight/ChevronDown icons)
  - `SlateText` - Rich text files (`.mano` extension, TextAlignStart icon)
  - `Markdown` - Markdown files (`.md` extension, TextQuote icon)

- **Naming rules**:
  - All node names must be globally unique. New nodes start from “新建文档”, auto-incremented when clashes occur.

- **Interactions**:
  - **Single Click**: Directories toggle expand; files open in editor
  - **Double Click**: Enter inline rename (blocked for trash/readOnly)
  - **Drag-and-Drop**: Reorders nodes with drop indicators; nodes in trash cannot be dragged; dropping into trash is disallowed
  - **Context Menu** (Right-click):
    - `Move up/down/left/right` - Keyboard-free ordering
    - `Create Mano Text` - Add child text node
    - `Remove` - Move to `__trash__` and delete backing files after base64 capture
    - *(Trash only)* `Move out` to restore files, `Delete` to remove from config

- **State Indicators**:
  - Selected file: `bg-accent` background
  - Drag over: `bg-accent/50` with position indicator line
  - Editing mode: Inline `<input>` replaces node label

#### Trash Node
- **ID**: `__trash__` (reserved, read-only)
- **Behavior**: 
  - Cannot be deleted, renamed, or moved
  - Stores deleted nodes by renaming their files with a `.bak` suffix
  - Supports restore (`Move Out`) and permanent deletion

---

### 4. EditorContainer (Content Area)

**File**: `src/components/ide/EditorContainer.tsx`

**Dimensions**: Flex-grow, minimum `30%` height

**Purpose**: Main workspace for file editing, supporting split views and tab groups.

**Architecture**:

#### Layout Types
- **Group Layout**: Single `EditorGroup` with tab bar
- **Split Layout**: Recursive `ResizablePanelGroup` with nested children

#### EditorGroup Components
- **Tab Bar**: Horizontal list of open files
  - Tab indicators: File name, close button (`X`)
  - Active tab: `bg-accent` styling
  - Dirty state: Orange dot until saved to disk
- **Content Area**: Plate-based `AutoSaveTextEditor`
  - Plugin kit mirrors plate basic-nodes demo (tables, media, markdown, comments, slash, etc.)
  - Auto-saves to IndexedDB + file system with 1s debounce; `⌘/Ctrl+S` triggers immediate save
  - Trash files open read-only

#### Split View
- **Directions**: Horizontal or vertical splits
- **Resize**: Draggable handles between panels
- **Minimum Size**: 20% per panel
- **Drop Zones**: Edge drop zones for creating new splits via drag

---

### 5. BottomPanel (Console & Tools)

**File**: `src/components/ide/BottomPanel.tsx`

**Dimensions**: Resizable `10-60%` height, collapsible

**Purpose**: Multi-tab panel for terminal, diagnostics, and debug output (currently mock data).

**Tabs**:
- **Terminal** (TerminalIcon)
- **Problems** (AlertCircle)
- **Output** (FileOutput)
- **Debug Console** (Bug)

**Header**:
- Tab list with icon + label
- Close button (`X`) in top-right corner to collapse panel

**Content**:
- Static placeholders only; no live wiring yet
- Can be expanded via drag handle or `⌘/Ctrl+J` even though ActivityBar toggle is disabled

---

### 6. StatusBar (Information Strip)

**File**: `src/components/ide/StatusBar.tsx`

**Dimensions**: Fixed height `24px`

**Purpose**: Displays contextual information about workspace and active file (currently mock values).

**Sections**:

#### Left Side
- **Git Branch** (GitBranch icon): Current repository branch (e.g., `main`)
- **Error Count** (AlertCircle): Number of compilation errors
- **Warning Count** (AlertCircle): Number of warnings

#### Right Side
- **Cursor Position**: Line and column numbers (e.g., `Ln 42, Col 18`)
- **Encoding**: Character encoding (e.g., `UTF-8`)
- **Language Mode**: File type identifier (e.g., `TypeScript`, `Markdown`)
- **Line Ending**: EOL format (e.g., `LF`, `CRLF`)
- **Connection Status** (Wifi icon): Network/sync indicator

**Styling**:
- Background: `bg-primary` with `text-primary-foreground`
- Interactive segments: `hover:bg-primary-foreground/10` with rounded corners

---

## Layout Mechanics

### Resizable Panels

**Library**: `react-resizable-panels` (`@/components/ui/resizable`)

**Implementation**:
- `ResizablePanelGroup`: Container defining resize direction (`horizontal` | `vertical`)
- `ResizablePanel`: Individual panel with size constraints
- `ResizableHandle`: Draggable separator with optional visual handle

**Persistence**:
- Uses `autoSaveId` prop to persist panel sizes in localStorage
- Example: `ide-layout-horizontal`, `ide-layout-vertical`

**Collapsible Panels**:
- Sidebar: `collapsible={true}` with `ref={sidebarRef}`
- Bottom Panel: `collapsible={true}` with `ref={panelRef}`
- Controlled via `ImperativePanelHandle` methods: `collapse()`, `expand()`, `isCollapsed()`

### Drag-and-Drop System

**Library**: `@dnd-kit/core`

**Contexts**:
1. **Tree Reordering** (PrimarySidebar)
   - Drag nodes to reorder within file tree
   - Drop modes: `before`, `after`, `into` (for directories)
   - Visual feedback: Drag overlay + drop position indicator line

2. **Tab Management** (EditorContainer)
   - Drag tabs between editor groups
   - Drop zones at panel edges to create splits
   - Drag overlay displays file name badge

**Sensors**:
- `PointerSensor` with `activationConstraint: { distance: 8 }`
- Prevents accidental drags (8px movement threshold)

---

## State Management

### EditorContext

**File**: `src/contexts/EditorContext.tsx`

**Pattern**: Context API + Reducer

**State Structure**:
```typescript
{
  groups: Record<string, EditorGroup>  // Tab groups by ID
  layout: EditorLayout                 // Split/group tree structure
  lastFocusedGroupId: string           // Active editor group
}
```

**Actions**:
- `OPEN_FILE` - Opens file in tab (checks for duplicates)
- `UPDATE_TAB_CONTENT` - Updates content (marks `isDirty=true`)
- `MARK_TAB_SAVED_TO_DISK` - Confirms disk write (`isSavedToDisk=true`)
- `CLOSE_TAB` - Removes tab from group
- `SPLIT_GROUP` - Creates horizontal/vertical split
- `MOVE_TAB_BETWEEN_GROUPS` - Drag-and-drop between groups

### Auto-Save

**Hook**: `useFileSystemAutoSave` (`src/hooks/useFileSystemAutoSave.ts`)

**Mechanism**:
- 1-second debounced saves (prevents excessive writes)
- Deep comparison via `JSON.stringify` to detect real changes
- Cross-platform via `getFileSystem()` strategy pattern
- Updates `isDirty` and `isSavedToDisk` states via context actions

---

## Responsive Behavior

### Fixed Dimensions
- **ActivityBar**: `48px` width (non-resizable)
- **StatusBar**: `24px` height (non-resizable)

### Resizable Ranges
- **PrimarySidebar**: `15-40%` of viewport width
- **BottomPanel**: `10-60%` of editor area height
- **Editor Splits**: Minimum `20%` per panel

### Collapse States
- **Sidebar Collapsed**: ActivityBar remains visible, content area expands
- **Panel Collapsed**: StatusBar remains visible, editor area expands

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl+B` | Toggle Primary Sidebar |
| `⌘/Ctrl+J` | Toggle Bottom Panel |
| `⌘/Ctrl+S` | Save active file immediately |
| `⌘/Ctrl+\\` | Split editor to the right |

---

## File Type System

### Supported Types
- **`text`**: Plate JSON value persisted as string; when JSON parse fails, falls back to line-by-line plain text. Trash files open read-only.

### File Naming
- **Display Name**: User-editable label (stored in `ManoNode.name`)
- **Filename**: Auto-generated via `getNodeFilename()` function
  - Replaces invalid characters (`/\:*?"<>|`) with underscores
  - Auto-appends extension (`.mano` for SlateText, `.md` for Markdown)

---

## Configuration

### Workspace Config

**File**: `mano.conf.json` (root directory)

**Structure**:
```json
{
  "data": ManoNode[],
  "lastUpdated": "ISO 8601 timestamp"
}
```

**Special Nodes**:
- **Trash**: `id: "__trash__"`, `readOnly: true`
- **Root Directories**: Top-level nodes with `nodeType: "Directory"`

**Auto-Creation**: Generated by `createDefaultManoConfig()` if missing; `lastUpdated` is refreshed on every save

---

## Cross-Platform Support

### File System Abstraction

**Strategy Pattern**: `src/services/fileSystem/index.ts`

**Strategies**:
- **Chrome/browser**: Uses `window.showDirectoryPicker()` (File System Access API) with wrapped handles
- **Tauri**: Uses `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs`
- **Safari**: Explicitly unsupported (throws guidance to switch to desktop/Chrome)

**Detection**: `isTauri()` utility function checks for `window.__TAURI__`

**Types**:
- `IFileHandle` / `IDirectoryHandle` - Cross-platform wrappers
- Never use native `FileSystemFileHandle` / `FileSystemDirectoryHandle`

---

## Styling

### Design System
- **Framework**: Tailwind CSS 4.x (strict requirement)
- **Components**: shadcn/ui library
- **Constraints**: No raw CSS or third-party CSS allowed

### Theme Variables
- `--background` / `--foreground` - Base colors
- `--accent` - Highlight color (selected items, active tabs)
- `--border` - Separator lines
- `--primary` - StatusBar background
- `--muted` - Secondary UI elements
- `--destructive` - Error states

### Common Patterns
- **Active State**: `bg-accent` background
- **Hover State**: `hover:bg-accent hover:text-accent-foreground`
- **Disabled State**: `disabled:opacity-50 disabled:pointer-events-none`
- **Transitions**: `transition-all` with default 150ms duration

---

## Future Enhancements (Disabled Features)

The following features are currently disabled with "Coming soon..." tooltips:

### ActivityBar Icons
- Search functionality
- Source Control integration
- Run and Debug tools
- Extensions marketplace

### Panel Features
- Bottom Panel toggle (Terminal, Problems, Output, Debug Console)
- Settings panel

These controls are rendered in disabled state (`disabled` attribute) with reduced opacity, awaiting full implementation in future releases.
