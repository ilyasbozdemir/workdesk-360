import type { Money } from '@temin360/domain'
import { perMilleToFraction } from '../numeric'

/**
 * Mevzuattaki binde oranları anlık görüntüsü (TANIM_Mevzuat tablosundan beslenir).
 */
export interface RateSnapshot {
  /** Karar pulu binde oranı (Örn: 5.69) */
  kararPuluBinde: number
  /** Damga vergisi binde oranı (Örn: 9.48) */
  damgaVergisiBinde: number
}

/**
 * Kesinti hesaplama bağlamı.
 */
export interface DeductionContext {
  /** Toplam KDV hariç tutar */
  totalKdvHaric: Money
  /** Toplam KDV dahil tutar */
  totalKdvDahil: Money
  /** İlgili mali yılın mevzuat vergi ve kesinti oranları */
  rates: RateSnapshot
}

/**
 * Hesaplanan tek bir yasal kesinti satırı.
 */
export interface DeductionLine {
  /** Kural ID'si */
  ruleId: string
  /** Kesinti adı / açıklaması */
  label: string
  /** Kesintinin hesaplandığı matrah tutarı */
  matrah: Money
  /** Kesinti tutarı */
  amount: Money
}

/**
 * Yasal Kesinti Kuralı (Soyut Temel Sınıf).
 */
export abstract class DeductionRule {
  protected constructor(readonly id: string, readonly label: string) {}
  /**
   * Verilen bağlam üzerinden kesinti tutarını hesaplar.
   * 
   * @param ctx - Fiyat toplamları ve mevzuat oranlarını içeren bağlam
   */
  abstract calculate(ctx: DeductionContext): DeductionLine
}

/**
 * Binde Oran Bazlı Yasal Kesinti Kuralı (Damga vergisi, karar pulu vb.).
 * Matrah × (mevzuat oranı binde) formülüyle kuruşu kuruşuna deterministik hesaplama yapar.
 */
export class RateDeduction extends DeductionRule {
  /**
   * Yeni bir binde oran kesinti kuralı tanımlar.
   * 
   * @param id - Kural kimliği (örn: 'damga-vergisi')
   * @param label - Kullanıcıya gösterilecek etiket (örn: 'Damga Vergisi')
   * @param base - Matrahın KDV hariç mi yoksa KDV dahil tutar üzerinden mi hesaplanacağı
   * @param rateKey - `RateSnapshot` içindeki oran alanı
   */
  constructor(
    id: string,
    label: string,
    private readonly base: 'kdvHaric' | 'kdvDahil',
    private readonly rateKey: keyof RateSnapshot,
  ) {
    super(id, label)
  }

  calculate(ctx: DeductionContext): DeductionLine {
    const matrah = this.base === 'kdvHaric' ? ctx.totalKdvHaric : ctx.totalKdvDahil
    const { pay, payda } = perMilleToFraction(ctx.rates[this.rateKey])
    return { ruleId: this.id, label: this.label, matrah, amount: matrah.mulRate(pay, payda) }
  }
}
