/**
 * <summary>
 * Disk Analiz 360 — SQLite Veri Erişimi, Kalıcı İndeks ve Şema Katmanı (storage).
 * WAL modu, şema sürümleme, artımlı indeks önbelleği, Treemap hiyerarşi sorguları ve
 * denetlenebilir temizlik geçmişi tablolarını yönetir.
 * </summary>
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import {
  AnalysisDashboardSummary,
  CleanupCandidateGroup,
  CleanupHistoryRecord,
  DiskAnalyzerSettings,
  DuplicateGroup,
  DuplicateSummary,
  ExtensionStat,
  FileHashStatus,
  IndexedFileRecord,
  IndexedFolderRecord,
  ScanErrorRecord,
  ScanSessionRecord,
  ScanStatus,
  SizeBucketStat,
  TreemapNodeInput,
  TreemapViewResponse
} from '../../shared/types.js'
import { buildBreadcrumbs, normalizeWinPath } from '../../shared/treemapLayout.js'

const CURRENT_SCHEMA_VERSION = 1

let idSeq = 0
export function createEntityId(prefix: string): string {
  idSeq = (idSeq + 1) % 10000000
  return `${prefix}-${Date.now()}-${idSeq}-${Math.random().toString(36).slice(2, 7)}`
}

export interface PreviousFileMeta {
  sizeBytes: number
  mtimeMs: number
  fileIndex?: string
  fastHash?: string
  sha256?: string
  hashStatus: FileHashStatus
}

const EXTENSION_CATEGORY_LABELS: Record<string, string> = {
  mp4: 'Video & Multimedya',
  mkv: 'Video & Multimedya',
  avi: 'Video & Multimedya',
  mov: 'Video & Multimedya',
  mp3: 'Ses Dosyası',
  wav: 'Ses Dosyası',
  zip: 'Sıkıştırılmış Arşiv',
  rar: 'Sıkıştırılmış Arşiv',
  '7z': 'Sıkıştırılmış Arşiv',
  iso: 'Disk İmajı',
  exe: 'Uygulama & Kurulum',
  msi: 'Uygulama & Kurulum',
  dll: 'Sistem & Kütüphane',
  pdf: 'Belge & Doküman',
  doc: 'Belge & Doküman',
  docx: 'Belge & Doküman',
  xls: 'Tablo & Finans',
  xlsx: 'Tablo & Finans',
  ppt: 'Sunum Dosyası',
  pptx: 'Sunum Dosyası',
  png: 'Görsel & Tasarım',
  jpg: 'Görsel & Tasarım',
  jpeg: 'Görsel & Tasarım',
  webp: 'Görsel & Tasarım',
  log: 'Günlük (Log) Dosyası',
  tmp: 'Geçici Dosya',
  bak: 'Yedek Dosyası',
  db: 'Veritabanı',
  sqlite: 'Veritabanı'
}

/**
 * <summary>
 * Disk Analiz 360 yerel SQLite indeks yöneticisi.
 * Veritabanı sıfırlansa veya silinse dahi kaynak dosyalar hiçbir şekilde etkilenmez.
 * </summary>
 */
export class DiskAnalyzerStorage {
  private db: Database.Database

  constructor(dbPath = ':memory:') {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('foreign_keys = ON')
    this.initSchema()
  }

  public getRawDb(): Database.Database {
    return this.db
  }

  public close(): void {
    this.db.close()
  }

