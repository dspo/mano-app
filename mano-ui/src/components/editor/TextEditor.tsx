import { useCallback, useEffect, useRef, useState } from 'react'
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

const serializeValue = (val: Value) => JSON.stringify(val, null, 2)

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
  const syncFromExternal = useRef(false)

  useEffect(() => {
    const nextValue = parseValue(value)
    const nextSerialized = serializeValue(nextValue)

    if (nextSerialized === serializedDraft) return

    // 延迟到微任务，避免在 effect 里同步 setState 被规则拦截。
    queueMicrotask(() => {
      syncFromExternal.current = true
      setDraftValue(nextValue)
      setSerializedDraft(nextSerialized)
    })
  }, [value, serializedDraft])

  const editor = usePlateEditor(
    {
      id: modelId,
      plugins: EditorKit,
      value: draftValue,
    }
  )

  const handleChange = useCallback(
    ({ value: next }: { value: Value }) => {
      if (syncFromExternal.current) {
        syncFromExternal.current = false
        return
      }
      setDraftValue(next)
      const serialized = serializeValue(next)
      setSerializedDraft(serialized)
      if (!readOnly) {
        onChange(serialized)
      }
    },
    [onChange, readOnly]
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

  const plateEditor = editor as ReturnType<typeof usePlateEditor> | null

  if (!plateEditor) {
    console.warn('[TextEditor] editor not initialized')
    return null
  }

  return (
    <Plate editor={plateEditor} onChange={handleChange} readOnly={readOnly}>
      <EditorContainer className="bg-background">
        <Editor />
      </EditorContainer>
    </Plate>
  )
}
