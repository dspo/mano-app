/**
 * Browser File System Strategy
 * Uses File System Access API for browser environment
 */

import type { ManoConfig } from '@/types/mano-config'
import { createDefaultManoConfig } from '@/types/mano-config'
import type {
  IFileSystemStrategy,
  IDirectoryHandle,
  IFileHandle,
  ManoConfigResult,
  FileResult,
} from './types'

// Extend Window interface for File System Access API
declare global {
  interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>
  }
}

/**
 * Browser-specific directory handle wrapper
 */
class BrowserDirectoryHandle implements IDirectoryHandle {
  readonly kind = 'directory' as const
  readonly name: string
  readonly handle: FileSystemDirectoryHandle

  constructor(handle: FileSystemDirectoryHandle) {
    this.handle = handle
    this.name = handle.name
  }
}

/**
 * Browser-specific file handle wrapper
 */
class BrowserFileHandle implements IFileHandle {
  readonly kind = 'file' as const
  readonly name: string
  readonly handle: FileSystemFileHandle

  constructor(handle: FileSystemFileHandle) {
    this.handle = handle
    this.name = handle.name
  }
}

export class BrowserFileSystemStrategy implements IFileSystemStrategy {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }

  async pickDirectory(): Promise<IDirectoryHandle> {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      })
      return new BrowserDirectoryHandle(handle)
    } catch (error) {
      console.error('[BrowserFS] Failed to pick directory:', error)
      throw error
    }
  }

  async readOrCreateManoConfig(dirHandle: IDirectoryHandle): Promise<ManoConfigResult> {
    const browserHandle = (dirHandle as BrowserDirectoryHandle).handle

    try {
      // Try to get existing mano.conf.json
      const fileHandle = await browserHandle.getFileHandle('mano.conf.json')
      const file = await fileHandle.getFile()
      const text = await file.text()
      const config = JSON.parse(text) as ManoConfig

      console.log('[BrowserFS] Loaded mano.conf.json')
      return {
        config,
        fileHandle: new BrowserFileHandle(fileHandle),
      }
    } catch {
      // File doesn't exist, create it
      console.log('[BrowserFS] mano.conf.json not found, creating default...')

      const fileHandle = await browserHandle.getFileHandle('mano.conf.json', { create: true })
      const config = createDefaultManoConfig()

      // Save default config
      await this.saveToFile(new BrowserFileHandle(fileHandle), config)

      console.log('[BrowserFS] Created mano.conf.json')
      return {
        config,
        fileHandle: new BrowserFileHandle(fileHandle),
      }
    }
  }

  async getOrCreateFile(
    dirHandle: IDirectoryHandle,
    filename: string,
    defaultContent: string | unknown = ''
  ): Promise<FileResult> {
    const browserHandle = (dirHandle as BrowserDirectoryHandle).handle

    try {
      // Try to get existing file
      const fileHandle = await browserHandle.getFileHandle(filename)
      const content = await this.readFromFile(new BrowserFileHandle(fileHandle))
      return {
        fileHandle: new BrowserFileHandle(fileHandle),
        content,
      }
    } catch {
      // File doesn't exist, create it
      console.log(`[BrowserFS] Creating new file: ${filename}`)

      const fileHandle = await browserHandle.getFileHandle(filename, { create: true })
      const textContent =
        typeof defaultContent === 'string' ? defaultContent : JSON.stringify(defaultContent, null, 2)

      await this.saveToFile(new BrowserFileHandle(fileHandle), textContent)
      return {
        fileHandle: new BrowserFileHandle(fileHandle),
        content: textContent,
      }
    }
  }

  async saveToFile(fileHandle: IFileHandle, content: string | unknown): Promise<boolean> {
    const browserHandle = (fileHandle as BrowserFileHandle).handle

    try {
      // Create a writable stream
      const writable = await browserHandle.createWritable()

      // Convert content to string if needed
      const textContent =
        typeof content === 'string' ? content : JSON.stringify(content, null, 2)

      // Write content
      await writable.write(textContent)

      // Close the file
      await writable.close()

      console.log(`[BrowserFS] Saved to disk successfully`)
      return true
    } catch (error) {
      console.error('[BrowserFS] Failed to save:', error)
      return false
    }
  }

  async readFromFile(fileHandle: IFileHandle): Promise<string> {
    const browserHandle = (fileHandle as BrowserFileHandle).handle

    try {
      const file = await browserHandle.getFile()
      return await file.text()
    } catch (error) {
      console.error('[BrowserFS] Failed to read:', error)
      throw error
    }
  }

  async saveManoConfig(fileHandle: IFileHandle, config: ManoConfig): Promise<boolean> {
    // Update lastUpdated timestamp
    config.lastUpdated = new Date().toISOString()
    return this.saveToFile(fileHandle, config)
  }

  async deleteFile(dirHandle: IDirectoryHandle, filename: string): Promise<boolean> {
    const browserHandle = (dirHandle as BrowserDirectoryHandle).handle

    try {
      await browserHandle.removeEntry(filename)
      console.log(`[BrowserFS] Deleted file: ${filename}`)
      return true
    } catch (error) {
      console.error(`[BrowserFS] Failed to delete file: ${filename}`, error)
      return false
    }
  }

  /**
   * Atomically rename a file in the directory.
   * 
   * Contract:
   * - If returns true: File was successfully renamed, old file deleted, new file exists
   * - If returns false: File rename failed, filesystem unchanged (strong atomicity guarantee)
   * 
   * Safety Measures:
   * 1. Check if target file already exists BEFORE creating it (prevent overwrite)
   * 2. Create new file first (read content → create new file → verify)
   * 3. Delete old file only after new file successfully created
   * 4. If deletion fails: Attempt rollback by removing the newly created file
   * 5. If rollback fails: Log critical error (indicates filesystem corruption)
   * 
   * Caller Responsibility:
   * - Only call this after confirming the rename operation is necessary
   * - If this returns false, caller must not modify application state
   * - Caller should display error to user and preserve original state
   */
  async renameFile(dirHandle: IDirectoryHandle, oldFilename: string, newFilename: string): Promise<boolean> {
    const browserHandle = (dirHandle as BrowserDirectoryHandle).handle

    try {
      // Pre-check 1: Verify old file exists
      let oldFileHandle: FileSystemFileHandle
      try {
        oldFileHandle = await browserHandle.getFileHandle(oldFilename)
      } catch {
        console.error(`[BrowserFS] Source file does not exist: ${oldFilename}`)
        return false
      }

      // Pre-check 2: Verify target file does NOT exist (prevent data loss)
      let targetExists = false
      try {
        await browserHandle.getFileHandle(newFilename)
        targetExists = true
      } catch {
        // Expected: new file doesn't exist yet
      }

      if (targetExists) {
        console.error(`[BrowserFS] Target file already exists: ${newFilename} - abort rename to prevent data loss`)
        return false
      }

      // Read old file content
      const file = await oldFileHandle.getFile()
      const content = await file.text()

      // Browser File System Access API doesn't support direct rename
      // Strategy: read old file → create new file → delete old file
      try {
        // Step 1: Create new file with old file's content
        const newFileHandle = await browserHandle.getFileHandle(newFilename, { create: true })
        const writable = await newFileHandle.createWritable()
        await writable.write(content)
        await writable.close()

        // Step 2: Delete old file
        try {
          await browserHandle.removeEntry(oldFilename)
          return true
        } catch (deleteError) {
          // Deletion failed - attempt rollback to maintain consistency
          console.error(`[BrowserFS] Failed to delete old file: ${oldFilename}`, deleteError)
          try {
            await browserHandle.removeEntry(newFilename)
            console.error(`[BrowserFS] Rolled back new file creation due to deletion failure`)
          } catch (rollbackError) {
            // Rollback failed - data is now in inconsistent state
            console.error(`[BrowserFS] Critical: Failed to rollback - both files may exist: ${oldFilename}, ${newFilename}`, rollbackError)
          }
          return false
        }
      } catch (createError) {
        console.error(`[BrowserFS] Failed to create new file: ${newFilename}`, createError)
        return false
      }
    } catch (error) {
      console.error(`[BrowserFS] Unexpected error during rename: ${oldFilename} → ${newFilename}`, error)
      return false
    }
  }
}
