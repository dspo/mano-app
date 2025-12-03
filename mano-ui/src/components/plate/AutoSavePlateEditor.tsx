import { useCallback } from 'react'
import { PlateEditor } from './PlateEditor'
import { useAutoSave } from '@/hooks/useAutoSave'
import { toast } from 'sonner'

interface AutoSavePlateEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  fileName: string
  readOnly?: boolean
}

export function AutoSavePlateEditor({ 
  value, 
  onChange, 
  fileName,
  readOnly = false 
}: AutoSavePlateEditorProps) {
  // 模拟保存到服务器/文件系统
  const handleSave = useCallback(async (content: unknown) => {
    try {
      // TODO: 实现真实的文件保存逻辑
      // await saveFile(fileName, JSON.stringify(content, null, 2))
      
      console.log(`[AutoSave] Saved ${fileName}:`, content)
      
      // 可选：显示保存成功提示（不影响用户体验）
      // toast.success('Changes saved', { duration: 1000 })
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error)
      toast.error('Failed to save changes')
    }
  }, [fileName])

  // 使用防抖自动保存（1秒延迟）
  useAutoSave(value, handleSave, 1000)

  return (
    <PlateEditor 
      value={value} 
      onChange={onChange} 
      readOnly={readOnly}
    />
  )
}
