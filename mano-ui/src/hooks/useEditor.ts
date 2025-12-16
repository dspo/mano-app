import { useContext } from 'react'
import { EditorContext, type EditorContextValue } from '@/contexts/EditorContextBase'

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}
