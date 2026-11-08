import { describe, it, expect } from 'vitest'
import {
  calculateMetrajTotals,
  calculateFiyatFarki,
  calculateKesintilerVeNet
} from '../hakedisCalculators'
import { HakedisKalem, FiyatFarkiParametreleri, KesintiParametreleri } from '../../types'

describe('Hakedis Calculators Domain Logic', () => {
  describe('calculateMetrajTotals', () => {
    it('kalemlerin bu hakediş, önceki ve kümülatif tutarlarını doğru hesaplar', () => {
      const sampleKalemler: HakedisKalem[] = [
        {
          id: 'k1',
          pozNo: 'P-01',
          aciklama: 'Hazır Beton',
          birim: 'm³',
          sozlesmeMiktar: 100,
          birimFiyat: 2000,
          oncekiMetraj: 20,
          buHakedisMetraj: 30
        },
        {
          id: 'k2',
          pozNo: 'P-02',
          aciklama: 'Demir Çelik',
          birim: 'kg',
          sozlesmeMiktar: 1000,
          birimFiyat: 25,
          oncekiMetraj: 100,
          buHakedisMetraj: 400
        }
      ]

      const result = calculateMetrajTotals(sampleKalemler)

      // K1: Bu hakediş: 30 * 2000 = 60,000; Önceki: 20 * 2000 = 40,000; Toplam: 100,000
      // K2: Bu hakediş: 400 * 25 = 10,000; Önceki: 100 * 25 = 2,500; Toplam: 12,500
      expect(result.buHakedisImalatTutari).toBe(70000)
      expect(result.oncekiImalatTutari).toBe(42500)
      expect(result.kumulatifImalatTutari).toBe(112500)
      expect(result.kalemDetaylari).toHaveLength(2)
      expect(result.kalemDetaylari[0].gerceklesmeYuzdesi).toBe(50) // (20+30)/100 * 100
    })

    it('boş kalem listesinde 0 döndürür', () => {
      const result = calculateMetrajTotals([])
      expect(result.buHakedisImalatTutari).toBe(0)
      expect(result.kumulatifImalatTutari).toBe(0)
      expect(result.kalemDetaylari).toEqual([])
    })
  })

  describe('calculateFiyatFarki', () => {
    const defaultParams: FiyatFarkiParametreleri = {
      aktifMi: true,
      temelEndeksI0: 1000,
      guncelEndeksIn: 1200, // %20 artış
      iscilikKatsayisiA1: 0.3,
      malzemeKatsayisiA2: 0.5,
      akaryakitKatsayisiB1: 0.1,
      makineKatsayisiB2: 0.1 // Toplam ağırlıklı oran = 1.0
    }

    it('endeks artışı ve katsayılara göre fiyat farkını doğru formüle eder', () => {
      const buHakedisImalat = 100000
      const result = calculateFiyatFarki(buHakedisImalat, defaultParams)

      // Artis orani = 1200 / 1000 - 1 = 0.20
      // Agirlikli oran = 1.0
      // Fiyat farki = 100000 * 0.20 * 1.0 = 20000
      expect(result.fiyatFarkiTutari).toBeCloseTo(20000, 2)
      expect(result.endeksArtisOrani).toBeCloseTo(0.2, 4)
    })

    it('fiyat farkı pasifse 0 döndürür', () => {
      const result = calculateFiyatFarki(100000, { ...defaultParams, aktifMi: false })
      expect(result.fiyatFarkiTutari).toBe(0)
    })

    it('endeks düşüşünde (negatif) Math.max(0) ile eksi fark üretmez', () => {
      const result = calculateFiyatFarki(100000, {
        ...defaultParams,
        guncelEndeksIn: 900 // %10 azalış
      })
      expect(result.fiyatFarkiTutari).toBe(0)
    })
  })

  describe('calculateKesintilerVeNet', () => {
    const defaultKesintiParams: KesintiParametreleri = {
      stopajOrani: 0.05, // %5
      damgaVergisiOrani: 0.00948, // ‰ 9.48
      kararPuluOrani: 0.00569, // ‰ 5.69
      kdvOrani: 0.2, // %20
      kdvTevkifatOraniPay: 5,
      kdvTevkifatOraniPayda: 10, // 5/10 (%50) KDV tevkifatı
      avansMahsubu: 5000,
      cezaVeDigerKesintiler: 1000,
      teminatKesintisiOrani: 0.06 // %6 nakit teminat
    }

    it('yasal kesintileri ve net ödenecek tutarı mevzuata uygun hesaplar', () => {
      const brutHakedis = 100000
      const result = calculateKesintilerVeNet(brutHakedis, defaultKesintiParams)

      // Stopaj: 100,000 * 0.05 = 5,000
      // Damga Vergisi: 100,000 * 0.00948 = 948
      // Karar Pulu: 100,000 * 0.00569 = 569
      // Teminat (%6): 100,000 * 0.06 = 6,000
      // KDV (%20): 100,000 * 0.20 = 20,000
      // KDV Tevkifat (5/10): 20,000 * 0.5 = 10,000
      // Toplam Yasal Kesintiler = 5,000 + 948 + 569 + 10,000 + 6,000 = 22,517
      // Toplam Kesintiler = 22,517 + 5,000 (avans) + 1,000 (ceza) = 28,517
      // Net Ödenecek = (100,000 brut + 20,000 KDV) - 28,517 kesintiler = 91,483
      expect(result.hesaplananStopaj).toBe(5000)
      expect(result.hesaplananDamga).toBeCloseTo(948, 2)
      expect(result.hesaplananKararPulu).toBeCloseTo(569, 2)
      expect(result.hesaplananTeminatKesintisi).toBe(6000)
      expect(result.hesaplananKdv).toBe(20000)
      expect(result.hesaplananKdvTevkifat).toBe(10000)
      expect(result.toplamKesintiler).toBeCloseTo(28517, 2)
      expect(result.netOdenecekTutar).toBeCloseTo(91483, 2)
    })
  })
})

