/**
 * Tauri File System Strategy
 * Uses Tauri APIs for desktop environment
 */

import type { ManoConfig } from '@/types/mano-config'
import { createDefaultManoConfig } from '@/types/mano-config'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs'
import type {
  IFileSystemStrategy,
  IDirectoryHandle,
  IFileHandle,
  ManoConfigResult,
  FileResult,
} from './types'
import { isTauri } from '@/lib/utils'

/**
 * Tauri-specific directory handle wrapper
 */
class TauriDirectoryHandle implements IDirectoryHandle {
  readonly kind = 'directory' as const
  readonly name: string
  readonly path: string

  constructor(path: string) {
    this.path = path
    this.name = path.split('/').pop() || path
  }
}

/**
 * Tauri-specific file handle wrapper
 */
class TauriFileHandle implements IFileHandle {
  readonly kind = 'file' as const
  readonly name: string
  readonly path: string

  constructor(path: string) {
    this.path = path
    this.name = path.split('/').pop() || path
  }
}

export class TauriFileSystemStrategy implements IFileSystemStrategy {
  isSupported(): boolean {
    return isTauri()
  }

  async pickDirectory(): Promise<IDirectoryHandle> {
    if (!this.isSupported()) {
      throw new Error('Tauri environment not detected. __TAURI_INTERNALS__ is not available.')
    }
    
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      })
      
      if (!selected || typeof selected !== 'string') {
        throw new Error('No directory selected')
      }

      return new TauriDirectoryHandle(selected)
    } catch (error) {
      console.error('[TauriFS] Failed to pick directory:', error)
      throw error
    }
  }

  async readOrCreateManoConfig(dirHandle: IDirectoryHandle): Promise<ManoConfigResult> {
    const tauriHandle = dirHandle as TauriDirectoryHandle
    const configPath = `${tauriHandle.path}/mano.conf.json`

    try {
      // Check if file exists
      const fileExists = await exists(configPath)

      if (fileExists) {
        // Read existing file
        const text = await readTextFile(configPath)
        const config = JSON.parse(text) as ManoConfig

        return {
          config,
          fileHandle: new TauriFileHandle(configPath),
        }
      } else {
        // File doesn't exist, create it
        const config = createDefaultManoConfig()
        await writeTextFile(configPath, JSON.stringify(config, null, 2))

        return {
          config,
          fileHandle: new TauriFileHandle(configPath),
        }
      }
    } catch (error) {
      console.error('[TauriFS] Failed to read or create mano.conf.json:', error)
      throw error
    }
  }

  async getOrCreateFile(
    dirHandle: IDirectoryHandle,
    filename: string,
    defaultContent: string | unknown = ''
  ): Promise<FileResult> {
    const tauriHandle = dirHandle as TauriDirectoryHandle
    const filePath = `${tauriHandle.path}/${filename}`

    try {
      const fileExists = await exists(filePath)

      if (fileExists) {
        // Read existing file
        const content = await readTextFile(filePath)
        return {
          fileHandle: new TauriFileHandle(filePath),
          content,
        }
      } else {
        // File doesn't exist, create it
        const textContent =
          typeof defaultContent === 'string'
            ? defaultContent
            : JSON.stringify(defaultContent, null, 2)

        await writeTextFile(filePath, textContent)

        return {
          fileHandle: new TauriFileHandle(filePath),
          content: textContent,
        }
      }
    } catch (error) {
      console.error(`[TauriFS] Failed to get or create file ${filename}:`, error)
      throw error
    }
  }

  async saveToFile(fileHandle: IFileHandle, content: string | unknown): Promise<boolean> {
    const tauriHandle = fileHandle as TauriFileHandle

    try {
      // Convert content to string if needed
      const textContent =
        typeof content === 'string' ? content : JSON.stringify(content, null, 2)

      await writeTextFile(tauriHandle.path, textContent)

      return true
    } catch (error) {
      console.error('[TauriFS] Failed to save:', error)
      return false
    }
  }

  async readFromFile(fileHandle: IFileHandle): Promise<string> {
    const tauriHandle = fileHandle as TauriFileHandle

    try {
      return await readTextFile(tauriHandle.path)
    } catch (error) {
      console.error('[TauriFS] Failed to read:', error)
      throw error
    }
  }

  async saveManoConfig(fileHandle: IFileHandle, config: ManoConfig): Promise<boolean> {
    // Update lastUpdated timestamp
    config.lastUpdated = new Date().toISOString()
    return this.saveToFile(fileHandle, config)
  }
}
