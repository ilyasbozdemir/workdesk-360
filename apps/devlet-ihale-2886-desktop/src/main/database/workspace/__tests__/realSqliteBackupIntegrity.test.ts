// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import AdmZip from 'adm-zip'
import Database from 'better-sqlite3'

// NOTE: We deliberately do NOT mock better-sqlite3 here!
// This integration test suite validates verifyAndRestoreBackupBuffer
// and PRAGMA quick_check against the REAL, native better-sqlite3 C++ engine.

// Mock Electron modules
vi.mock('electron', () => ({
  shell: {
    openPath: vi.fn().mockResolvedValue('')
  },
  app: {
    getPath: vi.fn().mockReturnValue(os.tmpdir()),
    getAppPath: vi.fn().mockReturnValue(os.tmpdir()),
    getVersion: vi.fn().mockReturnValue('1.0.0-test')
  },
  BrowserWindow: vi.fn()
}))

import { verifyAndRestoreBackupBuffer } from '../../../ipc/workspace/gdrive.ipc'
import type { BackupManifest } from '../../../../shared/types/backupManifest'

// Check whether the native C++ better-sqlite3 addon can be instantiated in the current Node runtime.
// Under Electron runtime (ELECTRON_RUN_AS_NODE=1 / pnpm test:electron), this evaluates to true.
let isNativeSqliteAvailable = false
try {
  const probe = new Database(':memory:')
  probe.close()
  isNativeSqliteAvailable = true
} catch {
  isNativeSqliteAvailable = false
}

