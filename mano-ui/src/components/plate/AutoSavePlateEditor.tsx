import { PlateEditor } from './PlateEditor'
import { useIndexedDBAutoSave } from '@/hooks/useIndexedDB'

interface AutoSavePlateEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  tabId: string // 用于 IndexedDB 键
  readOnly?: boolean
}

export function AutoSavePlateEditor({ 
  value, 
  onChange, 
  tabId,
  readOnly = false 
}: AutoSavePlateEditorProps) {
  // 自动保存到 IndexedDB（1秒防抖）
  useIndexedDBAutoSave(`editor-content-${tabId}`, value, 1000)

  return (
    <PlateEditor 
      value={value} 
      onChange={onChange} 
      readOnly={readOnly}
    />
  )
}
