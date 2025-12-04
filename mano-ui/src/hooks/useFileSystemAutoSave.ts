import { useEffect, useRef, useCallback } from 'react'
import { getFileSystem } from '@/services/fileSystem'
import type { IFileHandle } from '@/services/fileSystem'

/**
 * 文件系统自动保存 hook
 * 支持浏览器和 Tauri 环境的跨平台文件保存
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
  
  // 更新最新的引用
  latestContentRef.current = content
  latestFileHandleRef.current = fileHandle

  const saveToFile = useCallback(async (contentToSave: unknown) => {
    const currentHandle = latestFileHandleRef.current
    if (!currentHandle || isSavingRef.current) {
      return
    }

    try {
      isSavingRef.current = true

      // 将内容序列化为字符串
      const textContent =
        typeof contentToSave === 'string' ? contentToSave : JSON.stringify(contentToSave, null, 2)

      // 使用跨平台的文件系统策略
      const fileSystem = getFileSystem()
      await fileSystem.saveToFile(currentHandle as IFileHandle, textContent)

      console.log('[FileSystemAutoSave] Saved to disk')
      onSaveSuccess?.()
      
      // 更新已保存的内容引用
      previousContentRef.current = contentToSave
    } catch (error) {
      console.error('[FileSystemAutoSave] Failed to save:', error)
      onSaveError?.(error)
    } finally {
      isSavingRef.current = false
    }
  }, [onSaveSuccess, onSaveError])

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 没有文件句柄时不保存
    if (!fileHandle) {
      return
    }

    // 首次渲染，初始化 previousContentRef
    if (previousContentRef.current === undefined) {
      previousContentRef.current = content
      return
    }

    // 比较内容是否真正改变（深度比较）
    const currentContentStr = JSON.stringify(content)
    const previousContentStr = JSON.stringify(previousContentRef.current)
    
    if (currentContentStr !== previousContentStr) {
      console.log('[FileSystemAutoSave] Content changed, scheduling save...')
      
      // 设置防抖定时器
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

  // 组件卸载时立即保存未保存的内容
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // 检查是否有未保存的内容
      const latestContent = latestContentRef.current
      const currentHandle = latestFileHandleRef.current
      
      if (
        currentHandle &&
        previousContentRef.current !== undefined &&
        JSON.stringify(latestContent) !== JSON.stringify(previousContentRef.current)
      ) {
        // 组件卸载时的最后保存（同步执行）
        saveToFile(latestContent)
      }
    }
  }, [saveToFile])
}
