/**
 * <summary>
 * Disk Analiz 360 — Electron Ana Süreç (Main Process) ve Tip Güvenli IPC Köprüsü.
 * </summary>
 */

import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { DiskAnalyzerStorage } from './modules/storage.js'
import { discoverSystemDrives } from './modules/disk-discovery.js'
import { runDiskScan } from './modules/scanner.js'
import { runDuplicateDetectionPipeline } from './modules/duplicate-detector.js'
import { executeSafeTrashCleanup } from './modules/cleanup.js'
import { CleanupExecutionItemRequest, DiskAnalyzerSettings } from '../shared/types.js'

let mainWindow: BrowserWindow | null = null
let storage: DiskAnalyzerStorage | null = null
let activeScanAbortController: AbortController | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    title: 'Disk Analiz 360 — Akıllı Disk Haritası, Mükerrer Tespit ve Güvenli Temizlik',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('dev.ilyasbozdemir.diskanaliz360')

  const userDataDir = app.getPath('userData')
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true })
  }
  const dbPath = join(userDataDir, 'disk-analiz-360.db')
  storage = new DiskAnalyzerStorage(dbPath)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ==========================================================================
  // IPC HANDLERS
  // ==========================================================================

  ipcMain.handle('diskAnaliz:getDrives', () => {
    return discoverSystemDrives()
  })

  ipcMain.handle('diskAnaliz:selectFolderDialog', async () => {
    if (!mainWindow) return null
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Taranacak Klasörü veya Sürücüyü Seçin',
      properties: ['openDirectory', 'dontAddToRecent']
    })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })

  ipcMain.handle(
    'diskAnaliz:startScan',
    async (_, params: { rootPath: string; detectDuplicates?: boolean }) => {
      if (!storage) throw new Error('Veritabanı hazır değil.')
      if (activeScanAbortController) {
        activeScanAbortController.abort()
      }

      const controller = new AbortController()
      activeScanAbortController = controller

      try {
        const session = await runDiskScan(storage, {
          rootPath: params.rootPath,
          detectDuplicates: params.detectDuplicates ?? true,
          signal: controller.signal,
          onProgress: (progress) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('diskAnaliz:scanProgress', progress)
            }
          }
        })
        return session
      } finally {
        if (activeScanAbortController === controller) {
          activeScanAbortController = null
        }
      }
    }
  )

  ipcMain.handle('diskAnaliz:cancelScan', () => {
    if (activeScanAbortController) {
      activeScanAbortController.abort()
      activeScanAbortController = null
      return { cancelled: true }
    }
    return { cancelled: false }
  })

  ipcMain.handle('diskAnaliz:getDashboardSummary', (_, rootPath?: string) => {
    return storage?.getAnalysisDashboardSummary(rootPath) || null
  })

  ipcMain.handle(
    'diskAnaliz:getTreemapView',
    (_, params: { rootPath: string; folderPath?: string }) => {
      return storage?.getTreemapView(params.rootPath, params.folderPath) || null
    }
  )

  ipcMain.handle('diskAnaliz:searchFiles', (_, params) => {
    return storage?.searchFiles(params || {}) || []
  })

  ipcMain.handle('diskAnaliz:getDuplicates', (_, rootPath?: string) => {
    return (
      storage?.getVerifiedDuplicates(rootPath) || {
        totalGroups: 0,
        totalDuplicateFiles: 0,
        totalRecoverableBytes: 0,
        groups: []
      }
    )
  })

  ipcMain.handle('diskAnaliz:runDuplicateCheck', async (_, rootPath?: string) => {
    if (!storage) throw new Error('Veritabanı hazır değil.')
    return await runDuplicateDetectionPipeline(storage, { rootPath })
  })

  ipcMain.handle('diskAnaliz:getCleanupCandidates', (_, rootPath?: string) => {
    return storage?.getCleanupCandidateGroups(rootPath) || []
  })

  ipcMain.handle(
    'diskAnaliz:executeTrashCleanup',
    async (_, requests: CleanupExecutionItemRequest[]) => {
      if (!storage) throw new Error('Veritabanı hazır değil.')
      return await executeSafeTrashCleanup(storage, requests, {
        trashItemFn: async (targetPath: string) => {
          await shell.trashItem(targetPath)
        },
        allowDeleteLastCopy: false
      })
    }
  )

  ipcMain.handle('diskAnaliz:getCleanupHistory', (_, limit?: number) => {
    return storage?.getCleanupHistory(limit || 100) || []
  })

  ipcMain.handle('diskAnaliz:getScanSessions', (_, limit?: number) => {
    return storage?.getScanSessions(limit || 25) || []
  })

  ipcMain.handle('diskAnaliz:getScanErrors', (_, sessionId?: string) => {
    return storage?.getScanErrors(sessionId, 150) || []
  })

  ipcMain.handle('diskAnaliz:getSettings', () => {
    return storage?.getSettings()
  })

  ipcMain.handle('diskAnaliz:updateSettings', (_, updates: Partial<DiskAnalyzerSettings>) => {
    return storage?.updateSettings(updates)
  })

  ipcMain.handle('diskAnaliz:showInFolder', (_, targetPath: string) => {
    if (targetPath && fs.existsSync(targetPath)) {
      shell.showItemInFolder(targetPath)
      return true
    }
    return false
  })

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  if (activeScanAbortController) {
    activeScanAbortController.abort()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

