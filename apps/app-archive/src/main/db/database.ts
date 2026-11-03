import Database from 'better-sqlite3'
import { getStoragePaths } from '../paths'
import { FileRecord } from '../../shared/types'

let dbInstance: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance

  const { dbPath } = getStoragePaths()
  const db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      relative_path TEXT NOT NULL,
      name TEXT NOT NULL,
      ext TEXT NOT NULL,
      size INTEGER NOT NULL,
      mtime_ms INTEGER NOT NULL,
      ctime_ms INTEGER NOT NULL,
      sha256 TEXT,
      category TEXT NOT NULL,
      indexed_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_files_ext ON files(ext);
    CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
    CREATE INDEX IF NOT EXISTS idx_files_size ON files(size);
    CREATE INDEX IF NOT EXISTS idx_files_sha256 ON files(sha256);

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      file_hash TEXT,
      tag TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(file_path, tag)
    );

    CREATE INDEX IF NOT EXISTS idx_tags_file_path ON tags(file_path);
    CREATE INDEX IF NOT EXISTS idx_tags_file_hash ON tags(file_hash);
    CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
  `)

  dbInstance = db
  return dbInstance
}

export function detectCategory(ext: string): string {
  const clean = ext.replace(/^\./, '').toLowerCase()
  if (['pdf'].includes(clean)) return 'pdf'
  if (['doc', 'docx', 'rtf', 'odt'].includes(clean)) return 'word'
  if (['xls', 'xlsx', 'csv', 'ods'].includes(clean)) return 'excel'
  if (['ppt', 'pptx', 'odp'].includes(clean)) return 'sunum'
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(clean)) return 'gorsel'
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(clean)) return 'arsiv'
  if (['txt', 'md', 'json', 'xml', 'log'].includes(clean)) return 'metin'
  if (['mp3', 'wav', 'ogg', 'flac'].includes(clean)) return 'ses'
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(clean)) return 'video'
  return 'diger'
}

export function getAllFilesWithTags(): FileRecord[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT 
      f.id,
      f.path,
      f.relative_path as relativePath,
      f.name,
      f.ext,
      f.size,
      f.mtime_ms as mtimeMs,
      f.ctime_ms as ctimeMs,
      f.sha256,
      f.category,
      GROUP_CONCAT(t.tag, '|||') as tagsStr
    FROM files f
    LEFT JOIN tags t ON f.path = t.file_path
    GROUP BY f.id
    ORDER BY f.name COLLATE NOCASE ASC
  `).all() as any[]

  return rows.map((r) => ({
    id: r.id,
    path: r.path,
    relativePath: r.relativePath,
    name: r.name,
    ext: r.ext,
    size: r.size,
    mtimeMs: r.mtimeMs,
    ctimeMs: r.ctimeMs,
    sha256: r.sha256,
    category: r.category,
    tags: r.tagsStr ? r.tagsStr.split('|||') : []
  }))
}

export function upsertFileRecord(file: Omit<FileRecord, 'id' | 'tags'>): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO files (path, relative_path, name, ext, size, mtime_ms, ctime_ms, sha256, category, indexed_at)
    VALUES (@path, @relativePath, @name, @ext, @size, @mtimeMs, @ctimeMs, @sha256, @category, @indexedAt)
    ON CONFLICT(path) DO UPDATE SET
      relative_path = excluded.relative_path,
      name = excluded.name,
      ext = excluded.ext,
      size = excluded.size,
      mtime_ms = excluded.mtime_ms,
      ctime_ms = excluded.ctime_ms,
      category = excluded.category,
      indexed_at = excluded.indexed_at
  `)

  stmt.run({
    ...file,
    indexedAt: Date.now()
  })
}

export function batchUpsertFiles(files: Omit<FileRecord, 'id' | 'tags'>[]): void {
  if (files.length === 0) return
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO files (path, relative_path, name, ext, size, mtime_ms, ctime_ms, sha256, category, indexed_at)
    VALUES (@path, @relativePath, @name, @ext, @size, @mtimeMs, @ctimeMs, @sha256, @category, @indexedAt)
    ON CONFLICT(path) DO UPDATE SET
      relative_path = excluded.relative_path,
      name = excluded.name,
      ext = excluded.ext,
      size = excluded.size,
      mtime_ms = excluded.mtime_ms,
      ctime_ms = excluded.ctime_ms,
      category = excluded.category,
      indexed_at = excluded.indexed_at
  `)

  const now = Date.now()
  const insertMany = db.transaction((items: Omit<FileRecord, 'id' | 'tags'>[]) => {
    for (const item of items) {
      stmt.run({
        ...item,
        indexedAt: now
      })
    }
  })

  insertMany(files)
}

export function removeFileRecord(filePath: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM files WHERE path = ?').run(filePath)
}

export function updateFileHash(filePath: string, sha256: string): void {
  const db = getDatabase()
  db.prepare('UPDATE files SET sha256 = ? WHERE path = ?').run(sha256, filePath)
  // Dosyaya ait etiketlerdeki hash'i de güncelle (ad değişirse hash ile eşleşme için)
  db.prepare('UPDATE tags SET file_hash = ? WHERE file_path = ?').run(sha256, filePath)
}

export function addFileTag(filePath: string, tag: string, sha256?: string | null): void {
  const cleanTag = tag.trim().toLowerCase()
  if (!cleanTag) return
  const db = getDatabase()
  db.prepare(`
    INSERT OR IGNORE INTO tags (file_path, file_hash, tag, created_at)
    VALUES (?, ?, ?, ?)
  `).run(filePath, sha256 || null, cleanTag, Date.now())
}

export function removeFileTag(filePath: string, tag: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM tags WHERE file_path = ? AND tag = ?').run(filePath, tag.trim().toLowerCase())
}

export function getAllTags(): string[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT DISTINCT tag FROM tags ORDER BY tag ASC').all() as { tag: string }[]
  return rows.map((r) => r.tag)
}
