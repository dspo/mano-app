/**
 * File System Access API service for saving files
 */

import type { ManoConfig } from '@/types/mano-config'
import { createDefaultManoConfig } from '@/types/mano-config'

// Re-export for convenience
export { getNodeFilename } from '@/types/mano-config'

export interface FileHandleWithPath {
  handle: FileSystemFileHandle
  path: string
}

/**
 * Save content to a file using File System Access API
 * @param fileHandle - File handle obtained from showDirectoryPicker
 * @param content - Content to save
 * @returns true if successful, false otherwise
 */
export async function saveToFileSystem(
  fileHandle: FileSystemFileHandle,
  content: string | unknown
): Promise<boolean> {
  try {
    // Create a writable stream
    const writable = await fileHandle.createWritable()
    
    // Convert content to string if needed
    const textContent = typeof content === 'string' 
      ? content 
      : JSON.stringify(content, null, 2)
    
    // Write content
    await writable.write(textContent)
    
    // Close the file
    await writable.close()
    
    console.log(`[FileSystem] Saved to disk successfully`)
    return true
  } catch (error) {
    console.error('[FileSystem] Failed to save:', error)
    return false
  }
}

/**
 * Read content from a file
 * @param fileHandle - File handle
 * @returns file content as string
 */
export async function readFromFileSystem(
  fileHandle: FileSystemFileHandle
): Promise<string> {
  try {
    const file = await fileHandle.getFile()
    return await file.text()
  } catch (error) {
    console.error('[FileSystem] Failed to read:', error)
    throw error
  }
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window
}

/**
 * Read or create mano.conf.json from directory
 * @param dirHandle - Directory handle
 * @returns ManoConfig object and file handle
 */
export async function readOrCreateManoConfig(
  dirHandle: FileSystemDirectoryHandle
): Promise<{ config: ManoConfig; fileHandle: FileSystemFileHandle }> {
  try {
    // Try to get existing mano.conf.json
    const fileHandle = await dirHandle.getFileHandle('mano.conf.json')
    const file = await fileHandle.getFile()
    const text = await file.text()
    const config = JSON.parse(text) as ManoConfig
    
    console.log('[FileSystem] Loaded mano.conf.json')
    return { config, fileHandle }
  } catch (error) {
    // File doesn't exist, create it
    console.log('[FileSystem] mano.conf.json not found, creating default...')
    
    const fileHandle = await dirHandle.getFileHandle('mano.conf.json', { create: true })
    const config = createDefaultManoConfig()
    
    // Save default config
    await saveToFileSystem(fileHandle, config)
    
    console.log('[FileSystem] Created mano.conf.json')
    return { config, fileHandle }
  }
}

/**
 * Get or create a file in directory
 * @param dirHandle - Directory handle
 * @param filename - File name
 * @param defaultContent - Default content if file doesn't exist
 * @returns File handle and content
 */
export async function getOrCreateFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  defaultContent: string | unknown = ''
): Promise<{ fileHandle: FileSystemFileHandle; content: string }> {
  try {
    // Try to get existing file
    const fileHandle = await dirHandle.getFileHandle(filename)
    const content = await readFromFileSystem(fileHandle)
    return { fileHandle, content }
  } catch (error) {
    // File doesn't exist, create it
    console.log(`[FileSystem] Creating new file: ${filename}`)
    
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
    const textContent = typeof defaultContent === 'string' 
      ? defaultContent 
      : JSON.stringify(defaultContent, null, 2)
    
    await saveToFileSystem(fileHandle, textContent)
    return { fileHandle, content: textContent }
  }
}

/**
 * Save mano.conf.json
 * @param fileHandle - File handle for mano.conf.json
 * @param config - ManoConfig object
 */
export async function saveManoConfig(
  fileHandle: FileSystemFileHandle,
  config: ManoConfig
): Promise<boolean> {
  // Update lastUpdated timestamp
  config.lastUpdated = new Date().toISOString()
  return saveToFileSystem(fileHandle, config)
}
