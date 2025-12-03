import { useContext } from 'react'
import { EditorContext } from '@/contexts/EditorContext'
import type { EditorContextValue } from '@/contexts/EditorContext'

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}
