import { PlateEditor } from './PlateEditor'
import { useIndexedDBAutoSave } from '@/hooks/useIndexedDB'
import { useFileSystemAutoSave } from '@/hooks/useFileSystemAutoSave'
import type { IFileHandle } from '@/services/fileSystem'

interface AutoSavePlateEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  modelId: string // For IndexedDB key (use modelId instead of tabId for single source of truth)
  fileHandle?: FileSystemFileHandle | IFileHandle // File handle for saving to file system
  readOnly?: boolean
  onSaveSuccess?: () => void // Save success callback
  onSaveError?: (error: unknown) => void // Save error callback
}

export function AutoSavePlateEditor({ 
  value, 
  onChange, 
  modelId,
  fileHandle,
  readOnly = false,
  onSaveSuccess,
  onSaveError,
}: AutoSavePlateEditorProps) {
  // Auto-save to IndexedDB (1s debounce) - as local backup (skip when readOnly)
  // Use modelId instead of tabId to avoid duplicate storage for same file opened in multiple tabs
  useIndexedDBAutoSave(readOnly ? null : `editor-content-${modelId}`, value, 1000)

  // Auto-save to file system (1s debounce) - persist to disk (skip when readOnly)
  useFileSystemAutoSave(readOnly ? undefined : fileHandle, value, 1000, onSaveSuccess, onSaveError)

  return (
    <PlateEditor 
      value={value} 
      onChange={onChange} 
      readOnly={readOnly}
    />
  )
}
