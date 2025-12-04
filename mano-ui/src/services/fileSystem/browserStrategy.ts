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
}
