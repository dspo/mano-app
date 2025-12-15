import { useState, useEffect, useRef } from 'react'
import { ActivityBar } from './ActivityBar'
import { PrimarySidebar } from './PrimarySidebar'
import { insertInto, insertBeforeAfter, findNodePath, removeAtPath, isAncestor, checkDuplicateNames, isInTrash, buildTextNodeNameSet, hasNameInSet } from '@/lib/tree-utils'
import type { ManoNode } from '@/types/mano-config'
import { EditorContainer } from './EditorContainer'
import { BottomPanel } from './BottomPanel'
import { StatusBar } from './StatusBar'
import { EdgeDropZones } from './EdgeDropZone'
import { FloatingNotification } from './FloatingNotification'
import { EditorProvider } from '@/contexts/EditorContext'
import { useEditor } from '@/hooks/useEditor'
import { toast } from 'sonner'
import type { IFileHandle, IDirectoryHandle } from '@/services/fileSystem'
import { TauriDirectoryHandle } from '@/services/fileSystem/tauriStrategy'
import {
  getFileSystem,
  saveManoConfig,
  getNodeFilename,
  getOrCreateFile,
  saveToFileSystem,
} from '@/services/fileSystem'

// Alias for backward compatibility
type FileNode = ManoNode
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ImperativePanelHandle,
} from '@/components/ui/resizable'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {isTauri} from "@tauri-apps/api/core";

