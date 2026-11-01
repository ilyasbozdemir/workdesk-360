// @vitest-environment node
/**
 * RC.8 (şema v44) → RC.10 (şema v46) GERÇEK ÜRETİM AKIŞI entegrasyon testi.
 *
 * - Gerçek `better-sqlite3` (native) motoru kullanılır; `node:sqlite` veya elle yazılmış
 *   BEGIN/COMMIT/ROLLBACK sarmalayıcıları KULLANILMAZ.
 * - Gerçek `DtmWorkspace` (openWorkspace → migration onayı → saveWorkspace → yeniden açma) zinciri koşulur.
 * - `atomicReplaceWorkspaceFile()` üretim fonksiyonu doğrudan çağrılır; test içinde elle `.bak` üretilmez.
 * - Yalnızca `electron` modülü (app.getPath/getVersion) taklit edilir.
 *
 * Native modül yalnızca Electron runtime'ında yüklenebiliyorsa (pnpm test:electron) çalışır;
 * aksi halde süit atlanır (realSqliteBackupIntegrity.test.ts ile aynı strateji).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import AdmZip from 'adm-zip'
import Database from 'better-sqlite3'

const hoisted = vi.hoisted(() => ({ userData: '' }))

vi.mock('electron', () => ({
  shell: { openPath: vi.fn().mockResolvedValue('') },
  app: {
    getPath: vi.fn(() => hoisted.userData),
    getAppPath: vi.fn(() => hoisted.userData),
    getVersion: vi.fn(() => '1.0.0-rc.10-test')
  },
  BrowserWindow: vi.fn()
}))

import { schema, resolveMigrationChanges, runMigrations } from '@dt/database'
import { DtmWorkspace, atomicReplaceWorkspaceFile } from '../DtmWorkspace'

let isNativeSqliteAvailable = false
try {
  const probe = new Database(':memory:')
  probe.close()
  isNativeSqliteAvailable = true
} catch {
  isNativeSqliteAvailable = false
}

const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/temin-rc8-schema-v44.sqlite')

/** RC.8 fixture'ından (v44) sayılan tarihsel tablo sayısı. */
const HISTORICAL_V44_TABLE_COUNT = 47

/** v46 manifestinde DATA_TeminDosyasi'na eklenen beş kolon. */
const V46_COLUMNS = [
  'is_locked',
  'lock_reason',
  'kayit_kaynagi',
  'aktarim_grubu_id',
  'kaynak_kayit_id'
] as const

const sha256 = (file: string): string =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function listTables(db: Database.Database): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]
  )
    .map((r) => r.name)
    .sort()
}

function listColumns(db: Database.Database, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name)
}

function getSchemaVersion(db: Database.Database): string {
  return (
    db.prepare("SELECT value FROM settings WHERE key='dbSchemaVersion'").get() as { value: string }
  ).value
}

/** v45 (Belgelerim/Kütüphane) ile eklenen tablolar — üretim manifestinden türetilir. */
function getV45Tables(): string[] {
  const { pendingChanges } = resolveMigrationChanges(44, { appId: 'temin360-desktop' })
  return pendingChanges
    .filter((c) => c.schema === 45)
    .flatMap((c) => c.tables_added || [])
    .sort()
}

/** Fixture'ı gerçek bir .temin (zip) arşivi içine yerleştirir. */
function buildTeminArchive(
  targetPath: string,
  options: { sqliteFile?: string } = {}
): void {
  const zip = new AdmZip()
  const meta = {
    dtal_version: '1.0',
    schema_version: 44,
    institution: 'Sentetik Test Kurumu',
    created_at: '2026-10-01',
    updated_at: '2026-10-01T10:00:00.000Z',
    project_id: '0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d',
    active_db_file: 'database.sqlite',
    data_revision: 1,
    file_version: 1
  }
  zip.addFile('meta.json', Buffer.from(JSON.stringify(meta, null, 2), 'utf-8'))
  zip.addFile('database.sqlite', fs.readFileSync(options.sqliteFile || FIXTURE_PATH))
  zip.addFile('attachments/', Buffer.alloc(0))
  zip.writeZip(targetPath)
}

