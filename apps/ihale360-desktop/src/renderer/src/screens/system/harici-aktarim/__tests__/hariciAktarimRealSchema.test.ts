// @vitest-environment node
/**
 * Gerçek uygulama şeması entegrasyon testi.
 *
 * Diğer gerçek-SQLite testlerinden farkı: tablolar elle CREATE TABLE ile değil,
 * üretimde .temin dosyası oluşturulurken kullanılan `initializeDatabase` (@dt/database)
 * ile kurulur. Böylece gerçek kolonlar, NOT NULL / UNIQUE / FK kısıtları ve varsayılanlar
 * üzerinde harici aktarım servisinin yazdığı SQL'ler doğrulanır.
 * SQL guard (validateSql) üretimdeki gibi AÇIK bırakılır.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { initializeDatabase } from '@dt/database'
import { handleDbTransaction } from '../../../../../../main/ipc/db/dbTransaction'
import { executeDossierEzmeSync, parseDogrudanTeminJson } from '../hariciAktarimService'
import { SAMPLE_HARICI_DT_JSON } from '../sampleData'
import type { SyncOptions } from '../types'

const ALL_OPTIONS: SyncOptions = {
  overwriteGeneralInfo: true,
  overwriteMaterials: true,
  overwriteOffers: true,
  overwriteCommissions: true,
  createNewIfNotFound: false
}

/** node:sqlite'ta olmayan better-sqlite3 `transaction()` API'si için ince bir uyarlayıcı. */
function withTransactionShim(db: DatabaseSync): DatabaseSync {
  const anyDb = db as any
  if (!anyDb.transaction) {
    anyDb.transaction =
      <T extends unknown[]>(fn: (...args: T) => void) =>
      (...args: T) => {
        db.exec('BEGIN')
        try {
          fn(...args)
          db.exec('COMMIT')
        } catch (e) {
          db.exec('ROLLBACK')
          throw e
        }
      }
  }
  return db
}

