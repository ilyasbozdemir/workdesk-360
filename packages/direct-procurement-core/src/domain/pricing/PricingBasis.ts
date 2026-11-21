import { Money } from '@temin360/domain'

/**
 * Yaklaşık maliyet birim fiyat belirleme esası arayüzü (Strategy Pattern).
 * 
 * Toplanan piyasa tekliflerinden tek bir kalemin yaklaşık maliyet birim fiyatının
 * nasıl türetileceğini belirler.
 */
export interface PricingBasis {
  /** Esas tanımlayıcısı */
  readonly id: 'ortalama' | 'en-dusuk' | 'medyan'
  /**
   * Verilen fiyat tekliflerinden geçerli birim fiyatı türetir.
   * 
   * @param prices - Kalem için toplanan fiyat teklifleri
   * @returns Hesaplanan birim fiyat veya teklif yoksa `undefined`
   */
  unitPrice(prices: readonly Money[]): Money | undefined
}

/**
 * Aritmetik Ortalama Esası (Average Pricing).
 * 
 * Kaleme verilen geçerli tüm piyasa tekliflerinin aritmetik ortalamasını yaklaşık maliyet birim fiyatı olarak kabul eder.
 */
export class AveragePricing implements PricingBasis {
  readonly id = 'ortalama' as const
  unitPrice(prices: readonly Money[]): Money | undefined {
    if (prices.length === 0) return undefined
    const sum = prices.reduce((a, p) => a.plus(p), Money.ZERO)
    return sum.mulRate(1, prices.length)
  }
}

/**
 * En Düşük Teklif Esası (Lowest Pricing).
 * 
 * Piyasadan alınan teklifler arasındaki en düşük birim fiyatı yaklaşık maliyet olarak kabul eder.
 */
export class LowestPricing implements PricingBasis {
  readonly id = 'en-dusuk' as const
  unitPrice(prices: readonly Money[]): Money | undefined {
    return prices.length === 0 ? undefined : prices.reduce((m, p) => (p.compareTo(m) < 0 ? p : m))
  }
}

/**
 * Medyan (Ortanca) Esası (Median Pricing).
 * 
 * Uç değerlerin (aşırı yüksek veya aşırı düşük tekliflerin) ortalamayı saptırmasını önlemek için
 * teklifleri sıralayıp ortanca değeri yaklaşık maliyet birim fiyatı olarak seçer.
 */
export class MedianPricing implements PricingBasis {
  readonly id = 'medyan' as const
  unitPrice(prices: readonly Money[]): Money | undefined {
    if (prices.length === 0) return undefined
    const s = [...prices].sort((a, b) => a.compareTo(b))
    const mid = Math.floor(s.length / 2)
    return s.length % 2 === 1 ? s[mid]! : s[mid - 1]!.plus(s[mid]!).mulRate(1, 2)
  }
}