/** Arşivin içindeki sqlite'ı çıkarıp salt-okunur açar. */
function openArchiveDb(
  archivePath: string,
  workDir: string
): { db: Database.Database; meta: Record<string, any>; entries: string[] } {
  const zip = new AdmZip(archivePath)
  const entries = zip.getEntries().map((e) => e.entryName)
  const meta = JSON.parse(zip.readAsText('meta.json'))
  const dbName = meta.active_db_file || 'database.sqlite'
  const inspectDir = path.join(workDir, 'inspect')
  fs.mkdirSync(inspectDir, { recursive: true })
  const extracted = path.join(inspectDir, `extracted_${crypto.randomUUID()}.sqlite`)
  fs.writeFileSync(extracted, zip.readFile(dbName)!)
  return { db: new Database(extracted, { readonly: true }), meta, entries }
}

function assertUserDataIntact(db: Database.Database): void {
  const personel = db.prepare('SELECT ad_soyad FROM TANIM_Personel ORDER BY id').all() as {
    ad_soyad: string
  }[]
  expect(personel.map((p) => p.ad_soyad)).toEqual(['Ahmet Yılmaz', 'Fatma Kaya'])

  const firmalar = db.prepare('SELECT unvan FROM TANIM_Firma ORDER BY id').all() as {
    unvan: string
  }[]
  expect(firmalar).toHaveLength(2)

  const dosya = db.prepare('SELECT id, temin_no, konu FROM DATA_TeminDosyasi').all() as {
    id: number
    temin_no: string
    konu: string
  }[]
  expect(dosya).toHaveLength(1)
  expect(dosya[0].temin_no).toBe('2026/DT-101')
  expect(dosya[0].konu).toBe('Kırtasiye ve Sarf Malzemesi Alımı')

  // İlişkiler: kalem → dosya, firma → dosya/TANIM_Firma, teklif → kalem + firma
  const kalemler = db
    .prepare('SELECT k.id FROM DATA_TeminKalem k JOIN DATA_TeminDosyasi d ON d.id = k.dosya_id')
    .all()
  expect(kalemler).toHaveLength(2)

  const teminFirmalar = db
    .prepare(
      'SELECT tf.id FROM DATA_TeminFirma tf JOIN TANIM_Firma f ON f.id = tf.firma_id JOIN DATA_TeminDosyasi d ON d.id = tf.dosya_id'
    )
    .all()
  expect(teminFirmalar).toHaveLength(2)

  const teklifler = db
    .prepare(
      `SELECT t.id FROM DATA_TeminKalemTeklif t
       JOIN DATA_TeminKalem k ON k.id = t.temin_kalem_id
       JOIN DATA_TeminFirma tf ON tf.id = t.temin_firma_id
       JOIN DATA_TeminDosyasi d ON d.id = t.dosya_id`
    )
    .all()
  expect(teklifler).toHaveLength(4)

  const settings = Object.fromEntries(
    (db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]).map(
      (r) => [r.key, r.value]
    )
  )
  expect(settings.institutionName).toBe('Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü')
  expect(settings.adminName).toBe('Mustafa Kemal Erdem')
  expect(settings.adminTitle).toBe('Destek Hizmetleri Müdürü')
}

function assertSqliteHealthy(db: Database.Database): void {
  const integrity = db.prepare('PRAGMA integrity_check').all() as { integrity_check: string }[]
  expect(integrity).toEqual([{ integrity_check: 'ok' }])
  expect(db.prepare('PRAGMA foreign_key_check').all()).toHaveLength(0)
}

