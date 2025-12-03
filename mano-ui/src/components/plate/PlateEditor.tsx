import { useCallback } from 'react'
import { Plate, usePlateEditor, PlateContent } from 'platejs/react'

interface PlateEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  readOnly?: boolean
}

export function PlateEditor({ value, onChange, readOnly = false }: PlateEditorProps) {
  const handleChange = useCallback((newValue: unknown) => {
    onChange(newValue)
  }, [onChange])

  const editor = usePlateEditor({
    value: value as never,
    override: {
      enabled: {
        readOnly: readOnly,
      },
    },
  })

  return (
    <div className="h-full flex flex-col bg-background">
      <Plate 
        editor={editor}
        onChange={({ value: newValue }) => handleChange(newValue)}
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

