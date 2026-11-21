// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'
import { composeDirectProcurement } from '@temin360/temin-direct'
import { MainSqlExecutor, type MainDb, type WorkspaceLike } from '../MainSqlExecutor'

// node:sqlite (Node 22+) bazı vitest sürümlerinde doğrudan import edilemez; require ile yüklenir.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite')
type DatabaseSync = InstanceType<typeof DatabaseSync>

const SCHEMA = `
  CREATE TABLE T (id INTEGER PRIMARY KEY, v TEXT NOT NULL);
  CREATE TABLE DATA_TeminDosyasi (id INTEGER PRIMARY KEY, konu TEXT, dosya_acilis_tarihi TEXT, ihale_tipi TEXT,
    firma_id INTEGER, is_deleted INTEGER DEFAULT 0, durum_asama_id INTEGER,
    is_locked INTEGER DEFAULT 0, lock_reason TEXT, sablon_tercihleri TEXT DEFAULT '{}');
  CREATE TABLE DATA_TeminKalem (id INTEGER PRIMARY KEY, temin_dosya_id INTEGER, sira_no INTEGER, kalem_adi TEXT,
    miktar REAL, birim TEXT, kdv_orani REAL);
  CREATE TABLE DATA_TeminFirma (id INTEGER PRIMARY KEY, temin_dosya_id INTEGER, firma_id INTEGER, unvan TEXT,
    vergi_no TEXT, aktif_mi INTEGER DEFAULT 1, kazandi_mi INTEGER DEFAULT 0, kazanan_mi INTEGER DEFAULT 0,
    teklif_toplami REAL, teklif_verdi_mi INTEGER, teklif_durumu TEXT);
  CREATE TABLE DATA_TeminKalemTeklif (id INTEGER PRIMARY KEY AUTOINCREMENT, temin_dosya_id INTEGER,
    temin_kalem_id INTEGER, temin_firma_id INTEGER, birim_fiyat REAL, kdv_tutari REAL, teklif_verildi_mi INTEGER);
  CREATE TABLE DATA_TeminBelge (id INTEGER PRIMARY KEY, temin_dosya_id INTEGER, belge_adi TEXT, durum TEXT, bekleme_nedeni TEXT);
  CREATE TABLE TANIM_Asama (id INTEGER PRIMARY KEY, asama_sira INTEGER);
  CREATE TABLE LOG_SystemLog (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, message TEXT, type TEXT);
`

type Mutation = [string, string, number]
interface FakeWorkspace extends WorkspaceLike {
  state: { mutations: Mutation[]; dirty: boolean; saveFails: boolean }
  save: ReturnType<typeof vi.fn<() => void>>
}

let db: DatabaseSync
let ws: FakeWorkspace
let warnings: string[]
let exec: MainSqlExecutor

beforeEach(() => {
  db = new DatabaseSync(':memory:')
  db.exec(SCHEMA)
  warnings = []
  const state = { mutations: [] as Mutation[], dirty: false, saveFails: false }
  ws = {
    state,
    save: vi.fn(() => { if (state.saveFails) throw new Error('disk dolu') }),
    getDb: () => db as unknown as MainDb,
    recordMutation: (t, a, c) => { state.mutations.push([t, a, c]); state.dirty = true },
    isDirty: () => state.dirty,
  }
  exec = new MainSqlExecutor(ws, (m) => warnings.push(m))
})

