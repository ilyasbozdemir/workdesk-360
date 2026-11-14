import { describe, expect, it } from "vitest";
import { luzumMuzekkeresiOnayEkiRoute } from "../route.definition";
import { definition } from "../definition";
import { getTemplateRouteDefinition } from "../../../route-registry";

describe("LuzumMuzekkeresiOnayEki — Rota Tanımı", () => {
  it("1. Rota tanımı doğru templateId ve slotları içerir", () => {
    expect(luzumMuzekkeresiOnayEkiRoute.templateId).toBe("luzum-muzekkeresi-onay-eki");
    expect(luzumMuzekkeresiOnayEkiRoute.slots.length).toBeGreaterThanOrEqual(2);

    const slotIds = luzumMuzekkeresiOnayEkiRoute.slots.map((s) => s.id);
    expect(slotIds).toContain("talepEden");
    expect(slotIds).toContain("hazirlayan");
  });

  it("2. Definition nesnesi routeDefinition ile eşleşir", () => {
    expect(definition.routeDefinition).toEqual(luzumMuzekkeresiOnayEkiRoute);
  });

  it("3. route-registry üzerinden doğru çözümlenir", () => {
    const route = getTemplateRouteDefinition("luzum-muzekkeresi-onay-eki");
    expect(route.templateId).toBe("luzum-muzekkeresi-onay-eki");
    expect(route.slots.some((s) => s.id === "talepEden")).toBe(true);

    const aliasRoute = getTemplateRouteDefinition("luzum_onay_eki");
    expect(aliasRoute.slots.some((s) => s.id === "talepEden")).toBe(true);
  });
});
