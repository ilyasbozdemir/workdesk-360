import { describe, expect, it } from "vitest";
import { harcamaPusulasiRoute } from "../route.definition";
import { definition } from "../definition";
import { getTemplateRouteDefinition } from "../../../route-registry";

describe("HarcamaPusulasi — Rota Tanımı", () => {
  it("1. Rota tanımı doğru templateId ve slotları içerir", () => {
    expect(harcamaPusulasiRoute.templateId).toBe("harcama-pusulasi");
    expect(harcamaPusulasiRoute.slots.length).toBe(2);

    const slotIds = harcamaPusulasiRoute.slots.map((s) => s.id);
    expect(slotIds).toContain("onaylayan");
    expect(slotIds).toContain("sunulacakMakam");
  });

  it("2. Definition nesnesi routeDefinition ile eşleşir", () => {
    expect(definition.routeDefinition).toEqual(harcamaPusulasiRoute);
  });

  it("3. TemplateRegistry rota çözümlemesi harcamaPusulasiRoute döndürür", () => {
    const route = getTemplateRouteDefinition("harcama-pusulasi");
    expect(route).toBeDefined();
    expect(route.templateId).toBe("harcama-pusulasi");
    expect(route.slots.some((s) => s.id === "onaylayan")).toBe(true);

    const altRoute = getTemplateRouteDefinition("harcama_pusulasi");
    expect(altRoute.slots.some((s) => s.id === "onaylayan")).toBe(true);
  });

  it("4. Onaylayan slotu Harcama Yetkilisi hedef alanlarını içerir", () => {
    const onaylayanSlot = harcamaPusulasiRoute.slots.find((s) => s.id === "onaylayan");
    expect(onaylayanSlot).toBeDefined();
    expect(onaylayanSlot?.required).toBe(true);
    expect(onaylayanSlot?.targetFieldKeys).toContain("harcamaYetkilisiAdi");
    expect(onaylayanSlot?.targetFieldKeys).toContain("onaylayanPersonelAdi");
  });
});
