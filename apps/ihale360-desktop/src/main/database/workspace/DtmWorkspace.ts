import AdmZip from 'adm-zip'
import Database from 'better-sqlite3'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { initializeDatabase } from '../index'
import { runMigrations, CURRENT_SCHEMA_VERSION, getPendingMigrations, schema } from '@dt/database'
import tasinirKodlariSeed from '../seed/tasinir_kodlari.json'
import { allExtensions, defaultFormat } from '../../config/fileFormats'
import {
  WorkspaceMeta,
  MutationSummaryItem,
  calculateIntegrityHash,
  normalizeMeta,
  extractDbInfo,
  TABLE_FRIENDLY_NAMES
} from './types'
import { ensureSchemaIntegrity } from './schemaIntegrity'
import { seedTemplates } from './templateSeeder'

/**
 * Atomically replaces destPath with sourcePath with Windows retry and safety backup.
 * 1. Creates a safety backup of destPath if it exists.
 * 2. Renames sourcePath to destPath with retry on Windows EPERM/EBUSY.
 * 3. If replace fails, restores destPath from the safety backup.
 * 4. On success, removes the temporary safety backup.
 */
export function atomicReplaceWorkspaceFile(
  sourcePath: string,
  destPath: string,
  maxRetries: number = 10,
  postReplaceValidate?: (targetPath: string) => void
): void {
  const destDir = path.dirname(destPath)
  const destExists = fs.existsSync(destPath)
  const backupPath = path.join(
    destDir,
    `.${path.basename(destPath)}.bak.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`
  )
  let backupCreated = false

  if (destExists) {
    try {
      fs.copyFileSync(destPath, backupPath)
      if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size === 0) {
        throw new Error('Güvenlik yedeği kopyası oluşturulamadı veya boş.')
      }
      backupCreated = true
    } catch (bakErr: unknown) {
      const msg = bakErr instanceof Error ? bakErr.message : String(bakErr)
      throw new Error(`Hedef dosya için güvenlik yedeği alınamadı: ${msg}. Kaydetme iptal edildi.`)
    }
  }

  let replaced = false
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.renameSync(sourcePath, destPath)
      replaced = true
      break
    } catch (err: unknown) {
      const errObj = err as NodeJS.ErrnoException
      lastError = err instanceof Error ? err : new Error(String(err))
      if (errObj.code === 'EPERM' || errObj.code === 'EBUSY' || errObj.code === 'EACCES') {
        if (attempt < maxRetries) {
          const delay = Math.min(25 * Math.pow(1.5, attempt - 1), 400)
          try {
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay)
          } catch {
            const s = Date.now()
            while (Date.now() - s < delay) {
              /* wait */
            }
          }
          continue
        }
      }
      break
    }
  }

  if (!replaced) {
    const destOldTmp = `${destPath}.old.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`
    try {
      if (fs.existsSync(destPath)) {
        fs.renameSync(destPath, destOldTmp)
      }
      fs.renameSync(sourcePath, destPath)
      if (fs.existsSync(destOldTmp)) {
        try {
          fs.unlinkSync(destOldTmp)
        } catch {
          /* ignore old tmp cleanup */
        }
      }
      replaced = true
    } catch (fallbackErr: unknown) {
      // 1. Try restoring from destOldTmp if it exists and destPath is missing/empty
      if (
        fs.existsSync(destOldTmp) &&
        fs.statSync(destOldTmp).size > 0 &&
        (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0)
      ) {
        try {
          fs.copyFileSync(destOldTmp, destPath)
        } catch {
          /* fallback to backupPath */
        }
      }

      // 2. Restore destPath from backupPath if target was removed or damaged
      if (
        backupCreated &&
        fs.existsSync(backupPath) &&
        (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0)
      ) {
        try {
          fs.copyFileSync(backupPath, destPath)
        } catch {
          /* ignore restore error */
        }
      }

      const primaryErr =
        lastError || (fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)))
      const backupInfo =
        backupCreated && fs.existsSync(backupPath) ? ` Güvenlik yedeği korundu: ${backupPath}.` : ''
      const err = new Error(
        `Dosya atomik olarak değiştirilemedi: ${primaryErr.message}.${backupInfo}`
      )
      Object.assign(err, {
        code: (primaryErr as NodeJS.ErrnoException).code,
        originalError: primaryErr,
        backupPath: backupCreated ? backupPath : undefined
      })
      throw err
    }
  }

  // Post-replacement validation before safety backup cleanup:
  // If validation fails, restore original destPath from backupPath so original file remains intact!
  if (postReplaceValidate) {
    try {
      postReplaceValidate(destPath)
    } catch (valErr: unknown) {
      const msg = valErr instanceof Error ? valErr.message : String(valErr)
      if (backupCreated && fs.existsSync(backupPath)) {
        try {
          fs.copyFileSync(backupPath, destPath)
          try {
            fs.unlinkSync(backupPath)
          } catch {
            /* ignore backup cleanup error */
          }
          throw new Error(
            `Hedef dosya doğrulanamadı ve orijinal dosya güvenlik yedeğinden geri yüklendi: ${msg}`
          )
        } catch (restoreErr: unknown) {
          if (
            restoreErr instanceof Error &&
            restoreErr.message.includes('güvenlik yedeğinden geri yüklendi')
          ) {
            throw restoreErr
          }
          const restoreMsg = restoreErr instanceof Error ? restoreErr.message : String(restoreErr)
          throw new Error(
            `KRİTİK HATA: Hedef dosya doğrulanamadı ve güvenlik yedeğinden geri yüklenirken hata oluştu: ${restoreMsg}. Orijinal veriniz şu yedek dosyasında korundu: ${backupPath}. Doğrulama hatası: ${msg}`
          )
        }
      }
      throw new Error(`Hedef dosya doğrulanamadı: ${msg}`)
    }
  }

  // Clean up backup file ONLY upon successful replacement AND successful validation
  if (backupCreated && fs.existsSync(backupPath)) {
    try {
      fs.unlinkSync(backupPath)
    } catch {
      /* ignore backup cleanup */
    }
  }
}

