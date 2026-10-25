import { describe, it, expect } from 'vitest'
import {
  getEkapTemplateMeta,
  isValidOkasCode,
  isValidBirim,
  suggestClosestOkas,
  parseEkapFile,
  generateErrorReportCsv
} from '../ekapTemplateService'
import * as XLSX from 'xlsx'

describe('ekapTemplateService', () => {
  it('resmi EKAP meta verilerini eksiksiz döndürür', () => {
    const meta = getEkapTemplateMeta()
    expect(meta.stats.birimSayisi).toBe(195)
    expect(meta.stats.okasSayisi).toBe(7623)
    expect(meta.version).toBe('2026.1')
  })

  it('resmi OKAS kodlarını doğru teyit eder', () => {
    expect(isValidOkasCode('452124111')).toBe(true)
    expect(isValidOkasCode('34115200')).toBe(true)
    expect(isValidOkasCode('9999999999')).toBe(false)
    expect(isValidOkasCode('')).toBe(false)
  })

  it('resmi birimleri doğru teyit eder', () => {
    expect(isValidBirim('100 adet')).toBe(true)
    expect(isValidBirim('adam/ay')).toBe(true)
    expect(isValidBirim('1/4 galon(qt)')).toBe(true)
    expect(isValidBirim('uydurma_birim')).toBe(false)
  })

  it('geçersiz veya eksik OKAS sorgusunda yakın öneri getirir', () => {
    const suggestions = suggestClosestOkas('acil anons', 2)
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].ad.toLowerCase()).toContain('acil')
  })

  it('Excel/ODS formatındaki yaklaşık maliyet cetvelini doğru ayrıştırır ve hesaplar', () => {
    // Örnek Yapım İhalesi Sayfa1 Excel tablosu oluştur
    const rows = [
      ['Poz No', 'OKAS Kodu/Kalem Adı', 'Ad ve Kısa Açıklama', 'Miktar', 'Birim', 'Birim Fiyat'],
      ['Y.15.001/2A', '452124111', 'Otel inşaat işleri', 10, '100 adet', 500],
      ['Y.16.050', '31518200', 'Acil durum aydınlatma', 5, 'Adet', 120],
      ['HATALI.01', '000000', 'Geçersiz satır', -3, 'BilinmeyenBirim', 'hatali_fiyat']
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1')
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

    const result = parseEkapFile(buffer, 'test_yaklasik_maliyet.xlsx')

    expect(result.totalRows).toBe(3)
    expect(result.validRows).toBe(2)
    expect(result.errorRows).toBe(1)

    // Yaklaşık maliyet hesabı: (10 * 500) + (5 * 120) = 5000 + 600 = 5600
    expect(result.toplamYaklasikMaliyet).toBe(5600)

    // Hatalı satır doğrulaması
    const errorItem = result.items[2]
    expect(errorItem.isValid).toBe(false)
    expect(errorItem.errors.length).toBeGreaterThan(0)

    // Hata CSV raporu testi
    const csv = generateErrorReportCsv(result.allErrors)
    expect(csv).toContain('Satır No')
    expect(csv).toContain('Miktar')
  })
})
