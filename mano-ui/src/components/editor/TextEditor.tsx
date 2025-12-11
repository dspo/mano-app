import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useIndexedDBAutoSave } from '@/hooks/useIndexedDB'
import { useFileSystemAutoSave } from '@/hooks/useFileSystemAutoSave'
import type { IFileHandle } from '@/services/fileSystem'

interface AutoSaveTextEditorProps {
  value: string
  onChange: (value: string) => void
  modelId: string
  fileHandle?: FileSystemFileHandle | IFileHandle
  readOnly?: boolean
  onSaveSuccess?: () => void
  onSaveError?: (error: unknown) => void
}

export function AutoSaveTextEditor({
  value,
  onChange,
  modelId,
  fileHandle,
  readOnly = false,
  onSaveSuccess,
  onSaveError,
}: AutoSaveTextEditorProps) {
  const [draft, setDraft] = useState<string>(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useIndexedDBAutoSave(readOnly ? null : `editor-content-${modelId}`, draft, 1000)
  useFileSystemAutoSave(
    readOnly ? undefined : fileHandle,
    draft,
    1000,
    onSaveSuccess,
    onSaveError
  )

  return (
    <div className="h-full flex flex-col bg-background">
      <Textarea
        value={draft}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          if (!readOnly) {
            onChange(next)
          }
        }}
        readOnly={readOnly}
        className="flex-1 min-h-0 h-full resize-none font-mono text-sm leading-6"
        placeholder="Start typing..."
      />
    </div>
  )
}
