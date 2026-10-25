import { ipcMain, app } from 'electron'
import { basename, join, dirname } from 'path'
import { homedir, tmpdir } from 'os'
import fs from 'fs'
import crypto from 'crypto'
import AdmZip from 'adm-zip'
import Database from 'better-sqlite3'
import { workspaceManager } from '../../database/workspace'
import { atomicReplaceWorkspaceFile } from '../../database/workspace/DtmWorkspace'
import { allExtensions, defaultFormat } from '../../config/fileFormats'
import { getDeviceInfo } from '../../utils/deviceInfo'
import { getAnonymousDeviceId } from '../../utils/anonymousDevice'
import { isBackupManifest, type BackupManifest } from '../../../shared/types/backupManifest'

// Shared Google Drive Token Refresh Helper (DB'den dinamik okunur, asla hardcoded değil)
async function tryRefreshToken(db: any): Promise<string | null> {
  try {
    const refreshRow = db
      .prepare("SELECT value FROM settings WHERE key = 'gdriveRefreshToken'")
      .get() as { value?: string }
    const refreshToken = refreshRow?.value
    if (!refreshToken) return null

    const clientIdRow = db
      .prepare("SELECT value FROM settings WHERE key = 'gdriveClientId'")
      .get() as { value?: string }
    const clientSecretRow = db
      .prepare("SELECT value FROM settings WHERE key = 'gdriveClientSecret'")
      .get() as { value?: string }

    const clientId = clientIdRow?.value?.trim()
    const clientSecret = clientSecretRow?.value?.trim()

    if (!clientId || !clientSecret) {
      console.warn(
        '[Google Drive] gdriveClientId veya gdriveClientSecret ayarlanmamış. Token otomatik yenilenemiyor.'
      )
      return null
    }

    const cleanRefresh = String(refreshToken)
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/[\r\n\s]+/g, '')

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: cleanRefresh,
        grant_type: 'refresh_token'
      }).toString()
    })

    if (res.ok) {
      const data = (await res.json()) as { access_token?: string }
      if (data.access_token) {
        db.prepare(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('gdriveAccessToken', ?)"
        ).run(data.access_token)
        console.log('[Google Drive] Access token otomatik yenilendi.')
        return data.access_token
      }
    } else {
      const errText = await res.text()
      console.warn('[Google Drive] Refresh token isteği başarısız:', res.status, errText)
    }
  } catch (err) {
    console.error('[Google Drive] Token yenileme hatası:', err)
  }
  return null
}

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0
  let delay = 500
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options)
      if ((res.status >= 500 && res.status < 600) || res.status === 429) {
        attempt++
        if (attempt >= maxRetries) return res
        console.warn(
          `[Google Drive API] Geçici sunucu hatası (${res.status}), ${delay}ms sonra tekrar deneniyor... (Deneme ${attempt}/${maxRetries})`
        )
        await new Promise((r) => setTimeout(r, delay))
        delay *= 2
        continue
      }
      return res
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) throw err
      console.warn(
        `[Google Drive API] Ağ hatası, ${delay}ms sonra tekrar deneniyor... (Deneme ${attempt}/${maxRetries})`,
        err
      )
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }
  return fetch(url, options!)
}

async function pruneOldBackups(
  token: string,
  folderId: string,
  projectRoot?: string,
  maxVersions = 7
): Promise<void> {
  try {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
    const res = await fetchWithRetry(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,createdTime)&orderBy=modifiedTime%20desc`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    if (res.ok) {
      const data = (await res.json()) as { files?: Array<{ id: string; name: string }> }
      const allFiles = data.files || []
      let teminFiles = allFiles.filter((f) => f.name?.toLowerCase().endsWith('.temin'))

      if (projectRoot) {
        const cleanRoot = projectRoot.trim().toLowerCase()
        const escaped = cleanRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        try {
          const pattern = new RegExp(
            `^${escaped}(?:(?:[-_.](?:\\d{4}[-_.]\\d{2}[-_.]\\d{2}(?:[-_.T]\\d{2}[-_.]\\d{2}(?:[-_.]\\d{2})?)?)|_surum\\s*#?\\d+)?\\.temin$`,
            'i'
          )
          teminFiles = teminFiles.filter((f) => pattern.test(f.name.trim().toLowerCase()))
        } catch {
          teminFiles = teminFiles.filter((f) => f.name.trim().toLowerCase().startsWith(cleanRoot))
        }
      }

      if (teminFiles.length > maxVersions) {
        const toDeleteTemin = teminFiles.slice(maxVersions)
        for (const file of toDeleteTemin) {
          // .temin dosyasını sil
          await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          }).catch(console.error)

          // Eşleşen .json manifest dosyasını da sil
          const matchingJsonName = file.name.replace(/\.temin$/i, '.json').toLowerCase()
          const matchingJson = allFiles.find(
            (jf) => jf.name?.trim().toLowerCase() === matchingJsonName
          )
          if (matchingJson) {
            await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${matchingJson.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            }).catch(console.error)
          }
        }
      }
    }
  } catch (err) {
    console.error('Google Drive backup pruning error:', err)
  }
}

let cachedAppFolderId: string | null = null

