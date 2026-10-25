import fs from 'fs'
import { basename } from 'path'
import crypto from 'crypto'
import { app } from 'electron'
import nodemailer from 'nodemailer'
import { workspaceManager } from '../database/workspace'
import { getSmtpSetting } from '../utils/settingsHelper'
import { getDeviceInfo } from '../utils/deviceInfo'
import { getAnonymousDeviceId } from '../utils/anonymousDevice'
import type { BackupManifest } from '../../shared/types/backupManifest'

export async function performAutoCloudSync(): Promise<void> {
  try {
    const db = workspaceManager.getDb()
    if (!db) return
    const urlRow = db.prepare("SELECT value FROM settings WHERE key = 'sync_server_url'").get() as
      | { value: string }
      | undefined
    const tokenRow = db
      .prepare("SELECT value FROM settings WHERE key = 'sync_server_token'")
      .get() as { value: string } | undefined

    const syncUrl = urlRow?.value
    const syncToken = tokenRow?.value

    let dosyalar: unknown[] = []
    const dCheck = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dosyalar'")
      .get()
    if (dCheck) {
      dosyalar = db.prepare('SELECT * FROM dosyalar LIMIT 100').all()
    }

    // 1. Bulut API Eşitlemesi
    if (syncUrl) {
      const cleanUrl = String(syncUrl).trim().replace(/\/+$/, '')
      const fullUrl = `${cleanUrl}/api/sync`

      await fetch(fullUrl, {
        method: 'POST',
        headers: {
          Authorization: syncToken ? `Bearer ${syncToken}` : 'Bearer dta_desktop_client',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'auto-sync-on-close',
          dosyalar,
          syncedAt: new Date().toISOString()
        })
      }).catch(() => {})
    }

    // 2. Otomatik E-Posta Yedeklemesi (Dosyada güncelleme varsa SMTP üzerinden yollar)
    try {
      if (!workspaceManager.hasChanges('email')) {
        console.log(
          '[AutoCloudSync] Dosyada değişiklik bulunmadığı için otomatik e-posta gönderimi atlandı.'
        )
      } else {
        const host = getSmtpSetting('smtpHost', 'smtp_host')
        const user = getSmtpSetting('smtpUser', 'smtp_user')
        const pass = getSmtpSetting('smtpPass', 'smtp_pass')
        const portStr = getSmtpSetting('smtpPort', 'smtp_port')
        const receiver = getSmtpSetting('smtpReceiver', 'smtp_receiver') || user
        const secureStr = getSmtpSetting('smtpSecure', 'smtp_secure')

        if (host && user && pass) {
          const port = parseInt(portStr || '587') || 587
          const actualSecure = port === 465 ? true : port === 587 ? false : secureStr === 'true'

          const transporter = nodemailer.createTransport({
            host: host,
            port,
            secure: actualSecure,
            auth: {
              user: user,
              pass: pass
            },
            tls: { rejectUnauthorized: false }
          })

          const curFile = workspaceManager.getCurrentFilePath()
          const attachments =
            curFile && fs.existsSync(curFile)
              ? [{ filename: basename(curFile), path: curFile }]
              : []

          await transporter.sendMail({
            from: `"TEMİN 360 Otomatik Kapanış Yedeği" <${user}>`,
            to: receiver,
            subject: `TEMİN 360 Otomatik Veritabanı Yedeği - ${new Date().toLocaleDateString('tr-TR')}`,
            text: `Uygulama kapatılırken otomatik veritabanı yedeğiniz alınmıştır.\nAktarılan dosya sayısı: ${dosyalar.length}\nTarih: ${new Date().toLocaleString('tr-TR')}`,
            attachments
          })
          workspaceManager.markSynced('email')
        }
      }
    } catch {
      // Non-blocking mail fail-safe
    }

    // 3. Otomatik Google Drive Bulut Yedeklemesi (Dosyada güncelleme varsa son 7 sürümü saklar ve eskileri temizler)
    try {
      if (!workspaceManager.hasChanges('gdrive')) {
        console.log(
          '[AutoCloudSync] Dosyada değişiklik bulunmadığı için Google Drive yüklemesi atlandı.'
        )
      } else {
        const gdriveRow = db
          .prepare("SELECT value FROM settings WHERE key = 'gdriveAccessToken'")
          .get() as { value?: string } | undefined
        let token = gdriveRow?.value
        if (!token) {
          try {
            const refreshRow = db
              .prepare("SELECT value FROM settings WHERE key = 'gdriveRefreshToken'")
              .get() as { value?: string } | undefined
            const clientIdRow = db
              .prepare("SELECT value FROM settings WHERE key = 'gdriveClientId'")
              .get() as { value?: string } | undefined
            const clientSecretRow = db
              .prepare("SELECT value FROM settings WHERE key = 'gdriveClientSecret'")
              .get() as { value?: string } | undefined
            if (refreshRow?.value && clientIdRow?.value && clientSecretRow?.value) {
              const res = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  client_id: clientIdRow.value.trim(),
                  client_secret: clientSecretRow.value.trim(),
                  refresh_token: refreshRow.value.trim(),
                  grant_type: 'refresh_token'
                }).toString()
              })
              if (res.ok) {
                const data = (await res.json()) as { access_token?: string }
                if (data.access_token) {
                  token = data.access_token
                  db.prepare(
                    "INSERT OR REPLACE INTO settings (key, value) VALUES ('gdriveAccessToken', ?)"
                  ).run(token)
                }
              }
            }
          } catch (tErr) {
            console.warn('[AutoCloudSync] Token refresh error:', tErr)
          }
        }
        const curFile = workspaceManager.getCurrentFilePath()
        if (token && curFile && fs.existsSync(curFile)) {
          const cleanToken = String(token)
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/^Bearer\s+/i, '')
            .replace(/[\r\n\s]+/g, '')

          // Find or create TEMIN_360_YEDEKLER folder
          const folderName = 'TEMIN_360_YEDEKLER'
          const folderQuery = encodeURIComponent(
            `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`
          )
          let folderId = ''
          const searchRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name)`,
            {
              headers: { Authorization: `Bearer ${cleanToken}` }
            }
          )
          if (searchRes.ok) {
            const sData = (await searchRes.json()) as { files?: Array<{ id: string }> }
            if (sData.files && sData.files.length > 0) folderId = sData.files[0].id
          }
          if (!folderId) {
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                description: 'TEMİN 360 Otomatik Kapanış Bulut Yedekleri'
              })
            })
            if (createRes.ok) {
              const cData = (await createRes.json()) as { id: string }
              folderId = cData.id
            }
          }

          if (folderId) {
            const fileName = basename(curFile)
            const fileData = fs.readFileSync(curFile)
            const now = new Date()
            const pad = (n: number): string => String(n).padStart(2, '0')
            const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
            const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}`
            const rawBase = fileName
              .replace(/\.temin$/i, '')
              .replace(/_\d{4}[-_.]\d{2}[-_.]\d{2}(?:[-_.]\d{2}[-_.]\d{2})?$/, '')
            const backupFileName = `${rawBase}_${dateStr}_${timeStr}.temin`

            const currentAppVersion = app?.getVersion ? app.getVersion() : '1.0.0'
            const activeMeta = workspaceManager.getMeta()
            const devInfo = getDeviceInfo()
            const anonymousDeviceId = getAnonymousDeviceId()
            const sha256 = crypto.createHash('sha256').update(fileData).digest('hex')

            // 1. Anonim Manifest Oluştur (Teknik metadata, kişisel/kurumsal veri içermez)
            const manifest: BackupManifest = {
              manifestVersion: 1,
              backupId: crypto.randomUUID(),
              projectId: activeMeta?.project_id || crypto.randomUUID(),
              fileName: backupFileName,
              sha256,
              fileSize: fileData.length,
              createdAt: new Date().toISOString(),
              dataRevision: activeMeta?.data_revision || 1,
              parentBackupId: activeMeta?.last_backup_id || null,
              appVersion: currentAppVersion,
              deviceId: anonymousDeviceId
            }

            // 2. Önce asıl .temin yedeğini Google Drive'a yükle
            const boundary = '--------------------------' + Date.now().toString(16)
            const teminMetadata = JSON.stringify({
              name: backupFileName,
              description: `TEMİN 360 Kapanış Otomatik Yedeği (${dateStr} ${timeStr.replace('-', ':')})`,
              parents: [folderId],
              appProperties: {
                backupId: manifest.backupId,
                projectId: manifest.projectId,
                sha256: manifest.sha256,
                dataRevision: String(manifest.dataRevision),
                appVersion: currentAppVersion,
                deviceId: anonymousDeviceId,
                projectRoot: rawBase
              }
            })

            const metadataBuffer = Buffer.from(
              `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${teminMetadata}\r\n`,
              'utf-8'
            )
            const fileHeaderBuffer = Buffer.from(
              `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`,
              'utf-8'
            )
            const closingBuffer = Buffer.from(`\r\n--${boundary}--`, 'utf-8')
            const multipartBody = Buffer.concat([
              metadataBuffer,
              fileHeaderBuffer,
              fileData,
              closingBuffer
            ])

            const uploadRes = await fetch(
              'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${cleanToken}`,
                  'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: multipartBody
              }
            )

            if (uploadRes.ok) {
              const uploadedFile = (await uploadRes.json()) as { id?: string }
              if (uploadedFile?.id) {
                // 3. .temin başarıyla yüklendi; driveFileId ile manifesti tamamla ve manifest.json yükle
                manifest.driveFileId = uploadedFile.id
                const manifestFileName = `${rawBase}_${dateStr}_${timeStr}.json`
                const manifestBoundary = '--------------------------' + Date.now().toString(16)
                const manifestMetaJson = JSON.stringify({
                  name: manifestFileName,
                  parents: [folderId],
                  appProperties: {
                    backupId: manifest.backupId,
                    projectId: manifest.projectId,
                    targetFileId: uploadedFile.id,
                    sha256: manifest.sha256,
                    dataRevision: String(manifest.dataRevision),
                    appVersion: currentAppVersion,
                    deviceId: anonymousDeviceId
                  }
                })
                const manifestContent = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8')
                const manifestMultipart = Buffer.concat([
                  Buffer.from(
                    `--${manifestBoundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${manifestMetaJson}\r\n`,
                    'utf-8'
                  ),
                  Buffer.from(
                    `--${manifestBoundary}\r\nContent-Type: application/json\r\n\r\n`,
                    'utf-8'
                  ),
                  manifestContent,
                  Buffer.from(`\r\n--${manifestBoundary}--`, 'utf-8')
                ])

                const manifestRes = await fetch(
                  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${cleanToken}`,
                      'Content-Type': `multipart/related; boundary=${manifestBoundary}`
                    },
                    body: manifestMultipart
                  }
                )

                // 4. Her iki dosya da başarıyla yüklendiğinde yedeklemeyi başarılı say
                if (manifestRes.ok && db) {
                  try {
                    db.prepare(
                      `INSERT INTO LOG_YedekGecmisi (hedef, dosya_adi, gdrive_file_id, boyut_bytes, surum_no, tarih, aciklama)
                       VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)`
                    ).run(
                      'gdrive',
                      backupFileName,
                      uploadedFile.id,
                      fileData.length,
                      currentAppVersion,
                      `Google Drive Kapanış Otomatik Yedeği [Manifest: ${manifest.backupId.slice(0, 8)}]`
                    )
                    db.prepare(
                      `INSERT OR REPLACE INTO settings (key, value) VALUES ('lastGdriveSync', ?)`
                    ).run(new Date().toISOString())
                    db.prepare(
                      `INSERT OR REPLACE INTO settings (key, value) VALUES ('lastGdriveSyncDevice', ?)`
                    ).run(devInfo.deviceLabel)
                    db.prepare(
                      `INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackupFileName', ?)`
                    ).run(backupFileName)
                    db.prepare(
                      `INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackupFileId', ?)`
                    ).run(uploadedFile.id)
                    db.prepare(
                      `INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackupId', ?)`
                    ).run(manifest.backupId)

                    if (activeMeta) {
                      activeMeta.last_backup_id = manifest.backupId
                    }
                    workspaceManager.save(true)
                    workspaceManager.markSynced('gdrive')
                  } catch (dbErr) {
                    console.warn('[AutoCloudSync] Could not save backup settings:', dbErr)
                  }
                } else {
                  console.warn(
                    '[AutoCloudSync] Kısmi Başarısızlık: .temin yüklendi ancak manifest yüklenemedi.'
                  )
                }
              }
            }

            // Prune: keep last 7 versions of THIS project (.temin ve .json eşlerini temizle)
            const qList = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
            const listRes = await fetch(
              `https://www.googleapis.com/drive/v3/files?q=${qList}&fields=files(id,name,modifiedTime,createdTime)&orderBy=modifiedTime%20desc`,
              {
                headers: { Authorization: `Bearer ${cleanToken}` }
              }
            )
            if (listRes.ok) {
              const lData = (await listRes.json()) as {
                files?: Array<{ id: string; name?: string }>
              }
              const allFiles = lData.files || []
              const cleanRoot = rawBase.trim().toLowerCase()
              const escaped = cleanRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              const teminPattern = new RegExp(
                `^${escaped}(?:[-_.](\\d{4}[-_.]\\d{2}[-_.]\\d{2}(?:[-_.T]\\d{2}[-_.]\\d{2}(?:[-_.]\\d{2})?)?|_surum\\s*#?\\d+)?\\.temin$`,
                'i'
              )

              const projectTeminFiles = allFiles.filter((f) =>
                f.name ? teminPattern.test(f.name.trim().toLowerCase()) : false
              )

              if (projectTeminFiles.length > 7) {
                const toDelTemin = projectTeminFiles.slice(7)
                for (const f of toDelTemin) {
                  // .temin dosyasını sil
                  await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${cleanToken}` }
                  }).catch(() => {})

                  // Eşleşen .json manifest dosyasını da sil
                  const matchingJsonName = (f.name || '')
                    .replace(/\.temin$/i, '.json')
                    .toLowerCase()
                  const matchingJson = allFiles.find(
                    (jf) => (jf.name || '').trim().toLowerCase() === matchingJsonName
                  )
                  if (matchingJson) {
                    await fetch(`https://www.googleapis.com/drive/v3/files/${matchingJson.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${cleanToken}` }
                    }).catch(() => {})
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Non-blocking gdrive fail-safe
    }
  } catch {
    // Non-blocking fail-safe
  }
}
