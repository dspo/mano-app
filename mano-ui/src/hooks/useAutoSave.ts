import { useEffect, useRef } from 'react'

/**
 * Auto-save hook - executes save with delay after content changes
 */
export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => void | Promise<void>,
  delay: number = 1000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const previousValueRef = useRef<T>(value)

  useEffect(() => {
    // Clear previous timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Only set new timer when value actually changes
    if (value !== previousValueRef.current) {
      timeoutRef.current = setTimeout(() => {
        onSave(value)
        previousValueRef.current = value
      }, delay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onSave, delay])
}
