import { describe, it, expect } from 'vitest'
import {
  buildDogrudanTeminWorkbook,
  createExportContext,
  KIK_2026_ESIK_DEGER_TL
} from '../excelExport'

describe('excelExportService', () => {
  const sampleData = {
    dosya: {
      id: 'dt-1',
      yil: 2026,
      no: 15,
      konu: 'Kırtasiye ve Büro Malzemesi Alımı',
      tur: 'mal',
      butce_yili: '2026',
      butce_kodu: '03.2'
    },
    kalemler: [
      {
        id: 'k1',
        kalem_adi: 'A4 Kağıt',
        birim: 'Paket',
        miktar: 100,
        kdv_orani: 20,
        yaklasik_maliyet: 150
      },
      {
        id: 'k2',
        kalem_adi: 'Tükenmez Kalem',
        birim: 'Adet',
        miktar: 50,
        kdv_orani: 20,
        yaklasik_maliyet: 10
      }
    ],
    firmalar: [
      { id: 'f1', unvan: 'ABC Kırtasiye Ltd.', vergi_no: '1111111111' },
      { id: 'f2', unvan: 'XYZ Büro Malzemeleri A.Ş.', vergi_no: '2222222222' }
    ],
    komisyon: [
      { ad_soyad: 'Ahmet Yılmaz', unvan: 'Şef', rol: 'Başkan' },
      { ad_soyad: 'Mehmet Demir', unvan: 'Memur', rol: 'Üye' }
    ],
    kurum: { ad: 'Ankara Büyükşehir Belediyesi' }
  }

  it('exports KIK_2026_ESIK_DEGER_TL constant correctly', () => {
    expect(KIK_2026_ESIK_DEGER_TL).toBe(1021827.0)
  })

  it('creates export context with accurate calculated parameters', () => {
    const ctx = createExportContext(sampleData)
    expect(ctx.kurumAdi).toBe(sampleData.kurum.ad.toUpperCase())
    expect(ctx.dosyaKonusu).toBe('Kırtasiye ve Büro Malzemesi Alımı')
    expect(ctx.turLabel).toBe('Mal Alımı')
    expect(ctx.kalemCount).toBe(2)
    expect(ctx.effectiveFirms.length).toBe(2)
  })

  it('builds a complete workbook containing all 8 official sheets', () => {
    const workbook = buildDogrudanTeminWorkbook(sampleData)
    const sheetNames = workbook.worksheets.map((ws) => ws.name)

    expect(sheetNames).toContain('Süreç Takibi & Özet')
    expect(sheetNames).toContain('Kalemler & Maliyet')
    expect(sheetNames).toContain('Teklifler & Piyasa')
    expect(sheetNames).toContain('A4 - İhtiyaç Listesi Formu')
    expect(sheetNames).toContain('A4 - Doğrudan Temin Onayı')
    expect(sheetNames).toContain('A4 - Piyasa Fiyat Tutanağı')
    expect(sheetNames).toContain('Komisyon ve Görevliler')
    expect(sheetNames).toContain('Belge ve Şablon Envanteri')
    expect(sheetNames.length).toBe(8)
  })
})
