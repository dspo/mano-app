import { PlateEditor } from './PlateEditor'
import { useIndexedDBAutoSave } from '@/hooks/useIndexedDB'
import { useFileSystemAutoSave } from '@/hooks/useFileSystemAutoSave'
import type { IFileHandle } from '@/services/fileSystem'

interface AutoSavePlateEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  tabId: string // 用于 IndexedDB 键
  fileHandle?: FileSystemFileHandle | IFileHandle // 文件句柄，用于保存到文件系统
  readOnly?: boolean
  onSaveSuccess?: () => void // 保存成功回调
  onSaveError?: (error: unknown) => void // 保存失败回调
}

export function AutoSavePlateEditor({ 
  value, 
  onChange, 
  tabId,
  fileHandle,
  readOnly = false,
  onSaveSuccess,
  onSaveError,
}: AutoSavePlateEditorProps) {
  // 自动保存到 IndexedDB（1秒防抖）- 作为本地备份
  useIndexedDBAutoSave(`editor-content-${tabId}`, value, 1000)

  // 自动保存到文件系统（1秒防抖）- 持久化到磁盘
  useFileSystemAutoSave(fileHandle, value, 1000, onSaveSuccess, onSaveError)

  return (
    <PlateEditor 
      value={value} 
      onChange={onChange} 
      readOnly={readOnly}
    />
  )
}
