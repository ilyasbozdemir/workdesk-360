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
})
