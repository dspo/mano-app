import { useEffect, useRef } from 'react'
import { Plate, usePlateEditor, PlateContent } from 'platejs/react'

interface PlateEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  readOnly?: boolean
}

export function PlateEditor({ value, onChange, readOnly = false }: PlateEditorProps) {
  const editor = usePlateEditor({
    value: value as never,
    readOnly: readOnly,
  })

  // Track if value changed externally (from another tab editing same file)
  const isInternalChange = useRef(false)
  const prevValue = useRef(value)

  useEffect(() => {
    // If value changed externally (another tab editing same file), sync editor state
    if (!isInternalChange.current && prevValue.current !== value) {
      editor.children = value as never
      // Trigger editor update
      if (typeof editor.onChange === 'function') {
        editor.onChange()
      }
    }
    prevValue.current = value
    isInternalChange.current = false
  }, [value, editor])

  return (
    <div className="h-full flex flex-col bg-background">
      <Plate 
        editor={editor}
        onChange={({ value: newValue }) => {
          if (!readOnly) {
            isInternalChange.current = true
            onChange(newValue)
          }
        }}
      >
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto py-8 px-6">
            <PlateContent
              className="outline-none min-h-full"
              placeholder="Start typing..."
            />
          </div>
        </div>
      </Plate>
    </div>
  )
}

