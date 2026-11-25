import type { NeedItem } from "../file/NeedItem";
import type { QuoteMatrix } from "../file/QuoteMatrix";
import { Money } from "../money";
import { lineTotal } from "../numeric";
import type { PricingBasis } from "./PricingBasis";

/**
 * Yaklaşık maliyet hesaplama çıktısı.
 */
export interface ApproximateCostResult {
  /** KDV hariç hesaplanan toplam yaklaşık maliyet tutarı */
  total: Money;
  /** Fiyat teklifi bulunmadığı için hesaba dahil edilemeyen kalemlerin ID listesi */
  missingItemIds: number[];
}

/**
 * Yaklaşık Maliyet Hesaplayıcı (Domain Service).
 * 
 * 4734 Sayılı Kanun Madde 9 ve Doğrudan Temin mevzuatına uygun olarak,
 * piyasadan toplanan fiyat teklifleri ve seçilen fiyatlandırma esasına (PricingBasis)
 * göre yaklaşık maliyeti kalem ve dosya bazında hesaplar.
 */
export class ApproximateCostCalculator {
  /**
   * Dosyadaki ihtiyaç kalemleri ve teklif matrisi üzerinden yaklaşık maliyeti hesaplar.
   * 
   * @param items - İhtiyaç kalemleri listesi
   * @param bidderIds - Fiyatı dikkate alınacak istekli firmaların ID listesi
   * @param quotes - Teklif matrisi
   * @param basis - Birim fiyat belirleme esası (Aritmetik Ortalama, En Düşük Teklif, Medyan)
   * @returns Toplam tutar ve eksik kalan kalemleri içeren sonuç nesnesi
   */
  calculate(
    items: readonly NeedItem[],
    bidderIds: readonly number[],
    quotes: QuoteMatrix,
    basis: PricingBasis,
  ): ApproximateCostResult {
    let total = Money.ZERO;
    const missingItemIds: number[] = [];
    for (const item of items) {
      const unit = basis.unitPrice(quotes.pricesForItem(item.id, bidderIds));
      if (!unit) missingItemIds.push(item.id);
      else total = total.plus(lineTotal(unit, item.quantity));
    }
    return { total, missingItemIds };
  }
}
