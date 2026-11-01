import Decimal from 'decimal.js'
import { Money } from '../../money'

export function calculateLineTotal(
  quantity: string,
  unitPrice: string
): Money {
  const total = new Decimal(quantity)
    .mul(new Decimal(unitPrice))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

  return Money.fromTL(total.toFixed(2))
}