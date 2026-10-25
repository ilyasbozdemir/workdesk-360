import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import os from 'os'
import { workspaceManager } from '../../database/workspace'
import { getSetting } from '../../utils/settingsHelper'
import { applyPassword } from './dbAuthHandlers'
import { verifyPassword } from './authCrypto'

// Kimlik bilgisi anahtarları genel ayar IPC'si üzerinden okunamaz/yazılamaz.
const PROTECTED_KEY_RE = /^(adminPassword|passwordHistory|additionalUsers|pcPass_.*)$/

/**
 * Sistem Ayarları ve SMTP Konfigürasyonu IPC İşleyicileri
 * Sistem ayarlarını getirme, kaydetme, SMTP ayarlarını JSON olarak dışa/içe aktarma işleyicilerini içerir.
 */
export function registerDbSettingsHandlers(): void {
  /**
   * Sistem ve Kurum Ayarlarını Getirme İşleyicisi (`db:get-settings`)
   * @returns Kurum adı, logosu, yönetici ve tema ayarları
   */
  ipcMain.handle('db:get-settings', async () => {
    try {
      const db = workspaceManager.getDb()
      const rows = db.prepare('SELECT key, value FROM settings').all() as {
        key: string
        value: string
      }[]
      const settingsObj: Record<string, string | string[] | undefined> = {}
      for (const r of rows) {
        if (r.key && !PROTECTED_KEY_RE.test(r.key) && r.value !== undefined && r.value !== null) {
          settingsObj[r.key] = r.value
        }
      }

      // Bilinen yüklenmiş Google Drive yedek ID'lerini topla
      try {
        const historyRows = db
          .prepare(
            "SELECT gdrive_file_id FROM LOG_YedekGecmisi WHERE gdrive_file_id IS NOT NULL AND gdrive_file_id != ''"
          )
          .all() as { gdrive_file_id?: string }[]
        const knownBackupIds = historyRows
          .map((h) => h.gdrive_file_id)
          .filter((id): id is string => !!id)
        if (typeof settingsObj.lastBackupFileId === 'string' && settingsObj.lastBackupFileId) {
          knownBackupIds.push(settingsObj.lastBackupFileId)
        }
        settingsObj.knownBackupFileIds = Array.from(new Set(knownBackupIds))
      } catch {
        settingsObj.knownBackupFileIds =
          typeof settingsObj.lastBackupFileId === 'string' && settingsObj.lastBackupFileId
            ? [settingsObj.lastBackupFileId]
            : []
      }

      // Fallback from TANIM_Kurum if not present in settings
      try {
        const kurumRow = db
          .prepare(
            'SELECT kurum_adi, kurum_anteti, logo_kurum, logo_sol, logo_sag FROM TANIM_Kurum WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY id ASC LIMIT 1'
          )
          .get() as
          | {
              kurum_adi?: string
              kurum_anteti?: string
              logo_kurum?: string
              logo_sol?: string
              logo_sag?: string
            }
          | undefined

        if (kurumRow) {
          if (!settingsObj.institutionName || settingsObj.institutionName === 'Bilinmeyen Kurum') {
            settingsObj.institutionName =
              kurumRow.kurum_adi || kurumRow.kurum_anteti || 'Bilinmeyen Kurum'
          }
          if (!settingsObj.institutionLogo && kurumRow.logo_kurum) {
            settingsObj.institutionLogo = kurumRow.logo_kurum
          }
          if (!settingsObj.logoLeft && kurumRow.logo_sol) {
            settingsObj.logoLeft = kurumRow.logo_sol
          }
          if (!settingsObj.logoRight && kurumRow.logo_sag) {
            settingsObj.logoRight = kurumRow.logo_sag
          }
        }
      } catch {
        // TANIM_Kurum table may not exist yet
      }

      return {
        activeKurumId: settingsObj.activeKurumId || '1',
        institutionName: settingsObj.institutionName || 'Bilinmeyen Kurum',
        institutionLogo: settingsObj.institutionLogo || null,
        logoLeft: settingsObj.logoLeft || null,
        logoRight: settingsObj.logoRight || null,
        adminName: settingsObj.adminName || 'Sistem Yöneticisi',
        adminTitle: settingsObj.adminTitle || 'Destek Sorumlusu',
        adminUsername: settingsObj.adminUsername || 'admin',
        eButceKodu: settingsObj.eButceKodu || '',
        say2000iKodu: settingsObj.say2000iKodu || '',
        themeLightVars: settingsObj.themeLightVars || '',
        themeDarkVars: settingsObj.themeDarkVars || '',
        ...settingsObj
      }
    } catch {
      return {
        activeKurumId: '1',
        institutionName: null,
        institutionLogo: null,
        logoLeft: null,
        logoRight: null,
        adminName: 'Sistem Yöneticisi',
        adminTitle: 'Destek Sorumlusu',
        adminUsername: 'admin',
        eButceKodu: '',
        say2000iKodu: '',
        themeLightVars: '',
        themeDarkVars: ''
      }
    }
  })

  /**
   * Sistem Ayarlarını Kaydetme İşleyicisi (`db:save-settings`)
   * @param settingsMap Anahtar-değer çiftlerinden oluşan ayarlar nesnesi
   */
  ipcMain.handle('db:save-settings', async (_, settingsMap: Record<string, string>) => {
    try {
      const db = workspaceManager.getDb()
      const insertStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      const transaction = db.transaction((settings: Record<string, string>) => {
        for (const [key, value] of Object.entries(settings)) {
          if (PROTECTED_KEY_RE.test(key)) continue
          insertStmt.run(key, value)
        }
      })
      transaction(settingsMap)

      // Parola değişikliği: yalnızca yeni (boş olmayan) parola gönderildiyse ve mevcut parolayla
      // aynı değilse hashlenerek kaydedilir.
      if (settingsMap.adminPassword) {
        const hostname = os.hostname()
        const user = settingsMap.adminUsername || getSetting('adminUsername') || 'admin'
        const pass = settingsMap.adminPassword
        const current = db
          .prepare("SELECT value FROM settings WHERE key = 'adminPassword'")
          .get() as { value?: string } | undefined
        if (!verifyPassword(pass, current?.value)) {
          applyPassword(db, user, pass, hostname)
        }
      }

      workspaceManager.recordMutation('SETTINGS')
      workspaceManager.save()
      return { success: true }
    } catch (error: any) {
      console.error('Save settings error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * SMTP Ayarlarını JSON Dosyasına Dışa Aktarma İşleyicisi (`db:export-smtp`)
   */
  ipcMain.handle('db:export-smtp', async () => {
    try {
      const smtpHost = getSetting('smtpHost') || getSetting('smtp_host')
      const smtpPort = getSetting('smtpPort') || getSetting('smtp_port') || '587'
      const smtpUser = getSetting('smtpUser') || getSetting('smtp_user')
      const smtpPass = getSetting('smtpPass') || getSetting('smtp_pass')
      const smtpReceiver = getSetting('smtpReceiver') || getSetting('smtp_receiver')
      const smtpSecure = getSetting('smtpSecure') || getSetting('smtp_secure') || 'false'

      const smtpData = {
        _exportType: 'temin360_smtp_config',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        smtpHost,
        smtp_host: smtpHost,
        smtpPort,
        smtp_port: smtpPort,
        smtpUser,
        smtp_user: smtpUser,
        smtpPass,
        smtp_pass: smtpPass,
        smtpReceiver,
        smtp_receiver: smtpReceiver,
        smtpSecure,
        smtp_secure: smtpSecure
      }

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'SMTP Ayarlarını Dışa Aktar',
        defaultPath: 'temin360_smtp_ayarlari.json',
        filters: [{ name: 'JSON Dosyası (*.json)', extensions: ['json'] }]
      })

      if (canceled || !filePath) {
        return { success: false, error: 'İptal edildi' }
      }

      fs.writeFileSync(filePath, JSON.stringify(smtpData, null, 2), 'utf-8')
      return { success: true, filePath }
    } catch (error: any) {
      console.error('Export SMTP error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * SMTP Ayarlarını JSON Dosyasından İçe Aktarma İşleyicisi (`db:import-smtp`)
   */
  ipcMain.handle('db:import-smtp', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'SMTP Ayarlarını İçe Aktar',
        filters: [{ name: 'JSON Dosyası (*.json)', extensions: ['json'] }],
        properties: ['openFile']
      })

      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, error: 'İptal edildi' }
      }

      const content = fs.readFileSync(filePaths[0], 'utf-8')
      const data = JSON.parse(content)

      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Geçersiz ayar dosyası formatı!' }
      }

      const host = String(data.smtpHost || data.smtp_host || data.host || '').trim()
      const port = String(data.smtpPort || data.smtp_port || data.port || '587').trim()
      const user = String(
        data.smtpUser || data.smtp_user || data.user || data.username || ''
      ).trim()
      const pass = String(
        data.smtpPass || data.smtp_pass || data.pass || data.password || ''
      ).trim()
      const receiver = String(data.smtpReceiver || data.smtp_receiver || data.receiver || '').trim()

      let secureVal = 'false'
      if (data.smtpSecure !== undefined) secureVal = String(data.smtpSecure)
      else if (data.smtp_secure !== undefined) secureVal = String(data.smtp_secure)
      else if (data.secure !== undefined) secureVal = String(data.secure)

      const db = workspaceManager.getDb()
      const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')

      const entries: [string, string][] = [
        ['smtpHost', host],
        ['smtp_host', host],
        ['smtpPort', port],
        ['smtp_port', port],
        ['smtpUser', user],
        ['smtp_user', user],
        ['smtpPass', pass],
        ['smtp_pass', pass],
        ['smtpReceiver', receiver],
        ['smtp_receiver', receiver],
        ['smtpSecure', secureVal],
        ['smtp_secure', secureVal]
      ]

      const insertMany = db.transaction(() => {
        for (const [k, v] of entries) {
          stmt.run(k, v)
        }
      })
      insertMany()

      workspaceManager.recordMutation('SETTINGS')
      workspaceManager.save()
      return { success: true }
    } catch (error: any) {
      console.error('Import SMTP error:', error)
      return { success: false, error: error.message }
    }
  })
}
