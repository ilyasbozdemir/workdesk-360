import { IhtiyacRaporuKalem } from '../services/ihtiyacRaporuService'

export const DEFAULT_KDV_ORANI = 20

export interface Totals {
  araToplam: number
  kdv: number
  genelToplam: number
}

/**
 * Kuruş hassasiyetinde (2 ondalık) güvenli yuvarlama yapar.
 * Floating point hatalarını engellemek için Number.EPSILON kullanır.
 */
export function roundToKurus(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

/**
 * Kalem listesindeki KDV oranını güvenli çözer.
 * null veya undefined ise DEFAULT_KDV_ORANI (20) döner.
 * %0 geçerli bir vergi muafiyet oranı olduğundan korunur.
 */
export function resolveKdvOrani(kdvOrani: unknown): number {
  if (kdvOrani === null || kdvOrani === undefined || kdvOrani === '') {
    return DEFAULT_KDV_ORANI
  }
  const parsed = Number(kdvOrani)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_KDV_ORANI
}

/**
 * İhtiyaç raporu kalemlerinden tek kaynaktan tutarlı araToplam, KDV ve genelToplam hesaplar.
 * - Satır bazında 2 ondalık (kuruş) yuvarlama uygulanır.
 * - Genel toplam = araToplam + kdv eşitliği kuruş bazında korunur.
 */
export function calculateTotals(
  kalemler: Array<Pick<IhtiyacRaporuKalem, 'miktar' | 'tahmini_birim_fiyat' | 'kdv_orani'>>
): Totals {
  if (!kalemler || kalemler.length === 0) {
    return {
      araToplam: 0,
      kdv: 0,
      genelToplam: 0
    }
  }

  let rawSubTotal = 0
  let rawKdvTotal = 0

  for (const kalem of kalemler) {
    const miktar = Number(kalem.miktar) || 0
    const birimFiyat = Number(kalem.tahmini_birim_fiyat) || 0
    if (miktar <= 0 || birimFiyat <= 0) {
      continue
    }

    const rowSubTotal = roundToKurus(miktar * birimFiyat)
    const kdvRate = resolveKdvOrani(kalem.kdv_orani)
    const rowKdv = roundToKurus((rowSubTotal * kdvRate) / 100)

    rawSubTotal += rowSubTotal
    rawKdvTotal += rowKdv
  }

  const araToplam = roundToKurus(rawSubTotal)
  const kdv = roundToKurus(rawKdvTotal)
  const genelToplam = roundToKurus(araToplam + kdv)

  return {
    araToplam,
    kdv,
    genelToplam
  }
}
