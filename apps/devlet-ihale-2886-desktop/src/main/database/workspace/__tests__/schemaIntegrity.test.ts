// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { schema } from '../../index'
import { ensureSchemaIntegrity } from '../schemaIntegrity'
import {
  manifests,
  CURRENT_SCHEMA_VERSION,
  getMaxSchemaVersion,
  runMigrations,
  resolveMigrationChanges,
  getAppManifest
} from '@dt/database'

function createRealSqliteDb(): {
  rawDb: DatabaseSync
  db: {
    exec: (sql: string) => void
    prepare: (sql: string) => {
      run: (...args: any[]) => void
      get: (...args: any[]) => any
      all: (...args: any[]) => any[]
    }
    transaction: <T extends (...args: any[]) => any>(fn: T) => T
  }
} {
  const rawDb = new DatabaseSync(':memory:')
  const db = {
    exec: (sql: string) => rawDb.exec(sql),
    prepare: (sql: string) => {
      const stmt = rawDb.prepare(sql)
      return {
        run: (...args: any[]) => stmt.run(...args),
        get: (...args: any[]) => stmt.get(...args),
        all: (...args: any[]) => stmt.all(...args)
      }
    },
    transaction: <T extends (...args: any[]) => any>(fn: T): T => {
      return ((...args: any[]) => {
        rawDb.exec('BEGIN TRANSACTION;')
        try {
          const res = fn(...args)
          rawDb.exec('COMMIT;')
          return res
        } catch (err) {
          rawDb.exec('ROLLBACK;')
          throw err
        }
      }) as T
    }
  }
  return { rawDb, db }
}

