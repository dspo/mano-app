import React, { createContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { EditorState, EditorAction, EditorLayout, EditorGroup, EditorTab, EditorModel } from '@/types/editor'

// Initial state
const initialState: EditorState = {
  models: {},
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
  nextModelId: 1,
}

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'OPEN_FILE': {
      const targetGroupId = action.groupId || state.lastFocusedGroupId
      const group = state.groups[targetGroupId]
      if (!group) return state

      // Check if model for this file already exists
      const existingModel = Object.values(state.models).find(m => m.fileId === action.fileId)
      
      if (existingModel) {
        // File already open - check if tab exists in this group
        const existingTab = group.tabs.find(tab => tab.modelId === existingModel.id)
        if (existingTab) {
          // Tab already exists in this group, just activate it
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
        
        // File open in other group, create new tab pointing to same model
        const newTabId = `tab-${state.nextTabId}`
        const newTab: EditorTab = {
          id: newTabId,
          modelId: existingModel.id,
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

      // File not open yet - create new model
      const newModelId = `model-${state.nextModelId}`
      const newModel: EditorModel = {
        id: newModelId,
        fileId: action.fileId,
        fileName: action.fileName,
        fileType: action.fileType,
        content: action.content,
        isDirty: false,
        isSavedToDisk: true,
        version: 0,
        fileHandle: action.fileHandle,
        readOnly: action.readOnly || false,
      }

      const newTabId = `tab-${state.nextTabId}`
      const newTab: EditorTab = {
        id: newTabId,
        modelId: newModelId,
      }

      return {
        ...state,
        models: {
          ...state.models,
          [newModelId]: newModel,
        },
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
        nextModelId: state.nextModelId + 1,
      }
    }

    case 'CLOSE_TAB': {
      const group = state.groups[action.groupId]
      if (!group) return state

      const closedTab = group.tabs.find(tab => tab.id === action.tabId)
      const newTabs = group.tabs.filter(tab => tab.id !== action.tabId)
      let newActiveTabId = group.activeTabId

      // If closing the currently active tab, select a new active tab
      if (action.tabId === group.activeTabId) {
        if (newTabs.length > 0) {
          const closedIndex = group.tabs.findIndex(tab => tab.id === action.tabId)
          const newIndex = Math.min(closedIndex, newTabs.length - 1)
          newActiveTabId = newTabs[newIndex].id
        } else {
          newActiveTabId = null
        }
      }

      let newModels = { ...state.models }

      // Check if model is still referenced by any tab in any group
      if (closedTab) {
        const modelIsInUse = Object.values(state.groups).some(grp =>
          grp.id === action.groupId
            ? newTabs.some(tab => tab.modelId === closedTab.modelId) // Use newTabs for current group
            : grp.tabs.some(tab => tab.modelId === closedTab.modelId) // Use old tabs for other groups
        )

        // If model is not in use anymore, remove it
        if (!modelIsInUse) {
          const { [closedTab.modelId]: _, ...remaining } = newModels
          newModels = remaining
        }
      }

      const newState = {
        ...state,
        models: newModels,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: newTabs,
            activeTabId: newActiveTabId,
          },
        },
      }

      // If group becomes empty and is not the only group, automatically close it
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

      // If not the only group, close it
      if (Object.keys(newState.groups).length > 1) {
        return editorReducer(newState, { type: 'CLOSE_GROUP', groupId: action.groupId })
      }

      return newState
    }

    case 'CLOSE_FILE_IN_ALL_GROUPS': {
      // Close specified file in all groups
      let newState = { ...state }
      let hasChanges = false

      Object.keys(newState.groups).forEach(groupId => {
        const group = newState.groups[groupId]
        // Match by the model's fileId because tabs no longer carry fileId
        const tabsWithFile = group.tabs.filter(tab => {
          const model = newState.models[tab.modelId]
          return model?.fileId === action.fileId
        })
        
        if (tabsWithFile.length > 0) {
          hasChanges = true
          // Close all tabs of this file in the group
          tabsWithFile.forEach(tab => {
            newState = editorReducer(newState, { 
              type: 'CLOSE_TAB', 
              tabId: tab.id, 
              groupId: groupId 
            })
          })
        }
      })

      return hasChanges ? newState : state
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

      // Create new Editor group, if current group has active tab, copy to new group
      const newGroupId = `group-${state.nextGroupId}`
      const activeTab = group.activeTabId ? group.tabs.find(tab => tab.id === group.activeTabId) : null
      
      const newGroup: EditorGroup = {
        id: newGroupId,
        tabs: activeTab ? [{ ...activeTab }] : [],
        activeTabId: activeTab ? activeTab.id : null,
      }

      // Update layout tree
      const newLayout = splitLayoutNode(state.layout, action.groupId, newGroupId, action.direction)

      return {
        ...state,
        layout: newLayout,
        lastFocusedGroupId: newGroupId,  // Focus on newly created group
        groups: {
          ...state.groups,
          [newGroupId]: newGroup,
        },
        nextGroupId: state.nextGroupId + 1,
      }
    }

    case 'CLOSE_GROUP': {
      // Cannot close the last Editor group
      const groupCount = Object.keys(state.groups).length
      if (groupCount <= 1) return state

      const newGroups = { ...state.groups }
      delete newGroups[action.groupId]

      const newLayout = removeLayoutNode(state.layout, action.groupId)

      // If closing the currently focused group, select a new one
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

    case 'UPDATE_MODEL_CONTENT': {
      const model = state.models[action.modelId]
      if (!model) return state

      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: {
            ...model,
            content: action.content,
            isDirty: true,
            isSavedToDisk: false,
            version: (model.version ?? 0) + 1,
          },
        },
      }
    }

    case 'UPDATE_MODEL_FILE_META': {
      const updatedModels: EditorState['models'] = {}

      Object.entries(state.models).forEach(([modelId, model]) => {
        if (model.fileId === action.fileId) {
          updatedModels[modelId] = {
            ...model,
            fileName: action.fileName,
            fileHandle: action.fileHandle ?? model.fileHandle,
          }
        } else {
          updatedModels[modelId] = model
        }
      })

      return {
        ...state,
        models: updatedModels,
      }
    }

    case 'MARK_MODEL_SAVED': {
      const model = state.models[action.modelId]
      if (!model) return state

      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: {
            ...model,
            isDirty: false,
            isSavedToDisk: true,
          },
        },
      }
    }

    case 'MARK_MODEL_SAVED_TO_DISK': {
      const model = state.models[action.modelId]
      if (!model) return state

      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: {
            ...model,
            isDirty: false,
            isSavedToDisk: true,
          },
        },
      }
    }

    case 'MOVE_TAB_BETWEEN_GROUPS': {
      const sourceGroup = state.groups[action.sourceGroupId]
      const targetGroup = state.groups[action.targetGroupId]
      if (!sourceGroup || !targetGroup) return state

      // Find tab to move
      const tabToMove = sourceGroup.tabs.find(tab => tab.id === action.tabId)
      if (!tabToMove) return state

      // Remove from source group
      const newSourceTabs = sourceGroup.tabs.filter(tab => tab.id !== action.tabId)
      let newSourceActiveTabId = sourceGroup.activeTabId

      // If moving the active tab, update source group active state
      if (action.tabId === sourceGroup.activeTabId) {
        if (newSourceTabs.length > 0) {
          const removedIndex = sourceGroup.tabs.findIndex(tab => tab.id === action.tabId)
          const newIndex = Math.min(removedIndex, newSourceTabs.length - 1)
          newSourceActiveTabId = newSourceTabs[newIndex].id
        } else {
          newSourceActiveTabId = null
        }
      }

      // Add to target group
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
            activeTabId: tabToMove.id,  // Activate moved tab
          },
        },
      }

      // If source group becomes empty and is not the only group, automatically close it
      if (newSourceTabs.length === 0 && Object.keys(newState.groups).length > 1) {
        return editorReducer(newState, { type: 'CLOSE_GROUP', groupId: action.sourceGroupId })
      }

      return newState
    }

    case 'MOVE_TAB_TO_EDGE': {
      const sourceGroup = state.groups[action.sourceGroupId]
      if (!sourceGroup) return state

      // Find tab to move
      const tabToMove = sourceGroup.tabs.find(tab => tab.id === action.tabId)
      if (!tabToMove) return state

      // Create new Editor group
      const newGroupId = `group-${state.nextGroupId}`
      const newGroup: EditorGroup = {
        id: newGroupId,
        tabs: [tabToMove],
        activeTabId: tabToMove.id,
      }

      // Determine split direction
      const direction = (action.edge === 'left' || action.edge === 'right') ? 'horizontal' : 'vertical'

      // Update layout tree - insert new group at specified edge
      const newLayout = insertLayoutNodeAtEdge(
        state.layout,
        action.sourceGroupId,
        newGroupId,
        direction,
        action.edge
      )

      // Remove tab from source group
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

      // If source group becomes empty and is not the only group, automatically close it
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

// Helper function: split node in layout tree
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

// Helper function: insert new node at edge of layout tree
function insertLayoutNodeAtEdge(
  layout: EditorLayout,
  targetGroupId: string,
  newGroupId: string,
  direction: 'horizontal' | 'vertical',
  edge: 'left' | 'right' | 'top' | 'bottom'
): EditorLayout {
  // Find split node containing target group
  if (layout.type === 'group' && layout.groupId === targetGroupId) {
    // Target group is root node, directly create split
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
    // Recursively find target group
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

// Helper function: remove node from layout tree
function removeLayoutNode(layout: EditorLayout, targetGroupId: string): EditorLayout {
  if (layout.type === 'split') {
    const newChildren = layout.children.filter(child => {
      if (child.type === 'group') {
        return child.groupId !== targetGroupId
      }
      return true
    })

    // If only one child node remains, return that child node directly
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