export class DtmWorkspace {
  private tempDir: string
  private db: Database.Database | null = null
  private currentFilePath: string | null = null
  private meta: WorkspaceMeta | null = null
  private initialHash: string = ''
  private initialDataVersion: number = 0
  private userMutationCount: number = 0
  private isDirty: boolean = false
  private mutationMap: Map<string, MutationSummaryItem> = new Map()
  private lastMutationTime: string | null = null

  constructor() {
    this.tempDir = path.join(
      app.getPath('userData'),
      'dtm_temp',
      `${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    )
  }

  private acquireFileLock(filePath: string, maxAttempts: number = 3): void {
    const lockPath = filePath + '.lock'

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Atomic creation via O_CREAT | O_EXCL ('wx' flag): prevents TOCTOU lock race conditions
        fs.writeFileSync(lockPath, process.pid.toString(), { flag: 'wx', encoding: 'utf-8' })
        return
      } catch (err: unknown) {
        const errObj = err as NodeJS.ErrnoException
        if (errObj.code === 'EEXIST') {
          let existingPid: number | null = null
          try {
            const pidStr = fs.readFileSync(lockPath, 'utf-8').trim()
            const parsed = parseInt(pidStr, 10)
            if (!isNaN(parsed)) {
              existingPid = parsed
            }
          } catch {
            /* ignore read error if file was deleted in-flight */
          }

          if (existingPid !== null) {
            if (existingPid === process.pid) {
              // Lock is already owned by this exact process
              return
            }

            let isRunning = false
            try {
              process.kill(existingPid, 0)
              isRunning = true
            } catch {
              isRunning = false
            }

            if (isRunning) {
              throw new Error(
                'LOCKED|Bu dosya şu anda başka bir pencerede veya programda açık durumda. Çakışmayı önlemek için önce diğer taraftan kapatmalısınız.'
              )
            } else {
              // Stale lock from a terminated process: unlink and retry
              try {
                fs.unlinkSync(lockPath)
              } catch {
                /* ignore unlink error */
              }
              continue
            }
          }

          // Lock file was empty or corrupted: unlink and retry
          try {
            fs.unlinkSync(lockPath)
          } catch {
            /* ignore unlink error */
          }
          continue
        }

        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`Kilit dosyası oluşturulamadı: ${msg}`)
      }
    }

    throw new Error('Kilit dosyası oluşturulamadı: Eşzamanlı kilit yarışması çözülemedi.')
  }

  private releaseFileLock(filePath: string): void {
    const lockPath = filePath + '.lock'
    if (fs.existsSync(lockPath)) {
      try {
        fs.unlinkSync(lockPath)
      } catch {
        /* ignore lock unlink error */
      }
    }
  }

  public openWorkspace(filePath: string, allowMigration: boolean = false): WorkspaceMeta {
    filePath = filePath.replace(/^"+|"+$/g, '').trim()
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dosya bulunamadı: ${filePath}`)
    }

