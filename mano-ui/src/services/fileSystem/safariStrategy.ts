/**
 * Safari File System Strategy
 * Safari does not support the File System Access API in the same way as Chrome.
 * This strategy surfaces an actionable error instructing users to switch to
 * desktop (Tauri) or Chrome.
 */

import type {
  IFileSystemStrategy,
  IDirectoryHandle,
  ManoConfigResult,
  FileResult,
} from './types'

const unsupportedError =
  'Local file system access is not supported in Safari. Please use the desktop app or Chrome.'

export class SafariFileSystemStrategy implements IFileSystemStrategy {
  private fail(): never {
    // Throwing keeps call sites aware this environment cannot proceed.
    throw new Error(unsupportedError)
  }

  async pickDirectory(): Promise<IDirectoryHandle> {
    this.fail()
  }

  async readOrCreateManoConfig(): Promise<ManoConfigResult> {
    this.fail()
  }

  async getOrCreateFile(): Promise<FileResult> {
    this.fail()
  }

  async saveToFile(): Promise<boolean> {
    this.fail()
  }

  async readFromFile(): Promise<string> {
    this.fail()
  }

  async saveManoConfig(): Promise<boolean> {
    this.fail()
  }

  async deleteFile(): Promise<boolean> {
    this.fail()
  }

  async renameFile(): Promise<boolean> {
    this.fail()
  }
}
