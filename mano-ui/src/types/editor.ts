import type { IFileHandle } from '@/services/fileSystem'

// 编辑器标签页
export interface EditorTab {
  id: string
  fileId: string
  fileName: string
  fileType: 'text' | 'slate' // text: 普通文本, slate: 富文本
  content: unknown // string for text, Slate JSON for slate
  isDirty: boolean
  isSavedToDisk: boolean // 是否已保存到磁盘
  fileHandle?: FileSystemFileHandle | IFileHandle // 文件句柄，用于保存
  readOnly?: boolean // 是否为只读模式（垃圾篓中的文件）
}

// 编辑器组
export interface EditorGroup {
  id: string
  tabs: EditorTab[]
  activeTabId: string | null
}

// 编辑器布局节点（树结构）
export type EditorLayout = 
  | { type: 'group'; groupId: string; size?: number }
  | { type: 'split'; direction: 'horizontal' | 'vertical'; children: EditorLayout[]; sizes?: number[] }

// 编辑器全局状态
export interface EditorState {
  layout: EditorLayout
  groups: Record<string, EditorGroup>
  lastFocusedGroupId: string  // 最后聚焦的编辑器组 ID
  nextGroupId: number
  nextTabId: number
}

// 编辑器 Action 类型
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
