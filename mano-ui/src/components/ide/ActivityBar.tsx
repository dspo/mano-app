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
}

const activities = [
  { id: 'explorer', icon: Files, label: 'Explorer', disabled: false },
  { id: 'search', icon: Search, label: 'Search', disabled: true },
  { id: 'source-control', icon: GitBranch, label: 'Source Control', disabled: true },
  { id: 'run-debug', icon: Play, label: 'Run and Debug', disabled: true },
  { id: 'extensions', icon: Package, label: 'Extensions', disabled: true },
]

export function ActivityBar({ activeActivity, onActivityChange, showSidebar, onToggleSidebar, showPanel }: ActivityBarProps) {
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
                  onClick={() => !activity.disabled && onActivityChange(activity.id)}
                  disabled={activity.disabled}
                >
                  <activity.icon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {activity.disabled ? 'Coming soon...' : activity.label}
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
              disabled
            >
              {showPanel ? (
                <PanelBottomClose className="w-5 h-5" />
              ) : (
                <PanelBottom className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Coming soon...
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10" disabled>
              <Settings className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Coming soon...
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
