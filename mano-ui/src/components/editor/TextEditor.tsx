import { useEffect, useState } from 'react'
import { KEYS, type Value } from 'platejs'
import { Plate, usePlateEditor } from 'platejs/react'

import { EditorContainer, Editor } from '@/components/ui/editor'
import { EditorKit } from '@/components/editor/editor-kit'
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

const serializeValue = (val: Value) => JSON.stringify(val)

const defaultValue: Value = [
  {
    id: 'p-0',
    type: KEYS.p,
    children: [{ text: '' }],
  },
]

const textToValue = (text: string): Value => {
  if (!text) return defaultValue

  return text.split('\n').map((line, index) => ({
    id: `p-${index}`,
    type: KEYS.p,
    children: [{ text: line }],
  }))
}

const parseValue = (raw: string): Value => {
  if (!raw) return defaultValue

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch (error) {
    console.warn('[Editor] Failed to parse content as JSON, fallback to plain text.', error)
  }

  return textToValue(raw)
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
  const [draftValue, setDraftValue] = useState<Value>(() => parseValue(value))
  const [serializedDraft, setSerializedDraft] = useState(() =>
    serializeValue(parseValue(value))
  )

  useEffect(() => {
    const nextValue = parseValue(value)
    const nextSerialized = serializeValue(nextValue)

    if (nextSerialized === serializedDraft) return

    // 同步外部传入内容到本地编辑状态；仅在内容变化时更新，避免无意义的重渲染。
    setDraftValue(nextValue)
    setSerializedDraft(nextSerialized)
  }, [value, serializedDraft])

  const editor = usePlateEditor(
    {
      id: modelId,
      plugins: EditorKit,
      value: draftValue,
      onChange: (next: Value) => {
        setDraftValue(next)
        const serialized = serializeValue(next)
        setSerializedDraft(serialized)

        if (!readOnly) {
          onChange(serialized)
        }
      },
    } as any
  )

  useIndexedDBAutoSave(
    readOnly ? null : `editor-content-${modelId}`,
    serializedDraft,
    1000
  )

  useFileSystemAutoSave(
    readOnly ? undefined : fileHandle,
    serializedDraft,
    1000,
    onSaveSuccess,
    onSaveError
  )

  return (
    <Plate editor={editor} readOnly={readOnly}>
      <EditorContainer variant="demo" className="bg-background">
        <Editor variant="demo" />
      </EditorContainer>
    </Plate>
  )
}
