/**
 * ROTA ÇÖZÜCÜ (framework bağımsız)
 * 1) Şablonun slotlarını okur.
 * 2) Manuel override varsa onu öncelikli seçer.
 * 3) Yoksa defaultSource (document/settings) üzerinden değeri arar.
 * 4) Birincil kaynak boşsa diğer kaynağı dener.
 * 5) İkisi de boşsa null / unassigned döndürür.
 * 6) validateRoute ile zorunlu alanları ve temel türleri denetler.
 *
 * origin, seçilen değerin nereden geldiğini UI'da göstermek içindir.
 * Bu fonksiyon veritabanından veri ÇEKMEZ; hazırlanmış veri alır.
 */
import type {
  ResolvedDocumentRoute,
  RouteOverride,
  RouteValue,
  RouteValues,
  TemplateRouteDefinition,
} from "@temin360/contracts";
import { validateRoute } from "./validateRoute";

export interface ResolveRouteInput {
  definition: TemplateRouteDefinition;
  settings: RouteValues;
  document: RouteValues;
  overrides?: readonly RouteOverride[];
  /** true ise doğrulama hatalarında Error fırlatır */
  strict?: boolean;
}

function isNonEmptyRouteValue(val: RouteValue | undefined): val is RouteValue {
  if (val === undefined || val === null) return false;
  if (Array.isArray(val)) return val.length > 0;
  return Boolean(val.name && String(val.name).trim() !== "");
}

export function resolveRoute(input: ResolveRouteInput): ResolvedDocumentRoute {
  const { definition, settings, document, overrides = [], strict = false } = input;
  const allowed = new Set(definition.slots.map((slot) => slot.id));
  for (const override of overrides) {
    if (!allowed.has(override.slotId)) {
      throw new Error(`Unknown route slot: ${override.slotId}`);
    }
  }
  const overrideMap = new Map(overrides.map((item) => [item.slotId, item.value]));

  const steps = definition.slots.map((slot) => {
    const primary = slot.defaultSource === "document" ? document : settings;
    const fallback = slot.defaultSource === "document" ? settings : document;
    const primaryValue = primary[slot.id];
    const fallbackValue = fallback[slot.id];
    const hasPrimary = isNonEmptyRouteValue(primaryValue);
    const hasFallback = isNonEmptyRouteValue(fallbackValue);
    const hasOverride = overrideMap.has(slot.id) && isNonEmptyRouteValue(overrideMap.get(slot.id));

    const origin = hasOverride
      ? ("override" as const)
      : hasPrimary
      ? slot.defaultSource
      : hasFallback
      ? slot.defaultSource === "document"
        ? ("settings" as const)
        : ("document" as const)
      : ("unassigned" as const);

    const value = hasOverride
      ? overrideMap.get(slot.id)!
      : hasPrimary
      ? primaryValue!
      : hasFallback
      ? fallbackValue!
      : null;

    return { ...slot, value, origin };
  });

  const route: ResolvedDocumentRoute = {
    templateId: definition.templateId,
    definitionVersion: definition.version,
    isAppointmentDocument: Boolean(definition.isAppointmentDocument),
    steps,
  };
  const errors = validateRoute(route);
  if (errors.length > 0) {
    route.validationErrors = errors;
    if (strict) {
      throw new Error(errors.join("; "));
    }
  }
  return route;
}

