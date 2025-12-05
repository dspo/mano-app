import { useState, useEffect, useRef } from 'react'
import { TitleBar } from './TitleBar'
import { ActivityBar } from './ActivityBar'
import { PrimarySidebar } from './PrimarySidebar'
import { insertInto, insertBeforeAfter, findNodePath, removeAtPath, isAncestor, hasTextNodeWithName, checkDuplicateNames, isInTrash } from '@/lib/tree-utils'
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

  // Initialize bottom panel as collapsed on mount
  useEffect(() => {
    if (panelRef.current && isPanelCollapsed) {
      panelRef.current.collapse()
    }
  }, [])

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to activate drag
      },
    })
  )

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
      // Check if target group already has a tab with the same fileId
      const targetGroup = state.groups[dropData.groupId]
      const existingTab = targetGroup?.tabs.find(tab => tab.fileId === dragData.tab.fileId)
      
      if (existingTab) {
        // File already exists in target group - activate it and show notification
        dispatch({
          type: 'SET_ACTIVE_TAB',
          tabId: existingTab.id,
          groupId: dropData.groupId,
        })
        
        // Show notification at mouse position
        const mouseEvent = event.activatorEvent as MouseEvent
        if (mouseEvent) {
          setNotification({
            message: `"${dragData.tab.fileName}" is already open in this editor group`,
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

  // 打开文件夹
  const handleOpenFolder = async () => {
    try {
      // 动态导入 fileSystem module (直接指向 index)
      const fileSystemModule = await import('@/services/fileSystem/index')
      console.log('[IDELayout] fileSystemModule:', fileSystemModule)
      console.log('[IDELayout] getFileSystem:', fileSystemModule.getFileSystem)
      
      // 获取 fileSystem 实例（懒加载）
      const fs = fileSystemModule.getFileSystem()
      console.log('[IDELayout] fileSystem instance:', fs)
      
      // 选择目录
      console.log('[IDELayout] Calling pickDirectory...')
      const directory = await fs.pickDirectory()
      console.log('[IDELayout] Directory selected:', directory)
      setDirHandle(directory)
      
      // 读取或创建 mano.conf.json
      const { config, fileHandle } = await fs.readOrCreateManoConfig(directory)
      
      // 验证树结构中是否有重名的文本节点
      const duplicates = checkDuplicateNames(config.data)
      if (duplicates.length > 0) {
        console.error('[IDELayout] 检测到重名文本节点:', duplicates)
        const errorMsg = duplicates.map(d => 
          `"${d.name}" (节点ID: ${d.ids.join(', ')})`
        ).join('; ')
        toast.error(
          `mano.conf.json 中存在重名文本节点：${errorMsg}。文本节点对应物理文件，文件名必须唯一，请修复后再次打开。`,
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

  // 处理树拖拽重排
  const handleTreeReorder = async ({ sourceId, targetId, mode }: { sourceId: string; targetId: string; mode: 'before' | 'after' | 'into' }) => {
    try {
      // 防止把节点移动到自身或其子孙
      if (sourceId === targetId || isAncestor(fileTree as any, sourceId, targetId)) return

      // 检查源节点和目标节点是否在垃圾桶中
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

      // 规刱1）垃圾桶内部不能重排
      if (sourceInfo.isInTrash && targetInfo.isInTrash) {
        toast.error('无法在垃圾桶内部重排节点')
        return
      }

      // 规刱2）从外部拖入垃圾桶：等同于 Remove
      if (!sourceInfo.isInTrash && (targetId === '__trash__' || targetInfo.isInTrash)) {
        // 如果目标不是垃圾桶根节点，阻止操作（不能放到子节点中）
        if (targetId !== '__trash__') {
          toast.error('只能将节点移动到垃圾桶根目录')
          return
        }
        
        // 执行 Remove 操作
        const sourceNode = sourceInfo.node
        if (sourceNode) {
          await handleRemoveNode(sourceNode)
        }
        return
      }

      // 规刱3）从垃圾桶拖出：允许，但不执行内容编码和文件删除（只是移动）
      // 正常的拖拽重排逻辑
      const sourcePath = findNodePath(fileTree as any, sourceId)
      if (!sourcePath) return
      const { removed, newTree } = removeAtPath(fileTree as any, sourcePath)
      
      // 如果从垃圾桶拖出，需要清除 content 字段
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
        
        // 插入到目标
        let updated: FileNode[]
        if (mode === 'into') {
          updated = insertInto(newTree as any, targetId, cleanedNode as any) as any
        } else {
          updated = insertBeforeAfter(newTree as any, targetId, cleanedNode as any, mode) as any
        }
        setFileTree(updated)
        
        // 保存到 mano.conf.json
        if (configFileHandle) {
          const { saveManoConfig } = await import('@/services/fileSystem')
          await saveManoConfig(configFileHandle, { data: updated as any, lastUpdated: new Date().toISOString() })
        }
        return
      }

      // 普通拖拽重排
      let updated: FileNode[]
      if (mode === 'into') {
        updated = insertInto(newTree as any, targetId, removed as any) as any
      } else {
        updated = insertBeforeAfter(newTree as any, targetId, removed as any, mode) as any
      }
      setFileTree(updated)
      // Persist to mano.conf.json
      if (configFileHandle) {
        const { saveManoConfig } = await import('@/services/fileSystem')
        await saveManoConfig(configFileHandle, { data: updated as any, lastUpdated: new Date().toISOString() })
      }
    } catch (e) {
      console.error('Reorder failed:', e)
      toast.error('Failed to reorder')
    }
  }

  // 创建新节点
  const handleCreateNode = async (parentNode: FileNode) => {
    if (!configFileHandle) {
      toast.error('请先打开文件夹')
      return
    }

    try {
      // 在整个工作区中生成不重名的默认名称
      let baseName = '新建文档'
      let finalName = baseName
      let counter = 1
      
      // 检查整个工作区，而不仅仅是同级节点
      while (hasTextNodeWithName(fileTree as any, finalName)) {
        finalName = `${baseName}${counter}`
        counter++
      }

      // 生成新节点 ID
      const timestamp = Date.now()
      const newNode: FileNode = {
        id: `node-${timestamp}`,
        name: finalName,
        nodeType: 'SlateText',
        readOnly: false
      }

      // 添加到父节点的 children 末尾
      const updated = insertInto(fileTree as any, parentNode.id, newNode as any) as FileNode[]
      setFileTree(updated)

      // 设置为编辑模式
      setEditingNodeId(newNode.id)

      console.log('[handleCreateNode] Created new node:', newNode)
    } catch (e) {
      console.error('Create node failed:', e)
      toast.error('创建节点失败')
    }
  }

  // 重命名节点
  const handleRenameNode = async (nodeId: string, newName: string) => {
    if (!configFileHandle) {
      toast.error('请先打开文件夹')
      return
    }

    // 验证名称不为空
    if (!newName.trim()) {
      toast.error('节点名称不能为空')
      return
    }

    try {
      // 查找节点
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

      // 检查整个工作区是否有重名的文本节点（排除自身）
      if (hasTextNodeWithName(fileTree as any, newName, nodeId)) {
        toast.error(`工作区中已存在名为 "${newName}" 的文本节点，文件名必须唯一`)
        return
      }

      // 查找节点并更新名称
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
      setFileTree(updated)

      // 保存到 mano.conf.json
      const { saveManoConfig } = await import('@/services/fileSystem')
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

  // 取消编辑
  const handleCancelEdit = async () => {
    if (!editingNodeId) return

    // 查找正在编辑的节点
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
    
    // 如果是新创建的节点（名称仍为默认值），则删除它
    // 匹配 "新建文档" 或 "新建文档1"、"新建文档2" 等模式
    const isDefaultName = editingNode && /^新建文档\d*$/.test(editingNode.name)
    
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

  // 移除节点到垃圾篓
  const handleRemoveNode = async (node: FileNode) => {
    if (!configFileHandle || !dirHandle) {
      toast.error('请先打开文件夹')
      return
    }

    // 不能删除垃圾篓本身
    if (node.id === '__trash__') {
      toast.error('无法删除垃圾篓')
      return
    }

    try {
      // 关闭所有打开该节点的标签页（递归关闭子节点）
      const closeNodeAndChildren = (n: FileNode) => {
        if (n.nodeType !== 'Directory') {
          dispatch({ type: 'CLOSE_FILE_IN_ALL_GROUPS', fileId: n.id })
        }
        if (n.children) {
          n.children.forEach(child => closeNodeAndChildren(child))
        }
      }
      closeNodeAndChildren(node)

      // 设置动画状态
      setRemovingNodeId(node.id)
      
      // 等待动画完成
      await new Promise(resolve => setTimeout(resolve, 500))

      const { getFileSystem } = await import('@/services/fileSystem')
      const { getNodeFilename } = await import('@/services/fileSystem')
      const fs = getFileSystem()

      // 递归处理所有文本节点：读取内容、base64编码、删除文件
      const processNode = async (n: FileNode): Promise<FileNode> => {
        let processedNode = { ...n }

        // 如果是文本节点（SlateText 或 Markdown）
        if (n.nodeType === 'SlateText' || n.nodeType === 'Markdown') {
          try {
            // 读取文件内容
            const filename = getNodeFilename(n)
            const { content } = await fs.getOrCreateFile(dirHandle, filename, '')
            
            // Base64 编码并存储到 content 字段
            const base64Content = btoa(unescape(encodeURIComponent(content)))
            processedNode.content = base64Content

            // 删除物理文件
            await fs.deleteFile(dirHandle, filename)
            console.log(`[handleRemoveNode] Deleted file: ${filename}`)
          } catch (error) {
            console.error(`[handleRemoveNode] Failed to process node ${n.id}:`, error)
            throw error
          }
        }

        // 递归处理子节点
        if (n.children && n.children.length > 0) {
          processedNode.children = await Promise.all(
            n.children.map(child => processNode(child))
          )
        }

        return processedNode
      }

      // 处理节点及其所有子节点
      const processedNode = await processNode(node)

      // 查找或创建 __trash__ 节点
      let trashNode = fileTree.find(n => n.id === '__trash__')
      
      if (!trashNode) {
        // 创建垃圾篓节点
        trashNode = {
          id: '__trash__',
          name: '垃圾篓',
          nodeType: 'Directory',
          readOnly: true,
          children: []
        }
      }

      // Check if there are nodes with the same name in trash, rename if needed
      const checkAndRenameIfNeeded = (nodeToAdd: FileNode, existingNodes: FileNode[]): FileNode => {
        // Only check renaming for text nodes
        if (nodeToAdd.nodeType !== 'SlateText' && nodeToAdd.nodeType !== 'Markdown') {
          return nodeToAdd
        }

        let newName = nodeToAdd.name
        let counter = 1
        
        // Check for name conflicts with any text node in trash
        while (hasTextNodeWithName(existingNodes, newName, nodeToAdd.id)) {
          newName = `${nodeToAdd.name} (${counter})`
          counter++
        }

        if (newName !== nodeToAdd.name) {
          console.log(`[handleRemoveNode] Renamed ${nodeToAdd.name} to ${newName} to avoid conflict`)
          return { ...nodeToAdd, name: newName }
        }

        return nodeToAdd
      }

      // 从原位置移除节点
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

      // 检查并处理重名
      const renamedNode = checkAndRenameIfNeeded(processedNode, trashNode.children || [])

      // 将处理后的节点添加到垃圾篓
      updated = updated.map(n => {
        if (n.id === '__trash__') {
          return {
            ...n,
            children: [...(n.children || []), renamedNode]
          }
        }
        return n
      })

      // 如果垃圾篓不存在，添加到根节点
      if (!fileTree.find(n => n.id === '__trash__')) {
        trashNode.children = [renamedNode]
        updated = [...updated, trashNode as FileNode]
      }

      setFileTree(updated)

      // 保存到 mano.conf.json
      const { saveManoConfig } = await import('@/services/fileSystem')
      await saveManoConfig(configFileHandle, {
        data: updated,
        lastUpdated: new Date().toISOString()
      })

      toast.success('已移至垃圾篓')
      console.log('[handleRemoveNode] Moved to trash:', renamedNode)
      
      // 清除动画状态
      setRemovingNodeId(null)
    } catch (e) {
      console.error('Remove node failed:', e)
      toast.error('移除节点失败')
      // 清除动画状态
      setRemovingNodeId(null)
    }
  }

  // 将节点从垃圾篓移出
  const handleMoveOut = async (node: FileNode) => {
    if (!configFileHandle || !dirHandle) {
      toast.error('请先打开文件夹')
      return
    }

    try {
      // 关闭所有打开该节点的标签页（递归关闭子节点）
      const closeNodeAndChildren = (n: FileNode) => {
        if (n.nodeType !== 'Directory') {
          dispatch({ type: 'CLOSE_FILE_IN_ALL_GROUPS', fileId: n.id })
        }
        if (n.children) {
          n.children.forEach(child => closeNodeAndChildren(child))
        }
      }
      closeNodeAndChildren(node)

      // 设置动画状态
      setMovingOutNodeId(node.id)
      
      // 等待动画完成
      await new Promise(resolve => setTimeout(resolve, 500))

      const { getFileSystem } = await import('@/services/fileSystem')
      const { getNodeFilename } = await import('@/services/fileSystem')
      const fs = getFileSystem()

      // 获取垃圾篓之外的所有节点，用于检查重名
      const getNodesOutsideTrash = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(n => n.id !== '__trash__')
      }

      const nodesOutsideTrash = getNodesOutsideTrash(fileTree)

      // 检查并重命名以避免冲突
      const checkAndRenameNode = (nodeToRestore: FileNode, existingNodes: FileNode[]): FileNode => {
        // 只对文本节点检查重名
        if (nodeToRestore.nodeType !== 'SlateText' && nodeToRestore.nodeType !== 'Markdown') {
          return nodeToRestore
        }

        let newName = nodeToRestore.name
        let counter = 1
        
        // 检查是否与垃圾篓外的任何文本节点重名
        while (hasTextNodeWithName(existingNodes, newName, nodeToRestore.id)) {
          newName = `${nodeToRestore.name} (${counter})`
          counter++
        }

        if (newName !== nodeToRestore.name) {
          console.log(`[handleMoveOut] Renamed ${nodeToRestore.name} to ${newName} to avoid conflict`)
          return { ...nodeToRestore, name: newName }
        }

        return nodeToRestore
      }

      // 先检查并重命名节点
      const renamedNode = checkAndRenameNode(node, nodesOutsideTrash)

      // 递归处理节点：解码 content 并恢复文件
      const restoreNode = async (n: FileNode): Promise<FileNode> => {
        let restoredNode = { ...n }

        // 如果是文本节点且有 content 字段（base64编码）
        if ((n.nodeType === 'SlateText' || n.nodeType === 'Markdown') && n.content) {
          try {
            // Base64 解码
            const decodedContent = decodeURIComponent(escape(atob(n.content)))
            
            // 使用新名称创建文件
            const filename = getNodeFilename(restoredNode)
            const fileHandle = await fs.getOrCreateFile(dirHandle, filename, '')
            await fs.saveToFile(fileHandle.fileHandle, decodedContent)
            
            // 清空 content 字段
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { content, ...nodeWithoutContent } = restoredNode
            restoredNode = nodeWithoutContent as FileNode
            
            console.log(`[handleMoveOut] Restored file: ${filename}`)
          } catch (error) {
            console.error(`[handleMoveOut] Failed to restore node ${n.id}:`, error)
            throw error
          }
        }

        // 递归处理子节点
        if (n.children && n.children.length > 0) {
          restoredNode = {
            ...restoredNode,
            children: await Promise.all(
              n.children.map(child => restoreNode(child))
            )
          }
        }

        return restoredNode
      }

      // 恢复节点及其所有子节点
      const restoredNode = await restoreNode(renamedNode)

      // 从垃圾篓中移除节点
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

      // 找到 __trash__ 节点的索引
      const trashIndex = updated.findIndex(n => n.id === '__trash__')
      
      if (trashIndex !== -1) {
        // 在 __trash__ 之前插入恢复的节点
        updated = [
          ...updated.slice(0, trashIndex),
          restoredNode as FileNode,
          ...updated.slice(trashIndex)
        ]
      } else {
        // 如果找不到垃圾篓（不应该发生），添加到末尾
        updated = [...updated, restoredNode as FileNode]
      }

      setFileTree(updated)

      // 保存到 mano.conf.json
      const { saveManoConfig } = await import('@/services/fileSystem')
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

  // 处理节点折叠/展开状态变化
  const handleToggleExpand = async (nodeId: string, isExpanded: boolean) => {
    if (!configFileHandle) {
      return
    }

    // 递归更新节点的 expanded 状态
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
      const { saveManoConfig } = await import('@/services/fileSystem')
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
        
        let fileType: 'text' | 'slate' = 'text'
        let parsedContent: unknown = ''
        
        if (file.content) {
          // Decode base64 content (handle UTF-8)
          const decodedContent = decodeURIComponent(escape(atob(file.content)))
          
          if (file.nodeType === 'SlateText') {
            fileType = 'slate'
            try {
              parsedContent = JSON.parse(decodedContent)
            } catch {
              const { DEFAULT_SLATE_CONTENT } = await import('@/types/mano-config')
              parsedContent = DEFAULT_SLATE_CONTENT
            }
          } else if (file.nodeType === 'Markdown') {
            fileType = 'text'
            parsedContent = decodedContent
          }
        }
        
        // Store in memory (not to disk)
        setFileContentsMap(prev => ({ ...prev, [file.id]: file.content || '' }))
        
        // Open file in editor with readOnly flag
        dispatch({
          type: 'OPEN_FILE',
          fileId: file.id,
          fileName: file.name,
          fileType: fileType,
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
      
      const { getOrCreateFile, getNodeFilename } = await import('@/services/fileSystem')
      const { DEFAULT_SLATE_CONTENT } = await import('@/types/mano-config')
      
      // Get filename based on node type
      const filename = getNodeFilename(file)
      console.log('[handleFileClick] filename from getNodeFilename:', filename)
      
      // Determine file type and default content
      let fileType: 'text' | 'slate' = 'text'
      let defaultContent: string | unknown = ''
      
      if (file.nodeType === 'SlateText') {
        fileType = 'slate'
        defaultContent = DEFAULT_SLATE_CONTENT
      } else if (file.nodeType === 'Markdown') {
        fileType = 'text'
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
      
      // Parse content based on file type
      let parsedContent: unknown
      if (fileType === 'slate') {
        try {
          parsedContent = JSON.parse(content)
        } catch {
          // If parse fails, use default
          parsedContent = DEFAULT_SLATE_CONTENT
        }
      } else {
        parsedContent = content
      }
      
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

    if (!activeTab.fileHandle) {
      console.warn('[Save] No file handle for tab:', activeTab.fileName)
      toast.error('Cannot save: file handle not found')
      return
    }

    try {
      const { saveToFileSystem } = await import('@/services/fileSystem')
      const success = await saveToFileSystem(activeTab.fileHandle, activeTab.content)
      
      if (success) {
        // 标记为已保存到磁盘
        dispatch({
          type: 'MARK_TAB_SAVED_TO_DISK',
          tabId: activeTab.id,
          groupId: group.id,
        })
        toast.success(`Saved ${activeTab.fileName}`)
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

  const togglePanel = () => {
    const panel = panelRef.current
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand()
      } else {
        panel.collapse()
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TitleBar
        showSidebar={!isSidebarCollapsed}
        showPanel={!isPanelCollapsed}
        onToggleSidebar={toggleSidebar}
        onTogglePanel={togglePanel}
        onSplitEditorRight={handleSplitEditorRight}
        onOpenFolder={handleOpenFolder}
        onSave={handleSaveFile}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar 
          activeActivity={activeActivity} 
          onActivityChange={setActiveActivity}
          showSidebar={!isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          showPanel={!isPanelCollapsed}
          onTogglePanel={togglePanel}
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
              onRenameNode={handleRenameNode}
              onCancelEdit={handleCancelEdit}
              onRemoveNode={handleRemoveNode}
              onMoveOut={handleMoveOut}
              movingOutNodeId={movingOutNodeId}
              removingNodeId={removingNodeId}
              onToggleExpand={handleToggleExpand}
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
                defaultSize={30} 
                minSize={10} 
                maxSize={60}
                collapsible={true}
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
