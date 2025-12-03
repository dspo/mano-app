import React, { createContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { EditorState, EditorAction, EditorLayout, EditorGroup, EditorTab } from '@/types/editor'

// 初始状态
const initialState: EditorState = {
  layout: { type: 'group', groupId: 'group-1' },
  groups: {
    'group-1': {
      id: 'group-1',
      tabs: [],
      activeTabId: null,
    },
  },
  lastFocusedGroupId: 'group-1',
  nextGroupId: 2,
  nextTabId: 1,
}

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'OPEN_FILE': {
      const targetGroupId = action.groupId || state.lastFocusedGroupId
      const group = state.groups[targetGroupId]
      if (!group) return state

      // 检查文件是否已打开
      const existingTab = group.tabs.find(tab => tab.fileId === action.fileId)
      if (existingTab) {
        return {
          ...state,
          lastFocusedGroupId: targetGroupId,
          groups: {
            ...state.groups,
            [targetGroupId]: {
              ...group,
              activeTabId: existingTab.id,
            },
          },
        }
      }

      // 创建新标签页
      const newTabId = `tab-${state.nextTabId}`
      const newTab = {
        id: newTabId,
        fileId: action.fileId,
        fileName: action.fileName,
        content: action.content,
        isDirty: false,
      }

      return {
        ...state,
        lastFocusedGroupId: targetGroupId,
        groups: {
          ...state.groups,
          [targetGroupId]: {
            ...group,
            tabs: [...group.tabs, newTab],
            activeTabId: newTabId,
          },
        },
        nextTabId: state.nextTabId + 1,
      }
    }

    case 'CLOSE_TAB': {
      const group = state.groups[action.groupId]
      if (!group) return state

      const newTabs = group.tabs.filter(tab => tab.id !== action.tabId)
      let newActiveTabId = group.activeTabId

      // 如果关闭的是当前激活的标签页，选择新的激活标签页
      if (action.tabId === group.activeTabId) {
        if (newTabs.length > 0) {
          const closedIndex = group.tabs.findIndex(tab => tab.id === action.tabId)
          const newIndex = Math.min(closedIndex, newTabs.length - 1)
          newActiveTabId = newTabs[newIndex].id
        } else {
          newActiveTabId = null
        }
      }

      const newState = {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: newTabs,
            activeTabId: newActiveTabId,
          },
        },
      }

      // 如果组变空且不是唯一的组，自动关闭该组
      if (newTabs.length === 0 && Object.keys(newState.groups).length > 1) {
        return editorReducer(newState, { type: 'CLOSE_GROUP', groupId: action.groupId })
      }

      return newState
    }

    case 'CLOSE_ALL_TABS': {
      const group = state.groups[action.groupId]
      if (!group) return state

      const newState = {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: [],
            activeTabId: null,
          },
        },
      }

      // 如果不是唯一的组，关闭该组
      if (Object.keys(newState.groups).length > 1) {
        return editorReducer(newState, { type: 'CLOSE_GROUP', groupId: action.groupId })
      }

      return newState
    }

    case 'SET_ACTIVE_TAB': {
      const group = state.groups[action.groupId]
      if (!group) return state

      return {
        ...state,
        lastFocusedGroupId: action.groupId,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            activeTabId: action.tabId,
          },
        },
      }
    }

    case 'SPLIT_GROUP': {
      const group = state.groups[action.groupId]
      if (!group) return state

      // 创建新的编辑器组，如果当前组有激活的标签页，复制到新组
      const newGroupId = `group-${state.nextGroupId}`
      const activeTab = group.activeTabId ? group.tabs.find(tab => tab.id === group.activeTabId) : null
      
      const newGroup: EditorGroup = {
        id: newGroupId,
        tabs: activeTab ? [{ ...activeTab }] : [],
        activeTabId: activeTab ? activeTab.id : null,
      }

      // 更新布局树
      const newLayout = splitLayoutNode(state.layout, action.groupId, newGroupId, action.direction)

      return {
        ...state,
        layout: newLayout,
        lastFocusedGroupId: newGroupId,  // 聚焦到新创建的组
        groups: {
          ...state.groups,
          [newGroupId]: newGroup,
        },
        nextGroupId: state.nextGroupId + 1,
      }
    }

    case 'CLOSE_GROUP': {
      // 不允许关闭最后一个编辑器组
      const groupCount = Object.keys(state.groups).length
      if (groupCount <= 1) return state

      const newGroups = { ...state.groups }
      delete newGroups[action.groupId]

      const newLayout = removeLayoutNode(state.layout, action.groupId)

      // 如果关闭的是当前聚焦的组，选择一个新的
      const newLastFocusedGroupId = state.lastFocusedGroupId === action.groupId
        ? Object.keys(newGroups)[0]
        : state.lastFocusedGroupId

      return {
        ...state,
        layout: newLayout,
        lastFocusedGroupId: newLastFocusedGroupId,
        groups: newGroups,
      }
    }

    case 'UPDATE_TAB_CONTENT': {
      const group = state.groups[action.groupId]
      if (!group) return state

      const newTabs = group.tabs.map(tab =>
        tab.id === action.tabId
          ? { ...tab, content: action.content, isDirty: true }
          : tab
      )

      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: newTabs,
          },
        },
      }
    }

    case 'MOVE_TAB_BETWEEN_GROUPS': {
      const sourceGroup = state.groups[action.sourceGroupId]
      const targetGroup = state.groups[action.targetGroupId]
      if (!sourceGroup || !targetGroup) return state

      // 找到要移动的 tab
      const tabToMove = sourceGroup.tabs.find(tab => tab.id === action.tabId)
      if (!tabToMove) return state

      // 从源组移除
      const newSourceTabs = sourceGroup.tabs.filter(tab => tab.id !== action.tabId)
      let newSourceActiveTabId = sourceGroup.activeTabId

      // 如果移动的是激活的 tab，更新源组的激活状态
      if (action.tabId === sourceGroup.activeTabId) {
        if (newSourceTabs.length > 0) {
          const removedIndex = sourceGroup.tabs.findIndex(tab => tab.id === action.tabId)
          const newIndex = Math.min(removedIndex, newSourceTabs.length - 1)
          newSourceActiveTabId = newSourceTabs[newIndex].id
        } else {
          newSourceActiveTabId = null
        }
      }

      // 添加到目标组
      const newTargetTabs = [...targetGroup.tabs, tabToMove]

      const newState = {
        ...state,
        lastFocusedGroupId: action.targetGroupId,
        groups: {
          ...state.groups,
          [action.sourceGroupId]: {
            ...sourceGroup,
            tabs: newSourceTabs,
            activeTabId: newSourceActiveTabId,
          },
          [action.targetGroupId]: {
            ...targetGroup,
            tabs: newTargetTabs,
            activeTabId: tabToMove.id,  // 激活移动的 tab
          },
        },
      }

      // 如果源组变空且不是唯一的组，自动关闭
      if (newSourceTabs.length === 0 && Object.keys(newState.groups).length > 1) {
        return editorReducer(newState, { type: 'CLOSE_GROUP', groupId: action.sourceGroupId })
      }

      return newState
    }

    case 'MOVE_TAB_TO_EDGE': {
      const sourceGroup = state.groups[action.sourceGroupId]
      if (!sourceGroup) return state

      // 找到要移动的 tab
      const tabToMove = sourceGroup.tabs.find(tab => tab.id === action.tabId)
      if (!tabToMove) return state

      // 创建新的编辑器组
      const newGroupId = `group-${state.nextGroupId}`
      const newGroup: EditorGroup = {
        id: newGroupId,
        tabs: [tabToMove],
        activeTabId: tabToMove.id,
      }

      // 确定分屏方向
      const direction = (action.edge === 'left' || action.edge === 'right') ? 'horizontal' : 'vertical'

      // 更新布局树 - 在指定边缘插入新组
      const newLayout = insertLayoutNodeAtEdge(
        state.layout,
        action.sourceGroupId,
        newGroupId,
        direction,
        action.edge
      )

      // 从源组移除 tab
      const newSourceTabs = sourceGroup.tabs.filter(tab => tab.id !== action.tabId)
      let newSourceActiveTabId = sourceGroup.activeTabId

      if (action.tabId === sourceGroup.activeTabId) {
        if (newSourceTabs.length > 0) {
          const removedIndex = sourceGroup.tabs.findIndex(tab => tab.id === action.tabId)
          const newIndex = Math.min(removedIndex, newSourceTabs.length - 1)
          newSourceActiveTabId = newSourceTabs[newIndex].id
        } else {
          newSourceActiveTabId = null
        }
      }

      const newState = {
        ...state,
        layout: newLayout,
        lastFocusedGroupId: newGroupId,
        groups: {
          ...state.groups,
          [action.sourceGroupId]: {
            ...sourceGroup,
            tabs: newSourceTabs,
            activeTabId: newSourceActiveTabId,
          },
          [newGroupId]: newGroup,
        },
        nextGroupId: state.nextGroupId + 1,
      }

      // 如果源组变空且不是唯一的组，自动关闭
      if (newSourceTabs.length === 0 && Object.keys(newState.groups).length > 1) {
        return editorReducer(newState, { type: 'CLOSE_GROUP', groupId: action.sourceGroupId })
      }

      return newState
    }

    case 'REORDER_TABS': {
      const group = state.groups[action.groupId]
      if (!group) return state

      // Reorder tabs based on the new order
      const newTabs = action.tabIds.map(tabId => 
        group.tabs.find(tab => tab.id === tabId)
      ).filter((tab): tab is EditorTab => tab !== undefined)

      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: newTabs,
          },
        },
      }
    }

    default:
      return state
  }
}

