import { useDroppable } from '@dnd-kit/core'
import { useDndMonitor } from '@dnd-kit/core'
import { useState } from 'react'

type EdgePosition = 'left' | 'right'

interface EdgeDropZoneProps {
  position: EdgePosition
}

export function EdgeDropZone({ position }: EdgeDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: `edge-${position}`,
    data: {
      type: 'edge',
      position,
    },
  })

  useDndMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    onDragCancel: () => setIsDragging(false),
  })

  // Position styles
  const positionClasses = {
    left: 'left-0 top-0 bottom-0 w-16',
    right: 'right-0 top-0 bottom-0 w-16',
  }

  if (!isDragging) return null

  return (
    <div
      ref={setNodeRef}
      className={`absolute ${positionClasses[position]} z-50 pointer-events-auto transition-all ${
        isOver 
          ? 'bg-primary/30 border-2 border-primary' 
          : 'bg-primary/10 border-2 border-primary/30'
      }`}
    />
  )
}

export function EdgeDropZones() {
  return (
    <>
      <EdgeDropZone position="left" />
      <EdgeDropZone position="right" />
    </>
  )
}
