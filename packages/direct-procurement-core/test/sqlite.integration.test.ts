import { beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { Money } from '@temin360/domain'
import { BetterSqliteExecutor, composeDirectProcurement, DomainError } from '../src'

// Gerçek tablo tanımları (uygulamanın kendi şeması) -> DDL
import { DATA_TeminDosyasi } from '../../database/src/tables/DATA_TeminDosyasi'
import { DATA_TeminKalem } from '../../database/src/tables/DATA_TeminKalem'
import { DATA_TeminFirma } from '../../database/src/tables/DATA_TeminFirma'
import { DATA_TeminKalemTeklif } from '../../database/src/tables/DATA_TeminKalemTeklif'
import { DATA_TeminBelge } from '../../database/src/tables/DATA_TeminBelge'
import { TANIM_Firma } from '../../database/src/tables/TANIM_Firma'
import { TANIM_Asama } from '../../database/src/tables/TANIM_Asama'
import { TANIM_Mevzuat } from '../../database/src/tables/TANIM_Mevzuat'
import { LOG_SystemLog } from '../../database/src/tables/LOG_SystemLog'

const AT = '2026-11-17'

/** packages/database/src/index.ts içindeki DDL üreticisinin aynısı (sütun tanımı kısmı). */
function createTable(db: Database.Database, t: any) {
  const cols = t.columns.map((c: any) => {
    let d = `"${c.name}" ${c.type}`
    if (c.primaryKey) d += ' PRIMARY KEY'
    if (c.autoIncrement) d += ' AUTOINCREMENT'
    if (c.unique) d += ' UNIQUE'
    if (c.notNull) d += ' NOT NULL'
    if (c.default !== undefined) {
      let v = c.default
      if (typeof v === 'string') {
        const x = v.trim()
        const raw = ['CURRENT_TIMESTAMP', 'NULL', 'CURRENT_DATE', 'CURRENT_TIME'].includes(x.toUpperCase())
          || (x.startsWith("'") && x.endsWith("'")) || !isNaN(Number(x))
        if (!raw) v = `'${x.replace(/'/g, "''")}'`
      }
      d += ' DEFAULT ' + v
    }
    return d
  }).join(', ')
  const cons = t.constraints ? ', ' + t.constraints.join(', ') : ''
  db.exec(`CREATE TABLE IF NOT EXISTS ${t.name} (${cols}${cons});`)
  for (const row of t.initialData ?? []) {
    const keys = Object.keys(row)
    db.prepare(`INSERT OR IGNORE INTO ${t.name} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => row[k]))
  }
}

let db: Database.Database
let app: ReturnType<typeof composeDirectProcurement>

beforeEach(() => {
  db = new Database(':memory:')
  ;[TANIM_Firma, DATA_TeminDosyasi, DATA_TeminKalem, DATA_TeminFirma, DATA_TeminKalemTeklif, DATA_TeminBelge, TANIM_Asama, TANIM_Mevzuat, LOG_SystemLog]
    .forEach((t) => createTable(db, t))

  ;[100, 101, 102].forEach((id) => db.prepare('INSERT INTO TANIM_Firma (id, unvan) VALUES (?, ?)').run(id, `Master ${id}`))

  // Mevcut ekranların oluşturduğu dosya kartı
  db.prepare("INSERT INTO DATA_TeminDosyasi (id, konu, dosya_acilis_tarihi, ihale_tipi, tur) VALUES (348, 'Yedek parça alımı', ?, 'Doğrudan Temin', 'mal')").run(AT)
  const kalem = db.prepare("INSERT INTO DATA_TeminKalem (id, temin_dosya_id, sira_no, kalem_adi, miktar, birim, kdv_orani) VALUES (?, 348, ?, ?, ?, 'Adet', 20)")
  kalem.run(1, 1, 'King Post Keçesi', 1); kalem.run(2, 2, 'Kapı Amortisörü', 2)
  const firma = db.prepare('INSERT INTO DATA_TeminFirma (id, temin_dosya_id, firma_id, unvan) VALUES (?, 348, ?, ?)')
  firma.run(10, 100, 'A Ltd'); firma.run(11, 101, 'B Ltd'); firma.run(12, 102, 'C Ltd')
  const belge = db.prepare("INSERT INTO DATA_TeminBelge (temin_dosya_id, belge_adi, durum) VALUES (348, ?, ?)")
  belge.run('Piyasa Fiyat Araştırma Tutanağı', 'tamamlandi')
  belge.run('Yaklaşık Maliyet Hesap Cetveli', 'hazirlaniyor') // taslak: dokunulmamalı
  belge.run('Sonuç Onay Belgesi', 'tamamlandi') // araştırma belgesi değil: dokunulmamalı

  app = composeDirectProcurement(new BetterSqliteExecutor(db as never))
})

const prefsOf = () => JSON.parse((db.prepare('SELECT sablon_tercihleri p FROM DATA_TeminDosyasi WHERE id = 348').get() as { p: string }).p)

const quote = (item: number, bidder: number, tl: string) =>
  app.enterQuote.execute({ fileId: 348, itemId: item, bidderId: bidder, unitPriceTL: tl, at: AT })

async function allQuotesAndWinner() {
  await quote(1, 10, '22970.00'); await quote(2, 10, '400.00')
  await quote(1, 11, '23000.00'); await quote(2, 11, '450.00')
  return app.selectWinner.execute({ fileId: 348, at: AT })
}

describe('SqliteFileRepository (gerçek tablo şemasıyla)', () => {
  it('mevcut kartı aggregate olarak okur', async () => {
    const f = (await app.repo.findById(348))!
    expect(f.subject).toBe('Yedek parça alımı')
    expect(f.items.map((i) => i.name)).toEqual(['King Post Keçesi', 'Kapı Amortisörü'])
    expect(f.bidders).toHaveLength(3)
    expect(f.profile.id).toBe('dogrudan-temin')
  })

  it('olmayan dosya: undefined; başka tür: PROFILE_UNSUPPORTED', async () => {
    expect(await app.repo.findById(999)).toBeUndefined()
    db.prepare("UPDATE DATA_TeminDosyasi SET ihale_tipi = 'Açık İhale' WHERE id = 348").run()
    await expect(app.repo.findById(348)).rejects.toMatchObject({ code: 'PROFILE_UNSUPPORTED' })
  })

  it('teklifler kalıcı olur, firma toplamı mevcut ekranla aynı biçimde yazılır', async () => {
    await quote(1, 10, '22970.00'); await quote(2, 10, '400.00')
    const rows = db.prepare('SELECT temin_kalem_id k, birim_fiyat p FROM DATA_TeminKalemTeklif ORDER BY k').all()
    expect(rows).toEqual([{ k: 1, p: 22970 }, { k: 2, p: 400 }])
    const firma = db.prepare('SELECT teklif_toplami t, teklif_verdi_mi v, teklif_durumu d FROM DATA_TeminFirma WHERE id = 10').get()
    expect(firma).toEqual({ t: 23770, v: 1, d: 'Teklif Verildi' })
    // aynı fiyatı güncelleyince çift satır oluşmaz (INSERT OR REPLACE sözleşmesi)
    await quote(1, 10, '23000.00')
    expect(db.prepare('SELECT COUNT(*) n FROM DATA_TeminKalemTeklif WHERE temin_firma_id = 10').get()).toEqual({ n: 2 })
  })

  it('kazanan winnerSyncService ile aynı alanlara yazılır', async () => {
    const w = await allQuotesAndWinner()
    expect(w.bidderId).toBe(10)
    expect(db.prepare('SELECT firma_id f FROM DATA_TeminDosyasi WHERE id = 348').get()).toEqual({ f: 100 }) // master firma
    expect(db.prepare('SELECT id, kazandi_mi a, kazanan_mi b FROM DATA_TeminFirma ORDER BY id').all()).toEqual([
      { id: 10, a: 1, b: 1 }, { id: 11, a: 0, b: 0 }, { id: 12, a: 0, b: 0 },
    ])
    expect((await app.repo.findById(348))!.winnerId).toBe(10)
  })

  it('kayıt olmayan dosyayı yazmaz', async () => {
    const f = (await app.repo.findById(348))!
    db.prepare('DELETE FROM DATA_TeminKalemTeklif').run()
    db.prepare('DELETE FROM DATA_TeminDosyasi').run()
    await expect(app.repo.save(f)).rejects.toMatchObject({ code: 'FILE_NOT_PERSISTABLE' })
    expect(DomainError).toBeDefined()
  })
})

describe('olay tepkileri (FileReactionManager)', () => {
  it('teklif değişince yalnızca TAMAMLANMIŞ araştırma belgeleri "beklemede" olur', async () => {
    await quote(1, 10, '22970.00')
    const rows = db.prepare('SELECT belge_adi n, durum d, bekleme_nedeni r FROM DATA_TeminBelge ORDER BY id').all() as any[]
    expect(rows[0]).toMatchObject({ d: 'beklemede', r: 'Teklif fiyatı değişti, belgeyi yeniden üretin.' })
    expect(rows[1].d).toBe('hazirlaniyor')
    expect(rows[2].d).toBe('tamamlandi')
  })

  it('sonuç onayı: aşama 3e ilerler, denetim kaydı düşer, KİLİT kalıcıdır', async () => {
    await allQuotesAndWinner()
    await app.approveResult.execute({ fileId: 348, at: AT })

    const stage = db.prepare('SELECT a.asama_sira s FROM DATA_TeminDosyasi d JOIN TANIM_Asama a ON a.id = d.durum_asama_id WHERE d.id = 348').get()
    expect(stage).toEqual({ s: 3 })
    expect(db.prepare("SELECT message m FROM LOG_SystemLog WHERE message LIKE '%kilitlendi%'").all()).toHaveLength(1)

    // uygulama yeniden açılmış gibi: kilit DB'den geri gelir
    await expect(quote(1, 10, '1.00')).rejects.toMatchObject({ code: 'LOCKED' })
  })

  it('kabul: parçalı teslim kalıcı, aşama 4e ilerler, taslaklar onaya kadar düşmez', async () => {
    await allQuotesAndWinner()
    await app.approveResult.execute({ fileId: 348, at: AT })
    const seq = await app.recordAcceptance.execute({ fileId: 348, date: AT, lines: [{ itemId: 2, quantity: 1 }] })
    expect((await app.repo.findById(348))!.remainingQuantities().get(2)).toBe(2) // taslak düşmez
    await app.approveAcceptance.execute({ fileId: 348, seqNo: seq, at: AT })

    const f = (await app.repo.findById(348))!
    expect(f.remainingQuantities().get(2)).toBe(1)
    expect(f.acceptances[0]!.status).toBe('approved')
    expect(db.prepare('SELECT a.asama_sira s FROM DATA_TeminDosyasi d JOIN TANIM_Asama a ON a.id = d.durum_asama_id WHERE d.id = 348').get()).toEqual({ s: 4 })

    // mevcut depo biçimi: sablon_tercihleri.kabulTutanaklari (KabulTutanakItem)
    const prefs = prefsOf()
    expect(prefs.kabulTutanaklari).toHaveLength(1)
    expect(prefs.kabulTutanaklari[0]).toMatchObject({
      tutanakNo: 'KT-2026-001', onaylandi: true, onayTarihi: AT,
      kalemler: [{ siraNo: 2, malzemeAdi: 'Kapı Amortisörü', miktari: 2, kabulMiktari: 1, toplamTeslimAlinan: 1 }],
    })
    expect(prefs.sonucOnayDurumu).toEqual({ onaylandi: true, tarih: AT })
  })

  it('mevcut ekranın yazdığı tutanak alanları ve diğer JSON anahtarları KORUNUR', async () => {
    await allQuotesAndWinner()
    await app.approveResult.execute({ fileId: 348, at: AT })
    // UI daha önce bir tutanak (onaysız) ve fatura listesi yazmış
    const ui = {
      faturalar: [{ faturaNo: 'F-1' }],
      kabulTutanaklari: [{
        id: 'ui-1', tutanakNo: 'KT-2026-001', tutanakTarihi: AT, durum: 'kabul', onaylandi: false,
        faturaNo: 'DMA2026000000108', irsaliyeNo: 'IR-5', teslimYeri: 'Merkez Ambarı', islenmisMi: false,
        kalemler: [{ siraNo: 2, malzemeAdi: 'Kapı Amortisörü', ozelligi: '', birimi: 'Adet', miktari: 2, toplamTeslimAlinan: 2, kabulMiktari: 2 }],
      }],
    }
    db.prepare('UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = 348').run(JSON.stringify(ui))

    const f = (await app.repo.findById(348))!
    expect(f.acceptances).toHaveLength(1)
    expect(f.acceptances[0]!.status).toBe('draft')
    expect(f.acceptances[0]!.lines).toEqual([{ itemId: 2, quantity: 2 }])

    await app.approveAcceptance.execute({ fileId: 348, seqNo: 1, at: AT })
    const prefs = prefsOf()
    expect(prefs.faturalar).toEqual([{ faturaNo: 'F-1' }]) // dokunulmadı
    expect(prefs.kabulTutanaklari[0]).toMatchObject({
      id: 'ui-1', onaylandi: true, onayTarihi: AT, faturaNo: 'DMA2026000000108', irsaliyeNo: 'IR-5',
      teslimYeri: 'Merkez Ambarı', islenmisMi: false, // UI alanları korundu
    })
  })

  it('değişiklik yoksa sablon_tercihleri yeniden yazılmaz', async () => {
    await quote(1, 10, '22970.00') // tutanak / onay yok
    expect(db.prepare('SELECT sablon_tercihleri p FROM DATA_TeminDosyasi WHERE id = 348').get()).toEqual({ p: '{}' }) // varsayılan, dokunulmadı
  })

  it('is_locked=1 dosya aggregate için salt okunurdur (kabul dahil)', async () => {
    await allQuotesAndWinner()
    await app.approveResult.execute({ fileId: 348, at: AT })
    db.prepare("UPDATE DATA_TeminDosyasi SET is_locked = 1, lock_reason = 'eski_aktarim_imzali' WHERE id = 348").run()
    await expect(app.recordAcceptance.execute({ fileId: 348, date: AT, lines: [{ itemId: 1, quantity: 1 }] }))
      .rejects.toMatchObject({ code: 'FILE_LOCKED', message: expect.stringContaining('eski_aktarim_imzali') })
    await expect(quote(1, 10, '1.00')).rejects.toMatchObject({ code: 'FILE_LOCKED' })
  })

  it('aşama geri alınmaz: onaydan sonra gelen eski olay aşamayı düşürmez', async () => {
    await allQuotesAndWinner()
    await app.approveResult.execute({ fileId: 348, at: AT })
    db.prepare('UPDATE DATA_TeminDosyasi SET durum_asama_id = (SELECT id FROM TANIM_Asama WHERE asama_sira = 4) WHERE id = 348').run()
    await app.approveResult.execute({ fileId: 348, at: AT }).catch(() => {}) // zaten kilitli, hata beklenir
    expect(db.prepare('SELECT a.asama_sira s FROM DATA_TeminDosyasi d JOIN TANIM_Asama a ON a.id = d.durum_asama_id WHERE d.id = 348').get()).toEqual({ s: 4 })
  })

  it('bir tepki çökerse dosya kaydı geri alınmaz, hata LOG e yazılır', async () => {
    db.exec('DROP TABLE DATA_TeminBelge') // belge tepkisi çökecek
    await quote(1, 10, '22970.00')
    expect(db.prepare('SELECT COUNT(*) n FROM DATA_TeminKalemTeklif').get()).toEqual({ n: 1 }) // teklif yazıldı
    const err = db.prepare("SELECT title t FROM LOG_SystemLog WHERE type = 'error'").all() as any[]
    expect(err.map((e) => e.t)).toContain('Olay işleyici hatası: belgeleri-bayatla')
  })
})

describe('mevzuat oranları gerçek tablodan', () => {
  it('TANIM_Mevzuat yıl satırını okur; doğrudan temin kesintisi yine boş', async () => {
    db.prepare('INSERT OR REPLACE INTO TANIM_Mevzuat (yil, karar_pulu_orani, damga_vergisi_orani) VALUES (2026, 5.69, 9.48)').run()
    await allQuotesAndWinner()
    expect(await app.calculateDeductions.execute({ fileId: 348, date: AT })).toEqual([])
    expect(Money.ZERO.isNegative()).toBe(false)
  })
})
