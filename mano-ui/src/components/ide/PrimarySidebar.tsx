import { ChevronRight, ChevronDown, FileText, Library, TextQuote, TextAlignStart, Plus, Trash2, ArrowUpFromLine, Trash } from 'lucide-react'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { ManoNode } from '@/types/mano-config'
import { ManoTextAlignStartIcon } from '@/icons/icons'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { ManoLogoIcon } from '@/icons/ManoLogoIcon'

// For backward compatibility, keep FileNode as alias
export type FileNode = ManoNode

interface FileTreeItemProps {
  node: FileNode
  level: number
  onFileClick: (file: FileNode) => void
  selectedFile: string | null
  onReorder?: (payload: { sourceId: string; targetId: string; mode: 'before' | 'after' | 'into' }) => void
  dragOverId?: string | null
  dropMode?: 'before' | 'after' | 'into' | null
  dropLevel?: number
  onCreateNode?: (parentNode: FileNode) => void
  editingNodeId?: string | null
  onStartRename?: (nodeId: string) => void
  onRenameNode?: (nodeId: string, newName: string) => void
  onCancelEdit?: () => void
  onRemoveNode?: (node: FileNode) => void
  onMoveOut?: (node: FileNode) => void
  onDeleteNode?: (node: FileNode) => void
  isInTrash?: boolean
  movingOutNodeId?: string | null
  removingNodeId?: string | null
  contextMenuNodeId?: string | null
  onContextMenuChange?: (nodeId: string | null) => void
  onToggleExpand?: (nodeId: string, isExpanded: boolean) => void
}

