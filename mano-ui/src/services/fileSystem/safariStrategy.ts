/**
 * Safari File System Strategy
 * Safari does not support the File System Access API in the same way as Chrome.
 * This strategy surfaces an actionable error instructing users to switch to
 * desktop (Tauri) or Chrome.
 */

import type { ManoConfig } from '@/types/mano-config'
import type {
  IFileSystemStrategy,
  IDirectoryHandle,
  IFileHandle,
  ManoConfigResult,
  FileResult,
} from './types'

const unsupportedError =
  'Local file system access is not supported in Safari. Please use the desktop app or Chrome.'

export class SafariFileSystemStrategy implements IFileSystemStrategy {
  isSupported(): boolean {
    // Safari lacks the File System Access API we rely on.
    return false
  }

  private fail(): never {
    // Throwing keeps call sites aware this environment cannot proceed.
    throw new Error(unsupportedError)
  }

  async pickDirectory(): Promise<IDirectoryHandle> {
    this.fail()
  }

  async readOrCreateManoConfig(_dirHandle: IDirectoryHandle): Promise<ManoConfigResult> {
    this.fail()
  }

  async getOrCreateFile(
    _dirHandle: IDirectoryHandle,
    _filename: string,
    _defaultContent: string | unknown = ''
  ): Promise<FileResult> {
    this.fail()
  }

  async saveToFile(_fileHandle: IFileHandle, _content: string | unknown): Promise<boolean> {
    this.fail()
  }

  async readFromFile(_fileHandle: IFileHandle): Promise<string> {
    this.fail()
  }

  async saveManoConfig(_fileHandle: IFileHandle, _config: ManoConfig): Promise<boolean> {
    this.fail()
  }

  async deleteFile(_dirHandle: IDirectoryHandle, _filename: string): Promise<boolean> {
    this.fail()
  }

  async renameFile(
    _dirHandle: IDirectoryHandle,
    _oldFilename: string,
    _newFilename: string
  ): Promise<boolean> {
    this.fail()
  }
}
