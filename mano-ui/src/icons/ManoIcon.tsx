import manoIconPng from './icon.png'

interface ManoIconProps {
  className?: string
}

export function ManoIcon({ className = 'w-4 h-4' }: ManoIconProps) {
  return (
    <img 
      src={manoIconPng} 
      alt="Mano" 
      className={className}
    />
  )
}
