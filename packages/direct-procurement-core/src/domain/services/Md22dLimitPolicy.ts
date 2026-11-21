import { md22dLimiti, type IdareTipi, type Money } from '@temin360/domain'

/**
 * Parasal limit değerlendirme sonucu.
 */
export interface LimitEvaluation {
  /** İlgili mali yıl/dönem için geçerli olan 22/d üst parasal limiti (KDV hariç) */
  limit: Money
  /** Alım tutarının limit dahilinde olup olmadığı (`true` ise doğrudan temin yapılabilir) */
  withinLimit: boolean
  /** Limite kalan bakiye (negatif ise limit aşımı vardır) */
  margin: Money
}

/**
 * 4734 Sayılı Kanun Madde 22/d Parasal Limit Politikası (Domain Service).
 * 
 * Kamu İhale Kurumu (KİK) tarafından her yıl yayımlanan Doğrudan Temin parasal limitlerini
 * dosya tarihi ve idare tipine (Büyükşehir / Diğer İdareler) göre denetler.
 */
export class Md22dLimitPolicy {
  /**
   * Alım tutarını yasal limit ile karşılaştırarak değerlendirir.
   * 
   * @param costKdvHaric - KDV hariç yaklaşık maliyet veya alım tutarı
   * @param isoDate - Alım veya onay tarihi (ISO formatı YYYY-MM-DD)
   * @param idare - İdare türü ('buyuksehir' veya 'diger')
   * @returns Limit değerlendirme sonucu
   */
  evaluate(costKdvHaric: Money, isoDate: string, idare: IdareTipi): LimitEvaluation {
    const limit = md22dLimiti(isoDate, idare)
    return { limit, withinLimit: costKdvHaric.compareTo(limit) <= 0, margin: limit.minus(costKdvHaric) }
  }
}