function FileTreeItem({ node, level, onFileClick, selectedFile, onReorder, dragOverId, dropMode, dropLevel, onCreateNode, editingNodeId, onStartRename, onRenameNode, onCancelEdit, onRemoveNode, onMoveOut, onDeleteNode, isInTrash = false, movingOutNodeId, removingNodeId, contextMenuNodeId, onContextMenuChange, onToggleExpand }: FileTreeItemProps) {
  // Read initial state from node.expanded (default false if not set)
  const [isOpen, setIsOpen] = useState(node.expanded ?? false)
  const [editValue, setEditValue] = useState(node.name)
  const isEditing = editingNodeId === node.id
  const isContextMenuActive = contextMenuNodeId === node.id
  
  // Double-click detection
  const lastClickTimeRef = useRef<number>(0)
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Handle toggle and notify parent
  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggleExpand?.(node.id, newState)
  }
  
  // Check if current node is trash or inside trash
  const isTrashNode = node.id === '__trash__' || isInTrash
  
  // Handle double-click to enter rename mode
  const handleNodeDoubleClick = () => {
    // Prevent renaming trash node or nodes inside trash
    if (isTrashNode) return
    // Also prevent renaming if node is read-only
    if (node.readOnly) return
    
    onStartRename?.(node.id)
  }
  
  // Handle click with double-click detection
  const handleNodeClick = () => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTimeRef.current
    
    // Clear any pending timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }
    
    // Double-click detected (within 300ms)
    if (timeSinceLastClick < 300) {
      handleNodeDoubleClick()
      lastClickTimeRef.current = 0
      return
    }
    
    lastClickTimeRef.current = now
    
    // Single click
    clickTimeoutRef.current = setTimeout(() => {
      // For directories: toggle expand/collapse
      if (isDirectory) {
        handleToggle()
      } else {
        // For files: select the file
        onFileClick(node)
      }
      lastClickTimeRef.current = 0
    }, 300)
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])
  
  // Update editValue when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditValue(node.name)
    }
  }, [isEditing, node.name])
  
  // Determine if node is a directory
  const isDirectory = node.nodeType === 'Directory'
  
  // Select icon based on node type
  const getFileIcon = () => {
    switch (node.nodeType) {
      case 'SlateText':
        return hasChildren ? (
          <ManoTextAlignStartIcon className="w-4 h-4 shrink-0 text-primary" />
        ) : (
          <TextAlignStart className="w-4 h-4 shrink-0 text-primary" />
        )
      case 'Markdown':
        return <TextQuote className="w-4 h-4 shrink-0" />
      default:
        return <FileText className="w-4 h-4 shrink-0" />
    }
  }

  // Select icon for directory nodes
  const getDirectoryIcon = () => {
    // Special icon for trash node
    if (node.id === '__trash__') {
      // Empty trash vs trash with items
      return hasChildren ? (
        <Trash2 className="w-4 h-4 shrink-0" />
      ) : (
        <Trash className="w-4 h-4 shrink-0" />
      )
    }
    return <Library className="w-4 h-4 shrink-0" />
  }

  // DnD kit bindings - disable dragging for nodes in trash
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({ 
    id: node.id, 
    data: { node, level },
    disabled: isTrashNode // Disable dragging of nodes in trash
  })
  const { setNodeRef: setDropRef } = useDroppable({ id: `row-${node.id}`, data: { node, type: 'row', level } })
  
  // drop indicator
  const showBefore = dragOverId === node.id && dropMode === 'before'
  const showAfter = dragOverId === node.id && dropMode === 'after'
  const hasChildren = node.children && node.children.length > 0
  
  // Calculate drop line indentation
  const getDropLineIndent = () => {
    if (dropLevel === undefined) return level * 12 + 8
    return dropLevel * 12 + 8
  }

  if (!isDirectory) {
    // Render file node - can also have children now
    return (
      <div 
        className={cn(
          "relative transition-all duration-500",
          movingOutNodeId === node.id && "opacity-0 scale-95",
          removingNodeId === node.id && "opacity-0 scale-95"
        )}
      >
        {showBefore && (
          <div 
            className="absolute top-0 h-0.5 bg-primary rounded z-10"
            style={{ left: `${getDropLineIndent()}px`, right: '4px' }}
            color='blue'
          />
        )}

        <ContextMenu onOpenChange={(open) => onContextMenuChange?.(open ? node.id : null)}>
          <ContextMenuTrigger asChild>
            <div
              ref={(el) => {
                setDragRef(el)
                setDropRef(el)
              }}
              data-id={node.id}
              className={cn(
                "relative flex items-center transition-all duration-300",
                isContextMenuActive && "scale-[1.02] shadow-md shadow-primary/10 rounded-lg"
              )}
            >
              {isEditing ? (
                <div
                  className="w-full flex items-center gap-2 px-2 py-1 text-sm relative z-10"
                  style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                  {getFileIcon()}
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      if (editValue.trim()) {
                        onRenameNode?.(node.id, editValue.trim())
                      } else {
                        onCancelEdit?.()
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editValue.trim()) {
                          onRenameNode?.(node.id, editValue.trim())
                        } else {
                          onCancelEdit?.()
                        }
                      } else if (e.key === 'Escape') {
                        onCancelEdit?.()
                      }
                    }}
                    autoFocus
                    className="flex-1 bg-background border border-primary rounded px-1 py-0.5 text-sm outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  {hasChildren && <div className="w-3 h-3 shrink-0" />}
                </div>
              ) : (
                <>
                  <button
                    className={cn(
                      'flex-1 flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer relative z-10',
                      selectedFile === node.id && 'bg-accent',
                      node.readOnly && 'opacity-60',
                      isDragging && 'opacity-30'
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={handleNodeClick}
                    {...listeners}
                    {...attributes}
                    disabled={node.readOnly}
                  >
                    {getFileIcon()}
                    <span className="truncate">{node.name}</span>
                  </button>
                  {hasChildren && (
                    <button
                      className="px-2 py-1 hover:bg-accent/50 cursor-pointer relative z-10"
                      onClick={handleToggle}
                      disabled={node.readOnly}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                      ) : (
                        <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            {isInTrash && node.id !== '__trash__' && (
              <>
                <ContextMenuItem
                  onClick={() => onMoveOut?.(node)}
                >
                  <ArrowUpFromLine className="w-4 h-4 mr-2" />
                  Move out
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onDeleteNode?.(node)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </>
            )}
            {!isInTrash && (
              <>
                <ContextMenuItem
                  onClick={() => onCreateNode?.(node)}
                  disabled={node.readOnly || isTrashNode}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Mano Text
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onRemoveNode?.(node)}
                  disabled={node.readOnly || isTrashNode}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {isOpen && hasChildren && (
          <div className="relative">
            {node.children!.map((child) => (
              <FileTreeItem
                key={child.id}
                node={child}
                level={level + 1}
                onFileClick={onFileClick}
                selectedFile={selectedFile}
                onReorder={onReorder}
                dragOverId={dragOverId}
                dropMode={dropMode}
                dropLevel={dropLevel}
                onCreateNode={onCreateNode}
                editingNodeId={editingNodeId}
                onStartRename={onStartRename}
                onRenameNode={onRenameNode}
                onCancelEdit={onCancelEdit}
                onRemoveNode={onRemoveNode}
                onMoveOut={onMoveOut}
                onDeleteNode={onDeleteNode}
                isInTrash={isTrashNode}
                movingOutNodeId={movingOutNodeId}
                removingNodeId={removingNodeId}
                contextMenuNodeId={contextMenuNodeId}
                onContextMenuChange={onContextMenuChange}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </div>
        )}
        {showAfter && (
          <div 
            className="absolute bottom-0 h-0.5 bg-primary rounded z-10"
            style={{ left: `${getDropLineIndent()}px`, right: '4px' }}
          />
        )}
      </div>
    )
  }

  // Render directory node
  return (
    <div 
      className={cn(
        "relative transition-all duration-500",
        movingOutNodeId === node.id && "opacity-0 scale-95",
        removingNodeId === node.id && "opacity-0 scale-95"
      )}
    >
      {showBefore && (
        <div 
          className="absolute top-0 h-0.5 bg-primary rounded z-10"
          style={{ left: `${getDropLineIndent()}px`, right: '4px' }}
        />
      )}

      <ContextMenu onOpenChange={(open) => onContextMenuChange?.(open ? node.id : null)}>
        <ContextMenuTrigger asChild>
          <div
            ref={(el) => {
              setDragRef(el)
              setDropRef(el)
            }}
            data-id={node.id}
            className={cn(
              "relative transition-all duration-300",
              isContextMenuActive && "scale-[1.02] shadow-md shadow-primary/10 rounded-lg"
            )}
          >
            {isEditing ? (
              <div
                className="w-full flex items-center gap-1 px-2 py-1 text-sm relative z-10"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
              >
                {getDirectoryIcon()}
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (editValue.trim()) {
                      onRenameNode?.(node.id, editValue.trim())
                    } else {
                      onCancelEdit?.()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editValue.trim()) {
                        onRenameNode?.(node.id, editValue.trim())
                      } else {
                        onCancelEdit?.()
                      }
                    } else if (e.key === 'Escape') {
                      onCancelEdit?.()
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-background border border-primary rounded px-1 py-0.5 text-sm outline-none"
                  onFocus={(e) => e.target.select()}
                />
                <div className="w-4 h-4 shrink-0" />
              </div>
            ) : (
              <button
                className={cn(
                  'w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer relative z-10',
                  node.readOnly && 'opacity-60',
                  isDragging && 'opacity-30'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleNodeClick}
                {...listeners}
                {...attributes}
              >
                {getDirectoryIcon()}
                <span className="truncate">{node.name}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 shrink-0 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 ml-auto" />
                )}
              </button>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {isInTrash && node.id !== '__trash__' && (
            <>
              <ContextMenuItem
                onClick={() => onMoveOut?.(node)}
              >
                <ArrowUpFromLine className="w-4 h-4 mr-2" />
                Move out
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onDeleteNode?.(node)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </ContextMenuItem>
            </>
          )}
          {!isInTrash && (
            <>
              <ContextMenuItem
                onClick={() => onCreateNode?.(node)}
                disabled={node.readOnly || isTrashNode}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Mano Text
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onRemoveNode?.(node)}
                disabled={node.readOnly || isTrashNode}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && node.children && (
        <div className="relative">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
              selectedFile={selectedFile}
              onReorder={onReorder}
              dragOverId={dragOverId}
              dropMode={dropMode}
              dropLevel={dropLevel}
              onCreateNode={onCreateNode}
              editingNodeId={editingNodeId}
              onStartRename={onStartRename}
              onRenameNode={onRenameNode}
              onCancelEdit={onCancelEdit}
              onRemoveNode={onRemoveNode}
              onMoveOut={onMoveOut}
              onDeleteNode={onDeleteNode}
              isInTrash={isTrashNode}
              movingOutNodeId={movingOutNodeId}
              removingNodeId={removingNodeId}
              contextMenuNodeId={contextMenuNodeId}
              onContextMenuChange={onContextMenuChange}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
      {showAfter && (
        <div 
          className="absolute bottom-0 h-0.5 bg-primary rounded z-10"
          style={{ left: `${getDropLineIndent()}px`, right: '4px' }}
        />
      )}
    </div>
  )
}

interface PrimarySidebarProps {
  activity: string
  onFileClick: (file: FileNode) => void
  selectedFile: string | null
  fileTree?: FileNode[]
  onReorder?: (payload: { sourceId: string; targetId: string; mode: 'before' | 'after' | 'into' }) => void
  onCreateNode?: (parentNode: FileNode) => void
  editingNodeId?: string | null
  onStartRename?: (nodeId: string) => void
  onRenameNode?: (nodeId: string, newName: string) => void
  onCancelEdit?: () => void
  onRemoveNode?: (node: FileNode) => void
  onMoveOut?: (node: FileNode) => void
  onDeleteNode?: (node: FileNode) => void
  movingOutNodeId?: string | null
  removingNodeId?: string | null
  onToggleExpand?: (nodeId: string, isExpanded: boolean) => void
  onOpenFolder?: () => void
}

export function PrimarySidebar({ activity, onFileClick, selectedFile, fileTree = [], onReorder, onCreateNode, editingNodeId, onStartRename, onRenameNode, onCancelEdit, onRemoveNode, onMoveOut, onDeleteNode, movingOutNodeId, removingNodeId, onToggleExpand, onOpenFolder }: PrimarySidebarProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropMode, setDropMode] = useState<'before' | 'after' | 'into' | null>(null)
  const [dropLevel, setDropLevel] = useState<number>(0)
  const [activeNode, setActiveNode] = useState<FileNode | null>(null)
  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const node = active.data.current?.node as FileNode | undefined
    if (node) setActiveNode(node)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!active || !over) {
      setDragOverId(null)
      setDropMode(null)
      setDropLevel(0)
      return
    }
    const overId = String(over.id)
    const m = overId.match(/^row-(.*)$/)
    if (!m) {
      setDragOverId(null)
      setDropMode(null)
      setDropLevel(0)
      return
    }
    const targetId = m[1]
    const targetLevel = over.data.current?.level ?? 0

    // Check if source and target nodes are in trash
    const findNodeWithTrashInfo = (nodes: FileNode[], id: string, isInTrash = false): { node: FileNode | null; isInTrash: boolean } => {
      for (const node of nodes) {
        const currentIsInTrash = isInTrash || node.id === '__trash__'
        if (node.id === id) {
          return { node, isInTrash: currentIsInTrash }
        }
        if (node.children) {
          const result = findNodeWithTrashInfo(node.children, id, currentIsInTrash)
          if (result.node) return result
        }
      }
      return { node: null, isInTrash: false }
    }

    const sourceId = String(active.id)
    const sourceInfo = findNodeWithTrashInfo(fileTree, sourceId)
    const targetInfo = findNodeWithTrashInfo(fileTree, targetId)

    // New rule: prohibit any drag and drop into trash (including trash root and its children)
    if (targetInfo.isInTrash) {
      setDragOverId(null)
      setDropMode(null)
      setDropLevel(0)
      return
    }

    // Rule: nodes in trash cannot be dragged (already disabled in useDraggable)
    // Extra check here: if source is in trash, don't show any drop indicator
    if (sourceInfo.isInTrash) {
      setDragOverId(null)
      setDropMode(null)
      setDropLevel(0)
      return
    }
    
    const el = document.querySelector(`[data-id="${targetId}"]`)
    if (!el) {
      setDragOverId(targetId)
      setDropMode('after')
      setDropLevel(targetLevel)
      return
    }
    
    const rect = el.getBoundingClientRect()
    const pointerX = (event?.activatorEvent as PointerEvent)?.clientX ?? rect.left
    const pointerY = (event?.activatorEvent as PointerEvent)?.clientY ?? (rect.top + rect.height / 2)
    
    // Vertical direction: top half -> before, bottom half -> after
    const relativeY = (pointerY - rect.top) / rect.height
    const mode = relativeY < 0.5 ? 'before' : 'after'
    
    // Horizontal indent control: dragging pointer right → increase level (into), keeping horizontal → same level (after/before)
    // Base indent = targetLevel * 12px + 8px
    const baseIndent = targetLevel * 12 + 8
    const pointerIndent = pointerX - rect.left
    
    // Calculate target level: in 'after' mode, if pointer exceeds base + 12px, level +1 (indicates placing inside target)
    let calculatedLevel = targetLevel
    if (mode === 'after' && pointerIndent > baseIndent + 12) {
      calculatedLevel = targetLevel + 1
    }
    
    setDragOverId(targetId)
    setDropMode(mode)
    setDropLevel(calculatedLevel)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDragOverId(null)
    setDropMode(null)
    const finalDropLevel = dropLevel
    setDropLevel(0)
    setActiveNode(null)
    
    if (!active || !over || !onReorder) return
    
    const sourceId = String(active.id)
    const overId = String(over.id)
    const m = overId.match(/^row-(.*)$/)
    if (!m) return
    const targetId = m[1]
    const targetLevel = over.data.current?.level ?? 0
    
    // Decide mode based on relationship between dropLevel and targetLevel
    let mode: 'before' | 'after' | 'into' = dropMode || 'after'
    if (finalDropLevel > targetLevel) {
      // Deeper level indicates placing inside target
      mode = 'into'
    }
    
    onReorder({ sourceId, targetId, mode })
  }

  const getTitle = () => {
    switch (activity) {
      case 'explorer': return (
        <>
          <ManoLogoIcon className="w-4 h-4" />
          <span className="font-semibold text-sm">Mano</span>
        </>
      )
      case 'search': return 'SEARCH'
      case 'source-control': return 'SOURCE CONTROL'
      case 'run-debug': return 'RUN AND DEBUG'
      case 'extensions': return 'EXTENSIONS'
      default: return 'EXPLORER'
    }
  }

  return (
    <div className="h-full bg-background border-r flex flex-col">
      <div className="h-10 border-b px-3 flex items-center justify-between">
        <button
          className={cn(
            "flex items-center gap-2 font-semibold text-xs uppercase tracking-wide text-muted-foreground",
            activity === 'explorer' && "cursor-pointer hover:text-foreground/80 transition-colors",
            activity === 'explorer' && (!fileTree || fileTree.length === 0) && "animate-pulse"
          )}
          onClick={() => activity === 'explorer' && onOpenFolder?.()}
          disabled={activity !== 'explorer'}
        >
          {getTitle()}
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <ScrollArea className="h-full w-full">
          {activity === 'explorer' && (
            <div className="py-2">
              {fileTree.map((node) => (
                <FileTreeItem
                  key={node.id}
                  node={node}
                  level={0}
                  onFileClick={onFileClick}
                  selectedFile={selectedFile}
                  onReorder={onReorder}
                  dragOverId={dragOverId}
                  dropMode={dropMode}
                  dropLevel={dropLevel}
                  onCreateNode={onCreateNode}
                  editingNodeId={editingNodeId}
                  onStartRename={onStartRename}
                  onRenameNode={onRenameNode}
                  onCancelEdit={onCancelEdit}
                  onRemoveNode={onRemoveNode}
                  onMoveOut={onMoveOut}
                  onDeleteNode={onDeleteNode}
                  movingOutNodeId={movingOutNodeId}
                  removingNodeId={removingNodeId}
                  contextMenuNodeId={contextMenuNodeId}
                  onContextMenuChange={setContextMenuNodeId}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </div>
          )}
          {activity === 'search' && (
            <div className="p-4 text-sm text-muted-foreground">
              Search functionality coming soon...
            </div>
          )}
          {activity === 'source-control' && (
            <div className="p-4 text-sm text-muted-foreground">
              No source control providers registered.
            </div>
          )}
          {activity === 'run-debug' && (
            <div className="p-4 text-sm text-muted-foreground">
              To run and debug, configure launch.json
            </div>
          )}
          {activity === 'extensions' && (
            <div className="p-4 text-sm text-muted-foreground">
              Extensions marketplace coming soon...
            </div>
          )}
        </ScrollArea>
        <DragOverlay>
          {activeNode && (
            <div className="px-1.5 py-1 bg-background border border-border rounded-md shadow-lg flex items-center gap-1.5 opacity-90 max-w-[180px]">
              {activeNode.nodeType === 'Directory' && <Library className="w-3.5 h-3.5 shrink-0" color='blue' />}
              {activeNode.nodeType === 'SlateText' && <TextAlignStart className="w-3.5 h-3.5 shrink-0 text-primary" color='blue'  />}
              {activeNode.nodeType === 'Markdown' && <TextQuote className="w-3.5 h-3.5 shrink-0" color='blue'  />}
              {activeNode.nodeType !== 'Directory' && activeNode.nodeType !== 'SlateText' && activeNode.nodeType !== 'Markdown' && <FileText className="w-3.5 h-3.5 shrink-0" color='blue' />}
              <span className="text-xs truncate">
                {activeNode.name.length > 12 ? `${activeNode.name.slice(0, 12)}...` : activeNode.name}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
      </div>
    </div>
  )
}
