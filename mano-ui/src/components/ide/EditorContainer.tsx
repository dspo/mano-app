import type { EditorLayout } from '@/types/editor'
import { useEditor } from '@/hooks/useEditor'
import { EditorGroupWrapper } from './EditorGroupWrapper'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

interface EditorContainerProps {
  layout: EditorLayout
}

export function EditorContainer({ layout }: EditorContainerProps) {
  const { state } = useEditor()

  if (layout.type === 'group') {
    const group = state.groups[layout.groupId]
    if (!group) return null

    return <EditorGroupWrapper group={group} />
  }

  // Split layout - recursive rendering of nested panels
  return (
    <ResizablePanelGroup
      direction={layout.direction}
      className="h-full"
    >
      {layout.children.map((child, index) => (
        <div key={index} className="contents">
          <ResizablePanel
            defaultSize={layout.sizes?.[index] || 50}
            minSize={20}
          >
            <EditorContainer layout={child} />
          </ResizablePanel>
          {index < layout.children.length - 1 && <ResizableHandle withHandle />}
        </div>
      ))}
    </ResizablePanelGroup>
  )
}
