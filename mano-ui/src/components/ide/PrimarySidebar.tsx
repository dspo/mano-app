import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        children: [
          { id: '3', name: 'Button.tsx', type: 'file' },
          { id: '4', name: 'Input.tsx', type: 'file' },
        ],
      },
      { id: '5', name: 'App.tsx', type: 'file' },
      { id: '6', name: 'main.tsx', type: 'file' },
      { id: '7', name: 'index.css', type: 'file' },
    ],
  },
  {
    id: '8',
    name: 'public',
    type: 'folder',
    children: [
      { id: '9', name: 'vite.svg', type: 'file' },
    ],
  },
  { id: '10', name: 'package.json', type: 'file' },
  { id: '11', name: 'tsconfig.json', type: 'file' },
  { id: '12', name: 'vite.config.ts', type: 'file' },
  { id: '13', name: 'document.slate.json', type: 'file' },
]

interface FileTreeItemProps {
  node: FileNode
  level: number
  onFileClick: (file: FileNode) => void
  selectedFile: string | null
}

function FileTreeItem({ node, level, onFileClick, selectedFile }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (node.type === 'file') {
    return (
      <button
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer',
          selectedFile === node.id && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onFileClick(node)}
      >
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    )
  }

  return (
    <div>
      <button
        className="w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" />
        )}
        <Folder className="w-4 h-4 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PrimarySidebarProps {
  activity: string
  onFileClick: (file: FileNode) => void
  selectedFile: string | null
  fileTree?: FileNode[]
}

export function PrimarySidebar({ activity, onFileClick, selectedFile, fileTree = mockFileTree }: PrimarySidebarProps) {
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
    </div>
  )
}

export type { FileNode }
