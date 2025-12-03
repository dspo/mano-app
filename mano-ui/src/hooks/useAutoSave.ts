import { useEffect, useRef } from 'react'

/**
 * 自动保存 hook - 在内容变化后延迟执行保存
 */
export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => void | Promise<void>,
  delay: number = 1000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const previousValueRef = useRef<T>(value)

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 只有当值真正改变时才设置新的定时器
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
