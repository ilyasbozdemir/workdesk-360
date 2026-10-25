import { ipcMain } from 'electron'
import { basename } from 'path'
import nodemailer from 'nodemailer'
import { workspaceManager } from '../../database/workspace'
import { pocketBaseSyncService, PocketBaseConfig } from '../../services/pocketbaseSyncService'
import { minioSyncService, MinIOConfig } from '../../services/minioSyncService'
import { getSmtpSetting } from '../../utils/settingsHelper'

export function registerRemoteSyncIpcHandlers(): void {
  // PocketBase Self-Hosted API Handlers
  ipcMain.handle('workspace:pocketbase-test', async (_, config: PocketBaseConfig) => {
    return await pocketBaseSyncService.testConnection(config)
  })

  ipcMain.handle('workspace:pocketbase-push', async (_, config: PocketBaseConfig) => {
    try {
      const filePath = workspaceManager.getCurrentFilePath()
      if (!filePath) {
        return { success: false, message: 'Aktif bir çalışma dosyası açık değil!' }
      }
      workspaceManager.save()
      return await pocketBaseSyncService.pushWorkspace(config, filePath)
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) }
    }
  })

  ipcMain.handle('workspace:pocketbase-list', async (_, config: PocketBaseConfig) => {
    return await pocketBaseSyncService.listWorkspaces(config)
  })

  // MinIO / S3 Object Storage API Handlers
  ipcMain.handle('workspace:minio-test', async (_, config: MinIOConfig) => {
    return await minioSyncService.testConnection(config)
  })

  ipcMain.handle('workspace:minio-push', async (_, config: MinIOConfig) => {
    try {
      const filePath = workspaceManager.getCurrentFilePath()
      if (!filePath) {
        return { success: false, message: 'Aktif bir çalışma dosyası açık değil!' }
      }
      workspaceManager.save()
      return await minioSyncService.pushWorkspace(config, filePath)
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) }
    }
  })

  ipcMain.handle('workspace:minio-list', async (_, config: MinIOConfig) => {
    return await minioSyncService.listWorkspaces(config)
  })

  // Email Backup Handler
  ipcMain.handle('workspace:backup-email', async (_, args?: { force?: boolean }) => {
    try {
      const filePath = workspaceManager.getCurrentFilePath()
      if (!filePath) {
        return { success: false, error: 'Aktif bir çalışma dosyası bulunamadı!' }
      }
      workspaceManager.save()

      // Dosyada güncelleme/değişiklik yoksa gereksiz e-posta gönderimi yapma
      if (!args?.force && !workspaceManager.hasChanges('email')) {
        console.log('[Email Backup] Dosyada değişiklik bulunmadığı için e-posta gönderimi atlandı.')
        return {
          success: true,
          skipped: true,
          message:
            'Dosyada son gönderimden bu yana herhangi bir değişiklik bulunmadığı için e-posta gönderimi atlandı.'
        }
      }

      const host = getSmtpSetting('smtpHost', 'smtp_host')
      const portStr = getSmtpSetting('smtpPort', 'smtp_port')
      const user = getSmtpSetting('smtpUser', 'smtp_user')
      const pass = getSmtpSetting('smtpPass', 'smtp_pass')
      const receiver = getSmtpSetting('smtpReceiver', 'smtp_receiver') || user
      const secureStr = getSmtpSetting('smtpSecure', 'smtp_secure')

      if (!host || !user || !pass) {
        return { success: false, error: 'SMTP ayarları yapılandırılmamış!' }
      }

      const port = parseInt(portStr) || 587
      const userSecure = secureStr === 'true'
      const actualSecure =
        port === 465 ? true : port === 587 || port === 25 || port === 2525 ? false : userSecure

      const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: actualSecure,
        auth: {
          user: user,
          pass: pass
        },
        tls: {
          rejectUnauthorized: false
        }
      })

      const fileName = basename(filePath)
      await transporter.sendMail({
        from: `"TEMİN 360 Yedekleme" <${user}>`,
        to: receiver,
        subject: `TEMİN 360 Veritabanı Yedeği - ${fileName}`,
        text: `Kurum dosyası yedeğiniz ektedir.\nDosya adı: ${fileName}\nTarih: ${new Date().toLocaleString('tr-TR')}`,
        attachments: [
          {
            filename: fileName,
            path: filePath
          }
        ]
      })

      workspaceManager.markSynced('email')
      return { success: true, email: receiver }
    } catch (error: any) {
      console.error('Email backup error:', error)
      return { success: false, error: error.message }
    }
  })
}
