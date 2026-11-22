import { Money } from "../money";
import type { NeedItem } from "./NeedItem";

/**
 * Teklif Matrisi (Value Object / Collection).
 * 
 * Kalem × İstekli Firma bazında alınan birim fiyatları (KDV hariç) saklayan ve yöneten veri yapısıdır.
 * Eksik teklif kontrolü ve yaklaşık maliyet hesaplamaları için merkezi veri kaynağıdır.
 */
export class QuoteMatrix {
  private readonly prices = new Map<string, Money>();
  private static key = (itemId: number, bidderId: number) =>
    `${itemId}|${bidderId}`;

  /**
   * Bir kaleme ait istekli firma birim fiyatını kaydeder.
   * 
   * @param itemId - İhtiyaç kalemi kimliği
   * @param bidderId - İstekli firma kimliği
   * @param unitPrice - KDV hariç birim fiyat tutarı
   */
  set(itemId: number, bidderId: number, unitPrice: Money): void {
    this.prices.set(QuoteMatrix.key(itemId, bidderId), unitPrice);
  }

  /**
   * Belirtilen kalem ve istekli firmaya ait birim fiyatı getirir.
   * 
   * @param itemId - İhtiyaç kalemi kimliği
   * @param bidderId - İstekli firma kimliği
   * @returns Tanımlıysa birim fiyat tutarı, aksi halde `undefined`
   */
  get(itemId: number, bidderId: number): Money | undefined {
    return this.prices.get(QuoteMatrix.key(itemId, bidderId));
  }

  /**
   * Matristeki tüm teklif kayıtlarını düz liste olarak döndürür.
   */
  entries(): { itemId: number; bidderId: number; unitPrice: Money }[] {
    return [...this.prices.entries()].map(([k, unitPrice]) => {
      const [itemId, bidderId] = k.split("|").map(Number) as [number, number];
      return { itemId, bidderId, unitPrice };
    });
  }

  /**
   * Belirli bir kalem için fiyat teklifi vermiş olan tüm firmaların fiyatlarını döndürür.
   * 
   * @param itemId - İhtiyaç kalemi kimliği
   * @param bidderIds - Sorgulanacak firma ID listesi
   * @returns Verilen geçerli fiyat teklifleri dizisi
   */
  pricesForItem(itemId: number, bidderIds: readonly number[]): Money[] {
    return bidderIds.flatMap((b) => {
      const p = this.get(itemId, b);
      return p ? [p] : [];
    });
  }

  /**
   * İstekli firmanın dosyada bulunan tüm kalemlere eksiksiz fiyat verip vermediğini denetler.
   * Eksik teklif veren firmalarla adil değerlendirme yapılamaz.
   * 
   * @param bidderId - Denetlenecek firma kimliği
   * @param items - Dosyanın ihtiyaç kalemleri listesi
   * @returns Firma tüm kalemleri fiyatlandırmışsa `true`
   */
  isCompleteFor(bidderId: number, items: readonly NeedItem[]): boolean {
    return items.length > 0 &&
      items.every((i) => this.get(i.id, bidderId) !== undefined);
  }
}
