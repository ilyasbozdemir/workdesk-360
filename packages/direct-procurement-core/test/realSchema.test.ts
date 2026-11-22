import { it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { initializeDatabase } from '../../database/src/index'
import { BetterSqliteExecutor, composeDirectProcurement } from '../src'

it('GERÇEK şema (initializeDatabase) üzerinde uçtan uca', async () => {
  const db = new Database(':memory:')
  initializeDatabase(db, 'Test Belediyesi', '1.0.0-rc.23', 'temin360-desktop')
  const cols = (db.prepare("PRAGMA table_info('DATA_TeminDosyasi')").all() as any[]).map((c) => c.name)
  expect(cols).toContain('is_locked')

  const firmaId = (db.prepare("SELECT id FROM TANIM_Firma LIMIT 1").get() as any)?.id ?? (db.prepare("INSERT INTO TANIM_Firma (unvan) VALUES ('Master')").run().lastInsertRowid as number)
  db.prepare("INSERT INTO DATA_TeminDosyasi (id, konu, dosya_acilis_tarihi, ihale_tipi, tur) VALUES (348, 'Yedek parça', '2026-11-17', 'Doğrudan Temin', 'mal')").run()
  db.prepare("INSERT INTO DATA_TeminKalem (id, temin_dosya_id, sira_no, kalem_adi, miktar, birim, kdv_orani) VALUES (1, 348, 1, 'Keçe', 1, 'Adet', 20)").run()
  db.prepare("INSERT INTO DATA_TeminKalem (id, temin_dosya_id, sira_no, kalem_adi, miktar, birim, kdv_orani) VALUES (2, 348, 2, 'Amortisör', 2, 'Adet', 20)").run()
  for (const id of [10, 11]) db.prepare('INSERT INTO DATA_TeminFirma (id, temin_dosya_id, firma_id, unvan) VALUES (?, 348, ?, ?)').run(id, firmaId, `F${id}`)

  const app = composeDirectProcurement(new BetterSqliteExecutor(db as never))
  const at = '2026-11-17'
  for (const [i, b, p] of [[1, 10, '100.00'], [2, 10, '50.00'], [1, 11, '110.00'], [2, 11, '55.00']] as const)
    await app.enterQuote.execute({ fileId: 348, itemId: i, bidderId: b, unitPriceTL: p, at })
  expect((await app.selectWinner.execute({ fileId: 348, at })).bidderId).toBe(10)
  await app.approveResult.execute({ fileId: 348, at })
  const seq = await app.recordAcceptance.execute({ fileId: 348, date: at, lines: [{ itemId: 2, quantity: 1 }] })
  await app.approveAcceptance.execute({ fileId: 348, seqNo: seq, at })

  const f = (await app.repo.findById(348))!
  expect(f.remainingQuantities().get(2)).toBe(1)
  expect(db.prepare('SELECT COUNT(*) n FROM DATA_TeminKalemTeklif').get()).toEqual({ n: 4 })
  console.log('LOG kayıtları:', (db.prepare('SELECT COUNT(*) n FROM LOG_SystemLog').get() as any).n)
})
