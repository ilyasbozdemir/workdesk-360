import { describe, expect, it } from "vitest";
import { luzumMuzekkeresiTeslimTesellumRoute } from "../route.definition";
import { definition } from "../definition";

describe("LuzumMuzekkeresiTeslimTesellum — Rota Tanımı", () => {
  it("1. Rota tanımı doğru templateId ve slotları içerir", () => {
    expect(luzumMuzekkeresiTeslimTesellumRoute.templateId).toBe("luzum-muzekkeresi-teslim-tesellum");
    expect(luzumMuzekkeresiTeslimTesellumRoute.slots.length).toBeGreaterThanOrEqual(2);

    const slotIds = luzumMuzekkeresiTeslimTesellumRoute.slots.map((s) => s.id);
    expect(slotIds).toContain("teslimEden");
    expect(slotIds).toContain("teslimAlan");
  });

  it("2. Definition nesnesi routeDefinition ile eşleşir", () => {
    expect(definition.routeDefinition).toEqual(luzumMuzekkeresiTeslimTesellumRoute);
  });
});