describe('Gerçek uygulama şeması (@dt/database initializeDatabase) ile harici aktarım', () => {
  let db: DatabaseSync
  let originalWindow: unknown

  beforeEach(() => {
    db = withTransactionShim(new DatabaseSync(':memory:'))
    db.exec('PRAGMA foreign_keys = ON;')
    initializeDatabase(db as any, 'Şema Entegrasyon Test Kurumu', '1.0.0-test')

    originalWindow = (globalThis as any).window
    ;(globalThis as any).window = {
      electron: {
        ipcRenderer: {
          invoke: async (channel: string, arg1: unknown, arg2: unknown) => {
            if (channel === 'db:transaction') {
              // Üretimdeki gibi SQL guard açık
              return await handleDbTransaction(db as any, arg1 as any)
            }
            if (channel === 'db:run') {
              try {
                const info = db.prepare(arg1 as string).run(...((arg2 as any[]) || []))
                return {
                  success: true,
                  lastInsertRowid: Number(info.lastInsertRowid),
                  changes: Number(info.changes)
                }
              } catch (err: any) {
                return { success: false, error: err.message }
              }
            }
            if (channel === 'db:query') {
              // Gerçek şemada sorgu hatası testi geçersiz kılmasın diye hatayı yut**ma**
              return db.prepare(arg1 as string).all(...((arg2 as any[]) || []))
            }
            return { success: true }
          }
        }
      }
    }
  })

  afterEach(() => {
    ;(globalThis as any).window = originalWindow
    try {
      db.close()
    } catch {
      /* noop */
    }
  })

  it('örnek JSON ile YENİ dosya oluşturur; tüm alt kayıtlar yeni ID\'ye bağlanır ve FK ihlali yoktur', async () => {
    const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
    expect(parsed.success).toBe(true)

    const res = await executeDossierEzmeSync(null, parsed.data!, {
      ...ALL_OPTIONS,
      createNewIfNotFound: true
    })
    expect(res.success).toBe(true)
    const id = res.dosyaId
    expect(id).toBeGreaterThan(0)

    const dosya = db
      .prepare('SELECT temin_no, konu FROM DATA_TeminDosyasi WHERE id = ?')
      .get(id) as any
    expect(dosya.konu).toBe('Su Sayacı Alımı')

    const kalemler = db
      .prepare('SELECT COUNT(*) AS c FROM DATA_TeminKalem WHERE temin_dosya_id = ?')
      .get(id) as any
    expect(kalemler.c).toBe(parsed.data!.malzemeler?.length || 0)

    const komisyon = db
      .prepare('SELECT COUNT(*) AS c FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?')
      .get(id) as any
    expect(komisyon.c).toBeGreaterThan(0)

    // Hiçbir alt kayıt başka/eksik bir dosyaya bağlanmamalı
    const fkErrors = db.prepare('PRAGMA foreign_key_check').all()
    expect(fkErrors).toEqual([])
  })

  it('MEVCUT dosyayı günceller; başka dosyaların kayıtlarına dokunmaz', async () => {
    const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)

    // İki dosya oluştur: biri hedef, diğeri dokunulmaması gereken komşu
    const first = await executeDossierEzmeSync(null, parsed.data!, {
      ...ALL_OPTIONS,
      createNewIfNotFound: true
    })
    const second = await executeDossierEzmeSync(null, parsed.data!, {
      ...ALL_OPTIONS,
      createNewIfNotFound: true
    })
    expect(first.dosyaId).not.toBe(second.dosyaId)

    const komsuKalemOnce = db
      .prepare('SELECT COUNT(*) AS c FROM DATA_TeminKalem WHERE temin_dosya_id = ?')
      .get(second.dosyaId) as any

    const modified = structuredClone(parsed.data!)
    modified.dosyaBilgileri.isinAdi = 'Güncellenmiş İş Adı'

    const upd = await executeDossierEzmeSync(first.dosyaId, modified, ALL_OPTIONS)
    expect(upd.success).toBe(true)
    expect(upd.dosyaId).toBe(first.dosyaId)

    const hedef = db
      .prepare('SELECT konu FROM DATA_TeminDosyasi WHERE id = ?')
      .get(first.dosyaId) as any
    expect(hedef.konu).toBe('Güncellenmiş İş Adı')

    const komsu = db
      .prepare('SELECT konu FROM DATA_TeminDosyasi WHERE id = ?')
      .get(second.dosyaId) as any
    expect(komsu.konu).toBe('Su Sayacı Alımı')

    const komsuKalemSonra = db
      .prepare('SELECT COUNT(*) AS c FROM DATA_TeminKalem WHERE temin_dosya_id = ?')
      .get(second.dosyaId) as any
    expect(komsuKalemSonra.c).toBe(komsuKalemOnce.c)

    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  })

  it('aynı içerikle iki kez yeni dosya aktarımı farklı ID üretir (çakışma yok)', async () => {
    const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
    const [a, b] = await Promise.all([
      executeDossierEzmeSync(null, parsed.data!, { ...ALL_OPTIONS, createNewIfNotFound: true }),
      executeDossierEzmeSync(null, parsed.data!, { ...ALL_OPTIONS, createNewIfNotFound: true })
    ])
    expect(a.success && b.success).toBe(true)
    expect(a.dosyaId).not.toBe(b.dosyaId)
  })

  it('tekrarlanan aktarımlarda TANIM_Firma / TANIM_Personel mükerrer kayıt üretmez', async () => {
    const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
    const opts = { ...ALL_OPTIONS, createNewIfNotFound: true }
    await executeDossierEzmeSync(null, parsed.data!, opts)
    await executeDossierEzmeSync(null, parsed.data!, opts)

    const dupFirma = db
      .prepare('SELECT unvan, COUNT(*) AS c FROM TANIM_Firma GROUP BY unvan HAVING c > 1')
      .all()
    expect(dupFirma).toEqual([])

    const dupPersonel = db
      .prepare('SELECT ad_soyad, COUNT(*) AS c FROM TANIM_Personel GROUP BY ad_soyad HAVING c > 1')
      .all()
    expect(dupPersonel).toEqual([])
  })

  it('kazanan firma: DATA_TeminDosyasi.firma_id TANIM_Firma kaydını gösterir (uygulamadaki JOIN ile uyumlu)', async () => {
    const parsed = parseDogrudanTeminJson(SAMPLE_HARICI_DT_JSON)
    const res = await executeDossierEzmeSync(null, parsed.data!, {
      ...ALL_OPTIONS,
      createNewIfNotFound: true
    })
    const row = db
      .prepare(
        `SELECT d.firma_id, f.unvan FROM DATA_TeminDosyasi d
         LEFT JOIN TANIM_Firma f ON d.firma_id = f.id WHERE d.id = ?`
      )
      .get(res.dosyaId) as any

    const kazanan = parsed.data!.teklifler?.find((t) => t.durum === 'Kabul Edildi')
    if (kazanan) {
      expect(row.firma_id).not.toBeNull()
      expect(row.unvan).toBe(kazanan.firma.trim())
    }
  })
})
