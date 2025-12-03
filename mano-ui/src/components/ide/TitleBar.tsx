import { Minimize2, Maximize2, X, Circle, Check, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TitleBarProps {
  showSidebar: boolean
  showPanel: boolean
  onToggleSidebar: () => void
  onTogglePanel: () => void
  onSplitEditorRight?: () => void
  onOpenFolder?: () => void
  onSave?: () => void
}

export function TitleBar({ 
  showSidebar, 
  showPanel, 
  onToggleSidebar, 
  onTogglePanel,
  onSplitEditorRight,
  onOpenFolder,
  onSave,
}: TitleBarProps) {
  return (
    <div className="h-12 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Circle className="w-4 h-4 text-primary fill-primary" />
        <span className="font-semibold text-sm">Mano IDE</span>
        
        <div className="flex items-center gap-1 ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>New File</DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenFolder}>Open Folder</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSave}>
                <div className="flex items-center justify-between w-full gap-8">
                  <span>Save</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘S</kbd>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>Save All</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Close Editor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                Edit
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Undo</DropdownMenuItem>
              <DropdownMenuItem>Redo</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cut</DropdownMenuItem>
              <DropdownMenuItem>Copy</DropdownMenuItem>
              <DropdownMenuItem>Paste</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onToggleSidebar}>
                <div className="flex items-center justify-between w-full gap-8">
                  <span>Sidebar</span>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘B</kbd>
                    {showSidebar && <Check className="w-4 h-4" />}
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePanel}>
                <div className="flex items-center justify-between w-full gap-8">
                  <span>Panel</span>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘J</kbd>
                    {showPanel && <Check className="w-4 h-4" />}
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSplitEditorRight}>
                <PanelRight className="w-4 h-4 mr-2" />
                <div className="flex items-center justify-between w-full gap-4">
                  <span>Split Editor Right</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘\</kbd>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Zoom In</DropdownMenuItem>
              <DropdownMenuItem>Zoom Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                Terminal
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>New Terminal</DropdownMenuItem>
              <DropdownMenuItem>Split Terminal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Minimize2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
