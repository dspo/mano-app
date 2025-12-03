import { X, PanelRight } from 'lucide-react'
import type { EditorGroup } from '@/types/editor'
import { useEditor } from '@/hooks/useEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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

interface EditorGroupWrapperProps {
  group: EditorGroup
}

interface SortableTabProps {
  tab: { id: string; fileName: string; isDirty: boolean; fileId: string }
  groupId: string
  onClose: (tabId: string) => void
}

function SortableTab({ tab, groupId, onClose }: SortableTabProps) {
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
      sourceGroupId: groupId,
      type: 'tab-sort', // 区分组内排序和跨组移动
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
      className="gap-2"
      style={style}
      {...attributes}
      {...listeners}
    >
      <span className="text-sm">{tab.fileName}</span>
      {tab.isDirty && <span className="w-2 h-2 rounded-full bg-primary" />}
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 hover:bg-accent ml-1"
        onClick={(e) => {
          e.stopPropagation()
          onClose(tab.id)
        }}
      >
        <X className="w-3 h-3" />
      </Button>
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
      // 点击编辑器区域任意位置时更新聚焦状态
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
                  {group.tabs.map((tab) => (
                    <SortableTab
                      key={tab.id}
                      tab={tab}
                      groupId={group.id}
                      onClose={handleFileClose}
                    />
                  ))}
                </SortableContext>
              </TabsList>
            </div>

          {group.tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 font-mono text-sm">
                  <pre className="whitespace-pre-wrap">{tab.content}</pre>
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
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
