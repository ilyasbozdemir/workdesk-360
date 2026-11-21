import type { Money } from '@temin360/domain'
import type { NeedItem } from './NeedItem'

/** Kalem × firma birim fiyatları (KDV hariç). */
export class QuoteMatrix {
  private readonly prices = new Map<string, Money>()
  private static key = (itemId: number, bidderId: number) => `${itemId}|${bidderId}`

  set(itemId: number, bidderId: number, unitPrice: Money): void {
    this.prices.set(QuoteMatrix.key(itemId, bidderId), unitPrice)
  }

  get(itemId: number, bidderId: number): Money | undefined {
    return this.prices.get(QuoteMatrix.key(itemId, bidderId))
  }

  entries(): { itemId: number; bidderId: number; unitPrice: Money }[] {
    return [...this.prices.entries()].map(([k, unitPrice]) => {
      const [itemId, bidderId] = k.split('|').map(Number) as [number, number]
      return { itemId, bidderId, unitPrice }
    })
  }

  /** Bir kalem için fiyat veren tüm firmaların fiyatları. */
  pricesForItem(itemId: number, bidderIds: readonly number[]): Money[] {
    return bidderIds.flatMap((b) => {
      const p = this.get(itemId, b)
      return p ? [p] : []
    })
  }

  /** Firma tüm kalemlere fiyat vermiş mi? Eksik teklifli firmayla adil karşılaştırma yapılamaz. */
  isCompleteFor(bidderId: number, items: readonly NeedItem[]): boolean {
    return items.length > 0 && items.every((i) => this.get(i.id, bidderId) !== undefined)
  }
}
