import { describe, it, expect } from 'vitest'
import {
  applyRolePolicy,
  dedupeMembers,
  parseNumericPrice,
  resolveFirmsAndItems,
  cleanPersonelName,
  applyRefreshPolicy,
  getFieldRefreshPolicy
} from '../index'

describe('DocumentPreviewModalV3 - previewData modular helpers', () => {
  it('parseNumericPrice handles numbers, strings with commas and dots correctly', () => {
    expect(parseNumericPrice(1250.5)).toBe(1250.5)
    expect(parseNumericPrice('1.250,50')).toBe(1250.5)
    expect(parseNumericPrice('1250,50')).toBe(1250.5)
    expect(parseNumericPrice('1250.50')).toBe(1250.5)
    expect(parseNumericPrice('-')).toBe(0)
    expect(parseNumericPrice(null)).toBe(0)
    expect(parseNumericPrice(undefined)).toBe(0)
    expect(parseNumericPrice('')).toBe(0)
  })

  it('cleanPersonelName cleans duplicate names, paranthesis titles and double surnames', () => {
    expect(cleanPersonelName('Ahmet Yılmaz Ahmet Yılmaz')).toBe('Ahmet Yılmaz')
    expect(cleanPersonelName('Ali Veli (Ali Veli)')).toBe('Ali Veli')
    expect(cleanPersonelName('Mustafa Kaya (Mühendis)')).toBe('Mustafa Kaya')
    expect(cleanPersonelName('Mehmet Demir Demir')).toBe('Mehmet Demir')
    expect(cleanPersonelName('İlyas Bozdemir / İlyas Bozdemir')).toBe('İlyas Bozdemir')
    expect(cleanPersonelName('Ayşe Demir')).toBe('Ayşe Demir')
  })

  it('dedupeMembers removes duplicates based on personel_id or clean ad_soyad', () => {
    const members = [
      { personel_id: 1, ad_soyad: 'Ahmet Yılmaz', unvan: 'Müdür' },
      { personel_id: 1, ad_soyad: 'Ahmet Yılmaz (Tekrar)', unvan: 'Müdür' },
      { personel_id: 2, ad_soyad: 'Mehmet Demir', unvan: 'Mühendis' },
      { ad_soyad: 'Ayşe Kaya', unvan: 'Tekniker' },
      { ad_soyad: 'Ayşe Kaya', unvan: 'Tekniker (Kopya)' }
    ]

    const deduped = dedupeMembers(members)
    expect(deduped.length).toBe(3)
    expect(deduped[0].personel_id).toBe(1)
    expect(deduped[1].personel_id).toBe(2)
    expect(deduped[2].ad_soyad).toBe('Ayşe Kaya')
  })

  it('resolveFirmsAndItems correctly computes line item prices and winner firm when items are provided', () => {
    const baseData: any = {}
    const dosyaObj: any = { teslim_gun: 15 }
    const dosyaRecord: any = null
    const payloadData: any = {
      dosya: { firma_id: 10 }
    }
    const fileFirms = [
      { id: 10, unvan: 'A Firması', kazandi_mi: 1 },
      { id: 20, unvan: 'B Firması', kazandi_mi: 0 }
    ]
    const items = [{ id: 1, kalem_adi: 'Defter', miktar: 5, birim: 'Adet' }]
    const bids = [
      { temin_kalem_id: 1, temin_firma_id: 10, birim_fiyat: 100 },
      { temin_kalem_id: 1, temin_firma_id: 20, birim_fiyat: 120 }
    ]

    resolveFirmsAndItems(
      baseData,
      dosyaObj,
      dosyaRecord,
      payloadData,
      fileFirms,
      undefined,
      fileFirms,
      items,
      bids
    )

    expect(baseData.firmalar.length).toBe(2)
    expect(baseData.yukleniciFirma).toBe('A Firması')
    expect(baseData.teslimGun).toBe('15')
    expect(baseData.ihtiyacKalemleri.length).toBe(1)
    expect(baseData.ihtiyacKalemleri[0].enUygunFirmaAdi).toBe('A Firması')
    expect(baseData.ihtiyacKalemleri[0].toplamBedel).toBe('500,00')
    expect(baseData.genelToplam).toBe('500,00')
  })

  it('resolveFirmsAndItems preserves template resolved items (pozNo, imalatAdi) without foreign list pollution', () => {
    const baseData: any = {
      ihtiyacKalemleri: [
        {
          id: 101,
          siraNo: 1,
          pozNo: 'Y.15.001',
          imalatAdi: 'Beton Dökülmesi',
          teknikTarifi: 'C25/30 hazır beton',
          olcuBirimi: 'm³',
          miktar: 50
        }
      ]
    }
    const dosyaObj: any = { teslim_gun: 10 }

    resolveFirmsAndItems(
      baseData,
      dosyaObj,
      null,
      {},
      [],
      undefined,
      [],
      [],
      [],
      'ihtiyac-listesi'
    )

    expect(baseData.ihtiyacKalemleri.length).toBe(1)
    expect(baseData.ihtiyacKalemleri[0].pozNo).toBe('Y.15.001')
    expect(baseData.ihtiyacKalemleri[0].imalatAdi).toBe('Beton Dökülmesi')
    expect(baseData.ihtiyacKalemleri[0].teknikTarifi).toBe('C25/30 hazır beton')
    expect(baseData.ihtiyacKalemleri[0].olcuBirimi).toBe('m³')
    // Should NOT inject fiyatKalemleri for ihtiyac-listesi
    expect(baseData.fiyatKalemleri).toBeUndefined()
  })

  it('applyRefreshPolicy preserves manual table edits from saved snapshot and respects preserve fields', () => {
    const sourceData = {
      evrakSayisi: '2026/001',
      harcamaYetkilisiAdi: 'Ali Veli',
      ihtiyacKalemleri: [
        { siraNo: 1, malzemeAdi: 'Orijinal Kaynak Malzeme', miktar: 1 }
      ]
    }

    const savedSnapshot = {
      evrakSayisi: '2026/001-Revize',
      ihtiyacKalemleri: [
        { siraNo: 1, malzemeAdi: 'Kullanıcının Belgede Düzenlediği Özel Malzeme', miktar: 5 }
      ],
      ozelGerekce: 'Acil ihtiyaç nedeniyle'
    }

    const merged = applyRefreshPolicy(sourceData, savedSnapshot)

    // Manual / Template table items are preserved from snapshot!
    expect(merged.ihtiyacKalemleri[0].malzemeAdi).toBe('Kullanıcının Belgede Düzenlediği Özel Malzeme')
    expect(merged.ihtiyacKalemleri[0].miktar).toBe(5)
    expect(merged.ozelGerekce).toBe('Acil ihtiyaç nedeniyle')
    // Preserve fields are preserved from snapshot when filled
    expect(merged.evrakSayisi).toBe('2026/001-Revize')
    // Source data not present in snapshot remains intact
    expect(merged.harcamaYetkilisiAdi).toBe('Ali Veli')
  })

  it('applyRolePolicy can be invoked without error', () => {
    const data: any = { hazirlayanPersonelAdi: 'Test' }
    expect(() => applyRolePolicy(data, 'doc-1')).not.toThrow()
  })
})
