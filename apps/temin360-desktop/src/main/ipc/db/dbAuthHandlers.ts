import { ipcMain } from 'electron'
import os from 'os'
import path from 'path'
import child_process from 'child_process'
import crypto from 'crypto'
import { workspaceManager } from '../../database/workspace'
import { getSetting } from '../../utils/settingsHelper'
import { hashPassword, verifyPassword, isHashedPassword } from './authCrypto'

const RECOVERY_TTL_MS = 10 * 60 * 1000
const RECOVERY_MAX_ATTEMPTS = 5
const RECOVERY_RESEND_COOLDOWN_MS = 30 * 1000
const MIN_PASSWORD_LENGTH = 6

// Recovery state is kept in main-process memory only. The code itself is never stored
// in plain form and never returned over IPC or written to logs.
interface RecoveryState {
  salt: string
  codeHash: string
  expiresAt: number
  attempts: number
  verified: boolean
  lastSentAt: number
}
let activeRecovery: RecoveryState | null = null

function hashRecoveryCode(salt: string, code: string): string {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex')
}

function getRegisteredEmails(): string[] {
  const candidates = [
    getSetting('smtpReceiver'),
    getSetting('smtp_receiver'),
    getSetting('kurum_eposta'),
    getSetting('kurumEposta'),
    getSetting('adminEmail'),
    getSetting('admin_email')
  ]
    .filter((v): v is string => !!v && v.includes('@'))
    .map((v) => v.trim().toLowerCase())
  if (candidates.length === 0) {
    const smtpUser = getSetting('smtpUser') || getSetting('smtp_user')
    if (smtpUser && smtpUser.includes('@')) candidates.push(smtpUser.trim().toLowerCase())
  }
  return Array.from(new Set(candidates))
}

/**
 * Parola geçmişi YALNIZCA denetim amaçlıdır: gerçek parola tutulmaz, giriş doğrulamasında kullanılmaz.
 * Eski sürümlerden kalan düz metin kayıtlar hash'e dönüştürülür.
 */
function readHistory(db: any): any[] {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'passwordHistory'").get() as
    | { value?: string }
    | undefined
  if (!row?.value) return []
  try {
    const parsed = JSON.parse(row.value)
    if (!Array.isArray(parsed)) return []
    return parsed.map((h: any) => {
      // Audit-only: Asla parola veya parola özeti (hash) tutulmaz.
      const safe = { ...h }
      delete safe.password
      delete safe.passwordHash
      return safe
    })
  } catch {
    return []
  }
}

export function scrubPasswordHistory(db: any): void {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'passwordHistory'").get() as
      | { value?: string }
      | undefined
    if (!row?.value) return
    if (!row.value.includes('"password"') && !row.value.includes('"passwordHash"')) return
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('passwordHistory', ?)").run(
      JSON.stringify(readHistory(db))
    )
  } catch (e) {
    console.error('Scrub password history error:', e)
  }
}

