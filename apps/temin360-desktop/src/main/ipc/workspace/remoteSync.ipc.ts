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

  // Bug & Support Report Handler
  ipcMain.handle(
    'app:send-bug-report',
    async (
      _,
      report: {
        category?: string
        title: string
        description: string
        contactEmail?: string
        systemInfo?: Record<string, any>
        logs?: string
      }
    ) => {
      try {
        const host = getSmtpSetting('smtpHost', 'smtp_host')
        const portStr = getSmtpSetting('smtpPort', 'smtp_port')
        const user = getSmtpSetting('smtpUser', 'smtp_user')
        const pass = getSmtpSetting('smtpPass', 'smtp_pass')
        const secureStr = getSmtpSetting('smtpSecure', 'smtp_secure')

        const devEmail = 'bozdemir.ib70@gmail.com'
        const recipients = [devEmail]
        if (report.contactEmail && report.contactEmail.includes('@')) {
          recipients.push(report.contactEmail.trim())
        }

        const formattedHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
            <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
              <h2 style="margin: 0; font-size: 20px;">TEMİN 360 - Destek & Hata Bildirimi</h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Tür: ${report.category || 'Hata Bildirimi'} | Tarih: ${new Date().toLocaleString('tr-TR')}</p>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
              <h3 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                ${report.title || 'Başlıksız Hata Bildirimi'}
              </h3>
              <p style="white-space: pre-wrap; background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb;">
                ${report.description}
              </p>

              ${
                report.contactEmail
                  ? `<p><strong>İletişim E-Postası:</strong> <a href="mailto:${report.contactEmail}">${report.contactEmail}</a></p>`
                  : ''
              }

              ${
                report.systemInfo
                  ? `
                <h4 style="margin-top: 20px; margin-bottom: 8px; color: #334155;">Sistem Bilgileri</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden;">
                  ${Object.entries(report.systemInfo)
                    .map(
                      ([k, v]) =>
                        `<tr><td style="padding: 6px 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 140px;">${k}</td><td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0;">${v}</td></tr>`
                    )
                    .join('')}
                </table>
              `
                  : ''
              }

              ${
                report.logs
                  ? `
                <h4 style="margin-top: 20px; margin-bottom: 8px; color: #334155;">Hata Günlükleri (Son Loglar)</h4>
                <pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 8px; font-size: 11px; overflow-x: auto; max-height: 250px;">${report.logs}</pre>
              `
                  : ''
              }
            </div>
          </div>
        `

        // Eğer SMTP yapılandırılmışsa, e-posta gönder
        if (host && user && pass) {
          const port = parseInt(portStr) || 587
          const userSecure = secureStr === 'true'
          const actualSecure =
            port === 465 ? true : port === 587 || port === 25 || port === 2525 ? false : userSecure

          const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: actualSecure,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
          })

          await transporter.sendMail({
            from: `"TEMİN 360 Destek Bildirimi" <${user}>`,
            to: recipients.join(', '),
            subject: `[TEMİN 360 ${report.category || 'Hata'}] ${report.title}`,
            text: `TEMİN 360 Destek Bildirimi\n\nBaşlık: ${report.title}\n\nAçıklama:\n${report.description}\n\nİletişim: ${report.contactEmail || 'Belirtilmedi'}`,
            html: formattedHtml
          })

          return { success: true, method: 'smtp', message: 'Hata bildiriminiz e-posta ile geliştirici ekibine başarıyla iletildi.' }
        } else {
          return {
            success: false,
            reason: 'no_smtp',
            message: 'Sistemde SMTP ayarları yapılandırılmamış.',
            mailto: {
              to: devEmail,
              subject: `[TEMİN 360 ${report.category || 'Hata'}] ${report.title}`,
              body: `Başlık: ${report.title}\n\nAçıklama:\n${report.description}\n\nİletişim: ${report.contactEmail || 'Belirtilmedi'}\n\nSistem:\n${JSON.stringify(report.systemInfo || {}, null, 2)}`
            }
          }
        }
      } catch (err: any) {
        console.error('[Send Bug Report Error]:', err)
        return {
          success: false,
          reason: 'error',
          error: err?.message || String(err)
        }
      }
    }
  )
}
