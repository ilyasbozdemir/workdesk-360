import Database from 'better-sqlite3'
import path from 'path'
import { schema, runMigrations, initializeDatabase } from '@dt/database'

let dbInstance: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance

  const dbPath = path.join(process.cwd(), 'temin360_web.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Get current schema version
  let currentSchemaVer = 0
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get()
    if (tableCheck) {
      const versionRes = db.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as { value: string }
      if (versionRes) {
        currentSchemaVer = parseInt(versionRes.value) || 0
      }
    }
  } catch {
    // settings doesn't exist yet
  }

  if (currentSchemaVer === 0) {
    console.log('Veritabanı sıfırdan kuruluyor...')
    initializeDatabase(db, 'Ankara İl Sağlık Müdürlüğü', '1.0.0-web.1')
  } else {
    // Run migrations if needed
    runMigrations(db, currentSchemaVer, schema)
  }

  // Ensure WorkDesk 360 Ecosystem multi-app sync & statutory process tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS ecosystem_sync_records (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL DEFAULT 'temin-360',
      module_id TEXT,
      record_type TEXT NOT NULL DEFAULT 'dosya',
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ecosystem_sync_app ON ecosystem_sync_records(app_id);

    CREATE TABLE IF NOT EXISTS ecosystem_process_instances (
      id TEXT PRIMARY KEY,
      process_no TEXT NOT NULL,
      title TEXT NOT NULL,
      app_id TEXT NOT NULL DEFAULT 'flowdesk-360',
      module_id TEXT NOT NULL,
      flow_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_step_id TEXT,
      step_data TEXT NOT NULL,
      computed_results TEXT,
      deadline_iso TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ecosystem_proc_module ON ecosystem_process_instances(module_id);
  `)

  dbInstance = db
  return dbInstance
}