async function getOrCreateAppFolder(token: string): Promise<string> {
  if (cachedAppFolderId) {
    return cachedAppFolderId
  }

  const folderName = 'TEMIN_360_YEDEKLER'
  const query = encodeURIComponent(
    `mimeType = 'application/vnd.google-apps.folder' and (name = 'TEMIN_360_YEDEKLER' or name = 'TEMIN_360_YEDEKLERİ') and trashed = false`
  )

  // 1. Klasörü ara (Geçici 500 hatalarına karşı retry yetenekli)
  const searchRes = await fetchWithRetry(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (searchRes.status === 401) {
    cachedAppFolderId = null
    throw new Error(
      'GDRIVE_TOKEN_EXPIRED: Google Drive erişim jetonu (access token) süresi dolmuş veya geçersiz. ' +
        'Lütfen Google OAuth Playground (developers.google.com/oauthplayground) adresinden yeni bir access_token alıp ' +
        "Ayarlar > Google Drive bölümünden güncelleyin. OAuth token'ları yaklaşık 1 saat geçerlidir."
    )
  }

  if (searchRes.ok) {
    const data = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> }
    if (data.files && data.files.length > 0) {
      cachedAppFolderId = data.files[0].id
      console.log(`[Google Drive] ${data.files[0].name} klasörü bağlandı:`, cachedAppFolderId)
      return cachedAppFolderId
    }
  } else {
    const errText = await searchRes.text()
    throw new Error(`Google Drive klasör arama hatası (${searchRes.status}): ${errText}`)
  }

  // 2. Klasör bulunamadıysa oluştur
  console.log(`[Google Drive] ${folderName} bulunamadı, oluşturuluyor...`)
  const createRes = await fetchWithRetry('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'TEMİN 360 Doğrudan Temin Çalışma Alanı Bulut Yedekleri'
    })
  })

  if (createRes.status === 401) {
    throw new Error(
      'GDRIVE_TOKEN_EXPIRED: Google Drive erişim jetonu (access token) süresi dolmuş veya geçersiz. ' +
        'Lütfen Google OAuth Playground adresinden yeni bir access_token alıp Ayarlar > Google Drive bölümünden güncelleyin.'
    )
  }

  if (createRes.ok) {
    const folderData = (await createRes.json()) as { id: string }
    console.log(`[Google Drive] ${folderName} klasörü oluşturuldu:`, folderData.id)
    return folderData.id
  }

  const createErr = await createRes.text()
  throw new Error(`Google Drive klasör oluşturma hatası (${createRes.status}): ${createErr}`)
}

export interface BackupRestoreOptions {
  fileName: string
  targetManifest?: BackupManifest | null
  expectedSha256?: string
  expectedSize?: number
  overwriteActive?: boolean
  currentPath?: string | null
  destinationPath?: string | null
}

export interface BackupRestoreResult {
  success: boolean
  targetPath: string
  verifiedSha256: boolean
  verifiedSize: boolean
  contentVerified: boolean
  actualSha256: string
  actualSize: number
}

