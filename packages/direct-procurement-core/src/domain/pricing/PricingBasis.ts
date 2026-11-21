import { Money } from '@temin360/domain'

/** Yaklaşık maliyette bir kalemin birim fiyatını tekliflerden türeten esas (strateji). */
export interface PricingBasis {
  readonly id: 'ortalama' | 'en-dusuk' | 'medyan'
  unitPrice(prices: readonly Money[]): Money | undefined
}

export class AveragePricing implements PricingBasis {
  readonly id = 'ortalama' as const
  unitPrice(prices: readonly Money[]): Money | undefined {
    if (prices.length === 0) return undefined
    const sum = prices.reduce((a, p) => a.plus(p), Money.ZERO)
    return sum.mulRate(1, prices.length)
  }
}

export class LowestPricing implements PricingBasis {
  readonly id = 'en-dusuk' as const
  unitPrice(prices: readonly Money[]): Money | undefined {
    return prices.length === 0 ? undefined : prices.reduce((m, p) => (p.compareTo(m) < 0 ? p : m))
  }
}

export class MedianPricing implements PricingBasis {
  readonly id = 'medyan' as const
  unitPrice(prices: readonly Money[]): Money | undefined {
    if (prices.length === 0) return undefined
    const s = [...prices].sort((a, b) => a.compareTo(b))
    const mid = Math.floor(s.length / 2)
    return s.length % 2 === 1 ? s[mid]! : s[mid - 1]!.plus(s[mid]!).mulRate(1, 2)
  }
}
