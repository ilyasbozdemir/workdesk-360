import type { Bidder } from "../file/Bidder";
import type { NeedItem } from "../file/NeedItem";
import type { QuoteMatrix } from "../file/QuoteMatrix";
import { Money } from "../money";
import { DomainError } from "../shared/DomainError";
import { lineTotal } from "../shared/numeric";

/**
 * Kazanan seçimi sonucu.
 */
export interface WinnerResult {
  /** En avantajlı teklifi vererek seçilen yüklenici firmanın ID'si */
  bidderId: number;
  /** Kazanan firmanın KDV hariç toplam teklif tutarı */
  total: Money;
  /** Aynı en düşük toplamı vererek berabere kalan diğer firma ID'leri (beraberlik uyarısı için) */
  tiedWith: number[];
}

/**
 * Kazanan İstekli Belirleme Stratejisi Arayüzü (Strategy Pattern).
 * 
 * Verilen ihtiyaç kalemleri ve toplanan fiyat teklifleri üzerinden
 * alımın hangi istekli üzerinde kalacağını belirler.
 */
export interface WinnerSelectionStrategy {
  /**
   * Teklifleri değerlendirerek kazanan firmayı belirler.
   * 
   * @param items - İhtiyaç kalemleri listesi
   * @param bidders - Teklif veren firmalar
   * @param quotes - Birim fiyat matrisi
   * @returns Kazanan firma kimliği ve toplam teklif tutarı
   */
  select(
    items: readonly NeedItem[],
    bidders: readonly Bidder[],
    quotes: QuoteMatrix,
  ): WinnerResult;
}

/**
 * En Düşük Toplam Teklif Stratejisi (Lowest Total Strategy).
 * 
 * Doğrudan temin uygulamasında en yaygın kullanılan kuraldır:
 * Tüm kalemlere geçerli fiyat vermiş firmalar arasından KDV hariç genel toplamı
 * en düşük olan istekliyi kazanan olarak seçer.
 */
export class LowestTotalStrategy implements WinnerSelectionStrategy {
  /**
   * En düşük toplam teklif veren firmayı seçer.
   * 
   * @throws {DomainError} `NO_COMPLETE_BID` tüm kalemlere eksiksiz fiyat vermiş hiçbir firma yoksa
   */
  select(
    items: readonly NeedItem[],
    bidders: readonly Bidder[],
    quotes: QuoteMatrix,
  ): WinnerResult {
    const candidates = bidders
      .filter((b) => quotes.isCompleteFor(b.id, items))
      .map((b) => ({
        id: b.id,
        total: LowestTotalStrategy.totalOf(items, b.id, quotes),
      }));

    if (candidates.length === 0) {
      throw new DomainError(
        "NO_COMPLETE_BID",
        "Tüm kalemlere fiyat vermiş firma yok, kazanan belirlenemez.",
      );
    }

    const best = candidates.reduce((
      m,
      c,
    ) => (c.total.compareTo(m.total) < 0 ? c : m));
    const tiedWith = candidates.filter((c) =>
      c.id !== best.id && c.total.equals(best.total)
    ).map((c) => c.id);
    return { bidderId: best.id, total: best.total, tiedWith };
  }

  private static totalOf(
    items: readonly NeedItem[],
    bidderId: number,
    quotes: QuoteMatrix,
  ): Money {
    return items
      .map((i) => lineTotal(quotes.get(i.id, bidderId)!, i.quantity))
      .reduce((a, b) => a.plus(b), Money.ZERO);
  }
}