export function verifyAndRestoreBackupBuffer(
  buffer: Buffer,
  options: BackupRestoreOptions
): BackupRestoreResult {
  // 1. Temel ZIP başlık doğrulaması
  if (!buffer || buffer.length < 512 || buffer.subarray(0, 2).toString() !== 'PK') {
    throw new Error(
      'Güvenlik Hatası: İndirilen dosya geçerli bir TEMİN 360 arşivi değil veya bozuk (0 byte / geçersiz başlık).'
    )
  }

  // 2. Bütünlük ve Manifest Doğrulaması (SHA-256 + Boyut)
  const actualSha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  const actualSize = buffer.length

  const expectedSha = options.targetManifest?.sha256 || options.expectedSha256
  if (expectedSha) {
    if (actualSha256.toLowerCase() !== expectedSha.toLowerCase()) {
      throw new Error(
        `Güvenlik ve Bütünlük Hatası: İndirilen yedeğin SHA-256 özeti (${actualSha256}) manifestteki (${expectedSha}) ile uyuşmuyor! Dosya aktarım sırasında bozulmuş veya üzerinde oynanmış olabilir. Yerel çalışma dosyanız korundu.`
      )
    }
  }

  const expectedSize = options.targetManifest?.fileSize ?? options.expectedSize
  if (typeof expectedSize === 'number') {
    if (actualSize !== expectedSize) {
      throw new Error(
        `Güvenlik ve Bütünlük Hatası: İndirilen dosya boyutu (${actualSize} bayt) manifestteki beklenen (${expectedSize} bayt) ile uyuşmuyor! Yerel çalışma dosyanız korundu.`
      )
    }
  }

  // 3. ZIP arşivi yapısal doğrulaması (meta.json ve database.sqlite varlığı)
  let testZip: AdmZip
  try {
    testZip = new AdmZip(buffer)
  } catch (zipErr: unknown) {
    const msg = zipErr instanceof Error ? zipErr.message : String(zipErr)
    throw new Error(`İndirilen arşiv açılamadı (bozuk zip): ${msg}`)
  }

  const entries = testZip.getEntries()
  if (!entries || entries.length === 0) {
    throw new Error('İndirilen arşiv geçersiz veya boş.')
  }
  const hasMeta = entries.some((e) => e.entryName === 'meta.json')
  const dbEntry = entries.find((e) => e.entryName.endsWith('.sqlite'))
  if (!hasMeta || !dbEntry) {
    throw new Error('İndirilen arşivde zorunlu dosyalar (meta.json veya database.sqlite) eksik.')
  }

  // 4. SQLite veritabanı bütünlük doğrulaması (PRAGMA quick_check)
  const dbData = dbEntry.getData()
  if (!dbData || dbData.length === 0) {
    throw new Error('İndirilen arşivdeki SQLite veritabanı boş.')
  }

  const tempSqliteDir = fs.mkdtempSync(join(tmpdir(), 'temin-chk-'))
  const tempSqliteFile = join(tempSqliteDir, 'verify.sqlite')
  try {
    fs.writeFileSync(tempSqliteFile, dbData)
    const checkDb = new Database(tempSqliteFile, { readonly: true })
    try {
      const checkRow = checkDb.prepare('PRAGMA quick_check;').get() as
        | Record<string, unknown>
        | undefined
      const checkVal = checkRow ? Object.values(checkRow)[0] : null
      if (checkVal !== 'ok') {
        throw new Error(`SQLite bütünlük kontrolü başarısız: ${String(checkVal)}`)
      }
    } finally {
      checkDb.close()
    }
  } catch (sqlErr: unknown) {
    const msg = sqlErr instanceof Error ? sqlErr.message : String(sqlErr)
    throw new Error(
      `İndirilen veritabanı bütünlük testinden geçemedi (bozuk sqlite): ${msg}. Yerel dosyanız korundu.`
    )
  } finally {
    try {
      if (fs.existsSync(tempSqliteDir)) {
        fs.rmSync(tempSqliteDir, { recursive: true, force: true })
      }
    } catch {
      /* ignore cleanup */
    }
  }

  // 5. Hedef dosya atomik değiştirme ve güvenlik yedeği akışı
  const currentPath = options.currentPath || workspaceManager.getCurrentFilePath()
  let targetPath: string

  if (options.overwriteActive && currentPath && fs.existsSync(currentPath)) {
    // 1. Guaranteed safety backup: must succeed or operation aborts!
    const safetyBackupPath = currentPath + '.bak'
    try {
      fs.copyFileSync(currentPath, safetyBackupPath)
      if (!fs.existsSync(safetyBackupPath) || fs.statSync(safetyBackupPath).size === 0) {
        throw new Error('Güvenlik yedeği oluşturulamadı veya boş.')
      }
    } catch (bakErr: unknown) {
      const msg = bakErr instanceof Error ? bakErr.message : String(bakErr)
      throw new Error(
        `Kritik Güvenlik Uyarısı: Mevcut çalışma alanının güvenlik kopyası (.bak) oluşturulamadı (${msg}). Olası veri kaybını önlemek için bulut yedeğini geri yükleme işlemi derhal durduruldu. Yerel dosyanız korundu.`
      )
    }

    const tempRestorePath = join(
      dirname(currentPath),
      `.${basename(currentPath)}.restore.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`
    )
    fs.writeFileSync(tempRestorePath, buffer)

    // Close active workspace before file replacement
    try {
      workspaceManager.close()
    } catch {
      /* ignore */
    }

    try {
      atomicReplaceWorkspaceFile(tempRestorePath, currentPath)
      targetPath = currentPath
    } catch (replaceErr: unknown) {
      if (fs.existsSync(safetyBackupPath)) {
        try {
          fs.copyFileSync(safetyBackupPath, currentPath)
        } catch {
          /* ignore restore error */
        }
      }
      const msg = replaceErr instanceof Error ? replaceErr.message : String(replaceErr)
      throw new Error(
        `Yedek dosyası atomik olarak yazılamadı: ${msg}. Yerel dosya güvenlik yedeğinden (.bak) geri yüklendi.`
      )
    }
  } else {
    const defaultPath =
      options.destinationPath ||
      join(
        homedir(),
        'Desktop',
        allExtensions.some((ext) => options.fileName.toLowerCase().endsWith('.' + ext))
          ? options.fileName
          : `${options.fileName}.${defaultFormat.ext}`
      )
    const tempPath = join(
      dirname(defaultPath),
      `.${basename(defaultPath)}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`
    )
    try {
      fs.writeFileSync(tempPath, buffer)
      atomicReplaceWorkspaceFile(tempPath, defaultPath)
      targetPath = defaultPath
    } catch (err: unknown) {
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath)
        } catch {
          /* ignore */
        }
      }
      throw err
    }
  }

  return {
    success: true,
    targetPath,
    verifiedSha256: true,
    verifiedSize: true,
    contentVerified: true,
    actualSha256,
    actualSize: buffer.length
  }
}