describe('Database Schema Integrity & Manifest Tests (Devlet İhale 2886)', () => {
  it('should have all tables properly defined in 2886 schema', () => {
    expect(schema.tables).toBeDefined()
    expect(schema.tables.length).toBeGreaterThanOrEqual(25)

    const tableNames = new Set(schema.tables.map((t: any) => t.name))

    // Devlet İhale 2886 kurumsal ve ihale tabloları
    const allTables = [
      'TANIM_Kurum',
      'TANIM_Mevzuat',
      'TANIM_Birim',
      'TANIM_Personel',
      'TANIM_PersonelUnvanGecmisi',
      'TANIM_Roller',
      'TANIM_Asama',
      'TANIM_Firma',
      'TANIM_FirmaIletisimNotu',
      'TANIM_Ambar',
      'TANIM_Proje',
      'TANIM_TasinirKod',
      'TANIM_OkasKod',
      'TANIM_ButceKod',
      'TANIM_ButceOdenek',
      'TANIM_Kalem',
      'TANIM_OlcuBirimi',
      'TANIM_BirimDonusum',
      'TANIM_Sablon',
      'TANIM_Placeholder',
      'TANIM_SurecTaslak',
      'SABLON_Placeholder',
      'TANIM_KodSozlugu',
      'TANIM_KomisyonGorevi',
      'TANIM_Komisyon',
      'TANIM_KomisyonUye',
      'TANIM_Komisyon_Sablon',
      'TANIM_KikLimitDonemleri',
      'DATA_IhaleDosyasi',
      'DATA_IhaleKalem',
      'DATA_IhaleFirma',
      'DATA_TIF',
      'DATA_TIF_Kalem',
      'DATA_AmbarStok',
      'DATA_AmbarHareket',
      'DATA_NotVeGorev',
      'LOG_SystemLog'
    ]

    for (const tbl of allTables) {
      expect(tableNames.has(tbl), `Table "${tbl}" must be registered in schema`).toBe(true)
    }
  })

  it('should have valid column definitions for each table', () => {
    const validTypes = new Set(['INTEGER', 'TEXT', 'REAL', 'DATE', 'DATETIME', 'BLOB', 'NUMERIC'])

    for (const table of schema.tables) {
      expect(table.name).toBeTruthy()
      expect(Array.isArray(table.columns), `Table "${table.name}" columns must be an array`).toBe(
        true
      )
      expect(
        table.columns.length,
        `Table "${table.name}" must have at least one column`
      ).toBeGreaterThan(0)

      const colNames = new Set<string>()
      for (const col of table.columns) {
        expect(col.name, `Column in "${table.name}" must have a name`).toBeTruthy()
        expect(
          colNames.has(col.name),
          `Duplicate column "${col.name}" in table "${table.name}"`
        ).toBe(false)
        colNames.add(col.name)

        const rawType = (col.type || '').toUpperCase()
        expect(
          validTypes.has(rawType),
          `Invalid column type "${col.type}" for column "${col.name}" in table "${table.name}"`
        ).toBe(true)
      }
    }
  })

  it('should have correct columns in DATA_IhaleDosyasi and TANIM_ButceOdenek', () => {
    const ihaleDosyasi = schema.tables.find((t: any) => t.name === 'DATA_IhaleDosyasi')
    expect(ihaleDosyasi).toBeDefined()
    const ihaleCols = new Set(ihaleDosyasi!.columns.map((c: any) => c.name))
    expect(
      ihaleCols.has('ihale_kayit_no'),
      'DATA_IhaleDosyasi must have "ihale_kayit_no" column'
    ).toBe(true)
    expect(
      ihaleCols.has('yaklasik_maliyet'),
      'DATA_IhaleDosyasi must have "yaklasik_maliyet" column'
    ).toBe(true)
    expect(ihaleCols.has('ihale_usulu'), 'DATA_IhaleDosyasi must have "ihale_usulu" column').toBe(
      true
    )
    expect(ihaleCols.has('tur'), 'DATA_IhaleDosyasi must have "tur" column').toBe(true)

    const butceOdenek = schema.tables.find((t: any) => t.name === 'TANIM_ButceOdenek')
    expect(butceOdenek).toBeDefined()
    const odenekCols = new Set(butceOdenek!.columns.map((c: any) => c.name))
    expect(odenekCols.has('birim_adi'), 'TANIM_ButceOdenek must have "birim_adi" column').toBe(true)
    expect(odenekCols.has('butce_kodu'), 'TANIM_ButceOdenek must have "butce_kodu" column').toBe(
      true
    )
    expect(
      odenekCols.has('yillik_odenek'),
      'TANIM_ButceOdenek must have "yillik_odenek" column'
    ).toBe(true)
  })

  it('should have consistent schema version and migration manifests', () => {
    expect(manifests).toBeDefined()
    expect(manifests.length).toBeGreaterThan(0)

    const maxVersion = getMaxSchemaVersion()
    expect(maxVersion).toBeGreaterThanOrEqual(37)
    expect(CURRENT_SCHEMA_VERSION).toBe(maxVersion)

    const latestManifest = manifests[manifests.length - 1]
    expect(latestManifest.app).toBeDefined()
    expect(latestManifest.schema_max).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('should run migrations including Sürüm 11 without syntax error (near "/" bug fix)', () => {
    const executedSqls: string[] = []
    const dbLike: any = {
      exec: (sql: string) => {
        executedSqls.push(sql)
      },
      prepare: () => ({
        run: () => ({}),
        all: () => [],
        get: () => ({})
      }),
      transaction: (fn: any) => fn
    }

    expect(() => {
      runMigrations(dbLike, 10, schema)
    }).not.toThrow()

    // TANIM_OlcuBirimi should be created with properly quoted default value
    const olcuCreate = executedSqls.find((s) => s.includes('TANIM_OlcuBirimi'))
    expect(olcuCreate).toBeDefined()
    expect(olcuCreate).toContain('"kategori" TEXT DEFAULT \'Adet/Miktar\'')
    expect(olcuCreate).toContain('"donusum_tipi" TEXT DEFAULT \'linear\'')
    expect(olcuCreate).not.toContain('DEFAULT Adet/Miktar')
  })

  it('should initialize empty 2886 database with ensureSchemaIntegrity and verify 2886 defaults', () => {
    const { rawDb, db } = createRealSqliteDb()

    // Run ensureSchemaIntegrity on pristine empty SQLite database
    expect(() => {
      ensureSchemaIntegrity(db as any)
    }).not.toThrow()

    // 1. Verify DATA_IhtiyacRaporu table exists and has foreign key referencing DATA_IhaleDosyasi
    const ihtiyacTable = rawDb
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'DATA_IhtiyacRaporu'")
      .get() as { sql: string }
    expect(ihtiyacTable).toBeDefined()
    expect(ihtiyacTable.sql).toContain('FOREIGN KEY(ihale_dosya_id) REFERENCES DATA_IhaleDosyasi(id)')

    // 2. Verify DATA_IhaleDosyasi has 2886 defaults, NOT 4734 or Temin
    const tableInfo = rawDb.prepare("PRAGMA table_info('DATA_IhaleDosyasi')").all() as Array<{
      name: string
      dflt_value: string | null
    }>
    const maddeCol = tableInfo.find((c) => c.name === 'madde')
    expect(maddeCol).toBeDefined()
    expect(maddeCol?.dflt_value).toBe("'2886 Sayılı Devlet İhale Kanunu'")
    expect(maddeCol?.dflt_value).not.toContain('4734')
    expect(maddeCol?.dflt_value).not.toContain('22/d')

    const usulCol = tableInfo.find((c) => c.name === 'ihale_usulu')
    expect(usulCol?.dflt_value).toBe("'2886 Sayılı Kanun'")

    const tipiCol = tableInfo.find((c) => c.name === 'ihale_tipi')
    expect(tipiCol?.dflt_value).toBe("'Devlet İhalesi (2886)'")

    // 3. Insert into DATA_IhaleDosyasi and test link from DATA_IhtiyacRaporu
    rawDb.exec(`
      INSERT INTO DATA_IhaleDosyasi (dosya_no, konu, yaklasik_maliyet)
      VALUES ('2886/2026-001', 'Taşınmaz Kiralama İhalesi', 250000);
    `)
    const ihaleRow = rawDb
      .prepare("SELECT id, madde, ihale_tipi FROM DATA_IhaleDosyasi WHERE dosya_no = '2886/2026-001'")
      .get() as { id: number; madde: string; ihale_tipi: string }
    expect(ihaleRow).toBeDefined()
    expect(ihaleRow.madde).toBe('2886 Sayılı Devlet İhale Kanunu')
    expect(ihaleRow.ihale_tipi).toBe('Devlet İhalesi (2886)')

    // Insert linked record into DATA_IhtiyacRaporu
    rawDb.exec(`
      INSERT INTO DATA_IhtiyacRaporu (rapor_no, baslik, ihale_dosya_id, tahmini_butce)
      VALUES ('IR-2886-01', 'Kira İhtiyaç Raporu', ${ihaleRow.id}, 250000);
    `)
    const raporRow = rawDb
      .prepare("SELECT * FROM DATA_IhtiyacRaporu WHERE rapor_no = 'IR-2886-01'")
      .get() as any
    expect(raporRow).toBeDefined()
    expect(raporRow.ihale_dosya_id).toBe(ihaleRow.id)
  })

  it('should not silently swallow unexpected SQLite errors in ensureSchemaIntegrity', () => {
    const faultyDb: any = {
      exec: (sql: string) => {
        if (sql.includes('DATA_IhtiyacRaporu')) {
          throw new Error('SQLITE_CORRUPT: database disk image is malformed')
        }
      },
      prepare: () => ({
        get: () => ({ type: 'table' }),
        all: () => []
      })
    }

    expect(() => {
      ensureSchemaIntegrity(faultyDb)
    }).toThrow('SQLITE_CORRUPT')
  })

  it('should configure 2886 manifest to not inherit historical suite manifests', () => {
    const manifest = getAppManifest('devlet-ihale-2886-desktop')
    expect(manifest).toBeDefined()
    expect(manifest.app).toBe('devlet-ihale-2886-desktop')
    expect(manifest.inheritsHistoricalSuiteManifests).toBe(false)
    expect(manifest.shared_schema_scope).toBe('devlet_ihale_2886')

    const { pendingChanges } = resolveMigrationChanges(0, {
      appId: 'devlet-ihale-2886-desktop'
    })
    // Since 2886 has schema_max: 1 and does not inherit historical 46 temin manifests:
    expect(pendingChanges.length).toBe(1)
    expect(pendingChanges[0].schema).toBe(1)
  })

  it('should insert through DATA_TeminDosyasi compatibility view and produce 2886 context defaults', () => {
    const { rawDb, db } = createRealSqliteDb()
    ensureSchemaIntegrity(db as any)

    // Verify DATA_TeminDosyasi is a VIEW on DATA_IhaleDosyasi
    const viewMeta = rawDb
      .prepare("SELECT type FROM sqlite_master WHERE name = 'DATA_TeminDosyasi'")
      .get() as { type: string }
    expect(viewMeta.type).toBe('view')

    // Insert legacy-style record through DATA_TeminDosyasi view without specifying ihale_tipi or madde
    rawDb.exec(`
      INSERT INTO DATA_TeminDosyasi (dosya_no, konu, yaklasik_maliyet)
      VALUES ('2886/VIEW-01', 'Arsa Satışı İhalesi', 750000);
    `)

    // Verify underlying physical table DATA_IhaleDosyasi received 2886 defaults
    const inserted = rawDb
      .prepare("SELECT * FROM DATA_IhaleDosyasi WHERE dosya_no = '2886/VIEW-01'")
      .get() as any
    expect(inserted).toBeDefined()
    expect(inserted.madde).toBe('2886 Sayılı Devlet İhale Kanunu')
    expect(inserted.ihale_usulu).toBe('2886 Sayılı Kanun')
    expect(inserted.ihale_tipi).toBe('Devlet İhalesi (2886)')
    expect(inserted.tur).toBe('satis_kiralama')

    // Test UPDATE through the compatibility view
    rawDb.exec(`
      UPDATE DATA_TeminDosyasi SET konu = 'Güncellenen Arsa Satışı' WHERE dosya_no = '2886/VIEW-01';
    `)
    const updated = rawDb
      .prepare("SELECT konu, madde FROM DATA_IhaleDosyasi WHERE dosya_no = '2886/VIEW-01'")
      .get() as any
    expect(updated.konu).toBe('Güncellenen Arsa Satışı')
    expect(updated.madde).toBe('2886 Sayılı Devlet İhale Kanunu')
  })

  it('should safely upgrade legacy databases, standardize existing records, and pass foreign key checks', () => {
    const { rawDb, db } = createRealSqliteDb()

    // 1. Simulate an older database created before 2886 isolation:
    // Old table without explicit 2886 defaults and with legacy records containing old 4734/temin values
    rawDb.exec(`
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO settings (key, value) VALUES ('dbSchemaVersion', '0');

      CREATE TABLE TANIM_Birim (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        aktif_mi INTEGER DEFAULT 1
      );
      INSERT INTO TANIM_Birim (id, ad) VALUES (1, 'Emlak ve İstimlak Müdürlüğü');

      CREATE TABLE TANIM_Personel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad_soyad TEXT NOT NULL,
        aktif_mi INTEGER DEFAULT 1
      );
      INSERT INTO TANIM_Personel (id, ad_soyad) VALUES (1, 'Ahmet Yılmaz');

      CREATE TABLE DATA_IhaleDosyasi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dosya_no TEXT,
        temin_no TEXT,
        konu TEXT NOT NULL,
        madde TEXT DEFAULT '4734 Sayılı Kanun 22/d',
        ihale_usulu TEXT DEFAULT 'acik',
        ihale_tipi TEXT DEFAULT 'dogrudan_temin',
        tur TEXT DEFAULT 'mal',
        alim_turu TEXT DEFAULT 'mal',
        birim_id INTEGER REFERENCES TANIM_Birim(id),
        yaklasik_maliyet REAL DEFAULT 0
      );

      -- Legacy record with old temin defaults
      INSERT INTO DATA_IhaleDosyasi (id, dosya_no, konu, madde, ihale_usulu, ihale_tipi, tur, birim_id)
      VALUES (101, 'ESKI-2886-01', 'Eski İhale Kaydı', '4734 Sayılı Kanun 22/d', 'acik', 'dogrudan_temin', 'mal', 1);
    `)

    // 2. Run ensureSchemaIntegrity (database upgrade simulation)
    expect(() => {
      ensureSchemaIntegrity(db as any)
    }).not.toThrow()

    // 3. Verify existing legacy records were standardized to 2886 defaults without data loss
    const migratedRecord = rawDb
      .prepare('SELECT * FROM DATA_IhaleDosyasi WHERE id = 101')
      .get() as any
    expect(migratedRecord).toBeDefined()
    expect(migratedRecord.konu).toBe('Eski İhale Kaydı')
    expect(migratedRecord.madde).toBe('2886 Sayılı Devlet İhale Kanunu')
    expect(migratedRecord.ihale_usulu).toBe('2886 Sayılı Kanun')
    expect(migratedRecord.ihale_tipi).toBe('Devlet İhalesi (2886)')
    expect(migratedRecord.tur).toBe('satis_kiralama')

    // 4. Verify PRAGMA foreign_key_check passes with 0 violations
    const fkViolations = rawDb.prepare('PRAGMA foreign_key_check;').all()
    expect(fkViolations).toHaveLength(0)

    // 5. Test idempotency: re-running migration on upgraded DB must not throw or alter data
    expect(() => {
      ensureSchemaIntegrity(db as any)
    }).not.toThrow()

    const secondCheckRecord = rawDb
      .prepare('SELECT * FROM DATA_IhaleDosyasi WHERE id = 101')
      .get() as any
    expect(secondCheckRecord.madde).toBe('2886 Sayılı Devlet İhale Kanunu')
  })

  it('should atomically deduplicate DATA_DosyaSablonVeri by archiving to DATA_DosyaRevizyon without data loss', () => {
    const { rawDb, db } = createRealSqliteDb()
    ensureSchemaIntegrity(db as any)

    // Simulate legacy database having DATA_DosyaSablonVeri and DATA_DosyaRevizyon with duplicate entries
    rawDb.exec(`
      CREATE TABLE IF NOT EXISTS DATA_DosyaSablonVeri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER,
        sablon_id INTEGER,
        sablon_kodu TEXT,
        veri_json TEXT,
        updated_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS DATA_DosyaRevizyon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER,
        modul_adi TEXT,
        surec_kodu TEXT,
        belge_kodu TEXT,
        versiyon TEXT,
        baslik TEXT,
        veri_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      DROP INDEX IF EXISTS idx_data_dosyasablonveri_unique;

      INSERT INTO DATA_DosyaSablonVeri (temin_dosya_id, sablon_kodu, veri_json, updated_at)
      VALUES 
        (1, '2886-EVR-01', '{"version": 1, "note": "ilk versiyon"}', '2026-01-01 10:00:00'),
        (1, '2886-EVR-01', '{"version": 2, "note": "yeni versiyon"}', '2026-01-02 10:00:00');
    `)

    // Verify 2 duplicate rows exist
    const countBefore = rawDb
      .prepare("SELECT COUNT(*) as cnt FROM DATA_DosyaSablonVeri WHERE temin_dosya_id = 1 AND sablon_kodu = '2886-EVR-01'")
      .get() as { cnt: number }
    expect(countBefore.cnt).toBe(2)

    // Run schema integrity to trigger safe transactional deduplication
    expect(() => {
      ensureSchemaIntegrity(db as any)
    }).not.toThrow()

    // 1 row should remain in DATA_DosyaSablonVeri (the newer version)
    const remaining = rawDb
      .prepare("SELECT * FROM DATA_DosyaSablonVeri WHERE temin_dosya_id = 1 AND sablon_kodu = '2886-EVR-01'")
      .all() as any[]
    expect(remaining).toHaveLength(1)
    expect(remaining[0].veri_json).toContain('yeni versiyon')

    // Older duplicate must be archived in DATA_DosyaRevizyon
    const archived = rawDb
      .prepare("SELECT * FROM DATA_DosyaRevizyon WHERE temin_dosya_id = 1 AND surec_kodu = 'MIGRATION_DEDUP'")
      .all() as any[]
    expect(archived).toHaveLength(1)
    expect(archived[0].veri_json).toContain('ilk versiyon')
  })
})

