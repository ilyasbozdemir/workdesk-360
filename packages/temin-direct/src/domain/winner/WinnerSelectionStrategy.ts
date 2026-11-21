import type { Money } from '@temin360/domain'
import type { Bidder } from '../file/Bidder'
import type { NeedItem } from '../file/NeedItem'
import type { QuoteMatrix } from '../file/QuoteMatrix'
import { DomainError } from '../shared/DomainError'
import { lineTotal } from '../shared/numeric'

export interface WinnerResult {
  bidderId: number
  total: Money // KDV hariç
  /** Aynı toplamı veren diğer firmalar (beraberlik uyarısı için) */
  tiedWith: number[]
}

export interface WinnerSelectionStrategy {
  select(items: readonly NeedItem[], bidders: readonly Bidder[], quotes: QuoteMatrix): WinnerResult
}

/** KDV hariç toplamı en düşük olan, TÜM kalemlere fiyat vermiş firma. */
export class LowestTotalStrategy implements WinnerSelectionStrategy {
  select(items: readonly NeedItem[], bidders: readonly Bidder[], quotes: QuoteMatrix): WinnerResult {
    const candidates = bidders
      .filter((b) => quotes.isCompleteFor(b.id, items))
      .map((b) => ({ id: b.id, total: LowestTotalStrategy.totalOf(items, b.id, quotes) }))

    if (candidates.length === 0)
      throw new DomainError('NO_COMPLETE_BID', 'Tüm kalemlere fiyat vermiş firma yok, kazanan belirlenemez.')

    const best = candidates.reduce((m, c) => (c.total.compareTo(m.total) < 0 ? c : m))
    const tiedWith = candidates.filter((c) => c.id !== best.id && c.total.equals(best.total)).map((c) => c.id)
    return { bidderId: best.id, total: best.total, tiedWith }
  }

  private static totalOf(items: readonly NeedItem[], bidderId: number, quotes: QuoteMatrix): Money {
    return items
      .map((i) => lineTotal(quotes.get(i.id, bidderId)!, i.quantity))
      .reduce((a, b) => a.plus(b))
  }
}