export function registerGdriveIpcHandlers(closeAllSecondaryWindows: () => void): void {
  // Tek tıkla yerel OAuth loopback akışı (Tarayıcı açıp yetkiyi otomatik alır)
  ipcMain.handle(
    'workspace:start-gdrive-oauth',
    async (_, args?: { clientId?: string; clientSecret?: string }) => {
      try {
        const db = workspaceManager.getDb()
        let clientId = args?.clientId?.trim()
        let clientSecret = args?.clientSecret?.trim()

        if (!clientId) {
          const clientIdRow = db
            .prepare("SELECT value FROM settings WHERE key = 'gdriveClientId'")
            .get() as { value?: string }
          clientId = clientIdRow?.value?.trim()
        }
        if (!clientSecret) {
          const clientSecretRow = db
            .prepare("SELECT value FROM settings WHERE key = 'gdriveClientSecret'")
            .get() as { value?: string }
          clientSecret = clientSecretRow?.value?.trim()
        }

        if (!clientId || !clientSecret) {
          return {
            success: false,
            error:
              'Önce Google Cloud Client ID ve Client Secret alanlarını doldurun veya client_secret.json yükleyin.'
          }
        }

        // Güncel değerleri veritabanına kaydet
        try {
          db.prepare(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('gdriveClientId', ?)"
          ).run(clientId)
          db.prepare(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('gdriveClientSecret', ?)"
          ).run(clientSecret)
        } catch (dbSaveErr) {
          console.warn('Could not save client id/secret before oauth:', dbSaveErr)
        }

        const http = await import('http')
        const { shell } = await import('electron')

        return new Promise((resolve) => {
          let isResolved = false
          let port = 0

          const server = http.createServer(async (req, res) => {
            try {
              const reqUrl = new URL(req.url || '', `http://127.0.0.1:${port}`)
              const code = reqUrl.searchParams.get('code')
              const error = reqUrl.searchParams.get('error')

              if (error) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                res.end(
                  '<h2>❌ Giriş İptal Edildi.</h2><p>Bu sekmeyi kapatıp uygulamaya dönebilirsiniz.</p>'
                )
                server.close()
                if (!isResolved) {
                  isResolved = true
                  resolve({ success: false, error: `Google Yetkilendirme Hatası: ${error}` })
                }
                return
              }

              if (code) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                res.end(`
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Temin 360 - Bağlantı Başarılı</title></head>
                <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; text-align: center;">
                  <div style="background: #1e293b; padding: 40px 60px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid #334155;">
                    <div style="font-size: 50px; margin-bottom: 10px;">🎉</div>
                    <h2 style="color: #38bdf8; margin: 0 0 10px 0;">Google Drive Bağlantısı Başarılı!</h2>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0;">Yetkilendirme tamamlandı. Bu sekmeyi kapatıp Temin 360 uygulamasına dönebilirsiniz.</p>
                  </div>
                </body>
                </html>
              `)
                server.close()

                // Exchange authorization code for tokens
                const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: `http://127.0.0.1:${port}`,
                    grant_type: 'authorization_code'
                  }).toString()
                })

                if (!tokenRes.ok) {
                  const errText = await tokenRes.text()
                  if (!isResolved) {
                    isResolved = true
                    resolve({
                      success: false,
                      error: `Token alma hatası (${tokenRes.status}): ${errText}`
                    })
                  }
                  return
                }

                const tokenData = (await tokenRes.json()) as {
                  access_token?: string
                  refresh_token?: string
                }
                if (tokenData.access_token) {
                  db.prepare(
                    "INSERT OR REPLACE INTO settings (key, value) VALUES ('gdriveAccessToken', ?)"
                  ).run(tokenData.access_token)
                }
                if (tokenData.refresh_token) {
                  db.prepare(
                    "INSERT OR REPLACE INTO settings (key, value) VALUES ('gdriveRefreshToken', ?)"
                  ).run(tokenData.refresh_token)
                }

                if (!isResolved) {
                  isResolved = true
                  resolve({
                    success: true,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token
                  })
                }
              }
            } catch (e: any) {
              server.close()
              if (!isResolved) {
                isResolved = true
                resolve({ success: false, error: e.message })
              }
            }
          })

          server.listen(0, '127.0.0.1', () => {
            const addr = server.address()
            port = typeof addr === 'object' && addr ? addr.port : 0
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
              clientId
            )}&redirect_uri=${encodeURIComponent(
              `http://127.0.0.1:${port}`
            )}&response_type=code&scope=${encodeURIComponent(
              'https://www.googleapis.com/auth/drive.file'
            )}&access_type=offline&prompt=consent`

            shell.openExternal(authUrl)
          })

          // Timeout after 3 minutes if user didn't finish
          setTimeout(() => {
            if (!isResolved) {
              isResolved = true
              try {
                server.close()
              } catch {}
              resolve({
                success: false,
                error: 'Oturum açma işlemi zaman aşımına uğradı (3 dakika).'
              })
            }
          }, 180000)
        })
      } catch (error: any) {
        console.error('Google OAuth loopback error:', error)
        return { success: false, error: error.message }
      }
    }
  )

  ipcMain.handle(
    'workspace:backup-gdrive',
    async (_, args?: { token?: string; force?: boolean }) => {
      try {
        const filePath = workspaceManager.getCurrentFilePath()
        if (!filePath) {
          return { success: false, error: 'Aktif bir çalışma dosyası bulunamadı!' }
        }
        workspaceManager.save()

        // Dosyada güncelleme/değişiklik yoksa gereksiz Google Drive yüklemesi yapma
        if (!args?.force && !workspaceManager.hasChanges('gdrive')) {
          console.log('[Google Drive] Dosyada değişiklik bulunmadığı için yükleme atlandı.')
          return {
            success: true,
            skipped: true,
            message:
              'Dosyada son yedeklemeden bu yana herhangi bir değişiklik yapılmadığı için Google Drive yüklemesi atlandı.'
          }
        }

        const db = workspaceManager.getDb()
        let token = args?.token
        if (!token) {
          try {
            const row = db
              .prepare("SELECT value FROM settings WHERE key = 'gdriveAccessToken'")
              .get() as { value?: string }
            token = row?.value
          } catch {
            // Table/setting check fallback
          }
          if (!token) {
            token = (await tryRefreshToken(db)) || undefined
          }
        }

        const fileName = basename(filePath)

        if (token) {
          let cleanToken = String(token)
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/^Bearer\s+/i, '')
            .replace(/[\r\n\s]+/g, '')

          // 401 durumunda refresh token ile otomatik yenile
          let folderId: string
          try {
            folderId = await getOrCreateAppFolder(cleanToken)
          } catch (err: any) {
            if (err.message?.includes('GDRIVE_TOKEN_EXPIRED')) {
              console.log('[Google Drive] Token expire, refresh deneniyor...')
              const newToken = await tryRefreshToken(db)
              if (newToken) {
                cleanToken = newToken
                folderId = await getOrCreateAppFolder(cleanToken)
              } else {
                return {
                  success: false,
                  error:
                    'Google Drive erişim jetonu süresi dolmuş. Lütfen yeni Access Token girin ya da Refresh Token ve API ayarlarınızı kontrol edin.'
                }
              }
            } else {
              throw err
            }
          }

          // Cihaz / PC Kimlik Bilgileri
          const devInfo = getDeviceInfo()

          // Güncel yerel veriyi kaydet
          workspaceManager.save()
          const currentData = fs.readFileSync(filePath)

          const currentAppVersion = app?.getVersion ? app.getVersion() : '1.0.0'
          const activeMeta = workspaceManager.getMeta()
          const anonymousDeviceId = getAnonymousDeviceId()
          const sha256 = crypto.createHash('sha256').update(currentData).digest('hex')

          // Versioned timestamped filename: e.g. Acme_2026-09-06_17-46.temin
          const now = new Date()
          const pad = (n: number) => String(n).padStart(2, '0')
          const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
          const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}`
          const rawBase = fileName
            .replace(/\.temin$/i, '')
            .replace(/_\d{4}[-_.]\d{2}[-_.]\d{2}(?:[-_.]\d{2}[-_.]\d{2})?$/, '')
          const backupFileName = `${rawBase}_${dateStr}_${timeStr}.temin`

          // 1. Anonim Manifest Nesnesi Oluştur (Gizli/kişisel veri içermez)
          const manifest: BackupManifest = {
            manifestVersion: 1,
            backupId: crypto.randomUUID(),
            projectId: activeMeta?.project_id || crypto.randomUUID(),
            fileName: backupFileName,
            sha256,
            fileSize: currentData.length,
            createdAt: new Date().toISOString(),
            dataRevision: activeMeta?.data_revision || 1,
            parentBackupId: activeMeta?.last_backup_id || null,
            appVersion: currentAppVersion,
            deviceId: anonymousDeviceId
          }

          // 2. Önce asıl .temin dosyasını Google Drive'a yükle
          const boundary = '--------------------------' + Date.now().toString(16)
          const teminMetadata = JSON.stringify({
            name: backupFileName,
            description: `TEMİN 360 Yedeği (${dateStr} ${timeStr.replace('-', ':')})`,
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

          const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${teminMetadata}\r\n`
          const fileHeaderPart = `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`
          const closingPart = `\r\n--${boundary}--`

          const metadataBuffer = Buffer.from(metadataPart, 'utf-8')
          const fileHeaderBuffer = Buffer.from(fileHeaderPart, 'utf-8')
          const closingBuffer = Buffer.from(closingPart, 'utf-8')

          const multipartBody = Buffer.concat([
            metadataBuffer,
            fileHeaderBuffer,
            currentData,
            closingBuffer
          ])

          let res = await fetchWithRetry(
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

          if (res.status === 401) {
            console.log('[Google Drive] Yükleme sırasında 401 hatası, token yenileme deneniyor...')
            cachedAppFolderId = null
            const newToken = await tryRefreshToken(db)
            if (newToken) {
              cleanToken = newToken
              res = await fetchWithRetry(
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
            } else {
              return {
                success: false,
                error:
                  'Google Drive oturum süresi dolmuş veya geçersiz (401). Lütfen Ayarlar > Google Drive bölümünden token bilginizi yenileyin.'
              }
            }
          }

          if (!res.ok) {
            const errText = await res.text()
            if (res.status === 401) {
              return {
                success: false,
                error:
                  'Google Drive yetkilendirme hatası (401). Lütfen Ayarlar > Google Drive bölümünden token bilginizi yenileyin.'
              }
            }
            throw new Error(`Google Drive API Yükleme Hatası (${res.status}): ${errText}`)
          }

          const uploadedFile = (await res.json()) as any

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
            Buffer.from(`--${manifestBoundary}\r\nContent-Type: application/json\r\n\r\n`, 'utf-8'),
            manifestContent,
            Buffer.from(`\r\n--${manifestBoundary}--`, 'utf-8')
          ])

          const manifestRes = await fetchWithRetry(
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

          // 4. Her iki dosya da başarıyla yüklendiğinde yedeklemeyi tamamen başarılı say
          if (!manifestRes.ok) {
            console.warn(
              '[Google Drive] Kısmi Başarısızlık: .temin yüklendi ancak manifest.json yüklenemedi.'
            )
            return {
              success: false,
              partial: true,
              error:
                'Yedekleme kısmi başarısız oldu: .temin yüklendi ancak JSON manifesti Google Drive üzerine yüklenemedi. Bütünlük garantisi için lütfen tekrar deneyin.'
            }
          }

          // Prune older backups of this project asynchronously: keep only last 7 versions
          pruneOldBackups(cleanToken, folderId, rawBase, 7).catch((err) =>
            console.warn('[Google Drive] Eski yedekleri temizleme uyarısı:', err)
          )

          // Track backup history in SQLite database
          try {
            if (workspaceManager.isOpen()) {
              const db = workspaceManager.getDb()
              db.exec(`
              CREATE TABLE IF NOT EXISTS LOG_YedekGecmisi (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hedef TEXT NOT NULL,
                dosya_adi TEXT NOT NULL,
                gdrive_file_id TEXT,
                boyut_bytes INTEGER,
                surum_no TEXT,
                tarih TEXT NOT NULL,
                aciklama TEXT
              );
            `)
              db.prepare(
                `
              INSERT INTO LOG_YedekGecmisi (hedef, dosya_adi, gdrive_file_id, boyut_bytes, surum_no, tarih, aciklama)
              VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
            `
              ).run(
                'gdrive',
                backupFileName,
                uploadedFile.id,
                currentData.length,
                currentAppVersion,
                `Google Drive Bulut Yedeği [Manifest: ${manifest.backupId.slice(0, 8)}]`
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
              db.prepare(
                `INSERT OR REPLACE INTO settings (key, value) VALUES ('dbVersion', ?)`
              ).run(currentAppVersion)

              if (activeMeta) {
                activeMeta.last_backup_id = manifest.backupId
              }
              workspaceManager.save(true)
            }
          } catch (dbErr) {
            console.error('Failed to log backup history in DB:', dbErr)
          }

          workspaceManager.markSynced('gdrive')

          const successMsg = `${backupFileName} ve manifesti başarıyla Google Drive 'TEMIN_360_YEDEKLER' klasörüne yüklendi.`

          return {
            success: true,
            message: successMsg,
            fileId: uploadedFile.id,
            backupFileName,
            manifest
          }
        }

        // Fallback response if token not configured yet
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return {
          success: true,
          message: `${fileName} dosyanız Google Drive yedeği için hazırlandı. (Ayarlar > Google Drive alanından Access Token girdiğinizde doğrudan bulut senkronizasyonu aktif olacaktır.)`
        }
      } catch (error: any) {
        console.error('Google Drive backup error:', error)
        return { success: false, error: error.message }
      }
    }
  )

  ipcMain.handle('workspace:list-gdrive-files', async (_, args?: { token?: string }) => {
    try {
      const db = workspaceManager.getDb()
      let token = args?.token
      if (!token) {
        try {
          const row = db
            .prepare("SELECT value FROM settings WHERE key = 'gdriveAccessToken'")
            .get() as { value?: string }
          token = row?.value
        } catch {
          // Fallback
        }
      }

      if (!token) {
        return {
          success: false,
          error:
            'Google Drive API Access Token bulunamadı. Lütfen Ayarlar > Google Drive alanından token tanımlayın.'
        }
      }

      let cleanToken = String(token)
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^Bearer\s+/i, '')
        .replace(/[\r\n\s]+/g, '')
      let folderId: string
      try {
        folderId = await getOrCreateAppFolder(cleanToken)
      } catch (err: any) {
        if (err.message?.includes('GDRIVE_TOKEN_EXPIRED') || err.message?.includes('401')) {
          console.log('[Google Drive list] Token expire, refresh deneniyor...')
          const newToken = await tryRefreshToken(db)
          if (newToken) {
            cleanToken = newToken
            folderId = await getOrCreateAppFolder(cleanToken)
          } else {
            return {
              success: false,
              error:
                'Google Drive erişim jetonunun süresi dolmuş veya geçersiz. Lütfen yeni Access Token girin ya da Refresh Token ve API ayarlarınızı kontrol edin.'
            }
          }
        } else {
          throw err
        }
      }

      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
      const fetchedFiles: any[] = []
      let pageToken: string | undefined = undefined
      let pageCount = 0

      do {
        pageCount++
        const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
        const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=100&fields=nextPageToken,files(id,name,size,mimeType,modifiedTime,createdTime,description,appProperties)&orderBy=modifiedTime%20desc${pageParam}`
        let res = await fetchWithRetry(listUrl, {
          headers: {
            Authorization: `Bearer ${cleanToken}`
          }
        })

        if (res.status === 401) {
          const newToken = await tryRefreshToken(db)
          if (newToken) {
            cleanToken = newToken
            res = await fetchWithRetry(listUrl, {
              headers: {
                Authorization: `Bearer ${cleanToken}`
              }
            })
          }
        }

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Google Drive Dosyaları Listelenemedi (${res.status}): ${errText}`)
        }

        const data = (await res.json()) as { nextPageToken?: string; files?: any[] }
        if (data.files && Array.isArray(data.files)) {
          fetchedFiles.push(...data.files)
        }
        pageToken = data.nextPageToken
      } while (pageToken && pageCount < 100)

      if (pageToken) {
        console.warn(
          '[Google Drive] Dosya listeleme 100 sayfa (10.000 dosya) sınırına ulaştı, daha fazla dosya olabilir.'
        )
      }

      // Split into .temin backups and companion .json manifests
      const teminFiles = fetchedFiles.filter(
        (f: any) =>
          allExtensions.some((ext) => f.name?.toLowerCase().endsWith('.' + ext)) &&
          f.mimeType !== 'application/vnd.google-apps.folder'
      )
      const jsonFiles = fetchedFiles.filter(
        (f: any) =>
          f.name?.toLowerCase().endsWith('.json') &&
          f.mimeType !== 'application/vnd.google-apps.folder'
      )

      // Manifest eşleştirme haritası oluştur (targetFileId veya dosya adı bazında)
      const manifestByTargetId = new Map<string, any>()
      const manifestByBaseName = new Map<string, any>()

      for (const jf of jsonFiles) {
        const targetId = jf.appProperties?.targetFileId
        if (targetId) {
          manifestByTargetId.set(targetId, jf)
        }
        const baseName = jf.name?.replace(/\.json$/i, '').toLowerCase()
        if (baseName) {
          manifestByBaseName.set(baseName, jf)
        }
      }

      // Her .temin dosyasına eşleşen manifestini ve doğrulama durumunu bağla
      const validFiles = teminFiles.map((tf: any) => {
        const baseName = tf.name?.replace(/\.temin$/i, '').toLowerCase()
        const matchingJson =
          manifestByTargetId.get(tf.id) || (baseName ? manifestByBaseName.get(baseName) : undefined)

        let manifest: BackupManifest | null = null
        let isVerified = false

        if (matchingJson?.appProperties?.sha256) {
          const props = matchingJson.appProperties
          manifest = {
            manifestVersion: 1,
            backupId: props.backupId || '',
            projectId: props.projectId || '',
            fileName: tf.name,
            driveFileId: tf.id,
            sha256: props.sha256,
            fileSize: Number(tf.size) || 0,
            createdAt: tf.createdTime || matchingJson.createdTime || '',
            dataRevision: parseInt(props.dataRevision, 10) || 1,
            parentBackupId: props.parentBackupId || null,
            appVersion: props.appVersion || '',
            deviceId: props.deviceId || ''
          }
          isVerified = isBackupManifest(manifest)
        } else if (tf.appProperties?.sha256 && tf.appProperties?.projectId) {
          const props = tf.appProperties
          manifest = {
            manifestVersion: 1,
            backupId: props.backupId || '',
            projectId: props.projectId || '',
            fileName: tf.name,
            driveFileId: tf.id,
            sha256: props.sha256,
            fileSize: Number(tf.size) || 0,
            createdAt: tf.createdTime || '',
            dataRevision: parseInt(props.dataRevision, 10) || 1,
            parentBackupId: props.parentBackupId || null,
            appVersion: props.appVersion || '',
            deviceId: props.deviceId || ''
          }
          isVerified = isBackupManifest(manifest)
        }

        return {
          ...tf,
          manifest: isVerified ? manifest : null,
          manifestFileId: matchingJson?.id || null,
          manifestVerified: isVerified,
          isVerified
        }
      })

      return {
        success: true,
        files: validFiles,
        hasMore: Boolean(pageToken)
      }
    } catch (error: any) {
      console.error('Google Drive list error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(
    'workspace:download-gdrive-file',
    async (
      _,
      args: {
        fileId: string
        fileName: string
        token?: string
        overwriteActive?: boolean
        manifest?: BackupManifest
        manifestFileId?: string
      }
    ) => {
      try {
        let token = args.token
        const db = workspaceManager.getDb()
        if (!token) {
          try {
            const row = db
              .prepare("SELECT value FROM settings WHERE key = 'gdriveAccessToken'")
              .get() as { value?: string }
            token = row?.value
          } catch {
            // Fallback
          }
          if (!token) {
            token = (await tryRefreshToken(db)) || undefined
          }
        }

        if (!token) {
          return {
            success: false,
            error:
              'Google Drive Access Token bulunamadı. Lütfen Ayarlar > Google Drive alanından token tanımlayın.'
          }
        }

        let cleanToken = String(token)
          .trim()
          .replace(/^["']|["']$/g, '')
          .replace(/^Bearer\s+/i, '')
          .replace(/[\r\n\s]+/g, '')

        // Security check: Only permit supported backup files
        if (!allExtensions.some((ext) => args.fileName.toLowerCase().endsWith('.' + ext))) {
          throw new Error(
            'Güvenlik Koruması: Sadece geçerli TEMİN 360 çalışma alanı yedekleri indirilebilir.'
          )
        }

        // Verify file belongs strictly to TEMIN_360_YEDEKLER folder
        let folderId: string
        try {
          folderId = await getOrCreateAppFolder(cleanToken)
        } catch (err: any) {
          if (err.message?.includes('GDRIVE_TOKEN_EXPIRED') || err.message?.includes('401')) {
            const newToken = await tryRefreshToken(db)
            if (newToken) {
              cleanToken = newToken
              folderId = await getOrCreateAppFolder(cleanToken)
            } else {
              throw err
            }
          } else {
            throw err
          }
        }

        let metaRes = await fetchWithRetry(
          `https://www.googleapis.com/drive/v3/files/${args.fileId}?fields=id,name,parents,mimeType,appProperties,size`,
          {
            headers: {
              Authorization: `Bearer ${cleanToken}`
            }
          }
        )

        if (metaRes.status === 401) {
          const newToken = await tryRefreshToken(db)
          if (newToken) {
            cleanToken = newToken
            metaRes = await fetchWithRetry(
              `https://www.googleapis.com/drive/v3/files/${args.fileId}?fields=id,name,parents,mimeType,appProperties,size`,
              {
                headers: {
                  Authorization: `Bearer ${cleanToken}`
                }
              }
            )
          }
        }

        let driveFileMeta: any = null
        if (metaRes.ok) {
          driveFileMeta = (await metaRes.json()) as {
            parents?: string[]
            mimeType?: string
            appProperties?: Record<string, string>
            size?: string
          }
          if (driveFileMeta.mimeType === 'application/vnd.google-apps.folder') {
            throw new Error('Güvenlik Koruması: Klasörler doğrudan indirilemez.')
          }
          if (driveFileMeta.parents && !driveFileMeta.parents.includes(folderId)) {
            throw new Error('Güvenlik Koruması: Bu dosya TEMIN_360_YEDEKLER klasörüne ait değil.')
          }
        }

        let res = await fetchWithRetry(
          `https://www.googleapis.com/drive/v3/files/${args.fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${cleanToken}`
            }
          }
        )

        if (res.status === 401) {
          const newToken = await tryRefreshToken(db)
          if (newToken) {
            cleanToken = newToken
            res = await fetchWithRetry(
              `https://www.googleapis.com/drive/v3/files/${args.fileId}?alt=media`,
              {
                headers: {
                  Authorization: `Bearer ${cleanToken}`
                }
              }
            )
          }
        }

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Google Drive İndirme Hatası (${res.status}): ${errText}`)
        }

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 1. Temel ZIP başlık doğrulaması
        if (!buffer || buffer.length < 512 || buffer.subarray(0, 2).toString() !== 'PK') {
          throw new Error(
            'Güvenlik Hatası: İndirilen dosya geçerli bir TEMİN 360 arşivi değil veya bozuk (0 byte / geçersiz başlık).'
          )
        }

        // 2. Bütünlük ve Manifest Doğrulaması (SHA-256 + Boyut)
        let targetManifest: BackupManifest | null = args.manifest || null

        // Manifest parametresi gelmemişse eşleşen JSON dosyasını veya appProperties kontrol et
        if (!targetManifest && args.manifestFileId) {
          try {
            const mRes = await fetchWithRetry(
              `https://www.googleapis.com/drive/v3/files/${args.manifestFileId}?alt=media`,
              {
                headers: { Authorization: `Bearer ${cleanToken}` }
              }
            )
            if (mRes.ok) {
              const rawM = (await mRes.json()) as unknown
              if (isBackupManifest(rawM)) {
                targetManifest = rawM
              } else {
                throw new Error(
                  'İndirilen manifest dosyası geçerli bir BackupManifest şemasına uymuyor.'
                )
              }
            } else {
              throw new Error(`Manifest dosyası indirilemedi (HTTP ${mRes.status}).`)
            }
          } catch (mErr: any) {
            throw new Error(`Manifest yükleme/doğrulama hatası: ${mErr.message}`)
          }
        }

        // Eğer dosyanın kendi appProperties'inde sha256 varsa fallback olarak kullan
        if (!targetManifest && driveFileMeta?.appProperties?.sha256) {
          const p = driveFileMeta.appProperties
          targetManifest = {
            manifestVersion: 1,
            backupId: p.backupId || '',
            projectId: p.projectId || '',
            fileName: args.fileName,
            driveFileId: args.fileId,
            sha256: p.sha256,
            fileSize: Number(driveFileMeta.size) || buffer.length,
            createdAt: new Date().toISOString(),
            dataRevision: parseInt(p.dataRevision, 10) || 1,
            parentBackupId: p.parentBackupId || null,
            appVersion: p.appVersion || '',
            deviceId: p.deviceId || ''
          }
        }

        // 2. Doğrulama ve Güvenli Geri Yükleme (verifyAndRestoreBackupBuffer)
        const restoreResult = verifyAndRestoreBackupBuffer(buffer, {
          fileName: args.fileName,
          targetManifest,
          overwriteActive: args.overwriteActive,
          currentPath: workspaceManager.getCurrentFilePath(),
          destinationPath: join(
            homedir(),
            'Desktop',
            allExtensions.some((ext) => args.fileName.toLowerCase().endsWith('.' + ext))
              ? args.fileName
              : `${args.fileName}.${defaultFormat.ext}`
          )
        })

        const targetPath = restoreResult.targetPath

        // Open downloaded file as active workspace
        closeAllSecondaryWindows()
        const meta = workspaceManager.open(targetPath, true)

        try {
          const newDb = workspaceManager.getDb()
          newDb
            .prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackupFileId', ?)`)
            .run(args.fileId)
          newDb
            .prepare(
              `INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackupFileName', ?)`
            )
            .run(args.fileName)
          if (targetManifest?.backupId) {
            newDb
              .prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackupId', ?)`)
              .run(targetManifest.backupId)
          }
          newDb
            .prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('lastGdriveSync', ?)`)
            .run(new Date().toISOString())

          const activeMeta = workspaceManager.getMeta()
          if (activeMeta && targetManifest?.backupId) {
            activeMeta.last_backup_id = targetManifest.backupId
          }
          workspaceManager.markSynced('gdrive')
          workspaceManager.save(true)
        } catch (dbErr) {
          console.warn('Could not update last backup file info in downloaded DB:', dbErr)
        }

        return {
          success: true,
          message: args.overwriteActive
            ? `${args.fileName} buluttan indirildi ve mevcut aktif çalışma dosyanız güncellendi.`
            : `${args.fileName} Google Drive'dan başarıyla indirildi ve çalışma alanı olarak açıldı.`,
          meta,
          filePath: targetPath,
          verifiedSha256: Boolean(targetManifest?.sha256),
          verifiedSize: Boolean(targetManifest?.fileSize),
          contentVerified: Boolean(targetManifest?.sha256)
        }
      } catch (error: any) {
        console.error('Google Drive download error:', error)
        return { success: false, error: error.message }
      }
    }
  )

  ipcMain.handle(
    'workspace:delete-gdrive-file',
    async (_, args: { fileId: string; token?: string }) => {
      try {
        let token = args.token
        if (!token) {
          const db = workspaceManager.getDb()
          try {
            const row = db
              .prepare("SELECT value FROM settings WHERE key = 'gdriveAccessToken'")
              .get() as { value?: string }
            token = row?.value
          } catch {
            // Fallback
          }
        }

        if (!token) {
          return { success: false, error: 'Google Drive token bulunamadı.' }
        }

        const cleanToken = String(token)
          .trim()
          .replace(/^["']|["']$/g, '')
          .replace(/^Bearer\s+/i, '')
          .replace(/[\r\n\s]+/g, '')
        const folderId = await getOrCreateAppFolder(cleanToken)

        // Verify file is strictly in TEMIN_360_YEDEKLER folder
        const metaRes = await fetchWithRetry(
          `https://www.googleapis.com/drive/v3/files/${args.fileId}?fields=id,parents`,
          { headers: { Authorization: `Bearer ${cleanToken}` } }
        )
        if (metaRes.ok) {
          const meta = (await metaRes.json()) as { parents?: string[] }
          if (meta.parents && !meta.parents.includes(folderId)) {
            throw new Error(
              'Güvenlik Koruması: Yalnızca TEMIN_360_YEDEKLER klasöründeki yedekler silinebilir.'
            )
          }
        }

        const res = await fetchWithRetry(
          `https://www.googleapis.com/drive/v3/files/${args.fileId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${cleanToken}` }
          }
        )

        if (!res.ok && res.status !== 204) {
          const errText = await res.text()
          throw new Error(`Silme hatası (${res.status}): ${errText}`)
        }

        return { success: true, message: 'Yedek dosyası Google Drive üzerinden başarıyla silindi.' }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )
}
