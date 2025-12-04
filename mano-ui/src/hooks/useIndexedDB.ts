import { useEffect, useCallback } from 'react'
import { set, get, del } from 'idb-keyval'

/**
 * Hook for auto-saving content to IndexedDB
 * @param key - Unique key for storing the content (null to skip auto-save)
 * @param value - Content to save
 * @param delay - Debounce delay in milliseconds (default: 1000)
 */
export function useIndexedDBAutoSave<T>(
  key: string | null,
  value: T,
  delay = 1000
) {
  useEffect(() => {
    // Skip if key is null (e.g., readOnly mode)
    if (!key) return

    const timer = setTimeout(async () => {
      try {
        await set(key, value)
        console.log(`[IndexedDB] Auto-saved: ${key}`)
      } catch (error) {
        console.error(`[IndexedDB] Failed to save ${key}:`, error)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [key, value, delay])
}

/**
 * Hook for manually saving content to IndexedDB
 */
export function useIndexedDBSave() {
  const save = useCallback(async <T,>(key: string, value: T) => {
    try {
      await set(key, value)
      console.log(`[IndexedDB] Saved: ${key}`)
      return true
    } catch (error) {
      console.error(`[IndexedDB] Failed to save ${key}:`, error)
      return false
    }
  }, [])

  const load = useCallback(async <T,>(key: string): Promise<T | undefined> => {
    try {
      const value = await get<T>(key)
      if (value !== undefined) {
        console.log(`[IndexedDB] Loaded: ${key}`)
      }
      return value
    } catch (error) {
      console.error(`[IndexedDB] Failed to load ${key}:`, error)
      return undefined
    }
  }, [])

  const remove = useCallback(async (key: string) => {
    try {
      await del(key)
      console.log(`[IndexedDB] Removed: ${key}`)
      return true
    } catch (error) {
      console.error(`[IndexedDB] Failed to remove ${key}:`, error)
      return false
    }
  }, [])

  return { save, load, remove }
}
