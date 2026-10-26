// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import {
  schema,
  manifests,
  CURRENT_SCHEMA_VERSION,
  getMaxSchemaVersion,
  runMigrations,
  DOGRUDAN_TEMIN_TABLE_NAMES,
  IHALE_SPECIFIC_TABLE_NAMES,
  sharedFoundationTables,
  ensureIhaleCompatibilityViews
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

describe('Database Schema Integrity & Manifest Tests', () => {
  it('should have all tables properly defined in @dt/database schema', () => {
    expect(schema.tables).toBeDefined()
    expect(schema.tables.length).toBeGreaterThanOrEqual(30)

    const tableNames = new Set(schema.tables.map((t: any) => t.name))

    // All 43 database tables must exist
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
      'TANIM_AlimTuru',
      'TANIM_Sablon',
      'TANIM_Placeholder',
      'TANIM_AlimTuru_Sablon',
      'TANIM_SurecTaslak',
      'SABLON_Placeholder',
      'TANIM_KodSozlugu',
      'TANIM_KomisyonGorevi',
      'TANIM_Komisyon',
      'TANIM_KomisyonUye',
      'TANIM_Komisyon_Sablon',
      'TANIM_KikLimitDonemleri',
      'DATA_TeminDosyasi',
      'DATA_TeminKalem',
      'DATA_TeminFirma',
      'DATA_TeminKalemTeklif',
      'DATA_TeminKomisyon',
      'DATA_TeminBelge',
      'DATA_TIF',
      'DATA_TIF_Kalem',
      'DATA_AmbarStok',
      'DATA_AmbarHareket',
      'DATA_DosyaSablonVeri',
      'DATA_NotVeGorev',
      'DATA_IhtiyacRaporu',
      'DATA_IhtiyacRaporuKalem',
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

  it('should have correct columns in DATA_TeminDosyasi and TANIM_ButceOdenek', () => {
    const teminDosyasi = schema.tables.find((t: any) => t.name === 'DATA_TeminDosyasi')
    expect(teminDosyasi).toBeDefined()
    const teminCols = new Set(teminDosyasi!.columns.map((c: any) => c.name))
    expect(teminCols.has('birim'), 'DATA_TeminDosyasi must have "birim" column').toBe(true)
    expect(
      teminCols.has('harcama_birimi'),
      'DATA_TeminDosyasi must have "harcama_birimi" column'
    ).toBe(true)
    expect(teminCols.has('butce_yili'), 'DATA_TeminDosyasi must have "butce_yili" column').toBe(
      true
    )
    expect(teminCols.has('tur'), 'DATA_TeminDosyasi must have "tur" column').toBe(true)

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

  it('should rollback transaction and preserve dbSchemaVersion when a migration step fails in real SQLite', () => {
    const { rawDb, db } = createRealSqliteDb()

    // 1. Initial database setup at version 10 with existing data
    rawDb.exec(`
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO settings (key, value) VALUES ('dbSchemaVersion', '10');
      INSERT INTO schema_migrations (version, applied_at) VALUES (10, '2026-01-01 10:00:00');
      CREATE TABLE test_data (id INTEGER PRIMARY KEY, status TEXT);
      INSERT INTO test_data (id, status) VALUES (1, 'original_state');
    `)

    // Verify initial version
    const initialVersion = (
      rawDb.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as {
        value: string
      }
    )?.value
    expect(initialVersion).toBe('10')

    const faultySchema = {
      tables: [
        {
          name: 'TANIM_OlcuBirimi',
          columns: [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'ad', type: 'TEXT', notNull: true }
          ]
        }
      ]
    }

    // Simulate an execution with an invalid SQL command that fails inside the migration transaction
    const faultyExecDb = {
      ...db,
      exec: (sql: string) => {
        if (sql.includes('TANIM_OlcuBirimi')) {
          // Trigger a real SQLite syntax error inside the migration transaction
          rawDb.exec('THIS IS AN INVALID SYNTAX COMMAND THAT SQLITE FAILS ON;')
        }
        rawDb.exec(sql)
      }
    }

    expect(() => {
      runMigrations(faultyExecDb as any, 10, faultySchema)
    }).toThrow()

    // 2. Verify Rollback:
    // - dbSchemaVersion must NOT have been updated to 11 or later
    const versionAfterFail = (
      rawDb.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as {
        value: string
      }
    )?.value
    expect(versionAfterFail).toBe('10')

    // - The table created in failed step must NOT exist (rolled back)
    const tableExists = rawDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='TANIM_OlcuBirimi'")
      .get()
    expect(tableExists).toBeUndefined()

    // - Original data must still be intact
    const originalRow = rawDb.prepare("SELECT status FROM test_data WHERE id = 1").get() as {
      status: string
    }
    expect(originalRow?.status).toBe('original_state')
  })

  it('should enforce distinct table ownership across Temin 360, İhale 360 and 2886', () => {
    // 1. Doğrudan Temin (Temin 360) tabloları
    expect(DOGRUDAN_TEMIN_TABLE_NAMES.size).toBeGreaterThan(5)
    expect(DOGRUDAN_TEMIN_TABLE_NAMES.has('DATA_TeminDosyasi')).toBe(true)
    expect(DOGRUDAN_TEMIN_TABLE_NAMES.has('DATA_TeminKalem')).toBe(true)
    expect(DOGRUDAN_TEMIN_TABLE_NAMES.has('DATA_TeminFirma')).toBe(true)

    // 2. İhale 360 tabloları
    expect(IHALE_SPECIFIC_TABLE_NAMES.size).toBeGreaterThan(0)
    expect(IHALE_SPECIFIC_TABLE_NAMES.has('DATA_IhaleDosyasi')).toBe(true)
    expect(IHALE_SPECIFIC_TABLE_NAMES.has('DATA_IhaleKalem')).toBe(true)
    expect(IHALE_SPECIFIC_TABLE_NAMES.has('DATA_IhaleFirma')).toBe(true)

    // 3. Kesin ayrım (Disjoint sets): Temin tabloları ile İhale tabloları ASLA kesişmemelidir
    for (const ihaleTable of IHALE_SPECIFIC_TABLE_NAMES) {
      expect(
        DOGRUDAN_TEMIN_TABLE_NAMES.has(ihaleTable),
        `Table "${ihaleTable}" cannot belong to Doğrudan Temin specific set`
      ).toBe(false)
    }

    // 4. Paylaşılan kurumsal temel tablolar (TANIM_Kurum, TANIM_Birim, TANIM_Personel vb.)
    expect(sharedFoundationTables.length).toBeGreaterThan(15)
    const sharedNames = new Set(sharedFoundationTables.map((t) => t.name))
    expect(sharedNames.has('TANIM_Kurum')).toBe(true)
    expect(sharedNames.has('TANIM_Personel')).toBe(true)
    expect(sharedNames.has('LOG_SystemLog')).toBe(true)
  })

  it('should establish compatibility views on İhale 360 database without errors and route writes', () => {
    const { rawDb, db } = createRealSqliteDb()

    // Setup physical Ihale tables
    rawDb.exec(`
      CREATE TABLE DATA_IhaleDosyasi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ihale_kayit_no TEXT,
        dosya_no TEXT,
        temin_no TEXT,
        konu TEXT,
        is_tanimi TEXT,
        is_adi TEXT,
        alim_turu TEXT,
        tur TEXT,
        ihale_usulu TEXT,
        ihale_tipi TEXT,
        yaklasik_maliyet REAL,
        toplam_tutar REAL,
        sozlesme_bedeli REAL,
        durum TEXT,
        durum_asama_id INTEGER,
        asama TEXT,
        birim_id INTEGER,
        harcama_birimi TEXT,
        birim TEXT,
        firma_id INTEGER,
        created_at DATETIME,
        updated_at DATETIME,
        is_deleted INTEGER,
        tarih DATE,
        dosya_acilis_tarihi DATE
      );
      CREATE TABLE DATA_IhaleKalem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ihale_dosya_id INTEGER,
        temin_dosya_id INTEGER,
        sira_no INTEGER,
        kalem_adi TEXT,
        aciklama TEXT,
        tasinir_kod_id TEXT,
        okas_kodu TEXT,
        poz_no TEXT,
        olcu_birimi TEXT,
        birim TEXT,
        miktar REAL,
        yaklasik_birim_fiyat REAL,
        yaklasik_toplam_tutar REAL,
        kdv_orani REAL,
        created_at DATETIME,
        updated_at DATETIME
      );
      CREATE TABLE DATA_IhaleFirma (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ihale_dosya_id INTEGER,
        temin_dosya_id INTEGER,
        firma_id INTEGER,
        teklif_tutari REAL,
        kdv_haric_toplam REAL,
        kazandi_mi INTEGER,
        kazanan_mi INTEGER,
        sira_no INTEGER,
        aciklama TEXT,
        created_at DATETIME,
        updated_at DATETIME
      );
    `)

    // Call ensureIhaleCompatibilityViews on real database
    expect(() => {
      ensureIhaleCompatibilityViews(db as any)
    }).not.toThrow()

    // Verify Views exist and are queryable
    const viewRow = rawDb
      .prepare("SELECT type FROM sqlite_master WHERE name = 'DATA_TeminDosyasi'")
      .get() as { type?: string }
    expect(viewRow?.type).toBe('view')

    // Test writing to DATA_TeminDosyasi through INSTEAD OF INSERT trigger
    rawDb.exec(`
      INSERT INTO DATA_TeminDosyasi (temin_no, konu, yaklasik_maliyet)
      VALUES ('2026/DT-001', 'Test İhale Uyumluluk Dosyası', 75000);
    `)

    // Verify data landed in physical DATA_IhaleDosyasi table!
    const inserted = rawDb
      .prepare("SELECT * FROM DATA_IhaleDosyasi WHERE temin_no = '2026/DT-001'")
      .get() as any
    expect(inserted).toBeDefined()
    expect(inserted.konu).toBe('Test İhale Uyumluluk Dosyası')
    expect(inserted.yaklasik_maliyet).toBe(75000)
  })

  it('should tolerate idempotent already-exists or duplicate-column errors during migration', () => {
    const dbLike: any = {
      exec: (sql: string) => {
        if (sql.includes('ALTER TABLE')) {
          throw new Error('duplicate column name: test_col')
        }
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
  })
})
