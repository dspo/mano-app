import { X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface OpenFile {
  id: string
  name: string
  content: string
  isDirty: boolean
}

interface EditorGroupProps {
  openFiles: OpenFile[]
  activeFile: string | null
  onFileSelect: (fileId: string) => void
  onFileClose: (fileId: string) => void
}

export function EditorGroup({ openFiles, activeFile, onFileSelect, onFileClose }: EditorGroupProps) {
  if (openFiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file opened</p>
          <p className="text-sm">Select a file from the explorer to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <Tabs value={activeFile || undefined} onValueChange={onFileSelect} className="h-full flex flex-col">
      <TabsList className="h-10 border-b rounded-none bg-background justify-start w-full overflow-x-auto">
        {openFiles.map((file) => (
          <TabsTrigger
            key={file.id}
            value={file.id}
            className="relative data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 gap-2"
          >
            <span className="text-sm">{file.name}</span>
            {file.isDirty && <span className="w-2 h-2 rounded-full bg-primary" />}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 hover:bg-accent ml-1"
              onClick={(e) => {
                e.stopPropagation()
                onFileClose(file.id)
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </TabsTrigger>
        ))}
      </TabsList>

      {openFiles.map((file) => (
        <TabsContent key={file.id} value={file.id} className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap">{file.content}</pre>
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export type { OpenFile }
