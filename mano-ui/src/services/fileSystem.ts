/**
 * File System Access API service for saving files
 * This file provides backward compatibility while using the new strategy pattern
 * 
 * @deprecated Use the new strategy-based fileSystem service from './fileSystem/index' instead:
 * - Import { getFileSystem } from '@/services/fileSystem/index'
 * - Call getFileSystem().saveToFile() instead of saveToFileSystem()
 * 
 * This compatibility layer will be removed in a future version.
 */

import { getFileSystem } from './fileSystem/index'
import type { IFileHandle, IDirectoryHandle } from './fileSystem/index'
import type { ManoConfig } from '@/types/mano-config'

// Re-export types
export type { IFileHandle, IDirectoryHandle } from './fileSystem/index'

// Re-export functions
export { getFileSystem }

// Re-export for convenience
export { getNodeFilename } from '@/types/mano-config'

/**
 * Save content to a file
 * @param fileHandle - File handle
 * @param content - Content to save
 * @returns true if successful, false otherwise
 */
export async function saveToFileSystem(
  fileHandle: IFileHandle,
  content: string | unknown
): Promise<boolean> {
  return getFileSystem().saveToFile(fileHandle, content)
}

/**
 * Get or create a file in directory
 * @param dirHandle - Directory handle
 * @param filename - File name
 * @param defaultContent - Default content if file doesn't exist
 * @returns File handle and content
 */
export async function getOrCreateFile(
  dirHandle: IDirectoryHandle,
  filename: string,
  defaultContent: string | unknown = ''
): Promise<{ fileHandle: IFileHandle; content: string }> {
  const result = await getFileSystem().getOrCreateFile(dirHandle, filename, defaultContent)
  return {
    fileHandle: result.fileHandle,
    content: result.content,
  }
}

/**
 * Save mano.conf.json
 * @param fileHandle - File handle for mano.conf.json
 * @param config - ManoConfig object
 */
export async function saveManoConfig(
  fileHandle: IFileHandle,
  config: ManoConfig
): Promise<boolean> {
  config.lastUpdated = new Date().toISOString()
  return getFileSystem().saveManoConfig(fileHandle, config)
}