export function savePasswordToHistory(db: any, user: string, _pass: string, hostname: string): void {
  try {
    let history = readHistory(db)
    history.unshift({
      id: `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      username: user,
      hostname,
      osUsername: os.userInfo().username,
      createdAt: new Date().toISOString()
    })
    if (history.length > 100) history = history.slice(0, 100)
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('passwordHistory', ?)").run(
      JSON.stringify(history)
    )
  } catch (e) {
    console.error('Save password history error:', e)
  }
}

/**
 * Kullanıcı parolasını hashleyerek günceller.
 * DİĞER BİLGİSAYARLARDAKİ ESKİ pcPass_* KAYITLARINI ATOMİK OLARAK TEMİZLER. Böylece eski şifreyle diğer cihazlardan
 * oturum açılması engellenir.
 * İşlem kesinlikle bir SQLite transaction içerisinde yürütülür; db.transaction desteği yoksa
 * güvenlik gereği sessizce atomiklikten vazgeçmek yerine hata fırlatılır.
 */
export function applyPassword(db: any, user: string, pass: string, hostname: string): void {
  if (!db || typeof db.transaction !== 'function') {
    throw new Error('Database transaction support is required for atomic password operations.')
  }

  const hashed = hashPassword(pass)

  const executeApply = (): void => {
    // 1. Kayıtlı diğer kullanıcıları topla (additionalUsers, adminUsername, passwordHistory ve userDevices_* anahtarları)
    const otherUsers = new Set<string>()
    let usersList: any[] = []

    const usersRow = db.prepare("SELECT value FROM settings WHERE key = 'additionalUsers'").get() as
      | { value: string }
      | undefined
    if (usersRow?.value) {
      try {
        const parsed = JSON.parse(usersRow.value)
        if (Array.isArray(parsed)) usersList = parsed
      } catch {
        // additionalUsers bozuk/geçersiz JSON ise çökme, yapısal ayrıştırma ve diğer katmanlara güven
      }
    }

    usersList.forEach((u: any) => {
      if (u?.username && u.username !== user) otherUsers.add(u.username)
    })

    const adminUserRow = db.prepare("SELECT value FROM settings WHERE key = 'adminUsername'").get() as
      | { value?: string }
      | undefined
    if (adminUserRow?.value && adminUserRow.value !== user) {
      otherUsers.add(adminUserRow.value)
    }

    // passwordHistory üzerinden bilinen diğer kullanıcı adlarını da topla
    try {
      const hist = readHistory(db)
      hist.forEach((h: any) => {
        if (h?.username && h.username !== user) otherUsers.add(h.username)
      })
    } catch {}

    // 2. Açık veri modeli: Sistemdeki tüm bilinen cihaz adlarını topla (userDevices_*, history, users)
    const allKnownHostnames = new Set<string>()
    const userDevicesKey = `userDevices_${user}`

    try {
      const deviceKeyRows = (db
        .prepare("SELECT key, value FROM settings WHERE key LIKE 'userDevices!_%' ESCAPE '!'")
        .all() || []) as { key: string; value?: string }[]
      for (const dRow of deviceKeyRows) {
        const u = dRow.key.slice('userDevices_'.length)
        if (u && u !== user) otherUsers.add(u)
        if (dRow.value) {
          try {
            const parsed = JSON.parse(dRow.value)
            if (Array.isArray(parsed)) {
              parsed.forEach((h: any) => typeof h === 'string' && allKnownHostnames.add(h))
            }
          } catch {}
        }
      }
    } catch {}

    // passwordHistory ve additionalUsers'tan bilinen cihazları ve diğer kullanıcıları topla
    try {
      const hist = readHistory(db)
      hist.forEach((h: any) => {
        if (h?.hostname) allKnownHostnames.add(h.hostname)
        if (h?.username && h.username !== user) otherUsers.add(h.username)
      })
    } catch {}

    usersList.forEach((u: any) => {
      if (u?.hostname) allKnownHostnames.add(u.hostname)
      if (u?.username && u.username !== user) otherUsers.add(u.username)
    })

    // 3. Kullanıcıya ait tüm eski bilgisayar şifre önbelleklerini temizle.
    // LIKE sorgusunda '_' ve '%' karakterleri joker olduğu için kullanıcı adı '!' ile kaçış (ESCAPE) yapılır.
    const escapedUser = user.replace(/([%_!])/g, '!$1')
    const candidateRows = (db
      .prepare(
        "SELECT key FROM settings WHERE (key LIKE 'pcPass!_' || ? || '!_%' ESCAPE '!') OR (key = 'pcPass_' || ?)"
      )
      .all(escapedUser, user) || []) as { key: string }[]

    const deleteStmt = db.prepare('DELETE FROM settings WHERE key = ?')

    for (const row of candidateRows) {
      const k = row.key

      // Legacy tam eşleşme: 'pcPass_${user}'
      if (k === `pcPass_${user}`) {
        deleteStmt.run(k)
        continue
      }

      // Katman 1: Başka bir kayıtlı kullanıcının (örn. admin_backup) tam adıyla başlayan anahtarları KORU
      const isOtherUserPrefix = Array.from(otherUsers).some(
        (other) => k.startsWith(`pcPass_${other}_`) || k === `pcPass_${other}`
      )
      if (isOtherUserPrefix) {
        continue
      }

      // Katman 2: Anahtardan kullanıcı adını ve cihaz adını kesin olarak belirle.
      const raw = k.slice('pcPass_'.length)
      let belongsToThisUser = false

      // 2a. Eğer anahtar bilinen bir cihaz adı (allKnownHostnames) ile bitiyorsa:
      // Cihaz adında birden fazla alt çizgi (örn: PC_WORK_1_OFFICE) olsa dahi kullanıcı adı tam tespit edilir.
      for (const h of allKnownHostnames) {
        if (raw.endsWith(`_${h}`) && raw.length > h.length + 1) {
          const keyUser = raw.slice(0, raw.length - h.length - 1)
          if (keyUser === user) {
            belongsToThisUser = true
            break
          }
        }
      }

      // 2b. Bilinen cihaz listesinde yoksa (eski/miras veritabanı): son alt çizgiden önceki kısım tam kullanıcı adıysa sil
      if (!belongsToThisUser) {
        const lastU = raw.lastIndexOf('_')
        if (lastU !== -1) {
          const keyUser = raw.slice(0, lastU)
          if (keyUser === user) {
            belongsToThisUser = true
          }
        }
      }

      if (belongsToThisUser) {
        deleteStmt.run(k)
      }
    }

    // 4. Güncel bilgileri kaydet
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    stmt.run('adminUsername', user)
    stmt.run('adminPassword', hashed)
    stmt.run(`pcPass_${user}_${hostname}`, hashed)

    // Açık cihaz veri modeli: Kullanıcının güncel geçerli cihazını kaydet
    stmt.run(userDevicesKey, JSON.stringify([hostname]))

    const userEntry = {
      username: user,
      password: hashed,
      hostname,
      osUsername: os.userInfo().username,
      updatedAt: new Date().toISOString()
    }
    const idx = usersList.findIndex((u: any) => u.username === user)
    if (idx >= 0) usersList[idx] = { ...usersList[idx], ...userEntry }
    else usersList.push(userEntry)
    stmt.run('additionalUsers', JSON.stringify(usersList))

    savePasswordToHistory(db, user, pass, hostname)
  }

  db.transaction(executeApply)()
}

function upgradeLegacyKey(db: any, key: string, pass: string): void {
  try {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
      key,
      hashPassword(pass)
    )
    workspaceManager.recordMutation('SETTINGS')
    workspaceManager.save()
  } catch (e) {
    console.error('Legacy password upgrade error:', e)
  }
}

/**
 * Kullanıcının işletim sistemindeki görünen/tam adını (Display Name) güvenli şekilde tespit eder.
 * Shell enjeksiyonu riskini önlemek için execFileSync kullanılır (kabuk kullanılmaz).
 * Windows (net user), macOS (id -F), Linux (GECOS) ve homedir/username yedeklerini kapsar.
 */
export function resolveSystemUserDisplayName(osUsername: string): string {
  const sanitize = (name: string): string => {
    if (!name || typeof name !== 'string') return ''
    return name
      .replace(/[\r\n\t]/g, ' ')
      .trim()
      .split(/\s+/)
      .map(
        (part) =>
          part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1).toLocaleLowerCase('tr-TR')
      )
      .filter(Boolean)
      .join(' ')
      .slice(0, 50)
  }

  // 1. Windows: shell olmaksızın execFileSync ile 'net user <username>' çağrısı
  if (process.platform === 'win32') {
    try {
      const username = process.env.USERNAME || osUsername
      // Güvenlik: shell kullanılmaz, argümanlar dizi olarak işletim sistemine doğrudan aktarılır
      const out = child_process.execFileSync('net', ['user', username], {
        encoding: 'utf8',
        timeout: 2500,
        windowsHide: true
      })
      const lines = out.split(/\r?\n/)
      for (const line of lines) {
        const match = line.match(
          /^(?:Tam ad|Full Name|Nom complet|Nombre completo|Nome completo|Vollst.+ndiger Name|[^\s]+ ad)\s{2,}(.+)$/i
        )
        if (match && match[1] && match[1].trim()) {
          const res = sanitize(match[1])
          if (res) return res
        }
      }
    } catch {
      // Yerel olmayan veya etki alanı hesaplarında başarısız olursa yedeğe devam et
    }
  } else if (process.platform === 'darwin') {
    // 2. macOS: shell olmaksızın 'id -F' çağrısı
    try {
      const out = child_process.execFileSync('id', ['-F'], {
        encoding: 'utf8',
        timeout: 2000
      })
      if (out && out.trim()) {
        const res = sanitize(out)
        if (res) return res
      }
    } catch {
      // yedeğe devam et
    }
  } else if (process.platform === 'linux') {
    // 3. Linux: GECOS alanından tam adı çek (/etc/passwd 5. alan)
    try {
      const gecos = (os.userInfo() as any)?.gecos
      if (gecos) {
        const fullName = gecos.split(',')[0].trim()
        const res = sanitize(fullName)
        if (res) return res
      }
    } catch {
      // yedeğe devam et
    }
  }

  // 4. Fallback: Kullanıcı ev dizini klasör adı (örn: C:\Users\ilyas bozdemir)
  try {
    const homedir = os.homedir()
    const folderName = path.basename(homedir)
    if (
      folderName &&
      !['user', 'admin', 'administrator', 'kullanici', 'default', 'root'].includes(
        folderName.toLowerCase()
      )
    ) {
      const res = sanitize(folderName)
      if (res) return res
    }
  } catch {
    // yedeğe devam et
  }

  // 5. Son Fallback: osUsername
  return sanitize(osUsername) || osUsername || 'Kullanıcı'
}

/**
 * <summary>
 * Veritabanı Kimlik Doğrulama ve Kullanıcı İşlemleri IPC İşleyicileri
 * </summary>
 * <description>
 * Oturum açma, ilk kurulum, şifre kontrolü ve e-posta ile kurtarma kodu gönderme/doğrulama işlemlerini yönetir.
 * </description>
 */
export function registerDbAuthHandlers(): void {
  /**
   * <summary>
   * Bilgisayar ve Cihaz Bilgilerini Getirici
   * </summary>
   */
  ipcMain.handle('system:get-pc-info', async () => {
    try {
      const osUsername = os.userInfo().username || process.env.USERNAME || 'User'
      const hostname = os.hostname() || process.env.COMPUTERNAME || 'LOCAL-PC'
      const platform = os.platform()
      const osType = os.type()
      const userDomain = process.env.USERDOMAIN || ''
      const suggestedDisplayName = resolveSystemUserDisplayName(osUsername)

      return {
        hostname,
        platform,
        osUsername,
        osType,
        userDomain,
        suggestedDisplayName
      }
    } catch {
      return {
        hostname: 'LOCAL-PC',
        platform: 'win32',
        osUsername: 'User',
        osType: 'Windows_NT',
        userDomain: '',
        suggestedDisplayName: 'Kullanıcı'
      }
    }
  })

  /**
   * <summary>
   * Kimlik Doğrulama Kurulum Kontrolü
   * </summary>
   * <returns>Admin kullanıcı adı ve şifresi tanımlı mı bilgisi</returns>
   */
  ipcMain.handle('db:check-auth-setup', async () => {
    try {
      const db = workspaceManager.getDb()
      const userRow = db.prepare("SELECT value FROM settings WHERE key = 'adminUsername'").get() as
        | { value: string }
        | undefined
      const passRow = db.prepare("SELECT value FROM settings WHERE key = 'adminPassword'").get() as
        | { value: string }
        | undefined

      const hasUser = !!userRow?.value
      const hasPass = !!passRow?.value

      return { hasCredentials: hasUser && hasPass }
    } catch (error: any) {
      console.error('Check auth setup error:', error)
      return { hasCredentials: false, error: error.message }
    }
  })

  /**
   * <summary>
   * Parola Geçmişi (YALNIZCA DENETİM) — gerçek veya hash parola değeri dışarı verilmez
   * </summary>
   */
  ipcMain.handle('db:get-password-history', async () => {
    try {
      const db = workspaceManager.getDb()
      const history = readHistory(db).map((h: Record<string, unknown>) => {
        const safe = { ...h }
        delete safe.passwordHash
        return safe
      })
      return { success: true, history }
    } catch (error: any) {
      return { success: false, history: [], error: error.message }
    }
  })

  /**
   * <summary>
   * İlk Kullanıcı ve Kimlik Bilgileri Kurulumu — yalnızca henüz kimlik bilgisi tanımlı değilse çalışır
   * </summary>
   */
  ipcMain.handle('db:setup-auth', async (_, code: string, user: string, pass: string) => {
    try {
      const db = workspaceManager.getDb()
      const existing = db
        .prepare("SELECT value FROM settings WHERE key = 'adminPassword'")
        .get() as { value?: string } | undefined
      if (existing?.value) {
        return {
          success: false,
          error:
            'Kimlik bilgileri zaten tanımlı. Parolanızı unuttuysanız "Parolamı Unuttum" akışını kullanın.'
        }
      }
      if (!user || typeof pass !== 'string' || pass.length < MIN_PASSWORD_LENGTH) {
        return { success: false, error: `Parola en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` }
      }
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
        'eButceKodu',
        code
      )
      applyPassword(db, user, pass, os.hostname())
      workspaceManager.recordMutation('SETTINGS')
      workspaceManager.save()
      return { success: true }
    } catch (error: any) {
      console.error('Setup auth error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * <summary>
   * Kullanıcı Giriş İşleyicisi — yalnızca güncel parola geçerlidir; eski parolalar kabul edilmez.
   * Eski düz metin kayıtlar başarılı girişte otomatik olarak hash'e yükseltilir.
   * </summary>
   */
  ipcMain.handle('db:login', async (_, _code: string, user: string, pass: string) => {
    try {
      const db = workspaceManager.getDb()
      const hostname = os.hostname()
      const finish = <T extends Record<string, unknown>>(result: T): T => {
        scrubPasswordHistory(db)
        return result
      }

      const userRow = db.prepare("SELECT value FROM settings WHERE key = 'adminUsername'").get() as
        | { value: string }
        | undefined
      const passRow = db.prepare("SELECT value FROM settings WHERE key = 'adminPassword'").get() as
        | { value: string }
        | undefined

      const pcKey = `pcPass_${user}_${hostname}`
      const pcPassRow = db.prepare('SELECT value FROM settings WHERE key = ?').get(pcKey) as
        | { value: string }
        | undefined
      if (pcPassRow?.value && verifyPassword(pass, pcPassRow.value)) {
        if (!isHashedPassword(pcPassRow.value)) upgradeLegacyKey(db, pcKey, pass)
        return finish({ success: true, username: user, hostname })
      }

      const expectedUser = userRow?.value || 'admin'
      if (user === expectedUser && passRow?.value && verifyPassword(pass, passRow.value)) {
        if (!isHashedPassword(passRow.value)) upgradeLegacyKey(db, 'adminPassword', pass)
        return finish({ success: true, username: expectedUser })
      }

      const additionalUsersRow = db
        .prepare("SELECT value FROM settings WHERE key = 'additionalUsers'")
        .get() as { value: string } | undefined
      if (additionalUsersRow?.value) {
        try {
          const list = JSON.parse(additionalUsersRow.value)
          if (Array.isArray(list)) {
            const matched = list.find(
              (u: any) => u.username === user && verifyPassword(pass, u.password)
            )
            if (matched) {
              if (!isHashedPassword(matched.password)) {
                const upgraded = list.map((u: any) =>
                  u.password && !isHashedPassword(u.password)
                    ? { ...u, password: hashPassword(String(u.password)) }
                    : u
                )
                db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
                  'additionalUsers',
                  JSON.stringify(upgraded)
                )
                workspaceManager.recordMutation('SETTINGS')
                workspaceManager.save()
              }
              return finish({
                success: true,
                username: matched.username,
                role: matched.role || 'user'
              })
            }
          }
        } catch (e) {
          console.error('Failed to parse additionalUsers:', e)
        }
      }

      return { success: false, error: 'Kullanıcı adı veya şifre hatalı!' }
    } catch (error: any) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * <summary>
   * Adım 1: Kayıtlı e-posta doğrulaması ve tek kullanımlık 6 haneli kod gönderimi.
   * Kod IPC yanıtında veya loglarda ASLA yer almaz. SMTP yoksa/başarısızsa hata döner.
   * </summary>
   */
  ipcMain.handle('db:send-recovery-email', async (_, inputEmail: string) => {
    try {
      const email = (inputEmail || '').toString().trim().toLowerCase()
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Geçerli bir e-posta adresi girin.' }
      }

      const now = Date.now()
      if (activeRecovery && now - activeRecovery.lastSentAt < RECOVERY_RESEND_COOLDOWN_MS) {
        const wait = Math.ceil(
          (RECOVERY_RESEND_COOLDOWN_MS - (now - activeRecovery.lastSentAt)) / 1000
        )
        return { success: false, error: `Yeni kod istemek için ${wait} sn bekleyin.` }
      }

      const smtpHost = getSetting('smtpHost') || getSetting('smtp_host')
      const smtpPort = parseInt(getSetting('smtpPort') || getSetting('smtp_port') || '587', 10)
      const smtpUser = getSetting('smtpUser') || getSetting('smtp_user')
      const smtpPass = getSetting('smtpPass') || getSetting('smtp_pass')
      const smtpSecure = getSetting('smtpSecure') === 'true' || getSetting('smtp_secure') === 'true'

      const registered = getRegisteredEmails()
      if (registered.length === 0) {
        return {
          success: false,
          error:
            'Kayıtlı bir kurtarma e-posta adresi tanımlı değil. Ayarlardan kurum e-postasını tanımlayın.'
        }
      }
      if (!smtpHost || !smtpUser || !smtpPass) {
        return {
          success: false,
          error: 'SMTP sunucusu yapılandırılmamış; kurtarma kodu gönderilemiyor.'
        }
      }

      const genericOk = { success: true, message: 'Adres kayıtlıysa doğrulama kodu gönderildi.' }
      if (!registered.includes(email)) {
        // Do not reveal whether the address is registered.
        return genericOk
      }

      const code = crypto.randomInt(100000, 1000000).toString()
      const salt = crypto.randomBytes(16).toString('hex')
      const candidate: RecoveryState = {
        salt,
        codeHash: hashRecoveryCode(salt, code),
        expiresAt: now + RECOVERY_TTL_MS,
        attempts: 0,
        verified: false,
        lastSentAt: now
      }

      const actualSecure =
        smtpPort === 465
          ? true
          : smtpPort === 587 || smtpPort === 25 || smtpPort === 2525
            ? false
            : smtpSecure

      try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: actualSecure,
          auth: { user: smtpUser, pass: smtpPass }
        })
        const institution = getSetting('institutionName') || 'TEMİN 360 Kurumu'
        await transporter.sendMail({
          from: `"${institution} (TEMİN 360)" <${smtpUser}>`,
          to: email,
          subject: '[TEMİN 360] Parola Sıfırlama Kodu',
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #1e293b; margin-top: 0;">TEMİN 360 Güvenlik Doğrulaması</h2>
                <p style="color: #475569; font-size: 14px;"><strong>${institution}</strong> çalışma dosyası için parola sıfırlama talebinde bulunuldu.</p>
                <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${code}</span>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Bu kod 10 dakika geçerlidir ve tek kullanımlıktır. Talebi siz yapmadıysanız bu e-postayı dikkate almayın.</p>
              </div>
            `
        })
      } catch (mailError: any) {
        activeRecovery = null
        console.warn('Recovery e-mail could not be sent:', mailError?.code || 'SMTP_ERROR')
        return {
          success: false,
          error: 'E-posta gönderilemedi. SMTP ayarlarınızı kontrol edip tekrar deneyin.'
        }
      }

      activeRecovery = candidate
      return genericOk
    } catch (error: any) {
      console.error('Send recovery email error:', error?.message)
      return { success: false, error: 'Kurtarma işlemi başlatılamadı.' }
    }
  })

  /**
   * <summary>
   * Adım 2: Kod doğrulama (10 dk, en fazla 5 deneme, tek kullanımlık)
   * </summary>
   */
  ipcMain.handle('db:verify-recovery-code', async (_, inputCode: string) => {
    try {
      if (!activeRecovery) {
        return { success: false, error: 'Aktif bir kurtarma kodu yok. Lütfen yeni kod isteyin.' }
      }
      if (Date.now() > activeRecovery.expiresAt) {
        activeRecovery = null
        return {
          success: false,
          error: 'Doğrulama kodunun süresi doldu (10 dk). Lütfen yeni kod isteyin.'
        }
      }
      if (activeRecovery.verified) return { success: true }

      activeRecovery.attempts += 1
      const cleanInput = (inputCode || '').toString().trim()
      const given = Buffer.from(hashRecoveryCode(activeRecovery.salt, cleanInput), 'hex')
      const expected = Buffer.from(activeRecovery.codeHash, 'hex')
      if (!crypto.timingSafeEqual(given, expected)) {
        if (activeRecovery.attempts >= RECOVERY_MAX_ATTEMPTS) {
          activeRecovery = null
          return {
            success: false,
            error: 'Çok fazla hatalı deneme. Kod iptal edildi; lütfen yeni kod isteyin.'
          }
        }
        return {
          success: false,
          error: `Doğrulama kodu hatalı! Kalan deneme: ${RECOVERY_MAX_ATTEMPTS - activeRecovery.attempts}`
        }
      }
      activeRecovery.verified = true
      activeRecovery.expiresAt = Date.now() + RECOVERY_TTL_MS
      return { success: true }
    } catch (error: any) {
      console.error('Verify recovery code error:', error?.message)
      return { success: false, error: 'Kod doğrulanamadı.' }
    }
  })

  /**
   * <summary>
   * Adım 3: Doğrulanmış kurtarma oturumuyla yeni parola belirleme.
   * Yalnızca parolayı günceller; çalışma dosyası verilerine dokunmaz. Tek kullanımlıktır.
   * </summary>
   */
  ipcMain.handle('db:reset-password', async (_, newPassword: string) => {
    try {
      if (!activeRecovery || !activeRecovery.verified || Date.now() > activeRecovery.expiresAt) {
        activeRecovery = null
        return {
          success: false,
          error: 'Doğrulanmış bir kurtarma oturumu yok. Süreci yeniden başlatın.'
        }
      }
      if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
        return { success: false, error: `Parola en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` }
      }
      const db = workspaceManager.getDb()
      const userRow = db.prepare("SELECT value FROM settings WHERE key = 'adminUsername'").get() as
        | { value?: string }
        | undefined
      const username = userRow?.value || 'admin'
      applyPassword(db, username, newPassword, os.hostname())
      workspaceManager.recordMutation('SETTINGS')
      workspaceManager.save()
      activeRecovery = null
      return { success: true, username }
    } catch (error: any) {
      console.error('Reset password error:', error?.message)
      return { success: false, error: 'Parola güncellenemedi.' }
    }
  })
}
