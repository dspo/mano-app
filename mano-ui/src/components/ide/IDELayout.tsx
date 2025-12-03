import { useState, useEffect, useRef } from 'react'
import { TitleBar } from './TitleBar'
import { ActivityBar } from './ActivityBar'
import { PrimarySidebar, type FileNode } from './PrimarySidebar'
import { EditorContainer } from './EditorContainer'
import { BottomPanel } from './BottomPanel'
import { StatusBar } from './StatusBar'
import { EdgeDropZones } from './EdgeDropZone'
import { FloatingNotification } from './FloatingNotification'
import { EditorProvider } from '@/contexts/EditorContext'
import { useEditor } from '@/hooks/useEditor'
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
      </Button>
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
})`
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

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.id)
      
      // Open file in the first editor group
      dispatch({
        type: 'OPEN_FILE',
        fileId: file.id,
        fileName: file.name,
        content: fileContents[file.id] || `// Content of ${file.name}\n\nFile content goes here...`,
      })
    }
  }

  // Note: File closing is now handled inside EditorGroupWrapper

  // Split editor functions
  const handleSplitEditorRight = () => {
    dispatch({ type: 'SPLIT_GROUP', groupId: state.lastFocusedGroupId, direction: 'horizontal' })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [handleSplitEditorRight])

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
