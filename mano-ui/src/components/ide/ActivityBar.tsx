import { Files, Search, GitBranch, Play, Package, Settings, PanelLeftClose, PanelLeft, PanelBottomClose, PanelBottom } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ActivityBarProps {
  activeActivity: string
  onActivityChange: (activity: string) => void
  showSidebar: boolean
  onToggleSidebar: () => void
  showPanel: boolean
  onTogglePanel: () => void
}

const activities = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'source-control', icon: GitBranch, label: 'Source Control' },
  { id: 'run-debug', icon: Play, label: 'Run and Debug' },
  { id: 'extensions', icon: Package, label: 'Extensions' },
]

export function ActivityBar({ activeActivity, onActivityChange, showSidebar, onToggleSidebar, showPanel, onTogglePanel }: ActivityBarProps) {
  return (
    <div className="w-12 bg-accent/30 flex flex-col items-center py-2 border-r">
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-col gap-1 flex-1">
          {activities.map((activity) => (
            <Tooltip key={activity.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'w-10 h-10',
                    activeActivity === activity.id && 'bg-accent'
                  )}
                  onClick={() => onActivityChange(activity.id)}
                >
                  <activity.icon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {activity.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator className="my-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 mb-1"
              onClick={onToggleSidebar}
            >
              {showSidebar ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeft className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex flex-col gap-1">
              <span>{showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded text-center">⌘B</kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 mb-1"
              onClick={onTogglePanel}
            >
              {showPanel ? (
                <PanelBottomClose className="w-5 h-5" />
              ) : (
                <PanelBottom className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex flex-col gap-1">
              <span>{showPanel ? 'Hide Panel' : 'Show Panel'}</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded text-center">⌘J</kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <Settings className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Settings
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
