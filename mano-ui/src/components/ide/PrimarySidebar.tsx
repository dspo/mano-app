import { ChevronRight, ChevronDown, FileText, Library, TextQuote, TextAlignStart, Plus, Trash2 } from 'lucide-react'
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ManoNode } from '@/types/mano-config'
import { ManoTextAlignStartIcon } from '@/icons/icons'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

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
  onRenameNode?: (nodeId: string, newName: string) => void
  onCancelEdit?: () => void
  onRemoveNode?: (node: FileNode) => void
  isInTrash?: boolean
}

function FileTreeItem({ node, level, onFileClick, selectedFile, onReorder, dragOverId, dropMode, dropLevel, onCreateNode, editingNodeId, onRenameNode, onCancelEdit, onRemoveNode, isInTrash = false }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [editValue, setEditValue] = useState(node.name)
  const isEditing = editingNodeId === node.id
  
  // Check if current node is trash or inside trash
  const isTrashNode = node.id === '__trash__' || isInTrash
  
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

  // DnD kit bindings
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({ id: node.id, data: { node, level } })
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
      <div className="relative">
        {showBefore && (
          <div 
            className="absolute top-0 h-0.5 bg-primary rounded z-10"
            style={{ left: `${getDropLineIndent()}px`, right: '4px' }}
            color='blue'
          />
        )}

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              ref={(el) => {
                setDragRef(el)
                setDropRef(el)
              }}
              data-id={node.id}
              className="relative"
            >
              {isEditing ? (
                <div
                  className="w-full flex items-center gap-2 px-2 py-1 text-sm relative z-10"
                  style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                  {hasChildren && <div className="w-3 h-3 shrink-0" />}
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
                </div>
              ) : (
                <button
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer relative z-10',
                    selectedFile === node.id && 'bg-accent',
                    node.readOnly && 'opacity-60',
                    isDragging && 'opacity-30'
                  )}
                  style={{ paddingLeft: `${level * 12 + 8}px` }}
                  onClick={(e) => {
                    if (hasChildren && e.shiftKey) {
                      setIsOpen(!isOpen)
                    } else {
                      onFileClick(node)
                    }
                  }}
                  {...listeners}
                  {...attributes}
                  disabled={node.readOnly}
                >
                  {hasChildren && (
                    isOpen ? (
                      <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                    ) : (
                      <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                    )
                  )}
                  {getFileIcon()}
                  <span className="truncate">{node.name}</span>
                </button>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
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
                onRenameNode={onRenameNode}
                onCancelEdit={onCancelEdit}
                onRemoveNode={onRemoveNode}
                isInTrash={isTrashNode}
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
    <div className="relative">
      {showBefore && (
        <div 
          className="absolute top-0 h-0.5 bg-primary rounded z-10"
          style={{ left: `${getDropLineIndent()}px`, right: '4px' }}
        />
      )}

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={(el) => {
              setDragRef(el)
              setDropRef(el)
            }}
            data-id={node.id}
            className="relative"
          >
            {isEditing ? (
              <div
                className="w-full flex items-center gap-1 px-2 py-1 text-sm relative z-10"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
              >
                <div className="w-4 h-4 shrink-0" />
                <Library className="w-4 h-4 shrink-0" />
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
              </div>
            ) : (
              <button
                className={cn(
                  'w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer relative z-10',
                  node.readOnly && 'opacity-60',
                  isDragging && 'opacity-30'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => setIsOpen(!isOpen)}
                {...listeners}
                {...attributes}
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}
                <Library className="w-4 h-4 shrink-0" />
                <span className="truncate">{node.name}</span>
              </button>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
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
              onRenameNode={onRenameNode}
              onCancelEdit={onCancelEdit}
              onRemoveNode={onRemoveNode}
              isInTrash={isTrashNode}
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
  onRenameNode?: (nodeId: string, newName: string) => void
  onCancelEdit?: () => void
  onRemoveNode?: (node: FileNode) => void
}

export function PrimarySidebar({ activity, onFileClick, selectedFile, fileTree = [], onReorder, onCreateNode, editingNodeId, onRenameNode, onCancelEdit, onRemoveNode }: PrimarySidebarProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropMode, setDropMode] = useState<'before' | 'after' | 'into' | null>(null)
  const [dropLevel, setDropLevel] = useState<number>(0)
  const [activeNode, setActiveNode] = useState<FileNode | null>(null)
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

    // 检查源节点和目标节点是否在垃圾篓中
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

    // 规则1：垃圾篓内部不能重排，不显示任何 drop 指示器
    if (sourceInfo.isInTrash && targetInfo.isInTrash) {
      setDragOverId(null)
      setDropMode(null)
      setDropLevel(0)
      return
    }

    // 规则2：从外部拖入垃圾篓内部的子节点，不允许
    if (!sourceInfo.isInTrash && targetInfo.isInTrash && targetId !== '__trash__') {
      setDragOverId(null)
      setDropMode(null)
      setDropLevel(0)
      return
    }

    // 规则3：拖入垃圾篓根节点，强制只能 'into' 模式（放到末尾）
    if (!sourceInfo.isInTrash && targetId === '__trash__') {
      setDragOverId(targetId)
      setDropMode('into')
      setDropLevel(targetLevel + 1)
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
    
    // 水平缩进控制：指针向右拖动 → 增加层级（into），保持水平 → 同级（after/before）
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
      case 'explorer': return 'EXPLORER'
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
        <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
          {getTitle()}
        </h3>
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <ScrollArea className="flex-1">
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
                  onRenameNode={onRenameNode}
                  onCancelEdit={onCancelEdit}
                  onRemoveNode={onRemoveNode}
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
  )
}
