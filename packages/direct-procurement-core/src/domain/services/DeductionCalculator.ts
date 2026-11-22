import { Money } from "../money";
import type { DeductionContext, DeductionLine } from "../profile/DeductionRule";
import type { ProcurementProfile } from "../profile/ProcurementProfile";

/**
 * Yasal Kesinti Hesaplayıcı (Domain Service).
 * 
 * Alım profiline (`ProcurementProfile`) tanımlı tüm vergi ve kesinti kurallarını
 * işletir. Profilde kural yoksa gereksiz kesinti hesaplamaz (Doğrudan teminde karar pulu kesilmez).
 */
export class DeductionCalculator {
  /**
   * Profildeki kuralları verilen bağlama uygulayarak kesinti satırlarını hesaplar.
   * 
   * @param profile - İlgili alım profili
   * @param ctx - Matrahlar ve mevzuat oranlarını içeren bağlam
   * @returns Hesaplanmış kesinti satırları dizisi
   */
  calculate(
    profile: ProcurementProfile,
    ctx: DeductionContext,
  ): DeductionLine[] {
    return profile.deductions.map((rule) => rule.calculate(ctx));
  }

  /**
   * Hesaplanmış kesinti satırlarının genel toplamını döndürür.
   * 
   * @param lines - Kesinti satırları
   * @returns Toplam kesinti tutarı (Money)
   */
  total(lines: readonly DeductionLine[]): Money {
    return lines.reduce((s, l) => s.plus(l.amount), Money.ZERO);
  }
}
