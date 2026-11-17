import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  calculateDogrudanTeminInvoiceFinancials as calculateInvoiceFinancials,
  fetchCanonicalDossierPricing,
  isDogrudanTeminDosyasi,
  upsertKalemBidPrice
} from '../dossierPriceSyncService'

describe('Doğrudan Temin Fiyat Senkronizasyonu, Sözleşme Ayrımı ve Muhasebe Doğrulama Testleri', () => {
  const mockInvoke = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).window = {
      electron: {
        ipcRenderer: {
          invoke: mockInvoke
        }
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  })

  it('Senaryo 1 – Fiyat Senkronizasyonu: Fiyat araştırmasında güncellenen teklif fiyatı mükerrer kayıt oluşturmadan Muayene Kabul ve Dosya Künyesine yansımalı', async () => {
    // 1. upsertKalemBidPrice çağrıldığında önce eski kayıtları silmeli, tekil güncel kaydı eklemeli
    mockInvoke.mockImplementation(async (channel: string, sql: string) => {
      if (channel === 'db:run') {
        return { success: true }
      }
      if (channel === 'db:query') {
        if (sql.includes('FROM DATA_TeminKalemTeklif kt')) {
          return {
            success: true,
            data: [{ birim_fiyat: 8333, miktar: 1 }]
          }
        }
        if (sql.includes('SELECT id, teklif_toplami FROM DATA_TeminFirma')) {
          return {
            success: true,
            data: [
              { id: 10, teklif_toplami: 8333 },
              { id: 11, teklif_toplami: 9000 },
              { id: 12, teklif_toplami: 9500 }
            ]
          }
        }
        if (sql.includes('FROM DATA_TeminDosyasi WHERE id = ?')) {
          return {
            success: true,
            data: [
              {
                id: 275,
                temin_no: '2025/1',
                konu: 'Lisans Sözleşmesi',
                tur: 'mal',
                kdv: 20,
                yaklasik_maliyet: 8333,
                sozlesme_yapilacak_mi: 0
              }
            ]
          }
        }
        if (sql.includes('FROM DATA_TeminKalem WHERE temin_dosya_id = ?')) {
          return {
            success: true,
            data: [
              {
                id: 501,
                temin_dosya_id: 275,
                sira_no: 1,
                kalem_adi: 'Yazılım Lisansı',
                miktar: 1,
                olcu_birimi: 'Adet',
                kdv_orani: 20,
                birim_fiyat: 0 // Ham tabloda 0 olsa bile tekliften kanonik çözümlenmeli
              }
            ]
          }
        }
        if (sql.includes('FROM DATA_TeminFirma')) {
          return {
            success: true,
            data: [
              {
                id: 10,
                temin_dosya_id: 275,
                firma_id: 100,
                unvan: 'Yazılım Donanım Reklam Hizmetleri San. ve Tic. Ltd. Şti.',
                vergi_no: '1231025356',
                teklif_toplami: 8333,
                kazandi_mi: 1,
                kazanan_mi: 1
              },
              {
                id: 11,
                temin_dosya_id: 275,
                firma_id: 101,
                unvan: 'Bilişim Çözümleri A.Ş.',
                vergi_no: '2222222222',
                teklif_toplami: 9000,
                kazandi_mi: 0,
                kazanan_mi: 0
              },
              {
                id: 12,
                temin_dosya_id: 275,
                firma_id: 102,
                unvan: 'Teknoloji Sistemleri Ltd. Şti.',
                vergi_no: '3333333333',
                teklif_toplami: 9500,
                kazandi_mi: 0,
                kazanan_mi: 0
              }
            ]
          }
        }
        if (sql.includes('FROM DATA_TeminKalemTeklif') && !sql.includes('JOIN DATA_TeminKalem')) {
          // Veritabanında geçmişten kalan eski 5000 TL ve güncel 8333 TL kaydı olsa bile en güncel (id DESC) alınmalı
          return {
            success: true,
            data: [
              {
                id: 2,
                temin_dosya_id: 275,
                temin_kalem_id: 501,
                temin_firma_id: 10,
                birim_fiyat: 8333
              },
              {
                id: 1,
                temin_dosya_id: 275,
                temin_kalem_id: 501,
                temin_firma_id: 10,
                birim_fiyat: 5000
              },
              {
                id: 3,
                temin_dosya_id: 275,
                temin_kalem_id: 501,
                temin_firma_id: 11,
                birim_fiyat: 9000
              },
              {
                id: 4,
                temin_dosya_id: 275,
                temin_kalem_id: 501,
                temin_firma_id: 12,
                birim_fiyat: 9500
              }
            ]
          }
        }
      }
      return { success: true, data: [] }
    })

    const upsertRes = await upsertKalemBidPrice({
      dosyaId: 275,
      kalemId: 501,
      teminFirmaId: 10,
      birimFiyat: 8333
    })

    expect(upsertRes.firmaToplam).toBe(8333)
    expect(mockInvoke).toHaveBeenCalledWith(
      'db:run',
      expect.stringContaining('DELETE FROM DATA_TeminKalemTeklif'),
      [275, 501, 10]
    )

    const canonical = await fetchCanonicalDossierPricing(275)
    expect(canonical.kalemler).toHaveLength(1)
    // Dosya Künyesi ve Muayene Kabul'ün okuduğu birim fiyat ₺0,00 değil, ₺8.333,00 olmalı
    expect(canonical.kalemler[0].kazanan_birim_fiyat).toBe(8333)
    expect(canonical.kalemler[0].kazanan_kalem_toplam).toBe(8333)
    expect(canonical.kalemler[0].yaklasik_maliyet_toplam).toBeGreaterThan(0)
    // Mükerrer teklif satırları tekilleştirilmiş (3 firma x 1 kalem = 3 birim teklif) olmalı
    expect(canonical.teklifler).toHaveLength(3)
    expect(canonical.kazananFirma?.toplam_teklif_tutari).toBe(8333)
  })

  it('Senaryo 2 – Dosya Değiştirme İzolasyonu: A dosyasından B dosyasına geçildiğinde A dosyasının fiyatları B dosyasına taşınmamalı', async () => {
    mockInvoke.mockImplementation(async (_channel: string, sql: string, params: any[]) => {
      const dId = params?.[0]
      if (sql.includes('FROM DATA_TeminDosyasi WHERE id = ?')) {
        return {
          success: true,
          data: [
            dId === 101
              ? { id: 101, temin_no: '2026/1', konu: 'A Dosyası', yaklasik_maliyet: 45000, kdv: 20 }
              : { id: 102, temin_no: '2026/2', konu: 'B Dosyası', yaklasik_maliyet: 12500, kdv: 20 }
          ]
        }
      }
      if (sql.includes('FROM DATA_TeminKalem WHERE temin_dosya_id = ?')) {
        return {
          success: true,
          data: [
            dId === 101
              ? { id: 1, temin_dosya_id: 101, sira_no: 1, kalem_adi: 'A Kalemi', miktar: 10, birim_fiyat: 4500 }
              : { id: 2, temin_dosya_id: 102, sira_no: 1, kalem_adi: 'B Kalemi', miktar: 5, birim_fiyat: 2500 }
          ]
        }
      }
      if (sql.includes('FROM DATA_TeminFirma')) {
        return {
          success: true,
          data: [
            dId === 101
              ? { id: 21, temin_dosya_id: 101, unvan: 'A Firması', teklif_toplami: 45000, kazandi_mi: 1 }
              : { id: 22, temin_dosya_id: 102, unvan: 'B Firması', teklif_toplami: 12500, kazandi_mi: 1 }
          ]
        }
      }
      if (sql.includes('FROM DATA_TeminKalemTeklif')) {
        return {
          success: true,
          data: [
            dId === 101
              ? { id: 1, temin_dosya_id: 101, temin_kalem_id: 1, temin_firma_id: 21, birim_fiyat: 4500 }
              : { id: 2, temin_dosya_id: 102, temin_kalem_id: 2, temin_firma_id: 22, birim_fiyat: 2500 }
          ]
        }
      }
      return { success: true, data: [] }
    })

    const dosyaA = await fetchCanonicalDossierPricing(101)
    const dosyaB = await fetchCanonicalDossierPricing(102)

    expect(dosyaA.kalemler[0].kazanan_birim_fiyat).toBe(4500)
    expect(dosyaA.kazananFirma?.unvan).toBe('A Firması')

    expect(dosyaB.kalemler[0].kazanan_birim_fiyat).toBe(2500)
    expect(dosyaB.kalemler[0].kazanan_kalem_toplam).toBe(12500)
    expect(dosyaB.kazananFirma?.unvan).toBe('B Firması')
    expect(dosyaB.kalemler[0].kazanan_birim_fiyat).not.toBe(dosyaA.kalemler[0].kazanan_birim_fiyat)
  })

  it('Senaryo 3 – Doğrudan Temin Sözleşme Kontrolü: Doğrudan Temin dosyası ihale usullerinden doğru ayrıştırılmalı ve sözleşmesiz olmalı', () => {
    expect(isDogrudanTeminDosyasi({ ihale_sekli: '22/d*', tur: 'mal' })).toBe(true)
    expect(isDogrudanTeminDosyasi({ temin_usulu: '4734 Md. 22/a', tur: 'hizmet' })).toBe(true)
    expect(isDogrudanTeminDosyasi({ ihale_sekli: '4734 Md. 19 Açık İhale', tur: 'yapim' })).toBe(false)
    expect(isDogrudanTeminDosyasi({ temin_usulu: '2886 Devlet İhale Kanunu', tur: 'mal' })).toBe(false)
  })

  it('Senaryo 4 – Muhasebe ve Kesinti Kontrolü: Doğrudan Teminde Ödeme Emri Damga Vergisi (‰ 9,48) hesaplanmalı, İhale Karar Pulu (‰ 5,69) kesilmemeli', () => {
    // 180.958,00 TL Brüt (%20 KDV dahil) -> KDV Hariç Matrah = 150.798,33 TL
    // Ödeme Emri Damga Vergisi (‰ 9,48) = 1.429,57 TL, Karar Pulu = 0,00 TL, Net Ödenecek = 179.528,43 TL
    const fin = calculateInvoiceFinancials(180958, 20, 'Yok', false, true)
    expect(fin.matrah).toBe(150798.33)
    expect(fin.damgaVergisi).toBe(1429.57)
    expect(fin.kararPulu).toBe(0)
    expect(fin.netOdenecek).toBe(179528.43)

    // Kullanıcı Damga Vergisi muafiyeti seçerse damga vergisi 0 olmalı
    const finExempt = calculateInvoiceFinancials(180958, 20, 'Yok', false, false)
    expect(finExempt.damgaVergisi).toBe(0)
    expect(finExempt.kararPulu).toBe(0)
    expect(finExempt.netOdenecek).toBe(180958)
  })

  it('Senaryo 5 – Birleştirilmiş Dosya Künyesi / Detay Ekranı: Kalem fiyatı 0 olsa bile yaklaşık maliyet veya kazanan tekliften birim fiyat çözümlenmeli', async () => {
    mockInvoke.mockImplementation(async (_channel: string, sql: string) => {
      if (sql.includes('FROM DATA_TeminDosyasi WHERE id = ?')) {
        return {
          success: true,
          data: [{ id: 275, temin_no: '2025/1', konu: 'Lisans Sözleşmesi', yaklasik_maliyet: 8333, kdv: 20 }]
        }
      }
      if (sql.includes('FROM DATA_TeminKalem WHERE temin_dosya_id = ?')) {
        return {
          success: true,
          data: [
            {
              id: 501,
              temin_dosya_id: 275,
              sira_no: 1,
              kalem_adi: 'Yazılım Lisansı',
              miktar: 1,
              olcu_birimi: 'Adet',
              kdv_orani: 20,
              birim_fiyat: 0
            }
          ]
        }
      }
      if (sql.includes('FROM DATA_TeminFirma')) {
        return {
          success: true,
          data: [
            {
              id: 10,
              temin_dosya_id: 275,
              unvan: 'Yazılım Donanım Ltd. Şti.',
              teklif_toplami: 8333,
              kazandi_mi: 1
            }
          ]
        }
      }
      if (sql.includes('FROM DATA_TeminKalemTeklif')) {
        return { success: true, data: [] }
      }
      return { success: true, data: [] }
    })

    const canonical = await fetchCanonicalDossierPricing(275)
    expect(canonical.kalemler[0].yaklasik_maliyet_birim).toBe(8333)
    expect(canonical.kalemler[0].yaklasik_maliyet_toplam).toBe(8333)
    expect(canonical.kalemler[0].kazanan_birim_fiyat).toBe(8333)
    expect(canonical.kalemler[0].kazanan_kalem_toplam).toBe(8333)
    expect(canonical.firmalar[0].toplam_teklif_tutari).toBe(8333)
  })
})
