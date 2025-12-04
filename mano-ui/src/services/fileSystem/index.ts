/**
 * File System Service - Main Entry Point
 * Strategy pattern implementation for cross-platform file system operations
 */

import { isTauri } from '@/lib/utils'
import { BrowserFileSystemStrategy } from './browserStrategy'
import { TauriFileSystemStrategy } from './tauriStrategy'
import type { IFileSystemStrategy } from './types'

// Export types for external use
export type {
  IFileSystemStrategy,
  IDirectoryHandle,
  IFileHandle,
  ManoConfigResult,
  FileResult,
} from './types'

/**
 * File System Service
 * Lazy-initialized singleton that provides the appropriate file system strategy
 */
class FileSystemService {
  private static instance: FileSystemService | null = null
  private strategy: IFileSystemStrategy | null = null

  private constructor() {
    // Strategy is initialized lazily in getStrategy()
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService()
    }
    return FileSystemService.instance
  }

  /**
   * Get the current strategy (lazy initialization)
   */
  public getStrategy(): IFileSystemStrategy {
    if (!this.strategy) {
      // Initialize strategy on first access
      if (isTauri()) {
        console.log('[FileSystem] Using Tauri strategy')
        this.strategy = new TauriFileSystemStrategy()
      } else {
        console.log('[FileSystem] Using Browser strategy')
        this.strategy = new BrowserFileSystemStrategy()
      }
    }
    return this.strategy
  }

  /**
   * Check if file system operations are supported
   */
  public isSupported(): boolean {
    return this.getStrategy().isSupported()
  }
}

/**
 * Get the file system strategy instance
 * This function performs lazy initialization
 */
export function getFileSystem(): IFileSystemStrategy {
  return FileSystemService.getInstance().getStrategy()
}

/**
 * Check if file system operations are supported
 */
export function isFileSystemSupported(): boolean {
  return FileSystemService.getInstance().isSupported()
}

// Re-export for convenience
export { getNodeFilename } from '@/types/mano-config'
