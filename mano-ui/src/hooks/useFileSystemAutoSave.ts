import { useEffect, useRef } from 'react'
import { getFileSystem } from '@/services/fileSystem'
import type { IFileHandle } from '@/services/fileSystem'

/**
 * File system auto-save hook
 * Supports cross-platform file saving for both browser and Tauri environments
 * 
 * @param fileHandle - File handle from FileSystemFileHandle (browser) or IFileHandle (Tauri)
 * @param content - Content to save (will be JSON stringified if not a string)
 * @param delay - Debounce delay in milliseconds (default: 1000ms)
 * @param onSaveSuccess - Callback invoked after successful save
 * @param onSaveError - Callback invoked on save failure
 * 
 * @remarks
 * - Changes are debounced by the specified delay
 * - Attempts to save on component unmount (may not complete)
 * - Uses deep comparison via JSON.stringify for change detection
 */
export function useFileSystemAutoSave(
  fileHandle: FileSystemFileHandle | IFileHandle | undefined,
  content: unknown,
  delay: number = 1000,
  onSaveSuccess?: () => void,
  onSaveError?: (error: unknown) => void
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const previousContentRef = useRef<unknown>(undefined)
  const isSavingRef = useRef(false)
  const latestContentRef = useRef<unknown>(content)
  const latestFileHandleRef = useRef(fileHandle)
  
  // Update latest references
  latestContentRef.current = content
  latestFileHandleRef.current = fileHandle

  const saveToFile = async (contentToSave: unknown) => {
    const currentHandle = latestFileHandleRef.current
    if (!currentHandle || isSavingRef.current) {
      return
    }

    try {
      isSavingRef.current = true

      // Serialize content to string
      const textContent =
        typeof contentToSave === 'string' ? contentToSave : JSON.stringify(contentToSave, null, 2)

      // Use cross-platform file system strategy
      const fileSystem = getFileSystem()
      await fileSystem.saveToFile(currentHandle as IFileHandle, textContent)

      console.log('[FileSystemAutoSave] Saved to disk')
      onSaveSuccess?.()
      
      // Update saved content reference
      previousContentRef.current = contentToSave
    } catch (error) {
      console.error('[FileSystemAutoSave] Failed to save:', error)
      onSaveError?.(error)
    } finally {
      isSavingRef.current = false
    }
  }

  useEffect(() => {
    // Clear previous timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't save when file handle is missing
    if (!fileHandle) {
      return
    }

    // First render, initialize previousContentRef
    if (previousContentRef.current === undefined) {
      previousContentRef.current = content
      return
    }

    // Compare if content actually changed (deep comparison)
    const currentContentStr = JSON.stringify(content)
    const previousContentStr = JSON.stringify(previousContentRef.current)
    
    if (currentContentStr !== previousContentStr) {
      console.log('[FileSystemAutoSave] Content changed, scheduling save...')
      
      // Set debounce timer
      timeoutRef.current = setTimeout(() => {
        saveToFile(content)
      }, delay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, fileHandle, delay, saveToFile])

  // Immediately save unsaved content on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Check for unsaved content
      const latestContent = latestContentRef.current
      const currentHandle = latestFileHandleRef.current
      
      if (
        currentHandle &&
        previousContentRef.current !== undefined &&
        JSON.stringify(latestContent) !== JSON.stringify(previousContentRef.current)
      ) {
        // Final save on component unmount (synchronous execution)
        saveToFile(latestContent)
      }
    }
  }, [saveToFile])
}
