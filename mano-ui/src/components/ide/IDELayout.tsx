import { useState, useEffect, useRef } from 'react'
import { TitleBar } from './TitleBar'
import { ActivityBar } from './ActivityBar'
import { PrimarySidebar, type FileNode } from './PrimarySidebar'
import { EditorGroup, type OpenFile } from './EditorGroup'
import { BottomPanel } from './BottomPanel'
import { StatusBar } from './StatusBar'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  type ImperativePanelHandle,
} from '@/components/ui/resizable'

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
  const [activeActivity, setActiveActivity] = useState('explorer')
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  
  // Refs for controlling panels imperatively
  const sidebarRef = useRef<ImperativePanelHandle>(null)
  const panelRef = useRef<ImperativePanelHandle>(null)
  
  // Track collapsed state for UI updates
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.id)
      
      // Check if file is already open
      const existingFile = openFiles.find(f => f.id === file.id)
      if (existingFile) {
        setActiveFile(file.id)
      } else {
        // Open new file
        const newFile: OpenFile = {
          id: file.id,
          name: file.name,
          content: fileContents[file.id] || `// Content of ${file.name}\n\nFile content goes here...`,
          isDirty: false,
        }
        setOpenFiles([...openFiles, newFile])
        setActiveFile(file.id)
      }
    }
  }

  const handleFileClose = (fileId: string) => {
    const newOpenFiles = openFiles.filter(f => f.id !== fileId)
    setOpenFiles(newOpenFiles)
    
    if (activeFile === fileId) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].id : null)
    }
    
    if (selectedFile === fileId) {
      setSelectedFile(null)
    }
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
                <EditorGroup
                  openFiles={openFiles}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  onFileClose={handleFileClose}
                />
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
    </div>
  )
}