describe.skipIf(!isNativeSqliteAvailable)(
  'Gerçek SQLite Motoru (better-sqlite3) ile Bütünlük ve Geri Yükleme Doğrulaması',
  () => {
    let testDir: string

    beforeEach(() => {
      testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-real-sqlite-test-'))
    })

    afterEach(() => {
      try {
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true })
        }
      } catch {
        /* ignore cleanup */
      }
    })

    /**
     * Helper to create a REAL, valid SQLite database on disk using native better-sqlite3.
     */
    function createRealSqliteFile(dbFilePath: string): void {
      const db = new Database(dbFilePath)
      try {
        db.exec(`
        CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT);
        INSERT INTO settings VALUES ('dbSchemaVersion', '45');
        INSERT INTO settings VALUES ('institutionName', 'Gerçek Test Kurumu');

        CREATE TABLE DATA_TeminDosyasi (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          temin_no TEXT,
          konu TEXT,
          butce_yili INTEGER
        );
        INSERT INTO DATA_TeminDosyasi (temin_no, konu, butce_yili)
        VALUES ('2026/01', 'Gerçek SQLite Donanım Temini', 2026);
      `)
        // Ensure write-ahead log or journal is checkpointed and clean
        db.pragma('wal_checkpoint(FULL)')
      } finally {
        db.close()
      }
    }

    /**
     * Helper to build a real .ihale2886 archive buffer containing meta.json and a real SQLite file.
     */
    function buildRealArchiveBuffer(sqliteBuffer: Buffer): Buffer {
      const zip = new AdmZip()
      const meta = {
        dtal_version: '1.0',
        schema_version: 45,
        institution: 'Gerçek Test Kurumu',
        created_at: '2026-10-19',
        project_id: 'e116a21b-93b2-24fb-b406-6bb8da9e78cf',
        active_db_file: 'database.sqlite',
        data_revision: 1
      }
      zip.addFile('meta.json', Buffer.from(JSON.stringify(meta, null, 2), 'utf-8'))
      zip.addFile('database.sqlite', sqliteBuffer)
      // Add extra padding bytes to ensure buffer exceeds the 512-byte header check
      zip.addFile('padding.bin', crypto.randomBytes(2048))
      return zip.toBuffer()
    }

    function createManifest(buffer: Buffer): BackupManifest {
      return {
        manifestVersion: 1,
        backupId: 'backup-real-sqlite-uuid',
        projectId: 'project-real-sqlite-uuid',
        fileName: 'real_backup.ihale2886',
        driveFileId: 'gdrive-real-file-id',
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        fileSize: buffer.length,
        createdAt: new Date().toISOString(),
        dataRevision: 1,
        parentBackupId: null,
        appVersion: '1.0.0-test',
        deviceId: 'device-real-test'
      }
    }

    it('gerçek better-sqlite3 motoru ile geçerli veritabanını doğrular ve başarıyla geri yükler', () => {
      const realDbPath = path.join(testDir, 'source.sqlite')
      createRealSqliteFile(realDbPath)
      const validDbBytes = fs.readFileSync(realDbPath)

      const validArchiveBuffer = buildRealArchiveBuffer(validDbBytes)
      const manifest = createManifest(validArchiveBuffer)
      const targetFile = path.join(testDir, 'hedef_proje.ihale2886')

      const result = verifyAndRestoreBackupBuffer(validArchiveBuffer, {
        fileName: 'hedef_proje.ihale2886',
        destinationPath: targetFile,
        targetManifest: manifest
      })

      expect(result.success).toBe(true)
      expect(result.verifiedSha256).toBe(true)
      expect(result.verifiedSize).toBe(true)
      expect(fs.existsSync(targetFile)).toBe(true)

      // Unpack restored file and verify with real SQLite engine that it opens cleanly
      const restoredZip = new AdmZip(targetFile)
      const restoredDbData = restoredZip.readFile('database.sqlite')
      expect(restoredDbData).toBeDefined()

      const verifyDbPath = path.join(testDir, 'restored_verify.sqlite')
      fs.writeFileSync(verifyDbPath, restoredDbData!)

      const verifyDb = new Database(verifyDbPath, { readonly: true })
      try {
        const checkRow = verifyDb.prepare('PRAGMA quick_check;').get() as Record<string, unknown>
        expect(Object.values(checkRow)[0]).toBe('ok')

        const row = verifyDb.prepare('SELECT konu FROM DATA_TeminDosyasi WHERE id = 1').get() as {
          konu: string
        }
        expect(row.konu).toBe('Gerçek SQLite Donanım Temini')
      } finally {
        verifyDb.close()
      }
    })

    it('gerçek better-sqlite3 motoru bozuk (malformed disk image) veritabanını reddeder ve yerel dosyayı korur', () => {
      const realDbPath = path.join(testDir, 'corrupt_source.sqlite')
      createRealSqliteFile(realDbPath)
      const dbBytes = fs.readFileSync(realDbPath)

      // Intentionally corrupt SQLite internal B-tree page pointers while preserving SQLite header string
      // This creates an authentic malformed SQLite database that only a real SQLite C engine will detect
      const corruptedDbBytes = Buffer.from(dbBytes)
      // Overwrite bytes 100 to 400 (first B-Tree page headers / schema root) with garbage
      for (let i = 108; i < Math.min(corruptedDbBytes.length, 600); i++) {
        corruptedDbBytes[i] = 0xee ^ (i * 7)
      }

      const corruptedArchiveBuffer = buildRealArchiveBuffer(corruptedDbBytes)
      const manifest = createManifest(corruptedArchiveBuffer)

      // Target file that must be strictly preserved
      const targetFile = path.join(testDir, 'korunmasi_gereken_calisma.ihale2886')
      fs.writeFileSync(targetFile, 'BU_ORIJINAL_KULLANICI_VERISIDIR_ASLA_SILINMEMELIDIR')

      expect(() => {
        verifyAndRestoreBackupBuffer(corruptedArchiveBuffer, {
          fileName: 'hedef.ihale2886',
          currentPath: targetFile,
          overwriteActive: true,
          targetManifest: manifest
        })
      }).toThrow(/bütünlük testinden geçemedi|bozuk sqlite/i)

      // Crucial guarantee: The original target file and safety backup are completely preserved
      expect(fs.existsSync(targetFile)).toBe(true)
      expect(fs.readFileSync(targetFile, 'utf-8')).toBe(
        'BU_ORIJINAL_KULLANICI_VERISIDIR_ASLA_SILINMEMELIDIR'
      )
    })

    it('gerçek better-sqlite3 motoru 0-byte veya eksik başlığa sahip sahte sqlite dosyasını reddeder', () => {
      const fakeDbBytes = Buffer.from('BU_SQLITE_DEGILDIR_GECERSIZ_VERIDIR')
      const corruptArchiveBuffer = buildRealArchiveBuffer(fakeDbBytes)
      const manifest = createManifest(corruptArchiveBuffer)

      const targetFile = path.join(testDir, 'korunacak_dosya.ihale2886')
      fs.writeFileSync(targetFile, 'orijinal_saglam_veri')

      expect(() => {
        verifyAndRestoreBackupBuffer(corruptArchiveBuffer, {
          fileName: 'hedef.ihale2886',
          currentPath: targetFile,
          overwriteActive: true,
          targetManifest: manifest
        })
      }).toThrow(/bütünlük testinden geçemedi|bozuk sqlite/i)

      expect(fs.readFileSync(targetFile, 'utf-8')).toBe('orijinal_saglam_veri')
    })
  }
)
