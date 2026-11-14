import { describe, it, expect } from 'vitest'
import { calculateInvoiceFinancials } from '../components/tabs/DosyalarVeFaturalariTab'

describe('calculateInvoiceFinancials - Mali ve KDV Doğruluk Testleri', () => {
  it('%0 KDV durumunda matrah brüt tutara eşit olmalı ve KDV tutarı 0 çıkmalıdır', () => {
    const res = calculateInvoiceFinancials(10000, 0, 'Yok', true)
    expect(res.matrah).toBe(10000)
    expect(res.kdvTutari).toBe(0)
    expect(res.tevkifatTutari).toBe(0)
    // Damga vergisi: 10000 * 0.00948 = 94.80
    expect(res.damgaVergisi).toBe(94.8)
    // Karar pulu: 10000 * 0.00569 = 56.90
    expect(res.kararPulu).toBe(56.9)
    // Toplam kesinti: 94.8 + 56.9 = 151.70
    expect(res.toplamKesinti).toBe(151.7)
    // Net ödenecek: 10000 - 151.70 = 9848.30
    expect(res.netOdenecek).toBe(9848.3)
  })

  it('%20 KDV durumunda finansal hesaplama ve kuruş hassasiyeti', () => {
    // 12000 TL brüt, %20 KDV -> matrah = 10000 TL, KDV = 2000 TL
    const res = calculateInvoiceFinancials(12000, 20, 'Yok', true)
    expect(res.matrah).toBe(10000)
    expect(res.kdvTutari).toBe(2000)
    expect(res.tevkifatTutari).toBe(0)
    expect(res.damgaVergisi).toBe(94.8)
    expect(res.kararPulu).toBe(56.9)
    expect(res.netOdenecek).toBe(11848.3)
  })

  it('%10 ve %1 KDV oranlarını doğru hesaplamalıdır', () => {
    // %10 KDV: 11000 TL brüt -> matrah = 10000, KDV = 1000
    const res10 = calculateInvoiceFinancials(11000, 10, 'Yok', true)
    expect(res10.matrah).toBe(10000)
    expect(res10.kdvTutari).toBe(1000)

    // %1 KDV: 10100 TL brüt -> matrah = 10000, KDV = 100
    const res1 = calculateInvoiceFinancials(10100, 1, 'Yok', true)
    expect(res1.matrah).toBe(10000)
    expect(res1.kdvTutari).toBe(100)
  })

  it('Tüm tevkifat oranlarını (2/10, 5/10, 7/10, Tam) doğru uygulamalıdır', () => {
    // 12000 TL brüt, %20 KDV -> KDV = 2000 TL
    // 2/10 tevkifat -> 2000 * 0.2 = 400 TL
    const res2_10 = calculateInvoiceFinancials(12000, 20, '2/10', true)
    expect(res2_10.tevkifatTutari).toBe(400)

    // 5/10 tevkifat -> 2000 * 0.5 = 1000 TL
    const res5_10 = calculateInvoiceFinancials(12000, 20, '5/10', true)
    expect(res5_10.tevkifatTutari).toBe(1000)

    // 7/10 tevkifat -> 2000 * 0.7 = 1400 TL
    const res7_10 = calculateInvoiceFinancials(12000, 20, '7/10', true)
    expect(res7_10.tevkifatTutari).toBe(1400)

    // Tam tevkifat -> 2000 * 1.0 = 2000 TL
    const resTam = calculateInvoiceFinancials(12000, 20, 'Tam', true)
    expect(resTam.tevkifatTutari).toBe(2000)
  })

  it('Karar pulu uygulanmadığında kararPulu = 0 olmalıdır', () => {
    const res = calculateInvoiceFinancials(12000, 20, 'Yok', false)
    expect(res.kararPulu).toBe(0)
    expect(res.toplamKesinti).toBe(res.damgaVergisi)
    expect(res.netOdenecek).toBe(Number((12000 - res.damgaVergisi).toFixed(2)))
  })
})
