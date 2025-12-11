import type { IFileHandle } from '@/services/fileSystem'

/**
 * Editor Model - Single Source of Truth for File Content
 * 
 * This represents the actual content of a file, decoupled from its UI representation.
 * Multiple tabs can reference the same model, ensuring content consistency.
 * 
 * This follows the architecture pattern of VS Code and Monaco Editor.
 */
export interface EditorModel {
  id: string              // Unique model ID (e.g., "model-1")
  fileId: string          // Reference to the node/file ID
  fileName: string
  fileType: 'text'
  content: string
  isDirty: boolean
  isSavedToDisk: boolean
  version: number         // Incremented on every content change to force consumer refresh
  fileHandle?: FileSystemFileHandle | IFileHandle
  readOnly?: boolean      // Whether file is in read-only mode (e.g., trash)
}

/**
 * Editor Tab - View of an Editor Model
 * 
 * A tab is a lightweight reference to a model.
 * Multiple tabs can view the same model - they automatically stay in sync.
 */
export interface EditorTab {
  id: string              // Unique tab ID (e.g., "tab-1")
  modelId: string         // Reference to EditorModel (not a copy)
}

// Editor group
export interface EditorGroup {
  id: string
  tabs: EditorTab[]
  activeTabId: string | null
}

// Editor layout node (tree structure)
export type EditorLayout = 
  | { type: 'group'; groupId: string; size?: number }
  | { type: 'split'; direction: 'horizontal' | 'vertical'; children: EditorLayout[]; sizes?: number[] }

// Editor global state
export interface EditorState {
  models: Record<string, EditorModel>  // Content storage (single source of truth)
  layout: EditorLayout
  groups: Record<string, EditorGroup>
  lastFocusedGroupId: string  // ID of the last focused editor group
  nextGroupId: number
  nextTabId: number
  nextModelId: number          // New: for generating model IDs
}

// Editor Action types
export type EditorAction =
  | { type: 'OPEN_FILE'; fileId: string; fileName: string; fileType: 'text'; content: string; groupId?: string; fileHandle?: FileSystemFileHandle | IFileHandle; readOnly?: boolean }
  | { type: 'CLOSE_TAB'; tabId: string; groupId: string }
  | { type: 'CLOSE_ALL_TABS'; groupId: string }
  | { type: 'CLOSE_FILE_IN_ALL_GROUPS'; fileId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string; groupId: string }
  | { type: 'SPLIT_GROUP'; groupId: string; direction: 'horizontal' | 'vertical' }
  | { type: 'CLOSE_GROUP'; groupId: string }
  | { type: 'UPDATE_MODEL_CONTENT'; modelId: string; content: string }
  | { type: 'MARK_MODEL_SAVED'; modelId: string }
  | { type: 'MARK_MODEL_SAVED_TO_DISK'; modelId: string }
  | { type: 'MOVE_TAB_BETWEEN_GROUPS'; tabId: string; sourceGroupId: string; targetGroupId: string }
  | { type: 'MOVE_TAB_TO_EDGE'; tabId: string; sourceGroupId: string; edge: 'left' | 'right' }
  | { type: 'REORDER_TABS'; groupId: string; tabIds: string[] }