describe('MainSqlExecutor', () => {
  it('query: SELECT çalışır, yazma ifadesi reddedilir', async () => {
    db.exec("INSERT INTO T (id, v) VALUES (1, 'a')")
    expect(await exec.query<{ v: string }>('SELECT v FROM T WHERE id = ?', [1])).toMatchObject([{ v: 'a' }])
    await expect(exec.query("DELETE FROM T")).rejects.toThrow()
  })

  it('transaction: hepsi commit olur, mutation bildirilir, çalışma dosyası kaydedilir', async () => {
    await exec.transaction([
      { sql: 'INSERT INTO T (id, v) VALUES (?, ?)', params: [1, 'a'] },
      { sql: 'INSERT INTO T (id, v) VALUES (?, ?)', params: [2, 'b'] },
    ])
    expect(db.prepare('SELECT COUNT(*) n FROM T').get()).toMatchObject({ n: 2 })
    expect(ws.state.mutations.some(([t, a]) => t === 'T' && a === 'insert')).toBe(true)
    expect(ws.save).toHaveBeenCalledTimes(1)
  })

  it('transaction: biri hata verirse HİÇBİRİ uygulanmaz, mutation ve save yok', async () => {
    await expect(exec.transaction([
      { sql: 'INSERT INTO T (id, v) VALUES (?, ?)', params: [1, 'a'] },
      { sql: 'INSERT INTO T (id, v) VALUES (?, ?)', params: [2, null] }, // NOT NULL ihlali
    ])).rejects.toThrow()
    expect(db.prepare('SELECT COUNT(*) n FROM T').get()).toMatchObject({ n: 0 })
    expect(ws.state.mutations).toHaveLength(0)
    expect(ws.save).not.toHaveBeenCalled()
  })

  it('transaction: sqlGuard yıkıcı DDL ifadesini engeller', async () => {
    await expect(exec.transaction([{ sql: 'DROP TABLE T' }])).rejects.toThrow(/sqlGuard/)
    expect(db.prepare('SELECT COUNT(*) n FROM T').get()).toMatchObject({ n: 0 }) // tablo duruyor
  })

  it('kaydetme hatası: veri commit kalır, hata yerine uyarı verilir', async () => {
    ws.state.saveFails = true
    await exec.transaction([{ sql: 'INSERT INTO T (id, v) VALUES (1, ?)', params: ['a'] }])
    expect(db.prepare('SELECT COUNT(*) n FROM T').get()).toMatchObject({ n: 1 })
    expect(warnings.join(' ')).toMatch(/disk dolu/)
  })

  it('boş ifade listesi hiçbir şey yapmaz', async () => {
    await exec.transaction([])
    expect(ws.save).not.toHaveBeenCalled()
  })
})

describe('temin-direct ile uçtan uca (MainSqlExecutor üzerinden)', () => {
  it('teklif girişi: yazılır, tablo bazında bildirilir, çalışma dosyası kaydedilir', async () => {
    db.exec(`
      INSERT INTO DATA_TeminDosyasi (id, konu, dosya_acilis_tarihi, ihale_tipi) VALUES (348, 'Yedek parça', '2026-11-17', 'Doğrudan Temin');
      INSERT INTO DATA_TeminKalem (id, temin_dosya_id, sira_no, kalem_adi, miktar, birim, kdv_orani) VALUES (1, 348, 1, 'King Post Keçesi', 1, 'Adet', 20);
      INSERT INTO DATA_TeminFirma (id, temin_dosya_id, firma_id, unvan) VALUES (10, 348, 100, 'A Ltd');
      INSERT INTO DATA_TeminBelge (temin_dosya_id, belge_adi, durum) VALUES (348, 'Piyasa Fiyat Araştırma Tutanağı', 'tamamlandi');
    `)
    const app = composeDirectProcurement(exec)
    await app.enterQuote.execute({ fileId: 348, itemId: 1, bidderId: 10, unitPriceTL: '22970.00', at: '2026-11-17' })

    expect(db.prepare('SELECT birim_fiyat p FROM DATA_TeminKalemTeklif').get()).toMatchObject({ p: 22970 })
    expect(db.prepare('SELECT durum d FROM DATA_TeminBelge').get()).toMatchObject({ d: 'beklemede' })
    const tables = new Set(ws.state.mutations.map(([t]) => t))
    expect(tables).toContain('DATA_TeminKalemTeklif')
    expect(tables).toContain('DATA_TeminBelge')
    expect(ws.save).toHaveBeenCalled()
  })
})
