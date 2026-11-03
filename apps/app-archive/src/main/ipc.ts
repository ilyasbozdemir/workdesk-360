import { ipcMain, shell, BrowserWindow } from 'electron'
import path from 'path'
import { getStoragePaths } from './paths'
import { loadConfig, saveConfig } from './config'
import {
  getAllFilesWithTags,
  addFileTag,
  removeFileTag,
  getAllTags,
  getDatabase
} from './db/database'
import { scanDocumentsFolder, isScanActive } from './watcher/scanner'
import { AppStatus, AppConfig } from '../shared/types'

function isPathSafe(targetPath: string, rootDir: string): boolean {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedRoot = path.resolve(rootDir)
  return resolvedTarget.startsWith(resolvedRoot)
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  const paths = getStoragePaths()

  ipcMain.handle('arsiv:getStatus', (): AppStatus => {
    const db = getDatabase()
    const fileCount = (db.prepare('SELECT COUNT(*) as count FROM files').get() as any)?.count || 0
    const tagCount = (db.prepare('SELECT COUNT(DISTINCT tag) as count FROM tags').get() as any)?.count || 0

    return {
      baseDir: paths.baseDir,
      documentsDir: paths.documentsDir,
      configPath: paths.configPath,
      dbPath: paths.dbPath,
      isPortable: paths.isPortable,
      isFallbackAppData: paths.isFallbackAppData,
      fallbackReason: paths.fallbackReason,
      fileCount,
      tagCount,
      isScanning: isScanActive()
    }
  })

  ipcMain.handle('arsiv:getConfig', (): AppConfig => {
    return loadConfig().config
  })

  ipcMain.handle('arsiv:saveConfig', (_event, newConfig: AppConfig): boolean => {
    const res = saveConfig(newConfig)
    return res.success
  })

  ipcMain.handle('arsiv:getFiles', () => {
    return getAllFilesWithTags()
  })

  ipcMain.handle('arsiv:scanNow', async () => {
    await scanDocumentsFolder()
    return true
  })

  ipcMain.handle('arsiv:openFile', async (_event, filePath: string) => {
    if (!isPathSafe(filePath, paths.documentsDir)) {
      throw new Error('Erişim reddedildi: Dosya Belgeler klasörü dışında.')
    }
    await shell.openPath(filePath)
    return true
  })

  ipcMain.handle('arsiv:showInFolder', (_event, filePath: string) => {
    if (!isPathSafe(filePath, paths.documentsDir)) {
      throw new Error('Erişim reddedildi: Dosya Belgeler klasörü dışında.')
    }
    shell.showItemInFolder(filePath)
    return true
  })

  ipcMain.handle('arsiv:addTag', (_event, filePath: string, tag: string, sha256?: string) => {
    if (!isPathSafe(filePath, paths.documentsDir)) {
      throw new Error('Erişim reddedildi')
    }
    addFileTag(filePath, tag, sha256)
    mainWindow.webContents.send('arsiv:filesUpdated')
    return true
  })

  ipcMain.handle('arsiv:removeTag', (_event, filePath: string, tag: string) => {
    if (!isPathSafe(filePath, paths.documentsDir)) {
      throw new Error('Erişim reddedildi')
    }
    removeFileTag(filePath, tag)
    mainWindow.webContents.send('arsiv:filesUpdated')
    return true
  })

  ipcMain.handle('arsiv:getAllTags', () => {
    return getAllTags()
  })
}
