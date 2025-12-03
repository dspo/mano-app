import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ManoNode } from '@/types/mano-config'

// For backward compatibility, keep FileNode as alias
export type FileNode = ManoNode

interface FileTreeItemProps {
  node: FileNode
  level: number
  onFileClick: (file: FileNode) => void
  selectedFile: string | null
}

function FileTreeItem({ node, level, onFileClick, selectedFile }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  
  // Determine if node is a directory
  const isDirectory = node.nodeType === 'Directory'

  if (!isDirectory) {
    // Render file node
    return (
      <button
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer',
          selectedFile === node.id && 'bg-accent',
          node.readOnly && 'opacity-60'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onFileClick(node)}
        disabled={node.readOnly}
      >
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate">{node.name}</span>
        {node.unread !== undefined && node.unread > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {node.unread}
          </span>
        )}
      </button>
    )
  }

  // Render directory node
  return (
    <div>
      <button
        className={cn(
          'w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent/50 cursor-pointer',
          node.readOnly && 'opacity-60'
        )}
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
        {node.unread !== undefined && node.unread > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {node.unread}
          </span>
        )}
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

export function PrimarySidebar({ activity, onFileClick, selectedFile, fileTree = [] }: PrimarySidebarProps) {
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
