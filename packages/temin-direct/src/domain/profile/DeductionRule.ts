import type { Money } from '@temin360/domain'
import { perMilleToFraction } from '../shared/numeric'

/** Oranlar TANIM_Mevzuat'tan gelir, kuralda sabit tutulmaz. */
export interface RateSnapshot {
  kararPuluBinde: number
  damgaVergisiBinde: number
}

export interface DeductionContext {
  totalKdvHaric: Money
  totalKdvDahil: Money
  rates: RateSnapshot
}

export interface DeductionLine {
  ruleId: string
  label: string
  matrah: Money
  amount: Money
}

export abstract class DeductionRule {
  protected constructor(readonly id: string, readonly label: string) {}
  abstract calculate(ctx: DeductionContext): DeductionLine
}

/** Matrah × (mevzuat oranı binde). */
export class RateDeduction extends DeductionRule {
  constructor(
    id: string,
    label: string,
    private readonly base: 'kdvHaric' | 'kdvDahil',
    private readonly rateKey: keyof RateSnapshot,
  ) {
    super(id, label)
  }

  calculate(ctx: DeductionContext): DeductionLine {
    const matrah = this.base === 'kdvHaric' ? ctx.totalKdvHaric : ctx.totalKdvDahil
    const { pay, payda } = perMilleToFraction(ctx.rates[this.rateKey])
    return { ruleId: this.id, label: this.label, matrah, amount: matrah.mulRate(pay, payda) }
  }
}
