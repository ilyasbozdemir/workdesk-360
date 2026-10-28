import { ipcMain, BrowserWindow, dialog } from 'electron'
import { basename, resolve } from 'path'
import fs from 'fs'
import { workspaceManager } from '../database/workspace'
import { allFormatsFilter } from '../config/fileFormats'
import { getDeviceInfo } from '../utils/deviceInfo'
import { registerGdriveIpcHandlers } from './workspace/gdrive.ipc'
import { registerRemoteSyncIpcHandlers } from './workspace/remoteSync.ipc'

export { getDeviceInfo }

export function registerWorkspaceIpcHandlers(closeAllSecondaryWindows: () => void): void {
  ipcMain.handle('workspace:get-device-info', () => getDeviceInfo())

  ipcMain.handle('workspace:create', async (_, filePath: string, institutionName: string) => {
    try {
      const meta = workspaceManager.create(filePath, institutionName)
      return { success: true, meta, newFilePath: workspaceManager.getCurrentFilePath() }
    } catch (error: any) {
      console.error('Create workspace error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:open', async (_, filePath: string, allowMigration: boolean = false) => {
    try {
      closeAllSecondaryWindows()
      const meta = workspaceManager.open(filePath, allowMigration)
      return { success: true, meta, newFilePath: workspaceManager.getCurrentFilePath() }
    } catch (error: any) {
      if (error.message && error.message.startsWith('MIGRATION_REQUIRED|')) {
        const payloadStr = error.message.split('|')[1]
        const payload = JSON.parse(payloadStr)
        return { success: false, ...payload }
      }
      console.error('Open workspace error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:save', async () => {
    try {
      const filePath = workspaceManager.getCurrentFilePath()
      if (!filePath) {
        return { success: false, error: 'Aktif bir çalışma dosyası bulunamadı!' }
      }
      workspaceManager.save(true)
      workspaceManager.resetDirty()
      return { success: true, message: 'Çalışma dosyası başarıyla kaydedildi.' }
    } catch (error: any) {
      console.error('Save workspace error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:save-as', async (event, targetPath?: string) => {
    try {
      let dest = targetPath
      if (!dest) {
        const win = BrowserWindow.fromWebContents(event.sender)
        const currentPath = workspaceManager.getCurrentFilePath()
        const defaultName = currentPath ? basename(currentPath) : 'yeni_proje.temin'

        const { canceled, filePath } = await dialog.showSaveDialog(win!, {
          title: 'Farklı Kaydet',
          defaultPath: defaultName,
          filters: [allFormatsFilter]
        })

        if (canceled || !filePath) {
          return { success: false, error: 'Kayıt işlemi iptal edildi.' }
        }
        dest = filePath
      }

      const saveRes = workspaceManager.saveAs(dest)
      if (!saveRes.success) {
        return { success: false, error: saveRes.error || 'Farklı kaydetme işlemi başarısız oldu.' }
      }
      return { success: true, newFilePath: saveRes.newPath || dest }
    } catch (error: unknown) {
      console.error('Save as error:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('workspace:close', async () => {
    try {
      closeAllSecondaryWindows()
      // Sadece veritabanında/dosyada değişiklik yapılmışsa diske kaydet
      // Hiçbir SQL mutasyonu yoksa boş yere save/zip ve yedek çalıştırma
      if (workspaceManager.isDirty()) {
        try {
          workspaceManager.save()
        } catch (saveErr) {
          console.error('Auto-save on close error:', saveErr)
        }
      }
      workspaceManager.close()
      return { success: true }
    } catch (error: any) {
      console.error('Close workspace error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:backup', async (event) => {
    try {
      const filePath = workspaceManager.getCurrentFilePath()
      if (!filePath) {
        return { success: false, error: 'Aktif bir çalışma dosyası bulunamadı!' }
      }
      workspaceManager.save()

      const win = BrowserWindow.fromWebContents(event.sender)
      const { filePath: destPath } = await dialog.showSaveDialog(win!, {
        title: 'Yedek Dosyasını Kaydet',
        defaultPath: basename(filePath),
        filters: [allFormatsFilter]
      })

      if (!destPath) {
        return { success: false, error: 'Yedekleme iptal edildi' }
      }

      if (resolve(filePath) === resolve(destPath)) {
        return { success: false, error: 'Yedekleme konumu aktif çalışma dosyası ile aynı olamaz.' }
      }

      fs.copyFileSync(filePath, destPath)
      const srcStat = fs.statSync(filePath)
      const destStat = fs.statSync(destPath)
      if (srcStat.size !== destStat.size) {
        throw new Error('Yedek dosya boyutu kaynak dosya ile eşleşmiyor.')
      }

      return { success: true, backupPath: destPath }
    } catch (error: any) {
      console.error('Backup workspace error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:backup-server', async () => {
    try {
      const filePath = workspaceManager.getCurrentFilePath()
      if (!filePath) {
        return { success: false, error: 'Aktif bir çalışma dosyası bulunamadı!' }
      }
      workspaceManager.save()
      console.log(`[Mock] Uploading ${filePath} to web server as a backup...`)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return { success: true, message: 'Web sunucusuna başarıyla yüklendi.' }
    } catch (error: any) {
      console.error('Backup to server error:', error)
      return { success: false, error: error.message }
    }
  })

  // Google Drive Handlers
  registerGdriveIpcHandlers(closeAllSecondaryWindows)

  // Remote Sync Handlers (PocketBase, MinIO, Email)
  registerRemoteSyncIpcHandlers()

  ipcMain.handle('workspace:check-changes', async () => {
    try {
      const isDirty = workspaceManager.isDirty()
      const hasGdriveChanges = workspaceManager.hasChanges('gdrive')
      const hasEmailChanges = workspaceManager.hasChanges('email')
      const hasAnyChanges =
        isDirty || hasGdriveChanges || hasEmailChanges || workspaceManager.hasChanges('any')

      return {
        success: true,
        hasChanges: hasAnyChanges,
        hasGdriveChanges,
        hasEmailChanges,
        currentHash: workspaceManager.getCurrentHash(),
        isDirty
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        hasChanges: false,
        hasGdriveChanges: false,
        hasEmailChanges: false,
        isDirty: false
      }
    }
  })

  ipcMain.handle('workspace:is-dirty', async () => {
    return { success: true, isDirty: workspaceManager.isDirty() }
  })

  ipcMain.handle('workspace:get-dirty-summary', async () => {
    try {
      return { success: true, ...workspaceManager.getDirtySummary() }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        isDirty: false,
        totalChanges: 0,
        lastModifiedAt: null,
        items: []
      }
    }
  })

  ipcMain.handle('workspace:get-meta', async () => {
    try {
      const meta = workspaceManager.getMeta()
      return { success: true, meta }
    } catch (error: any) {
      console.error('Get meta error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:get-session-status', async () => {
    try {
      return { success: true, ...workspaceManager.getSessionStatus() }
    } catch (error: any) {
      return { success: false, isReadOnly: false, isTampered: false, error: error.message }
    }
  })

  ipcMain.handle('get-active-session-status', async () => {
    try {
      return { success: true, ...workspaceManager.getSessionStatus() }
    } catch (error: any) {
      return { success: false, isReadOnly: false, isTampered: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:upload-file', async (_, sourcePath: string) => {
    try {
      const result = workspaceManager.uploadAttachment(sourcePath)
      return { success: true, ...result }
    } catch (error: any) {
      console.error('Upload attachment error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('workspace:open-file', async (_, relativePath: string) => {
    try {
      const success = await workspaceManager.openAttachment(relativePath)
      return { success }
    } catch (error: any) {
      console.error('Open attachment error:', error)
      return { success: false, error: error.message }
    }
  })
}
