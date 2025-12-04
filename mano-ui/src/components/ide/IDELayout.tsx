import { useState, useEffect, useRef } from 'react'
import { TitleBar } from './TitleBar'
import { ActivityBar } from './ActivityBar'
import { PrimarySidebar } from './PrimarySidebar'
import { insertInto, insertBeforeAfter, findNodePath, removeAtPath, isAncestor } from '@/lib/tree-utils'
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
      <h1>Welcome to Mano IDE</h1>
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
  // @ts-ignore - State variable used only via setter
  const [fileContentsMap, setFileContentsMap] = useState<Record<string, string>>(fileContents)
  // @ts-ignore - State variable used only via setter
  const [fileHandlesMap, setFileHandlesMap] = useState<Record<string, FileSystemFileHandle | IFileHandle>>({})
  
  // Directory and config handles
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | IDirectoryHandle | null>(null)
  const [configFileHandle, setConfigFileHandle] = useState<FileSystemFileHandle | IFileHandle | null>(null)
  
  // Refs for controlling panels imperatively
  const sidebarRef = useRef<ImperativePanelHandle>(null)
  const panelRef = useRef<ImperativePanelHandle>(null)
  
  // Track collapsed state for UI updates
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

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
      // 移除源节点
      const sourcePath = findNodePath(fileTree as any, sourceId)
      if (!sourcePath) return
      const { removed, newTree } = removeAtPath(fileTree as any, sourcePath)
      // 插入到目标
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

  const handleFileClick = async (file: FileNode) => {
    // Only handle non-directory nodes
    if (file.nodeType === 'Directory') {
      return
    }
    
    // Check if we have directory access
    if (!dirHandle) {
      toast.error('请先打开文件夹')
      return
    }
    
    setSelectedFile(file.id)
    
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