  /**
   * <summary>
   * Veritabanı tablolarını, indekslerini ve şema sürüm kaydını güvenli biçimde oluşturur.
   * </summary>
   */
  private initSchema(): void {
    this.db.exec(`
      -- <summary>Şema sürümü ve migration geçmişi tablosu</summary>
      CREATE TABLE IF NOT EXISTS META_SchemaVersion (
        version INTEGER PRIMARY KEY,
        appliedAt TEXT NOT NULL,
        description TEXT NOT NULL
      );

      -- <summary>Disk tarama oturumları ve ilerleme özetleri tablosu</summary>
      CREATE TABLE IF NOT EXISTS DATA_ScanSession (
        id TEXT PRIMARY KEY,
        rootPath TEXT NOT NULL,
        driveCode TEXT NOT NULL,
        status TEXT NOT NULL,
        startedAt TEXT NOT NULL,
        completedAt TEXT,
        durationMs INTEGER NOT NULL DEFAULT 0,
        totalFiles INTEGER NOT NULL DEFAULT 0,
        totalFolders INTEGER NOT NULL DEFAULT 0,
        totalBytes INTEGER NOT NULL DEFAULT 0,
        skippedCount INTEGER NOT NULL DEFAULT 0,
        errorCount INTEGER NOT NULL DEFAULT 0,
        incrementalReusedCount INTEGER NOT NULL DEFAULT 0
      );

      -- <summary>Dosya metadata, boyut, değiştirilme zamanı ve kademeli hash indeksi tablosu</summary>
      CREATE TABLE IF NOT EXISTS DATA_IndexedFile (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        rootPath TEXT NOT NULL,
        fullPath TEXT NOT NULL UNIQUE,
        parentPath TEXT NOT NULL,
        name TEXT NOT NULL,
        extension TEXT NOT NULL,
        sizeBytes INTEGER NOT NULL,
        mtimeMs INTEGER NOT NULL,
        ctimeMs INTEGER NOT NULL,
        fileIndex TEXT,
        cleanupCategory TEXT NOT NULL DEFAULT 'none',
        fastHash TEXT,
        sha256 TEXT,
        hashStatus TEXT NOT NULL DEFAULT 'none',
        updatedAt TEXT NOT NULL
      );

      -- <summary>Klasör hiyerarşisi, doğrudan ve özyinelemeli (recursive) boyut/öğe sayısı tablosu</summary>
      CREATE TABLE IF NOT EXISTS DATA_IndexedFolder (
        fullPath TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        rootPath TEXT NOT NULL,
        parentPath TEXT NOT NULL,
        name TEXT NOT NULL,
        depth INTEGER NOT NULL DEFAULT 0,
        directFileCount INTEGER NOT NULL DEFAULT 0,
        directFolderCount INTEGER NOT NULL DEFAULT 0,
        recursiveFileCount INTEGER NOT NULL DEFAULT 0,
        recursiveFolderCount INTEGER NOT NULL DEFAULT 0,
        directBytes INTEGER NOT NULL DEFAULT 0,
        recursiveBytes INTEGER NOT NULL DEFAULT 0,
        updatedAt TEXT NOT NULL
      );

      -- <summary>Erişilemeyen dizinler, izin hataları ve atlanan sembolik bağ/junction kayıtları</summary>
      CREATE TABLE IF NOT EXISTS DATA_ScanError (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        targetPath TEXT NOT NULL,
        errorCode TEXT NOT NULL,
        errorMessage TEXT NOT NULL,
        itemType TEXT NOT NULL,
        occurredAt TEXT NOT NULL
      );

      -- <summary>Güvenli temizlik (Çöp Kutusu) işlem geçmişi ve gerçek/tahmini alan kazanımı kayıtları</summary>
      CREATE TABLE IF NOT EXISTS LOG_CleanupHistory (
        id TEXT PRIMARY KEY,
        batchId TEXT NOT NULL,
        filePath TEXT NOT NULL,
        sizeBytes INTEGER NOT NULL,
        method TEXT NOT NULL DEFAULT 'trash',
        status TEXT NOT NULL,
        errorMessage TEXT,
        estimatedSavedBytes INTEGER NOT NULL DEFAULT 0,
        measuredFreeSpaceDeltaBytes INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      -- <summary>Kullanıcı tarama kapsamı ve eşik ayarları tablosu</summary>
      CREATE TABLE IF NOT EXISTS CFG_Settings (
        key TEXT PRIMARY KEY,
        valueJson TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_file_root ON DATA_IndexedFile(rootPath);
      CREATE INDEX IF NOT EXISTS idx_file_parent ON DATA_IndexedFile(parentPath);
      CREATE INDEX IF NOT EXISTS idx_file_size ON DATA_IndexedFile(sizeBytes DESC);
      CREATE INDEX IF NOT EXISTS idx_file_ext ON DATA_IndexedFile(extension);
      CREATE INDEX IF NOT EXISTS idx_file_mtime ON DATA_IndexedFile(mtimeMs ASC);
      CREATE INDEX IF NOT EXISTS idx_file_sha256 ON DATA_IndexedFile(sha256) WHERE sha256 IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_file_cleanup ON DATA_IndexedFile(cleanupCategory) WHERE cleanupCategory != 'none';

      CREATE INDEX IF NOT EXISTS idx_folder_root ON DATA_IndexedFolder(rootPath);
      CREATE INDEX IF NOT EXISTS idx_folder_parent ON DATA_IndexedFolder(parentPath);
      CREATE INDEX IF NOT EXISTS idx_folder_rec_bytes ON DATA_IndexedFolder(recursiveBytes DESC);

      CREATE INDEX IF NOT EXISTS idx_error_session ON DATA_ScanError(sessionId);
      CREATE INDEX IF NOT EXISTS idx_cleanup_batch ON LOG_CleanupHistory(batchId);
    `)

    const existingVer = this.db
      .prepare('SELECT MAX(version) as v FROM META_SchemaVersion')
      .get() as { v: number | null }

    if (!existingVer || !existingVer.v) {
      this.db
        .prepare(
          'INSERT INTO META_SchemaVersion (version, appliedAt, description) VALUES (?, ?, ?)'
        )
        .run(
          CURRENT_SCHEMA_VERSION,
          new Date().toISOString(),
          'Initial Disk Analiz 360 SQLite WAL index and treemap schema'
        )
    }
  }

  // ==========================================================================
  // AYARLAR (CFG_Settings)
  // ==========================================================================

  public getSettings(): DiskAnalyzerSettings {
    const row = this.db
      .prepare('SELECT valueJson FROM CFG_Settings WHERE key = ?')
      .get('analyzer_settings') as { valueJson: string } | undefined

    const defaults: DiskAnalyzerSettings = {
      excludedPaths: [
        'C:\\Windows\\WinSxS',
        'C:\\System Volume Information',
        'C:\\$Recycle.Bin'
      ],
      largeFileThresholdMb: 100,
      oldFileThresholdDays: 180,
      followSymlinks: false
    }

    if (!row) return defaults
    try {
      return { ...defaults, ...JSON.parse(row.valueJson) }
    } catch {
      return defaults
    }
  }

  public updateSettings(partial: Partial<DiskAnalyzerSettings>): DiskAnalyzerSettings {
    const merged = { ...this.getSettings(), ...partial }
    this.db
      .prepare(
        `INSERT INTO CFG_Settings (key, valueJson, updatedAt)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET valueJson = excluded.valueJson, updatedAt = excluded.updatedAt`
      )
      .run('analyzer_settings', JSON.stringify(merged), new Date().toISOString())
    return merged
  }

  // ==========================================================================
  // TARAMA OTURUMLARI (DATA_ScanSession)
  // ==========================================================================

