/**
 * Verilen slot değerlerine manuel override'ları uygular.
 * Aynı slot ID'si override içinde varsa önceki değerin yerini alır.
 * NOT: Tek başına kaynak önceliğini çözmez; onu resolveRoute yapar.
 */
import type { RouteOverride, RouteValues } from "./types";

export function mergeRouteOverrides(
  values: RouteValues,
  overrides: readonly RouteOverride[],
): RouteValues {
  return {
    ...values,
    ...Object.fromEntries(overrides.map((item) => [item.slotId, item.value])),
  };
}