// 辅助函数：在布局树中分割节点
function splitLayoutNode(
  layout: EditorLayout,
  targetGroupId: string,
  newGroupId: string,
  direction: 'horizontal' | 'vertical'
): EditorLayout {
  if (layout.type === 'group' && layout.groupId === targetGroupId) {
    return {
      type: 'split',
      direction,
      children: [
        { type: 'group', groupId: targetGroupId },
        { type: 'group', groupId: newGroupId },
      ],
      sizes: [50, 50],
    }
  }

  if (layout.type === 'split') {
    return {
      ...layout,
      children: layout.children.map(child =>
        splitLayoutNode(child, targetGroupId, newGroupId, direction)
      ),
    }
  }

  return layout
}

// 辅助函数：在布局树的边缘插入新节点
function insertLayoutNodeAtEdge(
  layout: EditorLayout,
  targetGroupId: string,
  newGroupId: string,
  direction: 'horizontal' | 'vertical',
  edge: 'left' | 'right' | 'top' | 'bottom'
): EditorLayout {
  // 找到目标组所在的分屏节点
  if (layout.type === 'group' && layout.groupId === targetGroupId) {
    // 目标组是根节点，直接创建分屏
    const children = edge === 'left' || edge === 'top'
      ? [{ type: 'group' as const, groupId: newGroupId }, { type: 'group' as const, groupId: targetGroupId }]
      : [{ type: 'group' as const, groupId: targetGroupId }, { type: 'group' as const, groupId: newGroupId }]
    
    return {
      type: 'split',
      direction,
      children,
      sizes: [50, 50],
    }
  }

  if (layout.type === 'split') {
    // 递归查找目标组
    const newChildren = layout.children.map(child =>
      insertLayoutNodeAtEdge(child, targetGroupId, newGroupId, direction, edge)
    )
    
    return {
      ...layout,
      children: newChildren,
    }
  }

  return layout
}

// 辅助函数：从布局树中移除节点
function removeLayoutNode(layout: EditorLayout, targetGroupId: string): EditorLayout {
  if (layout.type === 'split') {
    const newChildren = layout.children.filter(child => {
      if (child.type === 'group') {
        return child.groupId !== targetGroupId
      }
      return true
    })

    // 如果只剩一个子节点，直接返回该子节点
    if (newChildren.length === 1) {
      return newChildren[0]
    }

    return {
      ...layout,
      children: newChildren.map(child => removeLayoutNode(child, targetGroupId)),
    }
  }

  return layout
}

// Context
export interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

export const EditorContext = createContext<EditorContextValue | null>(null)

// Provider
export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  )
}
