import { describe, it, expect } from 'vitest'
import { schema } from '../../index'
import {
  manifests,
  CURRENT_SCHEMA_VERSION,
  getMaxSchemaVersion,
  runMigrations
} from '@dt/database'

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
})
