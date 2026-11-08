import { describe, expect, it } from "vitest";
import {
  templateRegistry,
  getAllTemplateDefinitions,
  getTemplateDefinition,
  getTemplateMapping,
} from "../registry";
import { resolveTemplateData } from "../resolver/mappingResolver";
import { getTemplateRouteDefinition } from "../route-registry";

describe("Şablon Bazlı Mapping & Registry Mimarisi Testleri", () => {
  it("templateRegistry içindeki her şablon kendi dataMapping ve mapping tanımlarına sahip olmalıdır", () => {
    const definitions = getAllTemplateDefinitions();
    expect(definitions.length).toBeGreaterThanOrEqual(30);

    for (const def of definitions) {
      expect(def.dataMapping, `Şablon [${def.id}] dataMapping içermelidir`).toBeDefined();
      expect(typeof def.dataMapping).toBe("object");
      expect(def.mapping, `Şablon [${def.id}] mapping uyumluluk referansı içermelidir`).toBe(def.dataMapping);
    }
  });

  it("getTemplateMapping kanonik kimlik, snake_case ve alias değerlerini merkezi şablondan çözer", () => {
    const ihtiyacMap = getTemplateMapping("ihtiyac-listesi");
    expect(ihtiyacMap).toBeDefined();
    expect(ihtiyacMap.dosyaKonusu?.deger).toBe("İhtiyaç Listesi");

    const tutanakMap = getTemplateMapping("piyasa-fiyat-arastirma-tutanagi");
    expect(tutanakMap).toBeDefined();
    expect(tutanakMap.toplamBedel?.tablo).toBe("DATA_TeminDosyasi");

    // Snake_case çözümleme
    const snakeMap = getTemplateMapping("piyasa_fiyat_arastirma_tutanagi");
    expect(snakeMap).toBe(tutanakMap);

    // Alias çözümleme
    const aliasMap = getTemplateMapping("tutanak");
    expect(aliasMap).toBe(tutanakMap);

    // Kapsam dışı veya bilinmeyen kimlikte boş obje dönmeli, çökmemelidir
    expect(getTemplateMapping("")).toEqual({});
    expect(getTemplateMapping(null)).toEqual({});
    expect(getTemplateMapping(undefined)).toEqual({});
  });

  it("Yan / kapak belgeleri (ancillary mappings) getTemplateMapping üzerinden eksiksiz çözülür", () => {
    const ihaleKapagi = getTemplateMapping("ihale-kapagi");
    expect(ihaleKapagi).toBeDefined();
    expect(ihaleKapagi.teminNo?.tablo).toBe("DATA_TeminDosyasi");

    const sif = getTemplateMapping("tasinir-islem-fisi");
    expect(sif).toBeDefined();
    expect(sif.ihtiyacKalemleri?.altEslestirme?.malzemeAdi).toBe("kalem_adi");
  });

  it("Şablon klasöründeki dataMapping resolveTemplateData motoruyla hatasız yürütülür", async () => {
    const tutanakMap = getTemplateMapping("piyasa-fiyat-arastirma-tutanagi");
    const mockExecutor = async (sql: string) => {
      if (sql.includes("AS res_val") && sql.includes("konu")) {
        return [{ res_val: "Boya Alımı" }];
      }
      if (sql.includes("DATA_TeminDosyasi")) {
        return [{ res_val: "Boya Alımı", id: 1, konu: "Boya Alımı", yaklasik_maliyet: 50000 }];
      }
      return [];
    };

    const resolved = await resolveTemplateData(tutanakMap, 1, mockExecutor, "piyasa-fiyat-arastirma-tutanagi");
    expect(resolved.isinAdi).toBe("Boya Alımı");
  });

  it("Rota tanımları ilgili şablon paketlerinden merkezi route-registry'ye aktarılır", () => {
    const yaklasikRoute = getTemplateRouteDefinition("yaklasik-maliyet-cetveli");
    expect(yaklasikRoute.templateId).toBe("yaklasik-maliyet-cetveli");
    expect(yaklasikRoute.slots.some((s) => s.id === "komisyon")).toBe(true);

    const onayRoute = getTemplateRouteDefinition("dogrudan-temin-onay-belgesi");
    expect(onayRoute.slots.some((s) => s.id === "gerceklestirmeGorevlisi")).toBe(true);
  });
});
