import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ihtiyacRaporuService, IhtiyacRaporuKalem } from '../ihtiyacRaporuService'
import {
  mapRaporToLuzumMuzekkeresiData,
  sanitizeMiktar,
  sanitizeKdvOrani,
  sanitizeBirimFiyat
} from '../ihtiyacRaporuAdapter'
import { dbClient } from '../db/dbClient'

describe('ihtiyacRaporuService Tests', () => {
  // In-memory mock database state
  let mockRaporlar: any[] = []
  let mockKalemler: any[] = []
  let mockDosyalar: any[] = []
  let mockTeminKalemler: any[] = []
  let nextRaporId = 1
  let nextKalemId = 1
  let nextTeminKalemId = 1

  beforeEach(() => {
    mockRaporlar = []
    mockKalemler = []
    mockDosyalar = [
      {
        id: 10,
        temin_no: '2026/DT-001',
        dosya_no: '2026/DT-001',
        konu: 'Belediye Hizmet Binası Kırtasiye Alımı',
        tur: 'mal',
        status: 'devam_ediyor'
      }
    ]
    mockTeminKalemler = []
    nextRaporId = 1
    nextKalemId = 1
    nextTeminKalemId = 1

    // Mock dbClient.query
    vi.spyOn(dbClient, 'query').mockImplementation(async (sql: string, params: any[] = []) => {
      // getRaporlar
      if (sql.includes('FROM DATA_IhtiyacRaporu r') && sql.includes('GROUP BY r.id')) {
        let results = mockRaporlar.map((r) => {
          const kCount = mockKalemler.filter((k) => k.rapor_id === r.id).length
          const d = mockDosyalar.find((dosya) => dosya.id === r.temin_dosya_id)
          return {
            ...r,
            kalem_sayisi: kCount,
            dosya_no: d?.temin_no || d?.dosya_no || null,
            dosya_konu: d?.konu || null,
            dosya_tur: d?.tur || null
          }
        })

        if (sql.includes('r.durum = ?')) {
          const durumParam = params[0]
          results = results.filter((r) => r.durum === durumParam)
        }

        if (sql.includes('r.id = ?')) {
          const idParam = params[0]
          results = results.filter((r) => r.id === idParam)
        }

        return results
      }

      // getRaporKalemleri
      if (sql.includes('FROM DATA_IhtiyacRaporuKalem') && sql.includes('WHERE rapor_id = ?')) {
        const rId = params[0]
        return mockKalemler.filter((k) => k.rapor_id === rId)
      }

      // getDosyalarForSelect
      if (sql.includes('FROM DATA_TeminDosyasi')) {
        return mockDosyalar
      }

      // DATA_TeminKalem by temin_dosya_id
      if (sql.includes('FROM DATA_TeminKalem WHERE temin_dosya_id = ?')) {
        const dId = params[0]
        return mockTeminKalemler.filter((tk) => tk.temin_dosya_id === dId)
      }

      return []
    })

    // Mock dbClient.queryFirst
    vi.spyOn(dbClient, 'queryFirst').mockImplementation(async (sql: string, params: any[] = []) => {
      if (sql.includes('WHERE r.id = ?')) {
        const id = params[0]
        const r = mockRaporlar.find((item) => item.id === id)
        if (!r) return null
        const kCount = mockKalemler.filter((k) => k.rapor_id === r.id).length
        const d = mockDosyalar.find((dosya) => dosya.id === r.temin_dosya_id)
        return {
          ...r,
          kalem_sayisi: kCount,
          dosya_no: d?.temin_no || d?.dosya_no || null,
          dosya_konu: d?.konu || null,
          dosya_tur: d?.tur || null,
          dosya_evrak_sayisi: d?.evrak_sayisi || null
        }
      }

      if (sql.includes('FROM DATA_TeminDosyasi WHERE id = ?')) {
        const id = params[0]
        return mockDosyalar.find((d) => d.id === id) || null
      }

      if (sql.includes('SELECT rapor_no FROM DATA_IhtiyacRaporu')) {
        const prefix = (params[0] || '').replace('%', '')
        const matches = mockRaporlar
          .filter((r) => r.rapor_no && String(r.rapor_no).startsWith(prefix))
          .sort((a, b) => b.id - a.id)
        return matches.length > 0 ? { rapor_no: matches[0].rapor_no } : null
      }

      if (sql.includes('MAX(sira_no)')) {
        const dId = params[0]
        const items = mockTeminKalemler.filter((tk) => tk.temin_dosya_id === dId)
        const max = items.reduce((m, i) => Math.max(m, i.sira_no || 0), 0)
        return { max_sira: max }
      }

      return null
    })

    // Mock dbClient.transaction (atomic runner with snapshot rollback simulation)
    vi.spyOn(dbClient, 'transaction').mockImplementation(
      async (statements: { sql: string; params?: any[] }[]) => {
        // 1. Transaction öncesi anlık durum (Snapshot) alınır
        const snapshotRaporlar = JSON.parse(JSON.stringify(mockRaporlar))
        const snapshotTeminKalemler = JSON.parse(JSON.stringify(mockTeminKalemler))
        const snapshotDosyalar = JSON.parse(JSON.stringify(mockDosyalar))

        try {
          for (const stmt of statements) {
            const sql = stmt.sql
            const params = stmt.params || []

            // Simüle edilmiş SQL/Kısıtlama hatası tetikleyici
            if (sql.includes('SIMULATE_SQL_FAILURE')) {
              throw new Error('SQLite SQLITE_CONSTRAINT: foreign key mismatch in transaction')
            }

            if (sql.includes('UPDATE DATA_IhtiyacRaporu SET temin_dosya_id = ?')) {
              const dosyaId = params[0]
              const raporId = params[1]
              const r = mockRaporlar.find((item) => item.id === raporId)
              if (r) {
                r.temin_dosya_id = dosyaId
                r.durum = 'dosyaya_aktarildi'
              }
            } else if (sql.includes('DELETE FROM DATA_TeminKalem WHERE temin_dosya_id = ?')) {
              const dId = params[0]
              mockTeminKalemler = mockTeminKalemler.filter((tk) => tk.temin_dosya_id !== dId)
            } else if (sql.includes('INSERT INTO DATA_TeminKalem')) {
              const id = nextTeminKalemId++
              mockTeminKalemler.push({
                id,
                temin_dosya_id: params[0],
                sira_no: params[1],
                kalem_adi: params[2],
                tipi: params[3],
                birim: params[4],
                miktar: params[5],
                kdv_orani: params[6],
                tasinir_kodu: params[7],
                okas_kodu: params[8],
                poz_no: params[9],
                aciklama: params[10]
              })
            } else if (sql.includes('UPDATE DATA_TeminDosyasi SET')) {
              const dId = params[params.length - 1]
              const d = mockDosyalar.find((item) => item.id === dId)
              if (d && sql.includes('isin_aciklamasi = ?')) {
                d.isin_aciklamasi = params[0]
              }
            }
          }
          return { success: true, changes: statements.length }
        } catch (err) {
          // Rollback: Hata durumunda veritabanı anlık durumuna (snapshot) geri döndürülür
          mockRaporlar = snapshotRaporlar
          mockTeminKalemler = snapshotTeminKalemler
          mockDosyalar = snapshotDosyalar
          throw err
        }
      }
    )

    // Mock dbClient.run
    vi.spyOn(dbClient, 'run').mockImplementation(async (sql: string, params: any[] = []) => {
      if (
        sql.includes('CREATE TABLE') ||
        sql.includes('CREATE INDEX') ||
        sql.includes('ALTER TABLE')
      ) {
        return { success: true, changes: 0 }
      }

      // Insert Kalem (must check before DATA_IhtiyacRaporu)
      if (sql.includes('INSERT INTO DATA_IhtiyacRaporuKalem')) {
        const id = nextKalemId++
        mockKalemler.push({
          id,
          rapor_id: params[0],
          sira_no: params[1],
          kalem_adi: params[2],
          tipi: params[3],
          birim: params[4],
          miktar: params[5],
          kdv_orani: params[6],
          tasinir_kodu: params[7],
          okas_kodu: params[8],
          poz_no: params[9],
          aciklama: params[10],
          tahmini_birim_fiyat: params[11]
        })
        return { success: true, lastInsertRowid: id, changes: 1 }
      }

      // Insert Rapor
      if (sql.includes('INSERT INTO DATA_IhtiyacRaporu (')) {
        const id = nextRaporId++
        const newRecord = {
          id,
          rapor_no: params[0],
          baslik: params[1],
          gerekce: params[2],
          birim_id: params[3],
          birim_adi: params[4],
          talep_eden_personel_id: params[5],
          talep_eden_personel: params[6],
          talep_eden_unvan: params[7],
          durum: params[8],
          temin_dosya_id: params[9],
          tarih: params[10],
          onay_tarihi: params[11],
          tahmini_butce: params[12],
          notlar: params[13],
          evrak_sayisi: params[14]
        }
        mockRaporlar.push(newRecord)
        return { success: true, lastInsertRowid: id, changes: 1 }
      }

      // Delete Kalemler by rapor_id
      if (sql.includes('DELETE FROM DATA_IhtiyacRaporuKalem WHERE rapor_id = ?')) {
        const rId = params[0]
        mockKalemler = mockKalemler.filter((k) => k.rapor_id !== rId)
        return { success: true, changes: 1 }
      }

      // Update Rapor
      if (sql.includes('UPDATE DATA_IhtiyacRaporu SET')) {
        const id = params[params.length - 1]
        const r = mockRaporlar.find((item) => item.id === id)
        if (r) {
          if (sql.includes('temin_dosya_id = ?')) {
            r.temin_dosya_id = params[0]
            if (sql.includes("durum = 'dosyaya_aktarildi'")) {
              r.durum = 'dosyaya_aktarildi'
            }
          }
          if (sql.includes('temin_dosya_id = NULL')) {
            r.temin_dosya_id = null
            r.durum = 'taslak'
          }
        }
        return { success: true, changes: 1 }
      }

      // Delete Rapor
      if (sql.includes('DELETE FROM DATA_IhtiyacRaporu WHERE id = ?')) {
        const id = params[0]
        mockRaporlar = mockRaporlar.filter((r) => r.id !== id)
        mockKalemler = mockKalemler.filter((k) => k.rapor_id !== id)
        return { success: true, changes: 1 }
      }

      // Insert into DATA_TeminKalem
      if (sql.includes('INSERT INTO DATA_TeminKalem')) {
        const id = nextTeminKalemId++
        mockTeminKalemler.push({
          id,
          temin_dosya_id: params[0],
          sira_no: params[1],
          kalem_adi: params[2],
          tipi: params[3],
          birim: params[4],
          miktar: params[5],
          kdv_orani: params[6],
          tasinir_kodu: params[7],
          okas_kodu: params[8],
          poz_no: params[9],
          aciklama: params[10]
        })
        return { success: true, lastInsertRowid: id, changes: 1 }
      }

      return { success: true }
    })
  })

  it('1. should create an independent need report without requiring an active dossier', async () => {
    const kalemler: IhtiyacRaporuKalem[] = [
      {
        kalem_adi: 'A4 Kağıt (80 gr)',
        tipi: 'Mal',
        birim: 'Paket',
        miktar: 100,
        kdv_orani: 20,
        tahmini_birim_fiyat: 150
      },
      {
        kalem_adi: 'Mavi Tükenmez Kalem',
        tipi: 'Mal',
        birim: 'Kutu',
        miktar: 10,
        kdv_orani: 20,
        tahmini_birim_fiyat: 80
      }
    ]

    const newId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/001',
        baslik: '2026 Yılı 1. Çeyrek Kırtasiye İhtiyacı',
        gerekce: 'Müdürlük birimlerimizin günlük idari iş ve işlemlerinin aksamaması için',
        birim_id: 1,
        birim_adi: 'Yazı İşleri Müdürlüğü',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-01',
        onay_tarihi: null,
        tahmini_butce: 15800,
        notlar: 'Bütçe onayına sunulacak'
      },
      kalemler
    )

    expect(newId).toBe(1)
    expect(mockRaporlar.length).toBe(1)
    expect(mockRaporlar[0].temin_dosya_id).toBeNull()
    expect(mockRaporlar[0].durum).toBe('taslak')
    expect(mockKalemler.length).toBe(2)
    expect(mockKalemler[0].kalem_adi).toBe('A4 Kağıt (80 gr)')
  })

  it('2. should list need reports and support detail queries', async () => {
    await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/001',
        baslik: 'Yazıcı Kartuşu İhtiyacı',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-01',
        tahmini_butce: 5000
      },
      [{ kalem_adi: 'Toner', tipi: 'Mal', birim: 'Adet', miktar: 5 }]
    )

    const list = await ihtiyacRaporuService.getRaporlar()
    expect(list.length).toBe(1)
    expect(list[0].kalem_sayisi).toBe(1)

    const detail = await ihtiyacRaporuService.getRaporById(1)
    expect(detail).toBeDefined()
    expect(detail?.baslik).toBe('Yazıcı Kartuşu İhtiyacı')

    const items = await ihtiyacRaporuService.getRaporKalemleri(1)
    expect(items.length).toBe(1)
    expect(items[0].kalem_adi).toBe('Toner')
  })

  it('3. should duplicate a report as a completely independent new record', async () => {
    // Kaynak rapor oluştur
    const origId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/001',
        baslik: 'Yol Bakım Malzemesi',
        gerekce: 'Asfalt yama çalışmaları',
        durum: 'onaylandi',
        temin_dosya_id: 10, // Bağlı dosya var
        tarih: '2026-01-15',
        tahmini_butce: 20000
      },
      [
        {
          kalem_adi: 'Soğuk Asfalt',
          tipi: 'Mal',
          birim: 'Torba',
          miktar: 50,
          tahmini_birim_fiyat: 400
        }
      ]
    )

    // Kopyalama işlemini çalıştır
    const clonedId = await ihtiyacRaporuService.duplicateRapor(origId)

    expect(clonedId).not.toBe(origId)
    expect(mockRaporlar.length).toBe(2)

    const cloned = mockRaporlar.find((r) => r.id === clonedId)
    expect(cloned).toBeDefined()
    expect(cloned.baslik).toBe('Yol Bakım Malzemesi (Kopya)')
    // Klonlanan rapor taslak olmalı ve eski dosya bağlantısı taşınmamalıdır
    expect(cloned.durum).toBe('taslak')
    expect(cloned.temin_dosya_id).toBeNull()

    // Orijinal rapor değişmemelidir
    const original = mockRaporlar.find((r) => r.id === origId)
    expect(original.durum).toBe('onaylandi')
    expect(original.temin_dosya_id).toBe(10)

    // Klonlanan kalemler bağımsız olmalıdır
    const clonedItems = mockKalemler.filter((k) => k.rapor_id === clonedId)
    expect(clonedItems.length).toBe(1)
    expect(clonedItems[0].kalem_adi).toBe('Soğuk Asfalt')
    expect(clonedItems[0].rapor_id).toBe(clonedId)
  })

  it('4. should link report to a dossier and optionally clone items to DATA_TeminKalem', async () => {
    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/002',
        baslik: 'Boya ve Tiner İhtiyacı',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-02-10'
      },
      [
        { kalem_adi: 'İç Cephe Boyası', tipi: 'Mal', birim: 'Kova', miktar: 20, kdv_orani: 20 },
        { kalem_adi: 'Sentetik Tiner', tipi: 'Mal', birim: 'Teneke', miktar: 5, kdv_orani: 20 }
      ]
    )

    // Dosyaya bağla ve kalemleri kopyala
    await ihtiyacRaporuService.linkToDosya(raporId, 10, { copyItemsToDosya: true })

    const updated = mockRaporlar.find((r) => r.id === raporId)
    expect(updated.temin_dosya_id).toBe(10)
    expect(updated.durum).toBe('dosyaya_aktarildi')

    // DATA_TeminKalem'e kopyalanan kalemleri doğrula
    expect(mockTeminKalemler.length).toBe(2)
    expect(mockTeminKalemler[0].temin_dosya_id).toBe(10)
    expect(mockTeminKalemler[0].kalem_adi).toBe('İç Cephe Boyası')
    expect(mockTeminKalemler[1].kalem_adi).toBe('Sentetik Tiner')

    // Rapordaki kendi kalemleri bozulmadan kalmalı
    const repKalemler = mockKalemler.filter((k) => k.rapor_id === raporId)
    expect(repKalemler.length).toBe(2)
  })

  it('5. should unlink report from dossier safely', async () => {
    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/003',
        baslik: 'Bağlantısı Kaldırılacak Rapor',
        durum: 'dosyaya_aktarildi',
        temin_dosya_id: 10,
        tarih: '2026-02-15'
      },
      []
    )

    await ihtiyacRaporuService.unlinkFromDosya(raporId)

    const updated = mockRaporlar.find((r) => r.id === raporId)
    expect(updated.temin_dosya_id).toBeNull()
    expect(updated.durum).toBe('taslak')
  })

  it('6. should delete report and its items', async () => {
    const id = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/004',
        baslik: 'Silinecek Rapor',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-02-20'
      },
      [{ kalem_adi: 'Geçici Kalem', tipi: 'Mal', birim: 'Adet', miktar: 1 }]
    )

    expect(mockRaporlar.length).toBe(1)
    expect(mockKalemler.length).toBe(1)

    await ihtiyacRaporuService.deleteRapor(id)

    expect(mockRaporlar.length).toBe(0)
    expect(mockKalemler.length).toBe(0)
  })

  it('7. should preserve 0% KDV exemption and zero unit price correctly', async () => {
    const kalemler: IhtiyacRaporuKalem[] = [
      {
        kalem_adi: 'KDV Muaf Kitap Alımı',
        tipi: 'Mal',
        birim: 'Adet',
        miktar: 50,
        kdv_orani: 0, // %0 KDV muafiyeti!
        tahmini_birim_fiyat: 100
      },
      {
        kalem_adi: 'Standart Kırtasiye',
        tipi: 'Mal',
        birim: 'Adet',
        miktar: 10,
        kdv_orani: 20,
        tahmini_birim_fiyat: 0 // Sıfır birim fiyat
      }
    ]

    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/005',
        baslik: 'Kültür ve Eğitim Yayınları İhtiyacı',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-01'
      },
      kalemler
    )

    const saved = mockKalemler.filter((k) => k.rapor_id === raporId)
    expect(saved.length).toBe(2)
    // 0% KDV asla 20 ile ezilmemeli!
    expect(saved[0].kdv_orani).toBe(0)
    expect(saved[1].kdv_orani).toBe(20)
    expect(saved[1].tahmini_birim_fiyat).toBe(0)
  })

  it('8. should prevent duplicate items during transfer with append_if_missing', async () => {
    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/006',
        baslik: 'Yedek Parça İhtiyacı',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-05'
      },
      [
        { kalem_adi: 'Hava Filtresi', tipi: 'Mal', birim: 'Adet', miktar: 4, kdv_orani: 20 },
        { kalem_adi: 'Motor Yağı 5W30', tipi: 'Mal', birim: 'Litre', miktar: 20, kdv_orani: 20 }
      ]
    )

    // İlk aktarım: 2 kalem eklenmeli
    const firstResult = await ihtiyacRaporuService.linkToDosya(raporId, 10, {
      copyItemsToDosya: true,
      transferMode: 'append_if_missing'
    })

    expect(firstResult.success).toBe(true)
    expect(firstResult.transferredCount).toBe(2)
    expect(firstResult.skippedCount).toBe(0)
    expect(mockTeminKalemler.length).toBe(2)

    // İkinci aktarım (aynı rapora tekrar bağlama veya aynı kalemleri aktarma):
    // Mükerrerliği önleyip 0 kalem eklemeli, 2 kalemi atlamalı
    const secondResult = await ihtiyacRaporuService.linkToDosya(raporId, 10, {
      copyItemsToDosya: true,
      transferMode: 'append_if_missing'
    })

    expect(secondResult.success).toBe(true)
    expect(secondResult.transferredCount).toBe(0)
    expect(secondResult.skippedCount).toBe(2)
    // Kalem sayısı 2'de kalmalı, mükerrer oluşturulmamalı
    expect(mockTeminKalemler.length).toBe(2)
  })

  it('9. should replace all dossier items when transferMode is replace_all', async () => {
    // Önceden dosyada 1 kalem olsun
    mockTeminKalemler = [
      {
        id: nextTeminKalemId++,
        temin_dosya_id: 10,
        sira_no: 1,
        kalem_adi: 'Eski Kalem',
        tipi: 'Mal',
        birim: 'Adet',
        miktar: 1
      }
    ]

    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/007',
        baslik: 'Yeni Donanım İhtiyacı',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-10'
      },
      [{ kalem_adi: 'Monitor 27 inç', tipi: 'Mal', birim: 'Adet', miktar: 3, kdv_orani: 20 }]
    )

    const res = await ihtiyacRaporuService.linkToDosya(raporId, 10, {
      copyItemsToDosya: true,
      transferMode: 'replace_all'
    })

    expect(res.transferredCount).toBe(1)
    // Eski kalem silinip sadece yeni kalem kalmalı
    expect(mockTeminKalemler.length).toBe(1)
    expect(mockTeminKalemler[0].kalem_adi).toBe('Monitor 27 inç')
  })

  it('10. should execute dossier link and item transfer in a single atomic transaction', async () => {
    const txSpy = vi.spyOn(dbClient, 'transaction')

    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/008',
        baslik: 'Atomik Test Raporu',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-12'
      },
      [{ kalem_adi: 'Atomik Kalem', tipi: 'Mal', birim: 'Adet', miktar: 1 }]
    )

    await ihtiyacRaporuService.linkToDosya(raporId, 10, { copyItemsToDosya: true })

    // dbClient.transaction en az 1 kez ve tüm SQL cümlelerini içeren liste ile çağrılmalıdır
    expect(txSpy).toHaveBeenCalledTimes(1)
    const statements = txSpy.mock.calls[0][0]
    expect(Array.isArray(statements)).toBe(true)
    // Rapor güncelleme ve kalem ekleme aynı transaction dizisinde olmalıdır
    const hasReportUpdate = statements.some((s) => s.sql.includes('UPDATE DATA_IhtiyacRaporu'))
    const hasKalemInsert = statements.some((s) => s.sql.includes('INSERT INTO DATA_TeminKalem'))
    expect(hasReportUpdate).toBe(true)
    expect(hasKalemInsert).toBe(true)
  })

  it('11. should match items using multi-field key (name, type, unit, codes, description) so distinct items with same name are not lost', async () => {
    // Hedef dosyada mevcut bir kalem olsun: Bakır Kablo (2.5mm²)
    mockTeminKalemler = [
      {
        id: nextTeminKalemId++,
        temin_dosya_id: 10,
        sira_no: 1,
        kalem_adi: 'Bakır Kablo',
        tipi: 'Mal',
        birim: 'Metre',
        tasinir_kodu: '150.01.01',
        okas_kodu: null,
        poz_no: null,
        aciklama: '3x2.5 mm² TTR'
      }
    ]

    // Raporda 2 kalem var:
    // 1. Kalem: Hedefteki ile birebir aynı (atlamalı)
    // 2. Kalem: Aynı isim ve birimde ancak farklı kesit/özellikte (4x6 mm² ve farklı kod - ATLANMAMALI)
    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/009',
        baslik: 'Kablo İhtiyaç Raporu',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-15'
      },
      [
        {
          kalem_adi: 'Bakır Kablo',
          tipi: 'Mal',
          birim: 'Metre',
          tasinir_kodu: '150.01.01',
          aciklama: '3x2.5 mm² TTR',
          miktar: 100,
          kdv_orani: 20
        },
        {
          kalem_adi: 'Bakır Kablo',
          tipi: 'Mal',
          birim: 'Metre',
          tasinir_kodu: '150.01.02',
          aciklama: '4x6 mm² Antigron',
          miktar: 50,
          kdv_orani: 20
        }
      ]
    )

    const res = await ihtiyacRaporuService.linkToDosya(raporId, 10, {
      copyItemsToDosya: true,
      transferMode: 'append_if_missing'
    })

    // 1 tanesi atlandı (aynı özellik), 1 tanesi aktarıldı (farklı özellik)
    expect(res.transferredCount).toBe(1)
    expect(res.skippedCount).toBe(1)
    expect(mockTeminKalemler.length).toBe(2)
    expect(mockTeminKalemler[1].aciklama).toBe('4x6 mm² Antigron')
    expect(mockTeminKalemler[1].tasinir_kodu).toBe('150.01.02')
  })

  it('12. (Mock Tabanlı Rollback Simülasyonu) servis seviyesinde transaction başarısız olduğunda bellek durumunun geri alınmasını simüle etmeli', async () => {
    // NOT: Bu test servis seviyesindeki mock geri alma mantığını doğrular.
    // Gerçek SQLite engine seviyesindeki ROLLBACK kanıtı için 'ihtiyacRaporuRealSqliteRollback.test.ts' testine bakınız.
    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/010',
        baslik: 'Rollback Test Raporu',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-16'
      },
      [{ kalem_adi: 'Hatalı Kalem', tipi: 'Mal', birim: 'Adet', miktar: 1 }]
    )

    // Transaction mock'una ortada bir hatayı tetiklemesini sağlayacak bir SQL enjekte edelim
    const origTransaction = dbClient.transaction
    vi.spyOn(dbClient, 'transaction').mockImplementationOnce(async (statements) => {
      // Birinci statement (UPDATE DATA_IhtiyacRaporu) çalıştıktan sonra hata patlat
      const augmentedStatements = [...statements, { sql: 'SIMULATE_SQL_FAILURE' }]
      return origTransaction.call(dbClient, augmentedStatements)
    })

    // linkToDosya çağrısı transaction hatası nedeniyle reject etmeli
    await expect(
      ihtiyacRaporuService.linkToDosya(raporId, 10, { copyItemsToDosya: true })
    ).rejects.toThrow('SQLite SQLITE_CONSTRAINT')

    // MOCK ROLLBACK DOĞRULAMASI:
    // 1. DATA_IhtiyacRaporu tablosundaki rapor geri alınmalı; durumu 'dosyaya_aktarildi' değil, 'taslak' kalmalı!
    const savedRapor = mockRaporlar.find((r) => r.id === raporId)
    expect(savedRapor.durum).toBe('taslak')
    expect(savedRapor.temin_dosya_id).toBeNull()

    // 2. DATA_TeminKalem tablosuna hiçbir kısmi kalem eklenmemiş olmalı!
    const addedItems = mockTeminKalemler.filter((k) => k.temin_dosya_id === 10)
    expect(addedItems.length).toBe(0)
  })

  it('13. should correctly sanitize numeric fields with Number.isFinite() preventing Infinity and NaN leaks', () => {
    // sanitizeMiktar
    expect(sanitizeMiktar(Infinity)).toBe(1)
    expect(sanitizeMiktar(-Infinity)).toBe(1)
    expect(sanitizeMiktar(NaN)).toBe(1)
    expect(sanitizeMiktar(-5)).toBe(1)
    expect(sanitizeMiktar(0)).toBe(1)
    expect(sanitizeMiktar('42')).toBe(42)
    expect(sanitizeMiktar(15.5)).toBe(15.5)

    // sanitizeKdvOrani
    expect(sanitizeKdvOrani(Infinity)).toBe(20)
    expect(sanitizeKdvOrani(-Infinity)).toBe(20)
    expect(sanitizeKdvOrani(NaN)).toBe(20)
    expect(sanitizeKdvOrani(-1)).toBe(20)
    expect(sanitizeKdvOrani(0)).toBe(0) // Sıfır KDV korunmalı
    expect(sanitizeKdvOrani('0')).toBe(0)
    expect(sanitizeKdvOrani(10)).toBe(10)
    expect(sanitizeKdvOrani('20')).toBe(20)

    // sanitizeBirimFiyat
    expect(sanitizeBirimFiyat(Infinity)).toBe(0)
    expect(sanitizeBirimFiyat(-Infinity)).toBe(0)
    expect(sanitizeBirimFiyat(NaN)).toBe(0)
    expect(sanitizeBirimFiyat(-10)).toBe(0)
    expect(sanitizeBirimFiyat(0)).toBe(0)
    expect(sanitizeBirimFiyat(150.75)).toBe(150.75)
    expect(sanitizeBirimFiyat('300.5')).toBe(300.5)
  })

  it('14. should keep onayTarihi empty if report has no official approval, and separate rapor_no from evrakSayisi', () => {
    const mockRaporWithoutOnay = {
      id: 1,
      rapor_no: 'IR-2026/015',
      baslik: 'Onaysız Taslak Raporu',
      gerekce: 'Gerekçe metni',
      birim_adi: 'Fen İşleri',
      durum: 'dosyaya_aktarildi' as const,
      temin_dosya_id: 10,
      tarih: '2026-03-20',
      onay_tarihi: null // Resmi onay henüz yok!
    }

    const docData = mapRaporToLuzumMuzekkeresiData(mockRaporWithoutOnay, [])

    // Dosyaya bağlanmış olsa bile resmi onay tarihi yoksa onayTarihi boş kalmalıdır
    expect(docData.onayTarihi).toBe('')
    // Rapor numarası evrakSayisi alanına yazılmamalı, ayrı raporNo alanında bulunmalıdır
    expect(docData.evrakSayisi).toBe('')
    expect(docData.raporNo).toBe('IR-2026/015')

    // Gerçek onay tarihi ve kurum evrak sayısı verildiğinde ise doğru eşlenmelidir
    const mockRaporWithOnay = {
      ...mockRaporWithoutOnay,
      onay_tarihi: '2026-03-22'
    }
    const docDataWithOnay = mapRaporToLuzumMuzekkeresiData(mockRaporWithOnay, [], {
      evrak_sayisi: 'E.98765432'
    })
    expect(docDataWithOnay.onayTarihi).toBe('2026-03-22')
    expect(docDataWithOnay.evrakSayisi).toBe('E.98765432')
    expect(docDataWithOnay.raporNo).toBe('IR-2026/015')
  })

  it('15. should deduplicate items existing within the SAME report when using append_if_missing', async () => {
    // Hedef dosyada başlangıçta hiçbir kalem yok
    mockTeminKalemler = []

    // Aynı rapor içinde BİREBİR AYNI 2 kalem bulunuyor
    const raporId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/020',
        baslik: 'Aynı Kalem İçeren Rapor',
        durum: 'taslak',
        temin_dosya_id: null,
        tarih: '2026-03-25'
      },
      [
        {
          kalem_adi: 'A4 Kağıt',
          tipi: 'Mal',
          birim: 'Paket',
          tasinir_kodu: '150.01',
          aciklama: '80 gr 500lü',
          miktar: 10
        },
        {
          // Aynı raporda ikinci kez aynı kalem
          kalem_adi: 'A4 Kağıt',
          tipi: 'Mal',
          birim: 'Paket',
          tasinir_kodu: '150.01',
          aciklama: '80 gr 500lü',
          miktar: 20
        }
      ]
    )

    const res = await ihtiyacRaporuService.linkToDosya(raporId, 10, {
      copyItemsToDosya: true,
      transferMode: 'append_if_missing'
    })

    // Birinci kalem aktarılmalı, rapor içindeki ikinci mükerrer kalem atlanmalıdır
    expect(res.transferredCount).toBe(1)
    expect(res.skippedCount).toBe(1)
    expect(mockTeminKalemler.length).toBe(1)
  })

  it('16. should correctly resolve evrakSayisi across report, linked dossier, and kurumInfo fallback chain', () => {
    // 1. Raporda kayıtlı kendi evrak_sayisi varsa
    const raporWithEvrak = {
      id: 1,
      rapor_no: 'IR-2026/021',
      baslik: 'EBYS Kayıtlı Rapor',
      durum: 'taslak' as const,
      tarih: '2026-03-25',
      evrak_sayisi: 'E-2026-99999'
    }
    const res1 = mapRaporToLuzumMuzekkeresiData(raporWithEvrak, [])
    expect(res1.evrakSayisi).toBe('E-2026-99999')

    // 2. Raporda evrak_sayisi yok ama bağlı dosyanın evrak_sayisi varsa (dosya_evrak_sayisi)
    const raporWithDosyaEvrak = {
      id: 2,
      rapor_no: 'IR-2026/022',
      baslik: 'Dosyadan Evrak Alan Rapor',
      durum: 'dosyaya_aktarildi' as const,
      tarih: '2026-03-25',
      dosya_evrak_sayisi: 'DOSYA-EBYS-88888'
    }
    const res2 = mapRaporToLuzumMuzekkeresiData(raporWithDosyaEvrak, [])
    expect(res2.evrakSayisi).toBe('DOSYA-EBYS-88888')

    // 3. Ekrandan parametre olarak geçilen kurumInfo.evrak_sayisi en yüksek önceliğe sahiptir
    const res3 = mapRaporToLuzumMuzekkeresiData(raporWithEvrak, [], {
      evrak_sayisi: 'CUSTOM-EBYS-111'
    })
    expect(res3.evrakSayisi).toBe('CUSTOM-EBYS-111')
  })

  it('17. should reset evrak_sayisi, onay_tarihi, and temin_dosya_id to null when duplicating a report', async () => {
    // 1. Kaynak rapor oluştur (onaylanmış, EBYS sayısı verilmiş ve dosyaya bağlanmış)
    const sourceId = await ihtiyacRaporuService.createRapor(
      {
        rapor_no: 'IR-2026/099',
        baslik: 'Orijinal Onaylı EBYS Raporu',
        durum: 'onaylandi',
        temin_dosya_id: 10,
        tarih: '2026-03-20',
        onay_tarihi: '2026-03-22',
        evrak_sayisi: 'EBYS-2026-77777',
        tahmini_butce: 50000
      },
      [
        {
          kalem_adi: 'Orijinal Kalem',
          tipi: 'Mal',
          birim: 'Adet',
          miktar: 100,
          tahmini_birim_fiyat: 500
        }
      ]
    )

    // 2. Raporu kopyala (duplicate)
    const newId = await ihtiyacRaporuService.duplicateRapor(sourceId)
    expect(newId).toBeGreaterThan(0)

    // 3. Yeni kopyalanan raporu getir ve doğrula
    const clonedRapor = await ihtiyacRaporuService.getRaporById(newId)
    expect(clonedRapor).not.toBeNull()
    if (clonedRapor) {
      // Bağımsız yeni bir taslak olduğu için:
      expect(clonedRapor.durum).toBe('taslak')
      expect(clonedRapor.temin_dosya_id).toBeNull()
      expect(clonedRapor.onay_tarihi).toBeNull()
      // KRİTİK: Eski resmî EBYS evrak numarası kopyalanmamalı, null olmalı!
      expect(clonedRapor.evrak_sayisi).toBeNull()
      expect(clonedRapor.baslik).toBe('Orijinal Onaylı EBYS Raporu (Kopya)')
      expect(clonedRapor.tahmini_butce).toBe(50000)
    }

    // 4. Kalemlerin kopyalandığını doğrula
    const clonedKalemler = await ihtiyacRaporuService.getRaporKalemleri(newId)
    expect(clonedKalemler.length).toBe(1)
    expect(clonedKalemler[0].kalem_adi).toBe('Orijinal Kalem')
    expect(clonedKalemler[0].miktar).toBe(100)
  })
})
