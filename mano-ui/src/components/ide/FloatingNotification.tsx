import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'

interface FloatingNotificationProps {
  message: string
  x: number
  y: number
  onClose: () => void
}

export function FloatingNotification({ message, x, y, onClose }: FloatingNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, 2000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed z-50 pointer-events-none transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)', // Center horizontally, position above cursor
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-popover text-popover-foreground border border-border rounded-md shadow-lg mb-2">
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-sm whitespace-nowrap">{message}</span>
      </div>
    </div>
  )
}
