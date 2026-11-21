import { md22dLimiti, type IdareTipi, type Money } from '@temin360/domain'

export interface LimitEvaluation {
  limit: Money
  withinLimit: boolean
  /** Limite kalan (negatifse aşım) */
  margin: Money
}

/** 4734 md. 22/d parasal limit kontrolü. Limitler `@temin360/domain` içindeki tarihli dönemlerden gelir. */
export class Md22dLimitPolicy {
  evaluate(costKdvHaric: Money, isoDate: string, idare: IdareTipi): LimitEvaluation {
    const limit = md22dLimiti(isoDate, idare)
    return { limit, withinLimit: costKdvHaric.compareTo(limit) <= 0, margin: limit.minus(costKdvHaric) }
  }
}
