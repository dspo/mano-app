// 编辑器标签页
export interface EditorTab {
  id: string
  fileId: string
  fileName: string
  content: string
  isDirty: boolean
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
  | { type: 'OPEN_FILE'; fileId: string; fileName: string; content: string; groupId?: string }
  | { type: 'CLOSE_TAB'; tabId: string; groupId: string }
  | { type: 'CLOSE_ALL_TABS'; groupId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string; groupId: string }
  | { type: 'SPLIT_GROUP'; groupId: string; direction: 'horizontal' | 'vertical' }
  | { type: 'CLOSE_GROUP'; groupId: string }
  | { type: 'UPDATE_TAB_CONTENT'; tabId: string; groupId: string; content: string }
  | { type: 'MOVE_TAB_BETWEEN_GROUPS'; tabId: string; sourceGroupId: string; targetGroupId: string }
  | { type: 'MOVE_TAB_TO_EDGE'; tabId: string; sourceGroupId: string; edge: 'left' | 'right' }
  | { type: 'REORDER_TABS'; groupId: string; tabIds: string[] }
