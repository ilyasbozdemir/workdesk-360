import { Money } from "../money";
import type { DeductionContext, DeductionLine } from "../profile/DeductionRule";
import type { ProcurementProfile } from "../profile/ProcurementProfile";

/** Kesintilerin TEK hesap noktası. Profilde kural yoksa hiçbir şey hesaplanmaz, `if (tür)` yok. */
export class DeductionCalculator {
  calculate(
    profile: ProcurementProfile,
    ctx: DeductionContext,
  ): DeductionLine[] {
    return profile.deductions.map((rule) => rule.calculate(ctx));
  }

  total(lines: readonly DeductionLine[]): Money {
    return lines.reduce((s, l) => s.plus(l.amount), Money.ZERO);
  }
}
