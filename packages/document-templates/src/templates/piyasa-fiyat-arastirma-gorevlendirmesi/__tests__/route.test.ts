import { describe, expect, it } from "vitest";
import { getTemplateRouteDefinition } from "../../../route-registry";
import { piyasaFiyatGorevlendirmeRoute } from "../route.definition";
import { resolveTemplateKey, getTemplateDefinition } from "../../../registry";

describe("PiyasaFiyatArastirmaGorevlendirmesi — Rota ve Alias Tanımı", () => {
  it("1. getTemplateRouteDefinition standart ID ile doğru rota tanımını döner", () => {
    const route = getTemplateRouteDefinition("piyasa-fiyat-arastirma-gorevlendirmesi");
    expect(route).toBeDefined();
    expect(route.templateId).toBe("piyasa-fiyat-arastirma-gorevlendirmesi");
    expect(route.isAppointmentDocument).toBe(true);

    const slotIds = route.slots.map((s) => s.id);
    expect(slotIds).toContain("komisyon");
    expect(slotIds).toContain("hazirlayan");
    expect(slotIds).toContain("onaylayan");
  });

  it("2. Alias anahtarları (piyasa-arastirma-gorevlendirmesi, piyasa_arastirma_gorevlendirmesi) rotayı ve tanımı doğru çözer", () => {
    const alias1 = getTemplateRouteDefinition("piyasa-arastirma-gorevlendirmesi");
    expect(alias1).toBeDefined();
    expect(alias1.slots.some((s) => s.id === "komisyon")).toBe(true);

    const key1 = resolveTemplateKey("piyasa-arastirma-gorevlendirmesi");
    expect(key1).toBe("piyasa_fiyat_arastirma_gorevlendirmesi");

    const key2 = resolveTemplateKey("piyasa_arastirma_gorevlendirmesi");
    expect(key2).toBe("piyasa_fiyat_arastirma_gorevlendirmesi");

    const key3 = resolveTemplateKey("piyasa-fiyat-arastirma-gorevlendirme");
    expect(key3).toBe("piyasa_fiyat_arastirma_gorevlendirmesi");

    const def = getTemplateDefinition("piyasa-arastirma-gorevlendirmesi");
    expect(def).toBeDefined();
    expect(def?.id).toBe("piyasa-fiyat-arastirma-gorevlendirmesi");
  });

  it("3. Komisyon person-list slotu doğru hedef anahtarları barındırır", () => {
    const komisyonSlot = piyasaFiyatGorevlendirmeRoute.slots.find(
      (s) => s.id === "komisyon"
    );
    expect(komisyonSlot).toBeDefined();
    expect(komisyonSlot?.kind).toBe("person-list");
    expect(komisyonSlot?.fieldKey).toBe("gorevlendirilenler");
    expect(komisyonSlot?.targetFieldKeys).toContain("fiyatKomisyonu");
    expect(komisyonSlot?.targetFieldKeys).toContain("dagitimListesi");
  });

  it("4. Hazırlayan ve Onaylayan slotları person türündedir", () => {
    const hazirlayan = piyasaFiyatGorevlendirmeRoute.slots.find(
      (s) => s.id === "hazirlayan"
    );
    const onaylayan = piyasaFiyatGorevlendirmeRoute.slots.find(
      (s) => s.id === "onaylayan"
    );

    expect(hazirlayan?.kind).toBe("person");
    expect(hazirlayan?.fieldKey).toBe("hazirlayanPersonelAdi");
    expect(onaylayan?.kind).toBe("person");
    expect(onaylayan?.fieldKey).toBe("onaylayanPersonelAdi");
    expect(onaylayan?.required).toBe(true);
  });
});
