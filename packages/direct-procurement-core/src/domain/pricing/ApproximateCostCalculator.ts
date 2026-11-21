import type { NeedItem } from "../file/NeedItem";
import type { QuoteMatrix } from "../file/QuoteMatrix";
import { Money } from "../money";
import { lineTotal } from "../shared/numeric";
import type { PricingBasis } from "./PricingBasis";

export interface ApproximateCostResult {
  /** KDV hariç yaklaşık maliyet */
  total: Money;
  /** Hiç fiyat gelmediği için hesaba katılamayan kalemler */
  missingItemIds: number[];
}

export class ApproximateCostCalculator {
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