  public createScanSession(rootPath: string, driveCode: string): ScanSessionRecord {
    const normRoot = normalizeWinPath(rootPath)
    const session: ScanSessionRecord = {
      id: createEntityId('scan'),
      rootPath: normRoot,
      driveCode: driveCode || normRoot.slice(0, 2),
      status: 'running',
      startedAt: new Date().toISOString(),
      durationMs: 0,
      totalFiles: 0,
      totalFolders: 0,
      totalBytes: 0,
      skippedCount: 0,
      errorCount: 0,
      incrementalReusedCount: 0
    }

    this.db
      .prepare(
        `INSERT INTO DATA_ScanSession (
          id, rootPath, driveCode, status, startedAt, durationMs,
          totalFiles, totalFolders, totalBytes, skippedCount, errorCount, incrementalReusedCount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        session.id,
        session.rootPath,
        session.driveCode,
        session.status,
        session.startedAt,
        session.durationMs,
        session.totalFiles,
        session.totalFolders,
        session.totalBytes,
        session.skippedCount,
        session.errorCount,
        session.incrementalReusedCount
      )

    return session
  }

  public updateScanSession(
    sessionId: string,
    updates: {
      status: ScanStatus
      completedAt?: string
      durationMs: number
      totalFiles: number
      totalFolders: number
      totalBytes: number
      skippedCount: number
      errorCount: number
      incrementalReusedCount: number
    }
  ): void {
    this.db
      .prepare(
        `UPDATE DATA_ScanSession
         SET status = ?, completedAt = ?, durationMs = ?,
             totalFiles = ?, totalFolders = ?, totalBytes = ?,
             skippedCount = ?, errorCount = ?, incrementalReusedCount = ?
         WHERE id = ?`
      )
      .run(
        updates.status,
        updates.completedAt || null,
        updates.durationMs,
        updates.totalFiles,
        updates.totalFolders,
        updates.totalBytes,
        updates.skippedCount,
        updates.errorCount,
        updates.incrementalReusedCount,
        sessionId
      )
  }

  public getScanSessions(limit = 25): ScanSessionRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM DATA_ScanSession ORDER BY startedAt DESC LIMIT ?')
      .all(limit) as Array<{
      id: string
      rootPath: string
      driveCode: string
      status: ScanStatus
      startedAt: string
      completedAt: string | null
      durationMs: number
      totalFiles: number
      totalFolders: number
      totalBytes: number
      skippedCount: number
      errorCount: number
      incrementalReusedCount: number
    }>

    return rows.map((r) => ({
      ...r,
      completedAt: r.completedAt || undefined
    }))
  }

  public getLatestSessionForRoot(rootPath?: string): ScanSessionRecord | null {
    if (rootPath) {
      const normRoot = normalizeWinPath(rootPath)
      const row = this.db
        .prepare(
          'SELECT * FROM DATA_ScanSession WHERE LOWER(rootPath) = LOWER(?) ORDER BY startedAt DESC LIMIT 1'
        )
        .get(normRoot) as ScanSessionRecord | undefined
      return row || null
    }
    const row = this.db
      .prepare('SELECT * FROM DATA_ScanSession ORDER BY startedAt DESC LIMIT 1')
      .get() as ScanSessionRecord | undefined
    return row || null
  }

  // ==========================================================================
  // ARTIMLI (INCREMENTAL) İNDEKSLEME VE TOPLU YAZMA (BATCH UPSERT)
  // ==========================================================================

  /**
   * <summary>
   * Aynı kök dizin tekrar tarandığında boyutu, değiştirilme zamanı (mtimeMs) ve dosya kimliği (fileIndex)
   * değişmemiş dosyaların önceki hızlı/tam hash değerlerini korumak için mevcut kayıtları getirir.
   * </summary>
   */
  public getExistingFileMetadataMap(rootPath: string): Map<string, PreviousFileMeta> {
    const normRoot = normalizeWinPath(rootPath)
    const rows = this.db
      .prepare(
        `SELECT fullPath, sizeBytes, mtimeMs, fileIndex, fastHash, sha256, hashStatus
         FROM DATA_IndexedFile
         WHERE LOWER(rootPath) = LOWER(?)`
      )
      .all(normRoot) as Array<{
      fullPath: string
      sizeBytes: number
      mtimeMs: number
      fileIndex: string | null
      fastHash: string | null
      sha256: string | null
      hashStatus: FileHashStatus
    }>

    const map = new Map<string, PreviousFileMeta>()
    for (const r of rows) {
      map.set(r.fullPath.toLowerCase(), {
        sizeBytes: r.sizeBytes,
        mtimeMs: r.mtimeMs,
        fileIndex: r.fileIndex || undefined,
        fastHash: r.fastHash || undefined,
        sha256: r.sha256 || undefined,
        hashStatus: r.hashStatus
      })
    }
    return map
  }

  public upsertIndexedFilesBatch(files: IndexedFileRecord[]): void {
    if (files.length === 0) return

    const stmt = this.db.prepare(`
      INSERT INTO DATA_IndexedFile (
        id, sessionId, rootPath, fullPath, parentPath, name, extension,
        sizeBytes, mtimeMs, ctimeMs, fileIndex, cleanupCategory,
        fastHash, sha256, hashStatus, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(fullPath) DO UPDATE SET
        sessionId = excluded.sessionId,
        rootPath = excluded.rootPath,
        parentPath = excluded.parentPath,
        name = excluded.name,
        extension = excluded.extension,
        sizeBytes = excluded.sizeBytes,
        mtimeMs = excluded.mtimeMs,
        ctimeMs = excluded.ctimeMs,
        fileIndex = excluded.fileIndex,
        cleanupCategory = excluded.cleanupCategory,
        fastHash = excluded.fastHash,
        sha256 = excluded.sha256,
        hashStatus = excluded.hashStatus,
        updatedAt = excluded.updatedAt
    `)

    const tx = this.db.transaction((batch: IndexedFileRecord[]) => {
      for (const f of batch) {
        stmt.run(
          f.id,
          f.sessionId,
          f.rootPath,
          f.fullPath,
          f.parentPath,
          f.name,
          f.extension,
          f.sizeBytes,
          f.mtimeMs,
          f.ctimeMs,
          f.fileIndex || null,
          f.cleanupCategory,
          f.fastHash || null,
          f.sha256 || null,
          f.hashStatus,
          f.updatedAt
        )
      }
    })

    tx(files)
  }

  public upsertIndexedFoldersBatch(folders: IndexedFolderRecord[]): void {
    if (folders.length === 0) return

    const stmt = this.db.prepare(`
      INSERT INTO DATA_IndexedFolder (
        fullPath, sessionId, rootPath, parentPath, name, depth,
        directFileCount, directFolderCount, recursiveFileCount, recursiveFolderCount,
        directBytes, recursiveBytes, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(fullPath) DO UPDATE SET
        sessionId = excluded.sessionId,
        rootPath = excluded.rootPath,
        parentPath = excluded.parentPath,
        name = excluded.name,
        depth = excluded.depth,
        directFileCount = excluded.directFileCount,
        directFolderCount = excluded.directFolderCount,
        recursiveFileCount = excluded.recursiveFileCount,
        recursiveFolderCount = excluded.recursiveFolderCount,
        directBytes = excluded.directBytes,
        recursiveBytes = excluded.recursiveBytes,
        updatedAt = excluded.updatedAt
    `)

    const tx = this.db.transaction((batch: IndexedFolderRecord[]) => {
      for (const fld of batch) {
        stmt.run(
          fld.fullPath,
          fld.sessionId,
          fld.rootPath,
          fld.parentPath,
          fld.name,
          fld.depth,
          fld.directFileCount,
          fld.directFolderCount,
          fld.recursiveFileCount,
          fld.recursiveFolderCount,
          fld.directBytes,
          fld.recursiveBytes,
          fld.updatedAt
        )
      }
    })

    tx(folders)
  }

  public insertScanErrorsBatch(errors: ScanErrorRecord[]): void {
    if (errors.length === 0) return

    const stmt = this.db.prepare(`
      INSERT INTO DATA_ScanError (
        id, sessionId, targetPath, errorCode, errorMessage, itemType, occurredAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = this.db.transaction((batch: ScanErrorRecord[]) => {
      for (const e of batch) {
        stmt.run(
          e.id,
          e.sessionId,
          e.targetPath,
          e.errorCode,
          e.errorMessage,
          e.itemType,
          e.occurredAt
        )
      }
    })

    tx(errors)
  }

  /**
   * <summary>
   * Tamamlanan bir tarama sonrasında diskten silinmiş eski dosya/klasör kayıtlarını temizler.
   * Tarama iptal edildiyse (cancelled) ÇAĞRILMAZ; böylece kısmi ilerleme korunur.
   * </summary>
   */
  public pruneStaleEntriesAfterCompletedScan(rootPath: string, completedSessionId: string): void {
    const normRoot = normalizeWinPath(rootPath)
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          'DELETE FROM DATA_IndexedFile WHERE LOWER(rootPath) = LOWER(?) AND sessionId != ?'
        )
        .run(normRoot, completedSessionId)
      this.db
        .prepare(
          'DELETE FROM DATA_IndexedFolder WHERE LOWER(rootPath) = LOWER(?) AND sessionId != ?'
        )
        .run(normRoot, completedSessionId)
    })
    tx()
  }

  // ==========================================================================
  // ANALİZ RAPORLARI VE SORGULAR
  // ==========================================================================

  public getLargestFiles(rootPath?: string, limit = 50): IndexedFileRecord[] {
    if (rootPath) {
      const normRoot = normalizeWinPath(rootPath)
      return this.db
        .prepare(
          `SELECT * FROM DATA_IndexedFile
           WHERE LOWER(rootPath) = LOWER(?)
           ORDER BY sizeBytes DESC, name ASC
           LIMIT ?`
        )
        .all(normRoot, limit) as IndexedFileRecord[]
    }
    return this.db
      .prepare('SELECT * FROM DATA_IndexedFile ORDER BY sizeBytes DESC, name ASC LIMIT ?')
      .all(limit) as IndexedFileRecord[]
  }

  public getTopFolders(rootPath?: string, limit = 30): IndexedFolderRecord[] {
    if (rootPath) {
      const normRoot = normalizeWinPath(rootPath)
      return this.db
        .prepare(
          `SELECT * FROM DATA_IndexedFolder
           WHERE LOWER(rootPath) = LOWER(?) AND LOWER(fullPath) != LOWER(?)
           ORDER BY recursiveBytes DESC, name ASC
           LIMIT ?`
        )
        .all(normRoot, normRoot, limit) as IndexedFolderRecord[]
    }
    return this.db
      .prepare(
        'SELECT * FROM DATA_IndexedFolder WHERE depth > 0 ORDER BY recursiveBytes DESC, name ASC LIMIT ?'
      )
      .all(limit) as IndexedFolderRecord[]
  }

  public getOldestFiles(rootPath?: string, limit = 50): IndexedFileRecord[] {
    if (rootPath) {
      const normRoot = normalizeWinPath(rootPath)
      return this.db
        .prepare(
          `SELECT * FROM DATA_IndexedFile
           WHERE LOWER(rootPath) = LOWER(?)
           ORDER BY mtimeMs ASC, sizeBytes DESC
           LIMIT ?`
        )
        .all(normRoot, limit) as IndexedFileRecord[]
    }
    return this.db
      .prepare('SELECT * FROM DATA_IndexedFile ORDER BY mtimeMs ASC, sizeBytes DESC LIMIT ?')
      .all(limit) as IndexedFileRecord[]
  }

  public getExtensionStats(rootPath?: string, limit = 20): ExtensionStat[] {
    const whereClause = rootPath ? 'WHERE LOWER(rootPath) = LOWER(?)' : ''
    const params: unknown[] = rootPath ? [normalizeWinPath(rootPath)] : []

    const totalRow = this.db
      .prepare(`SELECT COALESCE(SUM(sizeBytes), 0) as total FROM DATA_IndexedFile ${whereClause}`)
      .get(...params) as { total: number }
    const grandTotal = totalRow.total || 0

    const rows = this.db
      .prepare(
        `SELECT extension, COUNT(*) as fileCount, COALESCE(SUM(sizeBytes), 0) as totalBytes
         FROM DATA_IndexedFile
         ${whereClause}
         GROUP BY extension
         ORDER BY totalBytes DESC
         LIMIT ?`
      )
      .all(...params, limit) as Array<{
      extension: string
      fileCount: number
      totalBytes: number
    }>

    return rows.map((r) => {
      const cleanExt = r.extension.replace(/^\./, '').toLowerCase()
      const categoryLabel =
        r.extension === '(uzantısız)'
          ? 'Uzantısız Dosya'
          : EXTENSION_CATEGORY_LABELS[cleanExt] || 'Diğer Dosya Türü'

      return {
        extension: r.extension,
        categoryLabel,
        fileCount: r.fileCount,
        totalBytes: r.totalBytes,
        percentage: grandTotal > 0 ? Math.round((r.totalBytes / grandTotal) * 1000) / 10 : 0
      }
    })
  }

  public getSizeBuckets(rootPath?: string): SizeBucketStat[] {
    const whereClause = rootPath ? 'WHERE LOWER(rootPath) = LOWER(?)' : ''
    const params: unknown[] = rootPath ? [normalizeWinPath(rootPath)] : []

    const MB = 1024 * 1024
    const GB = 1024 * MB

    const buckets = [
      { id: 'huge_1gb', label: 'Dev Dosyalar (> 1 GB)', min: GB, max: null },
      { id: 'large_100mb', label: 'Büyük Dosyalar (100 MB - 1 GB)', min: 100 * MB, max: GB },
      { id: 'medium_10mb', label: 'Orta Dosyalar (10 MB - 100 MB)', min: 10 * MB, max: 100 * MB },
      { id: 'small_1mb', label: 'Küçük Dosyalar (1 MB - 10 MB)', min: MB, max: 10 * MB },
      { id: 'tiny_sub1mb', label: 'Çok Küçük (< 1 MB)', min: 0, max: MB }
    ]

    return buckets.map((b) => {
      let cond = `sizeBytes >= ${b.min}`
      if (b.max !== null) {
        cond += ` AND sizeBytes < ${b.max}`
      }
      const fullWhere = whereClause ? `${whereClause} AND ${cond}` : `WHERE ${cond}`
      const row = this.db
        .prepare(
          `SELECT COUNT(*) as c, COALESCE(SUM(sizeBytes), 0) as s FROM DATA_IndexedFile ${fullWhere}`
        )
        .get(...params) as { c: number; s: number }

      return {
        bucketId: b.id,
        label: b.label,
        minBytes: b.min,
        maxBytes: b.max,
        fileCount: row.c,
        totalBytes: row.s
      }
    })
  }

  public getScanErrors(sessionId?: string, limit = 100): ScanErrorRecord[] {
    if (sessionId) {
      return this.db
        .prepare(
          'SELECT * FROM DATA_ScanError WHERE sessionId = ? ORDER BY occurredAt DESC LIMIT ?'
        )
        .all(sessionId, limit) as ScanErrorRecord[]
    }
    return this.db
      .prepare('SELECT * FROM DATA_ScanError ORDER BY occurredAt DESC LIMIT ?')
      .all(limit) as ScanErrorRecord[]
  }

  public getAnalysisDashboardSummary(rootPath?: string): AnalysisDashboardSummary {
    const session = this.getLatestSessionForRoot(rootPath)
    const effectiveRoot = session?.rootPath || rootPath

    return {
      session,
      topFolders: this.getTopFolders(effectiveRoot, 25),
      largestFiles: this.getLargestFiles(effectiveRoot, 50),
      oldestFiles: this.getOldestFiles(effectiveRoot, 40),
      extensionStats: this.getExtensionStats(effectiveRoot, 20),
      sizeBuckets: this.getSizeBuckets(effectiveRoot),
      recentErrors: this.getScanErrors(session?.id, 50)
    }
  }

  public searchFiles(params: {
    rootPath?: string
    parentPath?: string
    query?: string
    extension?: string
    minSizeBytes?: number
    sortBy?: 'size_desc' | 'size_asc' | 'name_asc' | 'mtime_asc' | 'mtime_desc'
    limit?: number
  }): IndexedFileRecord[] {
    const clauses: string[] = ['1=1']
    const args: unknown[] = []

    if (params.rootPath) {
      clauses.push('LOWER(rootPath) = LOWER(?)')
      args.push(normalizeWinPath(params.rootPath))
    }

    if (params.parentPath) {
      clauses.push('LOWER(parentPath) = LOWER(?)')
      args.push(normalizeWinPath(params.parentPath))
    }

    if (params.query?.trim()) {
      clauses.push('(LOWER(name) LIKE LOWER(?) OR LOWER(fullPath) LIKE LOWER(?))')
      const term = `%${params.query.trim()}%`
      args.push(term, term)
    }

    if (params.extension && params.extension !== 'all') {
      clauses.push('LOWER(extension) = LOWER(?)')
      args.push(params.extension)
    }

    if (params.minSizeBytes && params.minSizeBytes > 0) {
      clauses.push('sizeBytes >= ?')
      args.push(params.minSizeBytes)
    }

    let orderBy = 'sizeBytes DESC, name ASC'
    if (params.sortBy === 'size_asc') orderBy = 'sizeBytes ASC, name ASC'
    else if (params.sortBy === 'name_asc') orderBy = 'name ASC'
    else if (params.sortBy === 'mtime_asc') orderBy = 'mtimeMs ASC'
    else if (params.sortBy === 'mtime_desc') orderBy = 'mtimeMs DESC'

    const limit = Math.min(500, Math.max(1, params.limit || 150))

    return this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE ${clauses.join(' AND ')}
         ORDER BY ${orderBy}
         LIMIT ?`
      )
      .all(...args, limit) as IndexedFileRecord[]
  }

  // ==========================================================================
  // ETKİLEŞİMLİ TREEMAP VE RECURSIVE KLASÖR GEZİNME (getTreemapView)
  // ==========================================================================

  /**
   * <summary>
   * Seçili klasörün (örn: C:\ -> C:\Users -> C:\Users\AppData) doğrudan alt klasörlerini ve
   * doğrudan dosyalarını SQLite indeksinden getirir. Diski yeniden taramaz.
   * Ayrıca klasörün disk üzerinde silinip silinmediğini kontrol ederek bayat indeks uyarısı üretir.
   * </summary>
   */
  public getTreemapView(rootPath: string, folderPath?: string): TreemapViewResponse {
    const normRoot = normalizeWinPath(rootPath)
    const normTarget = normalizeWinPath(folderPath || normRoot)

    const currentFolder =
      (this.db
        .prepare('SELECT * FROM DATA_IndexedFolder WHERE LOWER(fullPath) = LOWER(?)')
        .get(normTarget) as IndexedFolderRecord | undefined) || null

    const childrenFolders = this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFolder
         WHERE LOWER(parentPath) = LOWER(?) AND LOWER(fullPath) != LOWER(?)
         ORDER BY recursiveBytes DESC, name ASC`
      )
      .all(normTarget, normTarget) as IndexedFolderRecord[]

    const childrenFiles = this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE LOWER(parentPath) = LOWER(?)
         ORDER BY sizeBytes DESC, name ASC`
      )
      .all(normTarget) as IndexedFileRecord[]

    let isIndexStale = false
    let staleReason: string | undefined

    if (currentFolder) {
      try {
        const stat = fs.statSync(normTarget)
        if (!stat.isDirectory()) {
          isIndexStale = true
          staleReason = 'Hedef konum artık bir klasör değil.'
        }
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException)?.code
        if (code === 'ENOENT') {
          isIndexStale = true
          staleReason = 'Bu klasör taramadan sonra taşınmış veya silinmiş.'
        }
      }
    }

    const treemapNodes: TreemapNodeInput[] = [
      ...childrenFolders.map((fld) => ({
        id: `folder:${fld.fullPath}`,
        name: fld.name,
        fullPath: fld.fullPath,
        parentPath: fld.parentPath,
        kind: 'folder' as const,
        sizeBytes: fld.recursiveBytes,
        fileCount: fld.recursiveFileCount,
        folderCount: fld.recursiveFolderCount
      })),
      ...childrenFiles.map((fl) => ({
        id: `file:${fl.fullPath}`,
        name: fl.name,
        fullPath: fl.fullPath,
        parentPath: fl.parentPath,
        kind: 'file' as const,
        sizeBytes: fl.sizeBytes,
        extension: fl.extension,
        mtimeMs: fl.mtimeMs,
        fileCount: 1,
        folderCount: 0
      }))
    ]

    return {
      currentFolder,
      breadcrumbs: buildBreadcrumbs(normRoot, normTarget),
      childrenFolders,
      childrenFiles,
      treemapNodes,
      isIndexStale,
      staleReason
    }
  }

  // ==========================================================================
  // MÜKERRER DOSYA ADAY VE DOĞRULAMA SORGULARI
  // ==========================================================================

  /**
   * <summary>
   * 1. Aşama: Yalnızca boyutu > 0 olan ve aynı boyutta en az 2 dosya bulunan adayları getirir.
   * Tekil boyuttaki dosyalar bu sorgudan dönmez ve hiçbir zaman hash işlemine girmez.
   * </summary>
   */
  public getSameSizeCandidates(rootPath?: string): IndexedFileRecord[] {
    const whereRoot = rootPath ? 'AND LOWER(rootPath) = LOWER(?)' : ''
    const args: unknown[] = rootPath ? [normalizeWinPath(rootPath)] : []

    return this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE sizeBytes > 0 ${whereRoot}
           AND sizeBytes IN (
             SELECT sizeBytes
             FROM DATA_IndexedFile
             WHERE sizeBytes > 0 ${whereRoot}
             GROUP BY sizeBytes
             HAVING COUNT(*) >= 2
           )
         ORDER BY sizeBytes DESC, fullPath ASC`
      )
      .all(...args, ...args) as IndexedFileRecord[]
  }

  public updateFileHashesBatch(
    updates: Array<{
      fullPath: string
      fastHash?: string
      sha256?: string
      hashStatus: FileHashStatus
    }>
  ): void {
    if (updates.length === 0) return

    const stmt = this.db.prepare(`
      UPDATE DATA_IndexedFile
      SET fastHash = COALESCE(?, fastHash),
          sha256 = COALESCE(?, sha256),
          hashStatus = ?,
          cleanupCategory = CASE WHEN ? = 'verified_sha256' THEN 'duplicate' ELSE cleanupCategory END,
          updatedAt = ?
      WHERE fullPath = ?
    `)

    const now = new Date().toISOString()
    const tx = this.db.transaction((items: typeof updates) => {
      for (const u of items) {
        stmt.run(
          u.fastHash || null,
          u.sha256 || null,
          u.hashStatus,
          u.hashStatus,
          now,
          u.fullPath
        )
      }
    })

    tx(updates)
  }

  /**
   * <summary>
   * Yalnızca hem boyutu (sizeBytes) hem de tam SHA-256 özeti doğrulanmış mükerrer grupları döndürür.
   * Kazanılabilir alan: (N - 1) * sizeBytes (en az 1 kopyanın korunacağı varsayımıyla).
   * </summary>
   */
  public getVerifiedDuplicates(rootPath?: string): DuplicateSummary {
    const whereRoot = rootPath ? 'AND LOWER(rootPath) = LOWER(?)' : ''
    const args: unknown[] = rootPath ? [normalizeWinPath(rootPath)] : []

    const groupRows = this.db
      .prepare(
        `SELECT sha256, sizeBytes, COUNT(*) as cnt
         FROM DATA_IndexedFile
         WHERE sizeBytes > 0
           AND sha256 IS NOT NULL
           AND hashStatus = 'verified_sha256'
           ${whereRoot}
         GROUP BY sha256, sizeBytes
         HAVING COUNT(*) >= 2
         ORDER BY (COUNT(*) - 1) * sizeBytes DESC`
      )
      .all(...args) as Array<{ sha256: string; sizeBytes: number; cnt: number }>

    const groups: DuplicateGroup[] = []
    let totalDuplicateFiles = 0
    let totalRecoverableBytes = 0

    const memberStmt = this.db.prepare(`
      SELECT id, fullPath, parentPath, name, extension, sizeBytes, mtimeMs, ctimeMs, sha256, hashStatus
      FROM DATA_IndexedFile
      WHERE sha256 = ? AND sizeBytes = ? ${whereRoot}
      ORDER BY mtimeMs ASC, fullPath ASC
    `)

    for (const grp of groupRows) {
      const files = memberStmt.all(grp.sha256, grp.sizeBytes, ...args) as Array<{
        id: string
        fullPath: string
        parentPath: string
        name: string
        extension: string
        sizeBytes: number
        mtimeMs: number
        ctimeMs: number
        sha256: string
        hashStatus: FileHashStatus
      }>

      if (files.length < 2) continue

      const totalGroupBytes = files.length * grp.sizeBytes
      const maxRecoverableBytes = (files.length - 1) * grp.sizeBytes

      totalDuplicateFiles += files.length
      totalRecoverableBytes += maxRecoverableBytes

      groups.push({
        groupKey: `${grp.sha256}:${grp.sizeBytes}`,
        sha256: grp.sha256,
        sizeBytes: grp.sizeBytes,
        fileCount: files.length,
        totalGroupBytes,
        maxRecoverableBytes,
        files
      })
    }

    return {
      totalGroups: groups.length,
      totalDuplicateFiles,
      totalRecoverableBytes,
      groups
    }
  }

  // ==========================================================================
  // TEMİZLİK ÖNERİLERİ VE GEÇMİŞİ
  // ==========================================================================

  public getCleanupCandidateGroups(rootPath?: string): CleanupCandidateGroup[] {
    const whereRoot = rootPath ? 'AND LOWER(rootPath) = LOWER(?)' : ''
    const args: unknown[] = rootPath ? [normalizeWinPath(rootPath)] : []

    const settings = this.getSettings()
    const largeBytes = settings.largeFileThresholdMb * 1024 * 1024
    const oldCutoffMs = Date.now() - settings.oldFileThresholdDays * 24 * 60 * 60 * 1000

    const tempFiles = this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE cleanupCategory = 'temp_file' ${whereRoot}
         ORDER BY sizeBytes DESC LIMIT 100`
      )
      .all(...args) as IndexedFileRecord[]

    const oldLogs = this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE cleanupCategory = 'old_log' ${whereRoot}
         ORDER BY sizeBytes DESC LIMIT 100`
      )
      .all(...args) as IndexedFileRecord[]

    const oldDownloads = this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE cleanupCategory = 'old_download' ${whereRoot}
         ORDER BY sizeBytes DESC LIMIT 100`
      )
      .all(...args) as IndexedFileRecord[]

    const largeFiles = this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE sizeBytes >= ? ${whereRoot}
         ORDER BY sizeBytes DESC LIMIT 100`
      )
      .all(largeBytes, ...args) as IndexedFileRecord[]

    const staleFiles = this.db
      .prepare(
        `SELECT * FROM DATA_IndexedFile
         WHERE mtimeMs > 0 AND mtimeMs <= ? ${whereRoot}
         ORDER BY sizeBytes DESC LIMIT 100`
      )
      .all(oldCutoffMs, ...args) as IndexedFileRecord[]

    const sumBytes = (list: IndexedFileRecord[]): number =>
      list.reduce((acc, item) => acc + item.sizeBytes, 0)

    return [
      {
        category: 'temp_file',
        title: 'Geçici Dosyalar (.tmp, .temp, .cache)',
        description: 'Uygulamaların oluşturduğu geçici çalışma dosyaları.',
        riskLevel: 'low',
        guidanceNote: 'Açık bir uygulamaya ait olmayan eski geçici dosyalar güvenle Geri Dönüşüm Kutusu’na taşınabilir.',
        fileCount: tempFiles.length,
        estimatedBytes: sumBytes(tempFiles),
        items: tempFiles
      },
      {
        category: 'old_log',
        title: 'Eski Uygulama Günlükleri (.log)',
        description: '30 günden eski uygulama günlük ve hata dökümü dosyaları.',
        riskLevel: 'low',
        guidanceNote: 'Tarihsel hata incelemesi gerekmiyorsa Geri Dönüşüm Kutusu’na taşınabilir.',
        fileCount: oldLogs.length,
        estimatedBytes: sumBytes(oldLogs),
        items: oldLogs
      },
      {
        category: 'old_download',
        title: 'İndirilenler Klasöründeki Eski Dosyalar',
        description: 'İndirilenler (Downloads) dizininde uzun süredir bekleyen kurulum ve arşiv paketleri.',
        riskLevel: 'medium',
        guidanceNote: 'Kurulumunu tamamladığınız .exe/.msi/.zip dosyalarını kontrol ederek seçebilirsiniz.',
        fileCount: oldDownloads.length,
        estimatedBytes: sumBytes(oldDownloads),
        items: oldDownloads
      },
      {
        category: 'large_file',
        title: `Büyük Dosyalar (≥ ${settings.largeFileThresholdMb} MB)`,
        description: 'Diskte en yüksek alanı kaplayan medya, yedek ve arşiv dosyaları.',
        riskLevel: 'review_required',
        guidanceNote: 'Bir dosyanın büyük olması gereksiz olduğu anlamına gelmez. Silmeden önce içeriğini doğrulayın.',
        fileCount: largeFiles.length,
        estimatedBytes: sumBytes(largeFiles),
        items: largeFiles
      },
      {
        category: 'user_selected',
        title: `Uzun Süredir Değişmeyen Dosyalar (≥ ${settings.oldFileThresholdDays} Gün)`,
        description: 'Son değiştirilme tarihi eski olan dosyalar.',
        riskLevel: 'review_required',
        guidanceNote: 'Arşiv belgeleri veya nadir kullanılan proje dosyaları olabilir; dikkatle inceleyin.',
        fileCount: staleFiles.length,
        estimatedBytes: sumBytes(staleFiles),
        items: staleFiles
      }
    ]
  }

  public recordCleanupHistoryItem(record: Omit<CleanupHistoryRecord, 'id'>): CleanupHistoryRecord {
    const full: CleanupHistoryRecord = {
      id: createEntityId('cln'),
      ...record
    }

    this.db
      .prepare(
        `INSERT INTO LOG_CleanupHistory (
          id, batchId, filePath, sizeBytes, method, status,
          errorMessage, estimatedSavedBytes, measuredFreeSpaceDeltaBytes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        full.id,
        full.batchId,
        full.filePath,
        full.sizeBytes,
        full.method,
        full.status,
        full.errorMessage || null,
        full.estimatedSavedBytes,
        full.measuredFreeSpaceDeltaBytes,
        full.createdAt
      )

    return full
  }

  public getCleanupHistory(limit = 100): CleanupHistoryRecord[] {
    return this.db
      .prepare('SELECT * FROM LOG_CleanupHistory ORDER BY createdAt DESC LIMIT ?')
      .all(limit) as CleanupHistoryRecord[]
  }

  public removeFileFromIndex(fullPath: string): void {
    const norm = normalizeWinPath(fullPath)
    const fileRow = this.db
      .prepare('SELECT * FROM DATA_IndexedFile WHERE LOWER(fullPath) = LOWER(?)')
      .get(norm) as IndexedFileRecord | undefined

    if (!fileRow) return

    const tx = this.db.transaction(() => {
      this.db
        .prepare('DELETE FROM DATA_IndexedFile WHERE id = ?')
        .run(fileRow.id)

      // Üst klasörlerin boyutunu güncelle
      let currentParent = normalizeWinPath(fileRow.parentPath)
      const normRoot = normalizeWinPath(fileRow.rootPath)
      let isDirectParent = true

      while (currentParent && currentParent.toLowerCase().startsWith(normRoot.toLowerCase())) {
        if (isDirectParent) {
          this.db
            .prepare(
              `UPDATE DATA_IndexedFolder
               SET directFileCount = MAX(0, directFileCount - 1),
                   directBytes = MAX(0, directBytes - ?),
                   recursiveFileCount = MAX(0, recursiveFileCount - 1),
                   recursiveBytes = MAX(0, recursiveBytes - ?)
               WHERE LOWER(fullPath) = LOWER(?)`
            )
            .run(fileRow.sizeBytes, fileRow.sizeBytes, currentParent)
          isDirectParent = false
        } else {
          this.db
            .prepare(
              `UPDATE DATA_IndexedFolder
               SET recursiveFileCount = MAX(0, recursiveFileCount - 1),
                   recursiveBytes = MAX(0, recursiveBytes - ?)
               WHERE LOWER(fullPath) = LOWER(?)`
            )
            .run(fileRow.sizeBytes, currentParent)
        }

        if (currentParent.toLowerCase() === normRoot.toLowerCase()) break
        const nextParent = normalizeWinPath(path.win32.dirname(currentParent))
        if (nextParent.toLowerCase() === currentParent.toLowerCase()) break
        currentParent = nextParent
      }
    })

    tx()
  }
}
