import { Terminal as TerminalIcon, AlertCircle, FileOutput, Bug, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface BottomPanelProps {
  isVisible: boolean
  onClose: () => void
}

export function BottomPanel({ onClose }: BottomPanelProps) {
  return (
    <div className="h-full border-t bg-background">
      <Tabs defaultValue="terminal" className="h-full flex flex-col">
        <div className="h-10 bg-muted/50 rounded-none justify-start border-b flex items-center">
          <TabsList className="h-10 bg-transparent rounded-none justify-start border-0 flex-1">
            <TabsTrigger value="terminal" className="gap-2">
              <TerminalIcon className="w-4 h-4" />
              Terminal
            </TabsTrigger>
            <TabsTrigger value="problems" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Problems
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-destructive/20 text-destructive rounded">3</span>
            </TabsTrigger>
            <TabsTrigger value="output" className="gap-2">
              <FileOutput className="w-4 h-4" />
              Output
            </TabsTrigger>
            <TabsTrigger value="debug" className="gap-2">
              <Bug className="w-4 h-4" />
              Debug Console
            </TabsTrigger>
          </TabsList>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 mr-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <TabsContent value="terminal" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 font-mono text-sm">
              <div className="text-muted-foreground mb-2">$ pnpm dev</div>
              <div className="text-green-500">✓ Server running at http://localhost:5173/</div>
              <div className="text-muted-foreground mt-2">$ _</div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="problems" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="flex items-start gap-3 py-2 hover:bg-accent/50 px-2 rounded">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm">Unused variable 'count'</div>
                  <div className="text-xs text-muted-foreground">src/App.tsx [5, 9]</div>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 hover:bg-accent/50 px-2 rounded">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm">Missing return type on function</div>
                  <div className="text-xs text-muted-foreground">src/utils.ts [12, 15]</div>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 hover:bg-accent/50 px-2 rounded">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm">Cannot find module './missing'</div>
                  <div className="text-xs text-muted-foreground">src/main.tsx [3, 1]</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="output" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 font-mono text-xs">
              <div className="text-muted-foreground">[vite] connecting...</div>
              <div className="text-green-500">[vite] connected.</div>
              <div className="text-muted-foreground">[vite] hmr update /src/App.tsx</div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="debug" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 font-mono text-xs text-muted-foreground">
              Debug console is empty
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
