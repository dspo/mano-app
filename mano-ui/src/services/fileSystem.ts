/**
 * File System Access API service for saving files
 */

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
