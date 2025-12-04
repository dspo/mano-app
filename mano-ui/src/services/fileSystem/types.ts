/**
 * File System Service Types
 * Defines the interface for file system operations
 */

import type { ManoConfig } from '@/types/mano-config'

/**
 * Directory handle interface - abstraction over browser and Tauri handles
 */
export interface IDirectoryHandle {
  readonly name: string
  readonly kind: 'directory'
}

/**
 * File handle interface - abstraction over browser and Tauri handles
 */
export interface IFileHandle {
  readonly name: string
  readonly kind: 'file'
}

/**
 * Result of reading or creating mano.conf.json
 */
export interface ManoConfigResult {
  config: ManoConfig
  fileHandle: IFileHandle
}

/**
 * Result of getting or creating a file
 */
export interface FileResult {
  fileHandle: IFileHandle
  content: string
}

/**
 * File System Strategy Interface
 * Different implementations for Browser and Tauri environments
 */
export interface IFileSystemStrategy {
  /**
   * Check if this strategy is supported in current environment
   */
  isSupported(): boolean

  /**
   * Pick a directory (show directory picker dialog)
   */
  pickDirectory(): Promise<IDirectoryHandle>

  /**
   * Read or create mano.conf.json from directory
   */
  readOrCreateManoConfig(dirHandle: IDirectoryHandle): Promise<ManoConfigResult>

  /**
   * Get or create a file in directory
   */
  getOrCreateFile(
    dirHandle: IDirectoryHandle,
    filename: string,
    defaultContent?: string | unknown
  ): Promise<FileResult>

  /**
   * Save content to a file
   */
  saveToFile(fileHandle: IFileHandle, content: string | unknown): Promise<boolean>

  /**
   * Read content from a file
   */
  readFromFile(fileHandle: IFileHandle): Promise<string>

  /**
   * Save mano.conf.json
   */
  saveManoConfig(fileHandle: IFileHandle, config: ManoConfig): Promise<boolean>
}
