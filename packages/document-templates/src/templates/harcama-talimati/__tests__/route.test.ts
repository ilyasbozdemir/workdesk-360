import { describe, expect, it } from "vitest";
import { harcamaTalimatiRoute } from "../route.definition";
import { definition } from "../definition";
import { getTemplateRouteDefinition } from "../../../route-registry";

describe("HarcamaTalimati — Rota Tanımı", () => {
  it("1. Rota tanımı doğru templateId ve slotları içerir", () => {
    expect(harcamaTalimatiRoute.templateId).toBe("harcama-talimati");
    expect(harcamaTalimatiRoute.slots.length).toBe(4);

    const slotIds = harcamaTalimatiRoute.slots.map((s) => s.id);
    expect(slotIds).toContain("gerceklestirmeGorevlisi");
    expect(slotIds).toContain("mutemet");
    expect(slotIds).toContain("onaylayan");
    expect(slotIds).toContain("sunulacakMakam");
  });

  it("2. Definition nesnesi routeDefinition ile eşleşir", () => {
    expect(definition.routeDefinition).toEqual(harcamaTalimatiRoute);
  });

  it("3. TemplateRegistry rota çözümlemesi harcamaTalimatiRoute döndürür", () => {
    const route = getTemplateRouteDefinition("harcama-talimati");
    expect(route).toBeDefined();
    expect(route.templateId).toBe("harcama-talimati");
    expect(route.slots.some((s) => s.id === "mutemet")).toBe(true);

    const altRoute = getTemplateRouteDefinition("harcama_talimati");
    expect(altRoute.slots.some((s) => s.id === "mutemet")).toBe(true);
  });

  it("4. Mutemet slotu muhasebe birim kategorisine ve ilgili alanlara bağlanmıştır", () => {
    const mutemetSlot = harcamaTalimatiRoute.slots.find((s) => s.id === "mutemet");
    expect(mutemetSlot).toBeDefined();
    expect(mutemetSlot?.unitCategory).toBe("muhasebe");
    expect(mutemetSlot?.fieldKey).toBe("mutemetAdi");
    expect(mutemetSlot?.titleFieldKey).toBe("mutemetUnvan");
    expect(mutemetSlot?.targetFieldKeys).toContain("muhasebeYetkilisiAdi");
  });

  it("5. Gerçekleştirme görevlisi slotu hem gerceklestirme hem hazirlayan personeli hedefler", () => {
    const ggSlot = harcamaTalimatiRoute.slots.find((s) => s.id === "gerceklestirmeGorevlisi");
    expect(ggSlot).toBeDefined();
    expect(ggSlot?.required).toBe(true);
    expect(ggSlot?.targetFieldKeys).toContain("gerceklestirmeGorevlisiAdi");
    expect(ggSlot?.targetFieldKeys).toContain("hazirlayanPersonelAdi");
    expect(ggSlot?.targetFieldKeys).toContain("gerceklestirmeGorevlileri");
  });
});
