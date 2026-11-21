import { DomainError } from "./DomainError";
import { Money } from "../money";

/** Birim fiyat × miktar. Miktar en çok 3 ondalık olabilir. */
export function lineTotal(unit: Money, quantity: number): Money {
  const scaled = Math.round(quantity * 1000);
  if (Math.abs(scaled / 1000 - quantity) > 1e-9) {
    throw new DomainError(
      "QTY_PRECISION",
      `Miktar en çok 3 ondalık içerebilir: ${quantity}`,
    );
  }
  return unit.mulRate(scaled, 1000);
}

/** KDV hariç tutardan KDV dahil tutar. */
export const withKdv = (haric: Money, kdvPercent: number): Money =>
  haric.mulRate(100 + kdvPercent, 100);

/** Binde oranı (örn. 5.69) -> Money.mulRate için pay/payda (4 ondalığa kadar). */
export function perMilleToFraction(
  perMille: number,
): { pay: bigint; payda: bigint } {
  return { pay: BigInt(Math.round(perMille * 10_000)), payda: 10_000_000n };
}

export const roundQty = (q: number): number => Math.round(q * 1000) / 1000;