    this.acquireFileLock(filePath)

    try {
      this.currentFilePath = filePath
      this.ensureTempDir()

      const zipBuffer = fs.readFileSync(filePath)
      if (zipBuffer.length === 0) {
        this.releaseFileLock(filePath)
        return this.createWorkspace(filePath, 'Yeni Kurum')
      }

      const metaPath = path.join(this.tempDir, 'meta.json')
      let rawMeta: any = {}
      const headerPrefix = zipBuffer.subarray(0, Math.min(zipBuffer.length, 512)).toString('latin1')
      const isRawSqlite = headerPrefix.includes('SQLite format 3')

      if (isRawSqlite) {
        const targetDb = path.join(this.tempDir, 'database.sqlite')
        fs.copyFileSync(filePath, targetDb)
        const dbInfo = extractDbInfo(targetDb, path.basename(filePath, path.extname(filePath)))
        rawMeta = {
          dtal_version: '1.0',
          schema_version: dbInfo.schemaVersion,
          institution_name: dbInfo.institutionName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          active_db_file: 'database.sqlite'
        }
        fs.writeFileSync(metaPath, JSON.stringify(rawMeta, null, 2))
      } else {
        try {
          const zip = new AdmZip(filePath)
          const resolvedTemp = path.resolve(this.tempDir)
          for (const entry of zip.getEntries()) {
            const entryTarget = path.resolve(resolvedTemp, entry.entryName)
            if (!entryTarget.startsWith(resolvedTemp + path.sep) && entryTarget !== resolvedTemp) {
              throw new Error(`Güvensiz arşiv içeriği tespit edildi (Zip Slip): ${entry.entryName}`)
            }
          }
          zip.extractAllTo(this.tempDir, true)
        } catch (zipErr: any) {
          if (zipErr?.message?.includes('Zip Slip')) {
            throw zipErr
          }
          const targetDb = path.join(this.tempDir, 'database.sqlite')
          fs.copyFileSync(filePath, targetDb)
          const dbInfo = extractDbInfo(targetDb, path.basename(filePath, path.extname(filePath)))
          rawMeta = {
            dtal_version: '1.0',
            schema_version: dbInfo.schemaVersion,
            institution_name: dbInfo.institutionName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            active_db_file: 'database.sqlite'
          }
          fs.writeFileSync(metaPath, JSON.stringify(rawMeta, null, 2))
        }

        if (fs.existsSync(metaPath)) {
          rawMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        }
      }

      const attachmentsDir = path.join(this.tempDir, 'attachments')
      if (!fs.existsSync(attachmentsDir)) {
        fs.mkdirSync(attachmentsDir, { recursive: true })
      }

      const hadExplicitProjectId = Boolean(rawMeta && (rawMeta.project_id || rawMeta.projectId))
      const activeDbFile = rawMeta?.active_db_file || 'database.sqlite'
      const targetDbPath = path.join(this.tempDir, activeDbFile)
      let projectDifferentiator: string | undefined = undefined
      if (fs.existsSync(targetDbPath)) {
        try {
          const info = extractDbInfo(targetDbPath)
          if (info.projectDifferentiator) {
            projectDifferentiator = info.projectDifferentiator
          }
        } catch {
          /* ignore */
        }
      }
      const meta = normalizeMeta(rawMeta, projectDifferentiator)
      const fromVersion = meta.schema_version || 1

      if (fromVersion < CURRENT_SCHEMA_VERSION) {
        if (!allowMigration) {
          const pendingUpdates = getPendingMigrations(fromVersion)
          if (pendingUpdates.length > 0) {
            const payload = JSON.stringify({
              requiresMigration: true,
              pendingUpdates,
              last_user_mutation_at: meta.last_user_mutation_at
            })
            throw new Error(`MIGRATION_REQUIRED|${payload}`)
          }
        }
        const dbFileName = meta.active_db_file || 'database.sqlite'
        const dbPath = path.join(this.tempDir, dbFileName)
        this.db = new Database(dbPath)
        const previousUserMutationAt = meta.last_user_mutation_at
        const previousUpdatedAt = meta.updated_at
        runMigrations(this.db, fromVersion, schema)
        ensureSchemaIntegrity(this.db)
        meta.schema_version = CURRENT_SCHEMA_VERSION
        // Schema migration does NOT alter user mutation or user updated_at timestamp!
        meta.updated_at = previousUpdatedAt || new Date().toISOString()
        meta.last_user_mutation_at = previousUserMutationAt
        meta.integrity_hash = calculateIntegrityHash(meta)
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
        this.saveWorkspace(true)
      } else {
        const dbFileName = meta.active_db_file || 'database.sqlite'
        const dbPath = path.join(this.tempDir, dbFileName)
        this.db = new Database(dbPath)

        // Eski projelerde projectId kalıcılığı (migration):
        // Dosyada önceden açıkça project_id yoksa, deterministik türetilen kimliği
        // diskteki .temin dosyasına kalıcı olarak kaydet.
        if (!hadExplicitProjectId) {
          meta.integrity_hash = calculateIntegrityHash(meta)
          fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
          this.saveWorkspace(true)
        }
      }

      if (this.db) {
        ensureSchemaIntegrity(this.db)
        seedTemplates(this.db)
      }

      this.meta = meta
      this.initialHash = this.calculateCurrentHash()
      this.initialDataVersion = this.getDataVersion()
      this.userMutationCount = 0
      this.mutationMap.clear()
      this.lastMutationTime = null
      this.isDirty = false
      this.notifyDirtyChange(false)
      return meta
    } catch (openErr: any) {
      this.releaseFileLock(filePath)
      if (this.db) {
        try {
          this.db.close()
        } catch {}
        this.db = null
      }
      this.currentFilePath = null
      if (this.tempDir && fs.existsSync(this.tempDir)) {
        try {
          fs.rmSync(this.tempDir, { recursive: true, force: true })
        } catch {}
      }
      throw openErr
    }
  }

  public createWorkspace(filePath: string, institutionName: string): WorkspaceMeta {
    const ext = path.extname(filePath).toLowerCase().replace(/^\./, '')
    if (!ext || !allExtensions.includes(ext)) {
      const base = ext ? filePath.substring(0, filePath.length - (ext.length + 1)) : filePath
      filePath = `${base}.${defaultFormat.ext}`
    }
    filePath = path.resolve(filePath)
    this.acquireFileLock(filePath)

    try {
      this.currentFilePath = filePath
      this.ensureTempDir()
      const dbPath = path.join(this.tempDir, 'database.sqlite')
      this.db = new Database(dbPath)
      initializeDatabase(this.db, institutionName)

      try {
        const insertStmt = this.db.prepare(`
          INSERT OR IGNORE INTO TANIM_TasinirKod (tam_kod, hesap_kodu, duzey_1, duzey_2, duzey_3, duzey_4, duzey_5, aciklama)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const seedTx = this.db.transaction((rows: any[]) => {
          for (const row of rows) {
            insertStmt.run(
              row.tam_kod,
              row.hesap_kodu,
              row.duzey_1,
              row.duzey_2,
              row.duzey_3,
              row.duzey_4,
              row.duzey_5,
              row.aciklama
            )
          }
        })
        seedTx(tasinirKodlariSeed)
      } catch {
        /* ignore seed error */
      }

      const meta: WorkspaceMeta = {
        dtal_version: '1.0',
        app_version: app.getVersion(),
        created_at: new Date().toISOString().split('T')[0],
        institution: institutionName,
        schema_version: CURRENT_SCHEMA_VERSION,
        platform: process.platform,
        file_version: 1,
        active_db_file: 'database.sqlite',
        updated_at: new Date().toISOString(),
        project_id: crypto.randomUUID(),
        warnings: []
      }
      meta.integrity_hash = calculateIntegrityHash(meta)
      const metaPath = path.join(this.tempDir, 'meta.json')
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
      fs.mkdirSync(path.join(this.tempDir, 'attachments'))
      seedTemplates(this.db)
      this.saveWorkspace(true)
      this.meta = meta
      this.initialHash = this.calculateCurrentHash()
      this.initialDataVersion = this.getDataVersion()
      this.resetDirty()
      return meta
    } catch (createErr) {
      this.releaseFileLock(filePath)
      this.currentFilePath = null
      throw createErr
    }
  }

  private writeWorkspaceArchive(targetPath: string, isUserSave: boolean = false): void {
    if (!this.db || !this.tempDir) {
      throw new Error('Hiçbir veri dosyası veya geçici dizin açık değil.')
    }

    try {
      this.db.pragma('wal_checkpoint(TRUNCATE)')
    } catch {
      /* ignore checkpoint error */
    }

    const metaPath = path.join(this.tempDir, 'meta.json')
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as WorkspaceMeta
      // ONLY update updated_at and increment data_revision if user has actually mutated data or is explicit user save
      if (this.userMutationCount > 0 || this.isDirtyState() || isUserSave || !meta.updated_at) {
        meta.updated_at = new Date().toISOString()
        if (this.userMutationCount > 0 || this.isDirtyState()) {
          meta.data_revision = (meta.data_revision || 1) + 1
        }
      }
      if (!meta.project_id) {
        meta.project_id = crypto.randomUUID()
      }
      if (meta.data_revision === undefined) {
        meta.data_revision = 1
      }
      meta.app_version = app.getVersion()
      meta.platform = process.platform
      meta.integrity_hash = calculateIntegrityHash(meta)
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
      this.meta = meta
    }

    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      throw new Error(`Hedef dizin bulunamadı: ${targetDir}`)
    }

    const zip = new AdmZip()
    zip.addLocalFolder(this.tempDir)

    // Atomik ve güvenli kaydetme: Önce aynı dizinde geçici bir dosyaya yaz,
    // arşivi bütünlük kontrolünden geçir, ardından atomik değiştirme yap.
    const tempFile = path.join(
      targetDir,
      `.${path.basename(targetPath)}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`
    )

    try {
      zip.writeZip(tempFile)
      if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
        throw new Error('Geçici arşiv dosyası oluşturulamadı veya boş.')
      }

      // Arşiv bütünlüğü doğrulaması
      try {
        const testZip = new AdmZip(tempFile)
        const entries = testZip.getEntries()
        if (!entries || entries.length === 0) {
          throw new Error('Arşiv içeriği boş.')
        }
        const hasMeta = entries.some((e) => e.entryName === 'meta.json')
        const hasDb = entries.some((e) => e.entryName.endsWith('.sqlite'))
        if (!hasMeta || !hasDb) {
          throw new Error('Zorunlu dosyalar (meta.json veya database.sqlite) eksik.')
        }
      } catch (valErr: unknown) {
        const msg = valErr instanceof Error ? valErr.message : String(valErr)
        throw new Error(`Oluşturulan geçici arşiv doğrulanamadı: ${msg}`)
      }

      atomicReplaceWorkspaceFile(tempFile, targetPath, 10, (verifiedPath: string) => {
        // Post-replacement verification: verify destination file actually exists, is non-empty, and is valid zip
        if (!fs.existsSync(verifiedPath) || fs.statSync(verifiedPath).size === 0) {
          throw new Error('Hedef arşiv dosyası oluşturulamadı veya boş.')
        }
        const verifiedZip = new AdmZip(verifiedPath)
        const verifiedEntries = verifiedZip.getEntries()
        if (
          !verifiedEntries.some((e) => e.entryName === 'meta.json') ||
          !verifiedEntries.some((e) => e.entryName.endsWith('.sqlite'))
        ) {
          throw new Error('Oluşturulan hedef arşiv dosyasında zorunlu dosyalar bulunamadı.')
        }
      })
    } catch (saveErr) {
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile)
        } catch {
          /* ignore temp cleanup error */
        }
      }
      throw saveErr
    }
  }

  public saveWorkspace(force: boolean = false): void {
    if (!this.currentFilePath || !this.db) throw new Error('Hiçbir veri dosyası açık değil.')
    if (!force && !this.isDirtyState()) return

    this.writeWorkspaceArchive(this.currentFilePath, force)
    this.initialHash = this.calculateCurrentHash()
    this.resetDirty()
  }

  public saveAs(targetFilePath: string): { success: boolean; newPath?: string; error?: string } {
    if (!this.currentFilePath || !this.db) {
      return { success: false, error: 'Açık bir çalışma alanı yok.' }
    }
    if (!targetFilePath || typeof targetFilePath !== 'string' || !targetFilePath.trim()) {
      return { success: false, error: 'Geçersiz hedef dosya yolu.' }
    }

    targetFilePath = targetFilePath.replace(/^"+|"+$/g, '').trim()
    const ext = path.extname(targetFilePath).toLowerCase().replace(/^\./, '')
    let newPath = targetFilePath
    if (!ext || !allExtensions.includes(ext)) {
      const base = ext
        ? targetFilePath.substring(0, targetFilePath.length - (ext.length + 1))
        : targetFilePath
      newPath = `${base}.${defaultFormat.ext}`
    }
    newPath = path.resolve(newPath)

    const oldPath = this.currentFilePath
    const isSameFile = path.resolve(oldPath).toLowerCase() === newPath.toLowerCase()

    if (isSameFile) {
      try {
        this.saveWorkspace(true)
        return { success: true, newPath }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }

    const targetDir = path.dirname(newPath)
    if (!fs.existsSync(targetDir)) {
      return { success: false, error: `Hedef dizin bulunamadı: ${targetDir}` }
    }

    // 1. Hedef dosya kilidini edin (çakışma kontrolü dahil)
    let newLockAcquired = false
    try {
      this.acquireFileLock(newPath)
      newLockAcquired = true
    } catch (lockErr: any) {
      return {
        success: false,
        error: `Yeni hedef dosya kilitlenemedi: ${lockErr.message}`
      }
    }

    // 2. Yeni dosyaya arşiv yaz ve doğrula (force: true - temiz dosyada dahi yazılır)
    // NOT: currentFilePath değeri ancak yazma ve doğrulama TAMAMEN başarılı olduğunda güncellenir!
    try {
      this.writeWorkspaceArchive(newPath, true)
    } catch (saveErr: any) {
      // Yazma veya doğrulama başarısız olursa: Yeni kilidi temizle, eski yol ve kilit KORUNUR
      if (newLockAcquired) {
        this.releaseFileLock(newPath)
      }
      return {
        success: false,
        error: `Farklı kaydetme işlemi başarısız oldu: ${saveErr.message}`
      }
    }

    // 3. Yazma ve doğrulama başarılı!
    // Eski dosya kilidini serbest bırak
    this.releaseFileLock(oldPath)
    // Aktif çalışma alanı yolunu yeni konuma güncelle
    this.currentFilePath = newPath
    this.initialHash = this.calculateCurrentHash()
    this.resetDirty()

    return { success: true, newPath }
  }

  public closeWorkspace(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
    if (this.currentFilePath) {
      this.releaseFileLock(this.currentFilePath)
    }
    this.currentFilePath = null
    this.meta = null
    if (fs.existsSync(this.tempDir)) fs.rmSync(this.tempDir, { recursive: true, force: true })
  }

  public replaceDatabase(sourceSqlitePath: string): void {
    if (!this.currentFilePath || !this.db || !this.meta)
      throw new Error('Açık bir çalışma alanı yok.')
    this.db.close()
    const newDbName = `database_${Date.now()}.sqlite`
    const dbPath = path.join(this.tempDir, newDbName)
    fs.copyFileSync(sourceSqlitePath, dbPath)
    this.meta.active_db_file = newDbName
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    ensureSchemaIntegrity(this.db)
    this.saveWorkspace()
  }

  public getDb(): Database.Database {
    if (!this.db) throw new Error('Veritabanı bağlı değil.')
    return this.db
  }
  public getDbPath(): string {
    if (!this.tempDir) throw new Error('Geçici dizin yok.')
    return path.join(this.tempDir, this.meta?.active_db_file || 'database.sqlite')
  }
  public getMeta(): WorkspaceMeta | null {
    return this.meta
  }
  public getCurrentFilePath(): string | null {
    return this.currentFilePath
  }

  public calculateCurrentHash(): string {
    if (!this.db || !this.tempDir) return ''
    try {
      try {
        this.db.pragma('wal_checkpoint(TRUNCATE)')
      } catch {}
      const dbPath = path.join(this.tempDir, this.meta?.active_db_file || 'database.sqlite')
      if (!fs.existsSync(dbPath)) return ''
      const content = fs.readFileSync(dbPath)
      const hash = crypto.createHash('sha256').update(content)
      const attachDir = path.join(this.tempDir, 'attachments')
      if (fs.existsSync(attachDir)) {
        for (const f of fs.readdirSync(attachDir).sort()) {
          try {
            const stat = fs.statSync(path.join(attachDir, f))
            hash.update(`${f}:${stat.size}:${stat.mtimeMs}`)
          } catch {}
        }
      }
      return hash.digest('hex')
    } catch {
      return ''
    }
  }

  public getDataVersion(): number {
    if (!this.db) return 0
    try {
      const row = this.db.prepare('PRAGMA data_version').get() as { data_version?: number }
      return row?.data_version ?? 0
    } catch {
      return 0
    }
  }

  public recordMutation(tableName?: string, action?: string, count: number = 1): void {
    if (count <= 0) return
    const table = tableName || 'Veritabanı'
    const tableUpper = table.toUpperCase()
    if (
      [
        'LOG_SYSTEMLOG',
        'SETTINGS',
        'SCHEMA_MIGRATIONS',
        'SQLITE_SEQUENCE',
        'TANIM_SABLON',
        'TANIM_DETSISCACHE',
        'TANIM_TASINIRKOD',
        'TANIM_KIKLIMITLERI'
      ].includes(tableUpper) ||
      tableUpper.startsWith('SYS_') ||
      tableUpper.startsWith('TEMP_')
    ) {
      return
    }
    this.userMutationCount += count
    this.isDirty = true
    const nowIso = new Date().toISOString()
    if (this.meta) {
      this.meta.last_user_mutation_at = nowIso
    }
    this.lastMutationTime = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    const act = (action as 'insert' | 'update' | 'delete' | 'other') || 'other'
    const key = `${table}_${act}`
    const existing = this.mutationMap.get(key)
    if (existing) {
      existing.count += count
      existing.lastTime = this.lastMutationTime
    } else {
      this.mutationMap.set(key, {
        tableName: table,
        title: TABLE_FRIENDLY_NAMES[table] || table,
        action: act,
        actionLabel:
          act === 'insert'
            ? 'Yeni Kayıt Eklendi'
            : act === 'update'
              ? 'Bilgiler Güncellendi'
              : act === 'delete'
                ? 'Kayıt Silindi'
                : 'Veri Düzenlendi',
        count,
        lastTime: this.lastMutationTime
      })
    }
    this.notifyDirtyChange(true)
  }

  public isDirtyState(): boolean {
    return !!(this.db && this.currentFilePath && this.isDirty && this.userMutationCount > 0)
  }

  public resetDirty(): void {
    this.isDirty = false
    this.userMutationCount = 0
    this.mutationMap.clear()
    this.lastMutationTime = null
    this.initialDataVersion = this.getDataVersion()
    this.initialHash = this.calculateCurrentHash()
    this.notifyDirtyChange(false)
  }

  public getDirtySummary() {
    const isDirty = this.isDirtyState()
    const items = Array.from(this.mutationMap.values())
    if (isDirty && items.length === 0) {
      items.push({
        tableName: 'Veritabanı',
        title: 'Çalışma Dosyası Değişiklikleri',
        action: 'other',
        actionLabel: 'Düzenlendi',
        count: Math.max(this.userMutationCount, 1),
        lastTime: this.lastMutationTime || 'Az önce'
      })
    }
    return {
      isDirty,
      totalChanges: isDirty
        ? Math.max(
            this.userMutationCount,
            items.reduce((acc, it) => acc + (it.count || 1), 0),
            1
          )
        : 0,
      lastModifiedAt: this.lastMutationTime,
      items: isDirty ? items : []
    }
  }

  public notifyDirtyChange(dirty: boolean): void {
    try {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send('workspace:dirty-changed', dirty)
          if (this.currentFilePath) {
            win.setTitle(`${dirty ? '● ' : ''}${path.basename(this.currentFilePath)} - TEMİN 360`)
          }
        }
      }
    } catch {}
  }

  public hasChanges(target: 'gdrive' | 'email' | 'any' = 'any'): boolean {
    if (!this.db || !this.currentFilePath) return false
    // Sadece şema bakımı veya okuma amaçlı açılan dosyalarda kullanıcı değişikliği yoksa
    // kapanışta veya arka planda gereksiz yedekleme/yükleme tetiklenmesini engelle.
    if (!this.isDirtyState() && this.userMutationCount === 0) {
      return false
    }
    const current = this.calculateCurrentHash()
    if (!current) return false
    if (target === 'gdrive' || target === 'email') {
      try {
        const key = target === 'gdrive' ? 'lastGdriveSyncHash' : 'lastEmailSyncHash'
        const row = this.db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as {
          value?: string
        }
        if (row?.value) return row.value !== current
      } catch {}
      return true
    }
    if (this.isDirtyState()) return true
    return current !== this.initialHash
  }

  public markSynced(target: 'gdrive' | 'email'): void {
    if (!this.db) return
    const current = this.calculateCurrentHash()
    if (!current) return
    try {
      const key = target === 'gdrive' ? 'lastGdriveSyncHash' : 'lastEmailSyncHash'
      this.db
        .prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
        .run(key, current)
    } catch {}
  }

  public isOpen(): boolean {
    return !!this.db
  }

  private ensureTempDir() {
    if (fs.existsSync(this.tempDir)) fs.rmSync(this.tempDir, { recursive: true, force: true })
    fs.mkdirSync(this.tempDir, { recursive: true })
  }
}