describe.skipIf(!isNativeSqliteAvailable)(
  'RC.8 (v44) → RC.10 (v46) Gerçek Üretim Açılış/Kayıt Akışı (better-sqlite3 + DtmWorkspace)',
  () => {
    let workDir: string
    let teminFile: string
    const openedWorkspaces: DtmWorkspace[] = []

    const newWorkspace = (): DtmWorkspace => {
      const ws = new DtmWorkspace()
      openedWorkspaces.push(ws)
      return ws
    }

    beforeEach(() => {
      workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-rc8-rc10-flow-'))
      hoisted.userData = path.join(workDir, 'userData')
      fs.mkdirSync(hoisted.userData, { recursive: true })
      teminFile = path.join(workDir, 'eski_proje_rc8.temin')
    })

    afterEach(() => {
      for (const ws of openedWorkspaces.splice(0)) {
        try {
          ws.closeWorkspace()
        } catch {
          /* zaten kapalı */
        }
      }
      try {
        fs.rmSync(workDir, { recursive: true, force: true })
      } catch {
        /* temizlik hatası yok sayılır */
      }
    })

    describe('1. Fixture doğrulaması (RC.8 / v44)', () => {
      it('tablo sayısı tarihsel v44 değeriyle eşleşir; v45 tabloları ve v46 kolonları YOKTUR', () => {
        const db = new Database(FIXTURE_PATH, { readonly: true })
        try {
          expect(getSchemaVersion(db)).toBe('44')

          const tables = listTables(db)
          expect(tables).toHaveLength(HISTORICAL_V44_TABLE_COUNT)

          // Güncel şema tanımından v45 tablolarını çıkarınca v44 tablo kümesi elde edilmeli
          const v45Tables = getV45Tables()
          expect(v45Tables.length).toBeGreaterThan(0)
          for (const t of v45Tables) {
            expect(tables, `v45 tablosu v44 fixture'ında bulunmamalı: ${t}`).not.toContain(t)
          }

          const dosyaCols = listColumns(db, 'DATA_TeminDosyasi')
          for (const col of V46_COLUMNS) {
            expect(dosyaCols, `v46 kolonu v44 fixture'ında bulunmamalı: ${col}`).not.toContain(col)
          }
          assertSqliteHealthy(db)
          assertUserDataIntact(db)
        } finally {
          db.close()
        }
      })

      it('fixture sentetik kayıtlar içerir (kalem, firma, teklif ilişkileri tutarlı)', () => {
        const db = new Database(FIXTURE_PATH, { readonly: true })
        try {
          assertUserDataIntact(db)
        } finally {
          db.close()
        }
      })
    })

    describe('2. Gerçek çalışma alanı akışı: open → onay → migration → save → reopen', () => {
      it('v44 .temin arşivi migration onayı istemeli; onaylanınca v46’ya yükselip kaydedilmeli ve yeniden açılabilmeli', () => {
        buildTeminArchive(teminFile)
        const originalHash = sha256(teminFile)

        // --- Üretimdeki onay kapısı: onaysız açış MIGRATION_REQUIRED fırlatır ---
        const wsPrompt = newWorkspace()
        let promptError: Error | null = null
        try {
          wsPrompt.openWorkspace(teminFile)
        } catch (e) {
          promptError = e as Error
        }
        expect(promptError).not.toBeNull()
        expect(promptError!.message.startsWith('MIGRATION_REQUIRED|')).toBe(true)
        const payload = JSON.parse(promptError!.message.slice('MIGRATION_REQUIRED|'.length))
        expect(payload.requiresMigration).toBe(true)
        expect(payload.pendingUpdates.map((u: { schema: number }) => u.schema)).toEqual([45, 46])

        // Onay beklenirken dosya DEĞİŞMEMİŞ ve kilit bırakılmamış olmalı
        expect(sha256(teminFile)).toBe(originalHash)
        expect(fs.existsSync(teminFile + '.lock')).toBe(false)

        // --- Kullanıcı onayladı: allowMigration=true ---
        const ws = newWorkspace()
        const meta = ws.openWorkspace(teminFile, true)
        expect(meta.schema_version).toBe(46)
        expect(fs.existsSync(teminFile + '.lock')).toBe(true) // açıkken kilitli

        // Canlı (açık) çalışma alanı veritabanı: gerçek better-sqlite3 nesnesi
        const liveDb = ws.getDb()
        expect(liveDb).toBeInstanceOf(Database)
        expect(getSchemaVersion(liveDb)).toBe('46')

        // --- Açık kayıt: saveWorkspace() ---
        ws.saveWorkspace(true)
        ws.closeWorkspace()
        expect(fs.existsSync(teminFile + '.lock')).toBe(false)

        // --- Arşiv bütünlüğü ---
        expect(sha256(teminFile)).not.toBe(originalHash) // yükseltilmiş arşiv yazıldı
        const {
          db: savedDb,
          meta: savedMeta,
          entries
        } = openArchiveDb(teminFile, workDir)
        try {
          expect(entries).toContain('meta.json')
          expect(entries).toContain('database.sqlite')
          expect(savedMeta.schema_version).toBe(46)
          expect(savedMeta.project_id).toBe('0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d')

          // v46 şeması
          expect(getSchemaVersion(savedDb)).toBe('46')
          const tables = listTables(savedDb)
          for (const t of getV45Tables()) expect(tables).toContain(t)
          const dosyaCols = listColumns(savedDb, 'DATA_TeminDosyasi')
          for (const col of V46_COLUMNS) expect(dosyaCols).toContain(col)

          // Güncel şema tanımındaki tüm tablo ve kolonlar mevcut olmalı
          for (const tableDef of (schema as any).tables as {
            name: string
            columns: { name: string }[]
          }[]) {
            if (!tables.includes(tableDef.name)) {
              throw new Error(`Migration sonrası tablo eksik: ${tableDef.name}`)
            }
            const cols = listColumns(savedDb, tableDef.name)
            for (const c of tableDef.columns) {
              if (!cols.includes(c.name)) {
                throw new Error(`Migration sonrası kolon eksik: ${tableDef.name}.${c.name}`)
              }
            }
          }

          assertSqliteHealthy(savedDb)
          assertUserDataIntact(savedDb)
        } finally {
          savedDb.close()
        }

        // --- Yeniden aç: artık onay istememeli ---
        const wsReopen = newWorkspace()
        const reopenedMeta = wsReopen.openWorkspace(teminFile)
        expect(reopenedMeta.schema_version).toBe(46)
        const reopenedDb = wsReopen.getDb()
        expect(getSchemaVersion(reopenedDb)).toBe('46')
        assertSqliteHealthy(reopenedDb)
        assertUserDataIntact(reopenedDb)
        wsReopen.closeWorkspace()

        // Kayıt sonrası yarım/geçici dosya kalmamalı
        const leftovers = fs
          .readdirSync(workDir)
          .filter((f) => f !== path.basename(teminFile) && f !== 'userData' && f !== 'inspect')
        expect(leftovers).toEqual([])
      }, 60000)
    })

    describe('3. Migration hata senaryosu (kontrollü hata)', () => {
      /**
       * v46 adımı `settings.dbSchemaVersion = 46` yazarken ABORT eden bir tetikleyici ekler.
       * Böylece gerçek migration transaction'ının İÇİNDE (v45 + v46 DDL'i uygulandıktan sonra) hata oluşur.
       */
      function createFaultyFixture(): string {
        const faultyDbPath = path.join(workDir, 'faulty_v44.sqlite')
        fs.copyFileSync(FIXTURE_PATH, faultyDbPath)
        const db = new Database(faultyDbPath)
        try {
          db.exec(`
            CREATE TRIGGER kontrollu_migration_hatasi
            BEFORE INSERT ON settings
            WHEN NEW.key = 'dbSchemaVersion' AND NEW.value = '46'
            BEGIN
              SELECT RAISE(ABORT, 'KONTROLLU_MIGRATION_HATASI');
            END;
          `)
          db.pragma('wal_checkpoint(TRUNCATE)')
        } finally {
          db.close()
        }
        return faultyDbPath
      }

      it('üretim runMigrations + better-sqlite3 transaction: hata anında tamamı geri alınır (v44 kalır)', () => {
        const faultyDbPath = createFaultyFixture()
        const db = new Database(faultyDbPath)
        try {
          expect(() => runMigrations(db, 44, schema, { appId: 'temin360-desktop' })).toThrow(
            /KONTROLLU_MIGRATION_HATASI/
          )

          expect(db.inTransaction).toBe(false)
          expect(getSchemaVersion(db)).toBe('44')
          const tables = listTables(db)
          for (const t of getV45Tables()) expect(tables).not.toContain(t)
          const dosyaCols = listColumns(db, 'DATA_TeminDosyasi')
          for (const col of V46_COLUMNS) expect(dosyaCols).not.toContain(col)

          // schema_migrations tablosuna v45/v46 satırı da yazılmamış olmalı
          const applied = db
            .prepare('SELECT version FROM schema_migrations WHERE version >= 45')
            .all()
          expect(applied).toHaveLength(0)

          assertSqliteHealthy(db)
        } finally {
          db.close()
        }
      }, 60000)

      it('DtmWorkspace.openWorkspace: migration başarısız olursa eski .temin değişmez, kilit/geçici dizin temizlenir, eski arşiv yeniden açılabilir', () => {
        buildTeminArchive(teminFile, { sqliteFile: createFaultyFixture() })
        const originalHash = sha256(teminFile)
        const originalSize = fs.statSync(teminFile).size

        const ws = newWorkspace()
        const tempDirOfWs: string = (ws as any).tempDir
        expect(() => ws.openWorkspace(teminFile, true)).toThrow(/KONTROLLU_MIGRATION_HATASI/)

        // Eski .temin dosyası bayt bayt aynı
        expect(sha256(teminFile)).toBe(originalHash)
        expect(fs.statSync(teminFile).size).toBe(originalSize)

        // Kilit ve geçici dosyalar temizlenmiş
        expect(fs.existsSync(teminFile + '.lock')).toBe(false)
        expect(fs.existsSync(tempDirOfWs)).toBe(false)
        const dirFiles = fs.readdirSync(workDir)
        expect(dirFiles.filter((f) => f.includes('.tmp.') || f.includes('.bak.'))).toEqual([])
        const dtmTemp = path.join(hoisted.userData, 'dtm_temp')
        if (fs.existsSync(dtmTemp)) {
          expect(fs.readdirSync(dtmTemp)).toEqual([])
        }

        // Eski arşiv: şema v44, kullanıcı verisi sağlam, yarım migration yok
        const { db, meta } = openArchiveDb(teminFile, workDir)
        try {
          expect(meta.schema_version).toBe(44)
          expect(getSchemaVersion(db)).toBe('44')
          const tables = listTables(db)
          expect(tables.filter((t) => !t.startsWith('sqlite_'))).toHaveLength(
            HISTORICAL_V44_TABLE_COUNT
          )
          for (const t of getV45Tables()) expect(tables).not.toContain(t)
          for (const col of V46_COLUMNS) {
            expect(listColumns(db, 'DATA_TeminDosyasi')).not.toContain(col)
          }
          assertSqliteHealthy(db)
          assertUserDataIntact(db)
        } finally {
          db.close()
        }

        // Üretim yolundan da hâlâ geçerli bir eski arşiv olarak açılmaya çalışılır (onay kapısına kadar)
        const wsRetry = newWorkspace()
        expect(() => wsRetry.openWorkspace(teminFile)).toThrow(/^MIGRATION_REQUIRED\|/)
        expect(fs.existsSync(teminFile + '.lock')).toBe(false)
        expect(sha256(teminFile)).toBe(originalHash)
      }, 60000)
    })

    describe('4. atomicReplaceWorkspaceFile (üretim fonksiyonu)', () => {
      const bakFiles = (dir: string): string[] =>
        fs.readdirSync(dir).filter((f) => f.includes('.bak.'))

      it('başarılı kayıt: hedef yeni içerikle değişir, kaynak tüketilir, güvenlik kopyası temizlenir', () => {
        const dest = path.join(workDir, 'hedef.temin')
        const src = path.join(workDir, '.hedef.temin.tmp.1')
        fs.writeFileSync(dest, 'ESKI_ICERIK')
        fs.writeFileSync(src, 'YENI_ICERIK')

        atomicReplaceWorkspaceFile(src, dest)

        expect(fs.readFileSync(dest, 'utf-8')).toBe('YENI_ICERIK')
        expect(fs.existsSync(src)).toBe(false)
        expect(bakFiles(workDir)).toEqual([])
      })

      it('gerçek .temin arşivi: başarılı değiştirmede arşiv geçerli kalır ve güvenlik kopyası kalmaz', () => {
        buildTeminArchive(teminFile)
        const newerArchive = path.join(workDir, '.eski_proje_rc8.temin.tmp.2')
        buildTeminArchive(newerArchive)

        atomicReplaceWorkspaceFile(newerArchive, teminFile, 10, (verified) => {
          const entries = new AdmZip(verified).getEntries().map((e) => e.entryName)
          if (!entries.includes('meta.json') || !entries.includes('database.sqlite')) {
            throw new Error('geçersiz arşiv')
          }
        })

        const { db } = openArchiveDb(teminFile, workDir)
        try {
          assertSqliteHealthy(db)
        } finally {
          db.close()
        }
        expect(bakFiles(workDir)).toEqual([])
      })

      it('dosya değiştirme hatası (kaynak yok): hata fırlatılır, eski dosya içeriği korunur, yedek yolu bildirilir', () => {
        const dest = path.join(workDir, 'korunacak.temin')
        fs.writeFileSync(dest, 'ESKI_KORUNMALI')
        const missingSrc = path.join(workDir, '.korunacak.temin.tmp.yok')

        let thrown: (Error & { backupPath?: string }) | null = null
        try {
          atomicReplaceWorkspaceFile(missingSrc, dest, 2)
        } catch (e) {
          thrown = e as Error & { backupPath?: string }
        }

        expect(thrown).not.toBeNull()
        expect(thrown!.message).toMatch(/atomik olarak değiştirilemedi/)
        expect(fs.readFileSync(dest, 'utf-8')).toBe('ESKI_KORUNMALI')
        // Üretim davranışı: başarısız değiştirmede güvenlik kopyası KORUNUR ve yolu hataya eklenir
        expect(thrown!.backupPath).toBeTruthy()
        expect(fs.readFileSync(thrown!.backupPath!, 'utf-8')).toBe('ESKI_KORUNMALI')
      })

      it('post-replacement doğrulama hatası: eski dosya geri yüklenir ve güvenlik kopyası temizlenir', () => {
        const dest = path.join(workDir, 'dogrulama.temin')
        const src = path.join(workDir, '.dogrulama.temin.tmp.1')
        fs.writeFileSync(dest, 'ESKI_ICERIK_GERI_GELMELI')
        fs.writeFileSync(src, 'BOZUK_YENI_ICERIK')

        expect(() =>
          atomicReplaceWorkspaceFile(src, dest, 3, () => {
            throw new Error('KONTROLLU_DOGRULAMA_HATASI')
          })
        ).toThrow(/orijinal dosya güvenlik yedeğinden geri yüklendi.*KONTROLLU_DOGRULAMA_HATASI/)

        expect(fs.readFileSync(dest, 'utf-8')).toBe('ESKI_ICERIK_GERI_GELMELI')
        expect(bakFiles(workDir)).toEqual([])
      })
    })

    describe('5. Gerçek saveWorkspace ile eski dosya üzerine atomik kayıt', () => {
      it('açık çalışma alanı kaydedilince geçici .tmp/.bak dosyaları kalmaz ve arşiv geçerli kalır', () => {
        buildTeminArchive(teminFile)
        const ws = newWorkspace()
        ws.openWorkspace(teminFile, true)
        ws.saveWorkspace(true)
        ws.saveWorkspace(true) // ikinci kayıt: mevcut v46 dosyasının üzerine atomik değiştirme
        ws.closeWorkspace()

        const files = fs.readdirSync(workDir).filter((f) => f !== 'userData' && f !== 'inspect')
        expect(files).toEqual([path.basename(teminFile)])

        const { db, meta } = openArchiveDb(teminFile, workDir)
        try {
          expect(meta.schema_version).toBe(46)
          assertSqliteHealthy(db)
          assertUserDataIntact(db)
        } finally {
          db.close()
        }
      }, 60000)
    })
  }
)