// Mock file contents
const fileContents: Record<string, string> = {
  '3': `import { Button } from '@/components/ui/button'

export function CustomButton() {
  return (
    <Button variant="default">
      Click me
    </Button>
  )
}`,
  '4': `import { Input } from '@/components/ui/input'

export function CustomInput() {
  return (
    <Input placeholder="Enter text..." />
  )
}`,
  '5': `import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="p-4">
      <h1>Welcome to Mano</h1>
      <Button onClick={() => setCount(c => c + 1)}>
        Count is {count}
              onReorder={handleTreeReorder}
    </div>
  )
}

export default App`,
  '6': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
  '7': `@import "tailwindcss";

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}`,
  '10': `{
  "name": "mano-ui",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}`,
  '11': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx"
  }
}`,
  '12': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
  '13': `[
  {
    "type": "h1",
    "children": [{ "text": "Welcome to Rich Text Editor" }]
  },
  {
    "type": "p",
    "children": [
      { "text": "This is a " },
      { "text": "rich text", "bold": true },
      { "text": " document powered by " },
      { "text": "Plate.js", "bold": true, "italic": true },
      { "text": "." }
    ]
  },
  {
    "type": "p",
    "children": [{ "text": "You can edit this content and it will auto-save." }]
  }
]`
}

export function IDELayout() {
  return (
    <EditorProvider>
      <IDELayoutContent />
    </EditorProvider>
  )
}

function IDELayoutContent() {
  const { dispatch } = useEditor()
  const { state } = useEditor()
  const [activeActivity, setActiveActivity] = useState('explorer')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<{ id: string; fileName: string } | null>(null)
  const [notification, setNotification] = useState<{ message: string; x: number; y: number } | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [textNodeNameSet, setTextNodeNameSet] = useState<Set<string>>(new Set())
  const [_fileContentsMap, setFileContentsMap] = useState<Record<string, string>>(fileContents)
  const [_fileHandlesMap, setFileHandlesMap] = useState<Record<string, FileSystemFileHandle | IFileHandle>>({})
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  
  // Directory and config handles
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | IDirectoryHandle | null>(null)
  const [configFileHandle, setConfigFileHandle] = useState<FileSystemFileHandle | IFileHandle | null>(null)
  
  // Refs for controlling panels imperatively
  const sidebarRef = useRef<ImperativePanelHandle>(null)
  const panelRef = useRef<ImperativePanelHandle>(null)
  
  // Track collapsed state for UI updates
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true)
  const [movingOutNodeId, setMovingOutNodeId] = useState<string | null>(null)
  const [removingNodeId, setRemovingNodeId] = useState<string | null>(null)

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to activate drag
      },
    })
  )

  /**
   * Synchronize textNodeNameSet with fileTree lifecycle
   * When fileTree changes, automatically rebuild the Set
   * This ensures Set is always in sync with the tree's current state
   */
  useEffect(() => {
    const newNameSet = buildTextNodeNameSet(fileTree)
    setTextNodeNameSet(newNameSet)
  }, [fileTree])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const dragData = event.active.data.current
    if (dragData?.tab) {
      setActiveTab(dragData.tab)
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTab(null) // Clear active tab

    if (!over) return

    const dragData = active.data.current
    const dropData = over.data.current

    if (!dragData || !dropData) return

    // Handle tab reordering within the same group
    if (dragData.type === 'tab-sort' && dropData.type === 'tab-sort' && 
        dragData.sourceGroupId === dropData.sourceGroupId && 
        active.id !== over.id) {
      const group = state.groups[dragData.sourceGroupId]
      if (!group) return

      const oldIndex = group.tabs.findIndex(t => t.id === active.id)
      const newIndex = group.tabs.findIndex(t => t.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTabs = [...group.tabs]
        const [movedTab] = newTabs.splice(oldIndex, 1)
        newTabs.splice(newIndex, 0, movedTab)

        dispatch({
          type: 'REORDER_TABS',
          groupId: dragData.sourceGroupId,
          tabIds: newTabs.map(t => t.id),
        })
      }
      return
    }

    // Tab dropped on another group
    if (dropData.type === 'group' && dragData.sourceGroupId !== dropData.groupId) {
      // Check if target group already has a tab with the same modelId
      const targetGroup = state.groups[dropData.groupId]
      const existingTab = targetGroup?.tabs.find(tab => tab.modelId === dragData.model.id)
      
      if (existingTab) {
        // Model already open in target group - activate it and show notification
        dispatch({
          type: 'SET_ACTIVE_TAB',
          tabId: existingTab.id,
          groupId: dropData.groupId,
        })
        
        // Show notification at mouse position
        const mouseEvent = event.activatorEvent as MouseEvent
        if (mouseEvent) {
          setNotification({
            message: `"${dragData.model.fileName}" is already open in this editor group`,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
          })
        }
      } else {
        // Move tab to target group
        dispatch({
          type: 'MOVE_TAB_BETWEEN_GROUPS',
          tabId: dragData.tab.id,
          sourceGroupId: dragData.sourceGroupId,
          targetGroupId: dropData.groupId,
        })
      }
    }

    // Tab dropped on edge to create new split (always allowed since it creates a new group)
    if (dropData.type === 'edge') {
      dispatch({
        type: 'MOVE_TAB_TO_EDGE',
        tabId: dragData.tab.id,
        sourceGroupId: dragData.sourceGroupId,
        edge: dropData.position,
      })
    }
  }

  // Open folder
  const handleOpenFolder = async () => {
    try {
      const fs = getFileSystem()
      
      // Select directory
      const directory = await fs.pickDirectory()
      setDirHandle(directory)
      
      // Read or create mano.conf.json
      const { config, fileHandle } = await fs.readOrCreateManoConfig(directory)
      
      // Validate if there are duplicate node names in tree structure
      const duplicates = checkDuplicateNames(config.data)
      if (duplicates.length > 0) {
        console.error('[IDELayout] 检测到重名节点:', duplicates)
        const errorMsg = duplicates.map(d => 
          `"${d.name}" (节点ID: ${d.ids.join(', ')})`
        ).join('; ')
        toast.error(
          `mano.conf.json 中存在重名节点：${errorMsg}。所有节点名称必须全局唯一，请修复后再次打开。`,
          { duration: 8000 }
        )
        return
      }
      
      setConfigFileHandle(fileHandle)
      setFileTree(config.data)
      
      toast.success(`已打开文件夹: ${directory.name}`)
      console.log('[IDELayout] Loaded mano.conf.json:', config)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to open folder:', err)
        toast.error('打开文件夹失败')
      }
    }
  }

  // Handle workspace from Tauri window menu
  const handleWorkspaceFromMenu = async (workspacePath: string) => {
    try {
      console.log('[IDELayout] Handling workspace from Tauri menu:', workspacePath)
      
      // Dynamically import fileSystem module
      const fs = getFileSystem()
      
      // Create directory handle from the path received from Tauri
      const directory = new TauriDirectoryHandle(workspacePath)
      console.log('[IDELayout] Directory handle created:', directory)
      setDirHandle(directory)
      
      // Read or create mano.conf.json
      const { config, fileHandle } = await fs.readOrCreateManoConfig(directory)
      
      // Validate if there are duplicate node names in tree structure
      const duplicates = checkDuplicateNames(config.data)
      if (duplicates.length > 0) {
        console.error('[IDELayout] 检测到重名节点:', duplicates)
        const errorMsg = duplicates.map(d => 
          `"${d.name}" (节点ID: ${d.ids.join(', ')})`
        ).join('; ')
        toast.error(
          `mano.conf.json 中存在重名节点：${errorMsg}。所有节点名称必须全局唯一，请修复后再次打开。`,
          { duration: 8000 }
        )
        return
      }
      
      setConfigFileHandle(fileHandle)
      setFileTree(config.data)
      
      toast.success(`已打开文件夹: ${directory.name}`)
      console.log('[IDELayout] Loaded mano.conf.json:', config)
    } catch (err) {
      console.error('[IDELayout] Failed to handle workspace from menu:', err)
      toast.error('打开文件夹失败')
    }
  }

  // Listen to Tauri window menu events
  useEffect(() => {
    if (!isTauri()) return

    let unlisten: (() => void) | undefined

    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        
        unlisten = await listen<{ workspace: string }>('workspace_updated', async (event) => {
          console.log('[IDELayout] Received workspace_updated event:', event.payload)
          await handleWorkspaceFromMenu(event.payload.workspace)
        })
        
        console.log('[IDELayout] Tauri menu event listener setup complete')
      } catch (error) {
        console.error('[IDELayout] Failed to setup Tauri menu event listener:', error)
      }
    }

    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])

  // Handle tree drag and reorder
  const handleTreeReorder = async ({ sourceId, targetId, mode }: { sourceId: string; targetId: string; mode: 'before' | 'after' | 'into' }) => {
    try {
      // Prevent moving node to itself or its descendants
      if (sourceId === targetId || isAncestor(fileTree as any, sourceId, targetId)) return

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

      const sourceInfo = findNodeWithTrashInfo(fileTree, sourceId)
      const targetInfo = findNodeWithTrashInfo(fileTree, targetId)

      // Rule 1) Cannot reorder within trash
      if (sourceInfo.isInTrash && targetInfo.isInTrash) {
        toast.error('无法在垃圾桶内部重排节点')
        return
      }

      // Rule 2) Dragging from outside into trash: equivalent to Remove
      if (!sourceInfo.isInTrash && (targetId === '__trash__' || targetInfo.isInTrash)) {
        // If target is not trash root node, block operation (cannot put into child nodes)
        if (targetId !== '__trash__') {
          toast.error('只能将节点移动到垃圾桶根目录')
          return
        }
        
        // Execute Remove operation
        const sourceNode = sourceInfo.node
        if (sourceNode) {
          await handleRemoveNode(sourceNode)
        }
        return
      }

      // Rule 3) Dragging out from trash: allowed, but don't encode content or delete files (just move)
      // Normal drag reorder logic
      const sourcePath = findNodePath(fileTree as any, sourceId)
      if (!sourcePath) return
      const { removed, newTree } = removeAtPath(fileTree as any, sourcePath)
      
      // If dragging out from trash, need to clear content field
      if (sourceInfo.isInTrash && !targetInfo.isInTrash) {
        const cleanContent = (node: FileNode): FileNode => {
          const cleaned = { ...node }
          delete cleaned.content
          if (cleaned.children) {
            cleaned.children = cleaned.children.map(child => cleanContent(child))
          }
          return cleaned
        }
        const cleanedNode = cleanContent(removed as any)
        
        // Insert to target
        let updated: FileNode[]
        if (mode === 'into') {
          updated = insertInto(newTree as any, targetId, cleanedNode as any) as any
        } else {
          updated = insertBeforeAfter(newTree as any, targetId, cleanedNode as any, mode) as any
        }
        setFileTree(updated)
        
        // Save to mano.conf.json
        if (configFileHandle) {
          await saveManoConfig(configFileHandle, { data: updated as any, lastUpdated: new Date().toISOString() })
        }
        return
      }

      // Normal drag reorder
      let updated: FileNode[]
      if (mode === 'into') {
        updated = insertInto(newTree as any, targetId, removed as any) as any
      } else {
        updated = insertBeforeAfter(newTree as any, targetId, removed as any, mode) as any
      }
      setFileTree(updated)
      // Persist to mano.conf.json
      if (configFileHandle) {
        await saveManoConfig(configFileHandle, { data: updated as any, lastUpdated: new Date().toISOString() })
      }
    } catch (e) {
      console.error('Reorder failed:', e)
      toast.error('Failed to reorder')
    }
  }

  // Start renaming a node (triggered by double-click)
  const handleStartRename = (nodeId: string) => {
    setEditingNodeId(nodeId)
  }

  // Create new node
  const handleCreateNode = async (parentNode: FileNode) => {
    if (!configFileHandle) {
      toast.error('请先打开文件夹')
      return
    }

    try {
      // Generate non-duplicate default name in entire workspace
      const baseName = '新建文档'
      let finalName = baseName
      let counter = 1
      
      // Check entire workspace using Set (O(1) lookup)
      while (hasNameInSet(textNodeNameSet, finalName)) {
        finalName = `${baseName}${counter}`
        counter++
      }

      // Generate new node ID
      const timestamp = Date.now()
      const newNode: FileNode = {
        id: `node-${timestamp}`,
        name: finalName,
        nodeType: 'SlateText',
        readOnly: false
      }

      // Add to end of parent node's children
      const updated = insertInto(fileTree as any, parentNode.id, newNode as any) as FileNode[]
      setFileTree(updated)

      // Set to edit mode
      setEditingNodeId(newNode.id)

      console.log('[handleCreateNode] Created new node:', newNode)
    } catch (e) {
      console.error('Create node failed:', e)
      toast.error('创建节点失败')
    }
  }

  // Rename node
  const handleRenameNode = async (nodeId: string, newName: string) => {
    /**
     * Design: File System Consistency Guarantee
     * 
     * This function enforces the following invariant:
     * "Config and physical files must always be in sync"
     * 
     * Steps:
     * 1. Validate: Check if new name is empty or duplicates existing names
     * 2. Prepare: Create updated tree with new name in memory
     * 3. CRITICAL: Rename physical file FIRST (if text node)
     *    - Only proceed if file rename succeeds
     *    - If file rename fails, abort and return early (NO state update)
     * 4. Persist: Update tree state and save config ONLY after file success
     * 
     * This ensures:
     * ✓ If operation returns success: Both file and config are renamed
     * ✓ If operation returns error: Neither file nor config are modified
     * ✓ No orphaned files or stale config references
     * 
     * Note: Directory nodes skip file operations (no physical files)
     */
    if (!configFileHandle) {
      toast.error('请先打开文件夹')
      return
    }

    // Validate name is not empty
    if (!newName.trim()) {
      toast.error('节点名称不能为空')
      return
    }

    try {
      // Find node
      const findNode = (nodes: FileNode[], id: string): FileNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node
          if (node.children) {
            const found = findNode(node.children, id)
            if (found) return found
          }
        }
        return null
      }

      const node = findNode(fileTree, nodeId)
      
      if (!node) {
        toast.error('找不到节点')
        return
      }

      // Check entire workspace for duplicate node names (excluding self)
      // If new name is same as current, it's allowed (no actual change)
      if (newName !== node.name && hasNameInSet(textNodeNameSet, newName)) {
        toast.error(`工作区中已存在名为 "${newName}" 的节点，所有节点名称必须全局唯一`)
        return
      }

      // Find node and update name
      const updateNodeName = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, name: newName }
          }
          if (node.children) {
            return { ...node, children: updateNodeName(node.children) }
          }
          return node
        })
      }

      const updated = updateNodeName(fileTree)
      
      // ATOMIC OPERATION: Rename file BEFORE modifying config
      // This guarantees config and files stay in sync
      // If file rename fails, we abort without modifying in-memory state
      if (dirHandle && (node.nodeType === 'SlateText' || node.nodeType === 'Markdown')) {
        try {
          const oldFilename = getNodeFilename(node)
          const newFilename = getNodeFilename({ ...node, name: newName })
          
          // Only rename if filenames are different
          if (oldFilename !== newFilename) {
            const fileSystem = getFileSystem()
            const renamed = await fileSystem.renameFile(dirHandle, oldFilename, newFilename)
            
            if (!renamed) {
              toast.error('文件重命名失败，节点名称未更改。请检查文件系统权限。')
              return
            }
          }
        } catch (error) {
          console.error('Failed to rename physical file:', error)
          toast.error('文件重命名出错，节点名称未更改。')
          return
        }
      }

      // Only update state and config if file rename succeeded
      setFileTree(updated)

      // Save to mano.conf.json
      await saveManoConfig(configFileHandle, { 
        data: updated as any, 
        lastUpdated: new Date().toISOString() 
      })

      setEditingNodeId(null)
      toast.success('重命名成功')
    } catch (e) {
      console.error('Rename node failed:', e)
      toast.error('重命名失败')
    }
  }

  // Cancel edit
  const handleCancelEdit = async () => {
    if (!editingNodeId) return

    // Find node being edited
    const findNode = (nodes: FileNode[], id: string): FileNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findNode(node.children, id)
          if (found) return found
        }
      }
      return null
    }

    const editingNode = findNode(fileTree, editingNodeId)
    
    // If it's a newly created node (name is still default), delete it
    // Match default document name patterns (like "New Doc", "New Doc1", "New Doc2", or Chinese equivalent)
    const isDefaultName = editingNode && /^(新建文档|New Doc)\d*$/.test(editingNode.name)
    
    if (isDefaultName) {
      const removeNodeById = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(node => {
          if (node.id === editingNodeId) {
            return false
          }
          if (node.children) {
            node.children = removeNodeById(node.children)
          }
          return true
        }).map(node => ({
          ...node,
          children: node.children ? removeNodeById(node.children) : undefined
        }))
      }

      const updated = removeNodeById(fileTree)
      setFileTree(updated)
    }

    setEditingNodeId(null)
  }

  // Remove node to trash
  const handleRemoveNode = async (node: FileNode) => {
    if (!configFileHandle || !dirHandle) {
      toast.error('请先打开文件夹')
      return
    }

    // Cannot delete trash itself
    if (node.id === '__trash__') {
      toast.error('无法删除垃圾篓')
      return
    }

    try {
      // Close all tabs that opened this node (recursively close child nodes)
      const closeNodeAndChildren = (n: FileNode) => {
        if (n.nodeType !== 'Directory') {
          dispatch({ type: 'CLOSE_FILE_IN_ALL_GROUPS', fileId: n.id })
        }
        if (n.children) {
          n.children.forEach(child => closeNodeAndChildren(child))
        }
      }
      closeNodeAndChildren(node)

      // Set animation state
      setRemovingNodeId(node.id)
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      const fs = getFileSystem()

        // Recursively process all text nodes: read content, base64 encode, delete file
      const processNode = async (n: FileNode, trashNodes: FileNode[] = []): Promise<FileNode> => {
        let processedNode = { ...n }

        // If it's a text node (SlateText or Markdown)
        if (n.nodeType === 'SlateText' || n.nodeType === 'Markdown') {
          try {
            // Read file content
            const filename = getNodeFilename(n)
            const { content } = await fs.getOrCreateFile(dirHandle, filename, '')
            
            // Base64 encode and store to content field
            const base64Content = btoa(unescape(encodeURIComponent(content)))
            processedNode.content = base64Content

            // Delete physical file
            await fs.deleteFile(dirHandle, filename)
            console.log(`[handleRemoveNode] Deleted file: ${filename}`)
          } catch (error) {
            console.error(`[handleRemoveNode] Failed to process node ${n.id}:`, error)
            throw error
          }
        }

        // Recursively process child nodes (no renaming needed - global deduplication ensures no conflicts)
        if (n.children && n.children.length > 0) {
          const processedChildren: FileNode[] = []
          for (const child of n.children) {
            const processedChild = await processNode(child, trashNodes)
            processedChildren.push(processedChild)
          }
          processedNode = {
            ...processedNode,
            children: processedChildren
          }
        }

        return processedNode
      }

      // Process node and all its children
      const processedNode = await processNode(node)

      // Find or create __trash__ node
      let trashNode = fileTree.find(n => n.id === '__trash__')
      
      if (!trashNode) {
        // Create trash node
        trashNode = {
          id: '__trash__',
          name: '垃圾篓',
          nodeType: 'Directory',
          readOnly: true,
          children: []
        }
      }

      // Remove node from original position
      const removeNodeById = (nodes: FileNode[], id: string): FileNode[] => {
        return nodes.filter(n => {
          if (n.id === id) return false
          if (n.children) {
            n.children = removeNodeById(n.children, id)
          }
          return true
        }).map(n => ({
          ...n,
          children: n.children ? removeNodeById(n.children, id) : undefined
        }))
      }

      let updated = removeNodeById(fileTree, node.id)

      // Add processed node to trash (no renaming needed - global deduplication ensures no conflicts)
      updated = updated.map(n => {
        if (n.id === '__trash__') {
          return {
            ...n,
            children: [...(n.children || []), processedNode]
          }
        }
        return n
      })

      // If trash doesn't exist, add to root
      if (!fileTree.find(n => n.id === '__trash__')) {
        trashNode.children = [processedNode]
        updated = [...updated, trashNode as FileNode]
      }

      setFileTree(updated)

      // Save to mano.conf.json
      await saveManoConfig(configFileHandle, {
        data: updated,
        lastUpdated: new Date().toISOString()
      })

      toast.success('已移至垃圾篓')
      console.log('[handleRemoveNode] Moved to trash:', processedNode)
      
      // Clear animation state
      setRemovingNodeId(null)
    } catch (e) {
      console.error('Remove node failed:', e)
      toast.error('移除节点失败')
      // Clear animation state
      setRemovingNodeId(null)
    }
  }

  // Move node out from trash
  const handleMoveOut = async (node: FileNode) => {
    if (!configFileHandle || !dirHandle) {
      toast.error('请先打开文件夹')
      return
    }

    try {
      // Close all tabs that opened this node (recursively close child nodes)
      const closeNodeAndChildren = (n: FileNode) => {
        if (n.nodeType !== 'Directory') {
          dispatch({ type: 'CLOSE_FILE_IN_ALL_GROUPS', fileId: n.id })
        }
        if (n.children) {
          n.children.forEach(child => closeNodeAndChildren(child))
        }
      }
      closeNodeAndChildren(node)

      // Set animation state
      setMovingOutNodeId(node.id)
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      const fs = getFileSystem()

      // Get all nodes outside trash for checking duplicates
      const getNodesOutsideTrash = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(n => n.id !== '__trash__')
      }

      const nodesOutsideTrash = getNodesOutsideTrash(fileTree)

      // Check and rename to avoid conflicts
      // Recursively process nodes: decode content and restore files
      const restoreNode = async (n: FileNode, parentNodes: FileNode[] = nodesOutsideTrash): Promise<FileNode> => {
        let restoredNode = { ...n }

        // If it's a text node with content field (base64 encoded)
        if ((n.nodeType === 'SlateText' || n.nodeType === 'Markdown') && n.content) {
          try {
            // Base64 decode
            const decodedContent = decodeURIComponent(escape(atob(n.content)))
            
            // Create file with new name
            const filename = getNodeFilename(restoredNode)
            const fileHandle = await fs.getOrCreateFile(dirHandle, filename, '')
            await fs.saveToFile(fileHandle.fileHandle, decodedContent)
            
            // Clear content field
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { content, ...nodeWithoutContent } = restoredNode
            restoredNode = nodeWithoutContent as FileNode
            
            console.log(`[handleMoveOut] Restored file: ${filename}`)
          } catch (error) {
            console.error(`[handleMoveOut] Failed to restore node ${n.id}:`, error)
            throw error
          }
        }

        // Recursively process child nodes (no renaming needed - global deduplication ensures no conflicts)
        if (n.children && n.children.length > 0) {
          const restoredChildren: FileNode[] = []
          for (const child of n.children) {
            const restoredChild = await restoreNode(child, parentNodes)
            restoredChildren.push(restoredChild)
          }
          restoredNode = {
            ...restoredNode,
            children: restoredChildren
          }
        }

        return restoredNode
      }

      // Restore node and all its children
      const restoredNode = await restoreNode(node)

      // Remove node from trash
      const removeFromTrash = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(n => {
          if (n.id === '__trash__' && n.children) {
            return {
              ...n,
              children: n.children.filter(child => child.id !== node.id)
            }
          }
          if (n.children) {
            return {
              ...n,
              children: removeFromTrash(n.children)
            }
          }
          return n
        })
      }

      let updated = removeFromTrash(fileTree)

      // Find __trash__ node index
      const trashIndex = updated.findIndex(n => n.id === '__trash__')
      
      if (trashIndex !== -1) {
        // Insert restored node before __trash__
        updated = [
          ...updated.slice(0, trashIndex),
          restoredNode as FileNode,
          ...updated.slice(trashIndex)
        ]
      } else {
        // If trash not found (should not happen), add to end
        updated = [...updated, restoredNode as FileNode]
      }

      setFileTree(updated)

      // Save to mano.conf.json
      await saveManoConfig(configFileHandle, {
        data: updated,
        lastUpdated: new Date().toISOString()
      })

      toast.success('已移出垃圾篓')
      console.log('[handleMoveOut] Moved out from trash:', restoredNode)
      
      // Clear animation state
      setMovingOutNodeId(null)
    } catch (e) {
      console.error('Move out failed:', e)
      toast.error('移出失败')
      // Clear animation state
      setMovingOutNodeId(null)
    }
  }

  // Permanently delete node from trash
  const handleDeleteNode = async (node: FileNode) => {
    if (!configFileHandle) {
      toast.error('未加载配置文件')
      return
    }

    try {
      // Close all tabs for this node and its children (if any)
      const closeNodeAndChildren = (n: FileNode) => {
        if (n.nodeType !== 'Directory') {
          dispatch({ type: 'CLOSE_FILE_IN_ALL_GROUPS', fileId: n.id })
        }
        if (n.children) {
          n.children.forEach(child => closeNodeAndChildren(child))
        }
      }
      closeNodeAndChildren(node)

      // Set animation state
      setRemovingNodeId(node.id)
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 500))

      // Remove node from tree (search and remove from parent's children)
      const removeNodeById = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter(n => n.id !== node.id)
          .map(n => ({
            ...n,
            children: n.children ? removeNodeById(n.children) : undefined
          }))
      }

      const updated = removeNodeById(fileTree)
      setFileTree(updated)

      // Save to mano.conf.json
      await saveManoConfig(configFileHandle, {
        data: updated,
        lastUpdated: new Date().toISOString()
      })

      toast.success('已永久删除')
      console.log('[handleDeleteNode] Permanently deleted:', node)
      
      // Clear animation state
      setRemovingNodeId(null)
    } catch (e) {
      console.error('Delete failed:', e)
      toast.error('删除失败')
      // Clear animation state
      setRemovingNodeId(null)
    }
  }

  // Handle node expand/collapse state change
  const handleToggleExpand = async (nodeId: string, isExpanded: boolean) => {
    if (!configFileHandle) {
      return
    }

    // Recursively update node's expanded state
    const updateNodeExpanded = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded: isExpanded }
        }
        if (node.children) {
          return { ...node, children: updateNodeExpanded(node.children) }
        }
        return node
      })
    }

    const updated = updateNodeExpanded(fileTree)
    setFileTree(updated)

    // Save to mano.conf.json
    try {
      await saveManoConfig(configFileHandle, {
        data: updated,
        lastUpdated: new Date().toISOString()
      })
      console.log(`[handleToggleExpand] Node ${nodeId} expanded: ${isExpanded}`)
    } catch (e) {
      console.error('Failed to save expand state:', e)
    }
  }

  const handleFileClick = async (file: FileNode) => {
    // Only handle non-directory nodes
    if (file.nodeType === 'Directory') {
      return
    }
    
    setSelectedFile(file.id)
    
    // Check if file is in trash - if so, read from base64 content
    const inTrash = isInTrash(fileTree, file.id)
    
    if (inTrash) {
      // File is in trash - read from base64 content field
      try {
        console.log('[handleFileClick] Opening file from trash:', file.name)
        
        const parsedContent = file.content
          ? decodeURIComponent(escape(atob(file.content)))
          : ''
        
        // Store in memory (not to disk)
        setFileContentsMap(prev => ({ ...prev, [file.id]: file.content || '' }))
        
        // Open file in editor with readOnly flag
        dispatch({
          type: 'OPEN_FILE',
          fileId: file.id,
          fileName: file.name,
          fileType: 'slate',
          content: parsedContent,
          fileHandle: undefined,
          readOnly: true, // Mark as read-only for trash files
        })
        
        toast.success(`已打开（预览）: ${file.name}`, { duration: 1500 })
      } catch (error) {
        console.error('Failed to open trash file:', error)
        toast.error(`打开文件失败: ${file.name}`)
      }
      return
    }
    
    // Check if we have directory access for non-trash files
    if (!dirHandle) {
      toast.error('请先打开文件夹')
      return
    }
    
    try {
      console.log('[handleFileClick] Opening file:', file.name, 'Type:', file.nodeType)
      console.log('[handleFileClick] Full file object:', JSON.stringify(file, null, 2))
      console.log('[handleFileClick] dirHandle:', dirHandle)
      
      // Get filename based on node type
      const filename = getNodeFilename(file)
      console.log('[handleFileClick] filename from getNodeFilename:', filename)
      
      // Determine file type and default content
      const fileType: 'slate' = 'slate'
      let defaultContent = ''
      
      if (file.nodeType === 'Markdown') {
        defaultContent = `# ${file.name}\n\n`
      }
      
      console.log('[handleFileClick] Calling getOrCreateFile...')
      // Get or create file
      const { fileHandle, content } = await getOrCreateFile(
        dirHandle,
        filename,
        defaultContent
      )
      
      console.log('[handleFileClick] Got file handle:', fileHandle)
      console.log('[handleFileClick] Content length:', content.length)
      
      const parsedContent = content
      
      // Store file handle and content
      setFileHandlesMap(prev => ({ ...prev, [file.id]: fileHandle }))
      setFileContentsMap(prev => ({ ...prev, [file.id]: content }))
      
      // Open file in editor
      dispatch({
        type: 'OPEN_FILE',
        fileId: file.id,
        fileName: file.name,
        fileType: fileType,
        content: parsedContent,
        fileHandle: fileHandle,
      })
      
      toast.success(`已打开: ${file.name}`, { duration: 1500 })
    } catch (error) {
      console.error('Failed to open file:', error)
      toast.error(`打开文件失败: ${file.name}`)
    }
  }

  // Note: File closing is now handled inside EditorGroupWrapper

  // Split editor functions
  const handleSplitEditorRight = () => {
    dispatch({ type: 'SPLIT_GROUP', groupId: state.lastFocusedGroupId, direction: 'horizontal' })
  }

  // Save current file to disk
  const handleSaveFile = async () => {
    const group = state.groups[state.lastFocusedGroupId]
    if (!group || !group.activeTabId) {
      console.warn('[Save] No active tab')
      return
    }

    const activeTab = group.tabs.find(t => t.id === group.activeTabId)
    if (!activeTab) return

    const model = state.models[activeTab.modelId]
    if (!model) {
      console.warn('[Save] Model not found for tab:', activeTab.id)
      toast.error('Cannot save: model not found')
      return
    }

    if (!model.fileHandle) {
      console.warn('[Save] No file handle for model:', model.fileName)
      toast.error('Cannot save: file handle not found')
      return
    }

    try {
      const success = await saveToFileSystem(model.fileHandle, model.content)
      
      if (success) {
        // Mark model as saved to disk
        dispatch({
          type: 'MARK_MODEL_SAVED_TO_DISK',
          modelId: model.id,
        })
        toast.success(`Saved ${model.fileName}`)
      } else {
        toast.error('Failed to save file')
      }
    } catch (error) {
      console.error('[Save] Error:', error)
      toast.error('Failed to save file')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Save File
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveFile()
      }
      // Cmd/Ctrl + B: Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        const panel = sidebarRef.current
        if (panel) {
          if (panel.isCollapsed()) {
            panel.expand()
          } else {
            panel.collapse()
          }
        }
      }
      // Cmd/Ctrl + J: Toggle Panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        const panel = panelRef.current
        if (panel) {
          if (panel.isCollapsed()) {
            panel.expand()
          } else {
            panel.collapse()
          }
        }
      }
      // Cmd/Ctrl + \: Split Right
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        handleSplitEditorRight()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSplitEditorRight, handleSaveFile, state])

  // Toggle functions for buttons/menu
  const toggleSidebar = () => {
    const panel = sidebarRef.current
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand()
      } else {
        panel.collapse()
      }
    }
  }

  // Disabled for now - will be enabled when Bottom Panel functionality is implemented
  // const togglePanel = () => {
  //   const panel = panelRef.current
  //   if (panel) {
  //     if (panel.isCollapsed()) {
  //       panel.expand()
  //     } else {
  //       panel.collapse()
  //     }
  //   }
  // }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar 
          activeActivity={activeActivity} 
          onActivityChange={setActiveActivity}
          showSidebar={!isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          showPanel={!isPanelCollapsed}
        />
        
        <ResizablePanelGroup 
          direction="horizontal"
          autoSaveId="ide-layout-horizontal"
        >
          <ResizablePanel 
            ref={sidebarRef}
            defaultSize={20} 
            minSize={15} 
            maxSize={40}
            collapsible={true}
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
          >
            <PrimarySidebar 
              activity={activeActivity}
              onFileClick={handleFileClick}
              selectedFile={selectedFile}
              fileTree={fileTree}
              onReorder={handleTreeReorder}
              onCreateNode={handleCreateNode}
              editingNodeId={editingNodeId}
              onStartRename={handleStartRename}
              onRenameNode={handleRenameNode}
              onCancelEdit={handleCancelEdit}
              onRemoveNode={handleRemoveNode}
              onMoveOut={handleMoveOut}
              onDeleteNode={handleDeleteNode}
              movingOutNodeId={movingOutNodeId}
              removingNodeId={removingNodeId}
              onToggleExpand={handleToggleExpand}
              onOpenFolder={handleOpenFolder}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={80}>
            <ResizablePanelGroup 
              direction="vertical"
              autoSaveId="ide-layout-vertical"
            >
              <ResizablePanel defaultSize={70} minSize={30}>
                <DndContext 
                  sensors={sensors} 
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="relative h-full">
                    <EditorContainer layout={state.layout} />
                    <EdgeDropZones />
                  </div>
                  <DragOverlay>
                    {activeTab && (
                      <div className="px-3 py-1.5 bg-background border border-border rounded-md shadow-lg flex items-center gap-2">
                        <span className="text-sm">{activeTab.fileName}</span>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel 
                ref={panelRef}
                defaultSize={0} 
                minSize={10} 
                maxSize={60}
                collapsible={true}
                collapsedSize={0}
                onCollapse={() => setIsPanelCollapsed(true)}
                onExpand={() => setIsPanelCollapsed(false)}
              >
                <BottomPanel 
                  isVisible={!isPanelCollapsed}
                  onClose={() => panelRef.current?.collapse()}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <StatusBar
        branch="feat/tailwindcss"
        errors={2}
        warnings={1}
        line={15}
        column={23}
        language="TypeScript"
      />
      
      {notification && (
        <FloatingNotification
          message={notification.message}
          x={notification.x}
          y={notification.y}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
