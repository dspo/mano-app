import type { IFileHandle } from '@/services/fileSystem'

// Editor tab
export interface EditorTab {
  id: string
  fileId: string
  fileName: string
  fileType: 'text' | 'slate' // text: plain text, slate: rich text
  content: unknown // string for text, Slate JSON for slate
  isDirty: boolean
  isSavedToDisk: boolean // Whether saved to disk
  fileHandle?: FileSystemFileHandle | IFileHandle // File handle for saving
  readOnly?: boolean // Whether in read-only mode (files in trash)
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
  layout: EditorLayout
  groups: Record<string, EditorGroup>
  lastFocusedGroupId: string  // ID of the last focused editor group
  nextGroupId: number
  nextTabId: number
}

// Editor Action types
export type EditorAction =
  | { type: 'OPEN_FILE'; fileId: string; fileName: string; fileType: 'text' | 'slate'; content: unknown; groupId?: string; fileHandle?: FileSystemFileHandle | IFileHandle; readOnly?: boolean }
  | { type: 'CLOSE_TAB'; tabId: string; groupId: string }
  | { type: 'CLOSE_ALL_TABS'; groupId: string }
  | { type: 'CLOSE_FILE_IN_ALL_GROUPS'; fileId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string; groupId: string }
  | { type: 'SPLIT_GROUP'; groupId: string; direction: 'horizontal' | 'vertical' }
  | { type: 'CLOSE_GROUP'; groupId: string }
  | { type: 'UPDATE_TAB_CONTENT'; tabId: string; groupId: string; content: unknown }
  | { type: 'MARK_TAB_SAVED'; tabId: string; groupId: string }
  | { type: 'MARK_TAB_SAVED_TO_DISK'; tabId: string; groupId: string }
  | { type: 'MOVE_TAB_BETWEEN_GROUPS'; tabId: string; sourceGroupId: string; targetGroupId: string }
  | { type: 'MOVE_TAB_TO_EDGE'; tabId: string; sourceGroupId: string; edge: 'left' | 'right' }
  | { type: 'REORDER_TABS'; groupId: string; tabIds: string[] }
