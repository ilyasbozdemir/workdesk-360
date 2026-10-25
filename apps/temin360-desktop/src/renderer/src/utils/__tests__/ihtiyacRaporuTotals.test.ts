import { describe, it, expect } from 'vitest'
import {
  calculateTotals,
  DEFAULT_KDV_ORANI,
  resolveKdvOrani,
  roundToKurus
} from '../ihtiyacRaporuTotals'

describe('ihtiyacRaporuTotals - calculateTotals', () => {
  it('boş liste verildiğinde tüm toplamları 0 döner', () => {
    const res = calculateTotals([])
    expect(res).toEqual({
      araToplam: 0,
      kdv: 0,
      genelToplam: 0
    })
  })

  it('kdv_orani null veya undefined olduğunda DEFAULT_KDV_ORANI (20) kullanır', () => {
    expect(resolveKdvOrani(null)).toBe(DEFAULT_KDV_ORANI)
    expect(resolveKdvOrani(undefined)).toBe(DEFAULT_KDV_ORANI)

    const kalemler = [
      { miktar: 2, tahmini_birim_fiyat: 100, kdv_orani: null as any },
      { miktar: 1, tahmini_birim_fiyat: 50, kdv_orani: undefined as any }
    ]
    // Kalem 1: 2 * 100 = 200, KDV %20 = 40
    // Kalem 2: 1 * 50 = 50, KDV %20 = 10
    // Ara toplam: 250, KDV: 50, Genel toplam: 300
    const res = calculateTotals(kalemler)
    expect(res.araToplam).toBe(250)
    expect(res.kdv).toBe(50)
    expect(res.genelToplam).toBe(300)
  })

  it('%0 KDV muafiyetini DEFAULT_KDV_ORANI ile ezmez, 0 olarak hesaplar', () => {
    expect(resolveKdvOrani(0)).toBe(0)
    expect(resolveKdvOrani('0')).toBe(0)

    const kalemler = [{ miktar: 5, tahmini_birim_fiyat: 100, kdv_orani: 0 }]
    const res = calculateTotals(kalemler)
    expect(res.araToplam).toBe(500)
    expect(res.kdv).toBe(0)
    expect(res.genelToplam).toBe(500)
  })

  it('0 fiyat veya 0 miktar olduğunda toplamı etkilemez', () => {
    const kalemler = [
      { miktar: 0, tahmini_birim_fiyat: 100, kdv_orani: 20 },
      { miktar: 10, tahmini_birim_fiyat: 0, kdv_orani: 20 },
      { miktar: 2, tahmini_birim_fiyat: 50, kdv_orani: 10 }
    ]
    // Yalnızca 3. kalem aktif: 2 * 50 = 100, KDV %10 = 10
    const res = calculateTotals(kalemler)
    expect(res.araToplam).toBe(100)
    expect(res.kdv).toBe(10)
    expect(res.genelToplam).toBe(110)
  })

  it('ondalıklı miktar ve kuruş yuvarlamalarını kuruş hassasiyetinde tutarlı hesaplar', () => {
    // 3.5 adet * 33.33 TL = 116.655 -> 116.66 TL
    // KDV %20 = 116.66 * 0.20 = 23.332 -> 23.33 TL
    // Genel Toplam = 116.66 + 23.33 = 139.99 TL
    const kalemler = [{ miktar: 3.5, tahmini_birim_fiyat: 33.33, kdv_orani: 20 }]
    const res = calculateTotals(kalemler)
    expect(res.araToplam).toBe(116.66)
    expect(res.kdv).toBe(23.33)
    expect(res.genelToplam).toBe(139.99)
  })

  it('roundToKurus kuruş hassasiyetinde çalışır', () => {
    expect(roundToKurus(10.555)).toBe(10.56)
    expect(roundToKurus(10.554)).toBe(10.55)
    expect(roundToKurus(0)).toBe(0)
    expect(roundToKurus(NaN)).toBe(0)
  })
})
