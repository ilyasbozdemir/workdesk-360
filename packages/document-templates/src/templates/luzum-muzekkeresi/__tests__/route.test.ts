import { describe, expect, it } from "vitest";
import {
  extractDocumentRouteValues,
  resolveRoute,
} from "@worksuite-360/document-engine";
import { getTemplateRouteDefinition } from "../../../route-registry";
import { luzumMuzekkeresiRoute } from "../route.definition";

describe("Lüzum Müzekkeresi — Rota (Route) Tanımı ve Çözümleme Testleri", () => {
  it("route-registry üzerinden luzum-muzekkeresi için doğru şablon rota tanımını döndürür", () => {
    const def = getTemplateRouteDefinition("luzum-muzekkeresi");
    expect(def.templateId).toBe("luzum-muzekkeresi");
    expect(def.slots.map((s) => s.id)).toEqual([
      "talepEden",
      "hazirlayan",
      "onaylayan",
      "sunulacakMakam",
    ]);
    expect(def).toEqual(luzumMuzekkeresiRoute);
  });

  it("varsayılan kaynakları (talepEden -> document, hazirlayan -> document, onaylayan -> settings) doğru çözer", () => {
    const docData = {
      talepEdenPersonelAdi: "Dosyadaki Talep Eden",
      talepEdenPersonelUnvan: "Birim Sorumlusu",
      hazirlayanPersonelAdi: "Dosyadaki Hazırlayan",
      hazirlayanPersonelUnvan: "Dosya Memuru",
      onaylayanPersonelAdi: "Dosyadaki Onaylayan",
      onaylayanPersonelUnvan: "Dosya Müdürü",
      sunulacakMakamAdi: "FEN İŞLERİ MÜDÜRLÜĞÜNE",
    };

    const documentRouteValues = extractDocumentRouteValues(
      docData,
      luzumMuzekkeresiRoute,
    );

    const settingsRouteValues = {
      talepEden: {
        id: "set_talep",
        name: "Ayarlardaki Talep Eden",
        title: "Birim Yetkilisi",
      },
      hazirlayan: {
        id: "set_haz",
        name: "Ayarlardaki Hazırlayan",
        title: "Ayarlar Uzmanı",
      },
      onaylayan: {
        id: "set_onay",
        name: "Ayarlardaki Onaylayan",
        title: "Harcama Yetkilisi (Ayarlar)",
      },
      sunulacakMakam: {
        id: "set_makam",
        name: "AYARLAR MAKAMI",
      },
    };

    const resolved = resolveRoute({
      definition: luzumMuzekkeresiRoute,
      document: documentRouteValues,
      settings: settingsRouteValues,
    });

    const talepStep = resolved.steps.find((s) => s.id === "talepEden")!;
    const hazStep = resolved.steps.find((s) => s.id === "hazirlayan")!;
    const onayStep = resolved.steps.find((s) => s.id === "onaylayan")!;
    const makamStep = resolved.steps.find((s) => s.id === "sunulacakMakam")!;

    // talepEden defaultSource: "document" -> Dosyadan gelmeli
    expect(talepStep.origin).toBe("document");
    expect(talepStep.value).toMatchObject({
      name: "Dosyadaki Talep Eden",
      title: "Birim Sorumlusu",
    });

    // hazirlayan defaultSource: "document" -> Dosyadan gelmeli
    expect(hazStep.origin).toBe("document");
    expect(hazStep.value).toMatchObject({
      name: "Dosyadaki Hazırlayan",
      title: "Dosya Memuru",
    });

    // onaylayan defaultSource: "settings" -> Ayarlardan gelmeli
    expect(onayStep.origin).toBe("settings");
    expect(onayStep.value).toMatchObject({
      name: "Ayarlardaki Onaylayan",
      title: "Harcama Yetkilisi (Ayarlar)",
    });

    // sunulacakMakam defaultSource: "document" -> Dosyadan gelmeli
    expect(makamStep.origin).toBe("document");
    expect(makamStep.value).toMatchObject({
      name: "FEN İŞLERİ MÜDÜRLÜĞÜNE",
    });
  });
});
