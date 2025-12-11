import { X, PanelRight } from 'lucide-react'
import type { EditorGroup, EditorModel } from '@/types/editor'
import { useEditor } from '@/hooks/useEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AutoSaveTextEditor } from '@/components/editor/TextEditor'

interface EditorGroupWrapperProps {
  group: EditorGroup
}

interface SortableTabProps {
  tab: { id: string; modelId: string }
  model: EditorModel
  groupId: string
  onClose: (tabId: string) => void
}

function SortableTab({ tab, model, groupId, onClose }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tab.id,
    data: {
      tab,
      model,
      sourceGroupId: groupId,
      type: 'tab-sort', // Distinguish between intra-group sorting and cross-group movement
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TabsTrigger
      ref={setNodeRef}
      value={tab.id}
      className="gap-2 relative group"
      style={style}
      {...attributes}
      {...listeners}
    >
      <span className="text-sm">{model.fileName}</span>
      {model.isDirty && (
        <span 
          className={`w-2 h-2 rounded-full ${model.isSavedToDisk ? 'bg-orange-500' : 'bg-primary'}`}
          title={model.isSavedToDisk ? 'Saved to IndexedDB, not yet saved to disk' : 'Modified'}
        />
      )}
      <div
        role="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-accent ml-1 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onClose(tab.id)
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <X className="w-3 h-3" />
      </div>
    </TabsTrigger>
  )
}

export function EditorGroupWrapper({ group }: EditorGroupWrapperProps) {
  const { dispatch, state } = useEditor()
  const isFocused = state.lastFocusedGroupId === group.id

  // Make group a drop target
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `group-${group.id}`,
    data: {
      type: 'group',
      groupId: group.id,
    },
  })

  const handleFocus = () => {
    if (!isFocused) {
      // Update focus state when clicking anywhere in the editor area
      if (group.activeTabId) {
        dispatch({ type: 'SET_ACTIVE_TAB', tabId: group.activeTabId, groupId: group.id })
      }
    }
  }

  const handleFileSelect = (tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tabId, groupId: group.id })
  }

  const handleFileClose = (tabId: string) => {
    dispatch({ type: 'CLOSE_TAB', tabId, groupId: group.id })
  }

  const handleSplitRight = () => {
    dispatch({ type: 'SPLIT_GROUP', groupId: group.id, direction: 'horizontal' })
  }

  const handleCloseAllTabs = () => {
    dispatch({ type: 'CLOSE_ALL_TABS', groupId: group.id })
  }

  if (group.tabs.length === 0) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div 
            ref={setDropRef}
            onClick={handleFocus}
            className={`flex-1 flex items-center justify-center text-muted-foreground h-full transition-all ${
              isFocused ? 'bg-background' : 'bg-muted/50 opacity-60'
            } ${isOver ? 'ring-2 ring-primary ring-inset' : ''}`}
          >
            <div className="text-center">
              <p className="text-lg mb-2">No file opened</p>
              <p className="text-sm">Select a file from the explorer to start editing</p>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleSplitRight}>
            <PanelRight className="w-4 h-4 mr-2" />
            Split Editor Right
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          ref={setDropRef}
          onClick={handleFocus} 
          className={`h-full transition-all ${isFocused ? '' : 'opacity-60'} ${isOver ? 'ring-2 ring-primary ring-inset' : ''}`}
        >
          <Tabs value={group.activeTabId || undefined} onValueChange={handleFileSelect} className="h-full flex flex-col">
            <div className={`h-10 rounded-none justify-start border-b flex items-center transition-colors ${
              isFocused ? 'bg-muted/50' : 'bg-muted/30'
            }`}>
              <TabsList className="h-10 bg-transparent rounded-none justify-start border-0 flex-1">
                <SortableContext items={group.tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                  {group.tabs.map((tab) => {
                    const model = state.models[tab.modelId]
                    if (!model) return null
                    return (
                      <SortableTab
                        key={tab.id}
                        tab={tab}
                        model={model}
                        groupId={group.id}
                        onClose={handleFileClose}
                      />
                    )
                  })}
                </SortableContext>
              </TabsList>
            </div>

          {group.tabs.map((tab) => {
            const model = state.models[tab.modelId]
            if (!model) return null

            return (
              <TabsContent key={tab.id} value={tab.id} className="flex-1 m-0">
                <AutoSaveTextEditor
                  key={model.id}
                  value={model.content}
                  modelId={model.id}
                  fileHandle={model.fileHandle}
                  readOnly={model.readOnly}
                  onSaveSuccess={() => {
                    dispatch({
                      type: 'MARK_MODEL_SAVED',
                      modelId: model.id,
                    })
                  }}
                  onSaveError={(error) => {
                    console.error('Failed to auto-save:', error)
                  }}
                  onChange={(newValue: string) => {
                    dispatch({
                      type: 'UPDATE_MODEL_CONTENT',
                      modelId: model.id,
                      content: newValue,
                    })
                  }}
                />
              </TabsContent>
            )
          })}
        </Tabs>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleSplitRight}>
          <PanelRight className="w-4 h-4 mr-2" />
          Split Editor Right
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleCloseAllTabs} disabled={group.tabs.length === 0}>
          Close All Tabs
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
