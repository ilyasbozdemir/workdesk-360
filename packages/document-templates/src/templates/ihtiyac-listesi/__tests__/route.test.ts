import { describe, expect, it } from "vitest";
import {
  applyResolvedRouteToDocumentData,
  extractDocumentRouteValues,
  mergeRouteOverrides,
  resolveRoute,
  validateRoute,
} from "@worksuite-360/document-engine";
import { getTemplateRouteDefinition } from "../../../route-registry";
import { ihtiyacListesiRoute } from "../route.definition";
import { createSyntheticDocumentData } from "../../__tests__/fixtures";

describe("İhtiyaç Listesi — Rota (Route) Çözümleme ve Öncelik Testleri", () => {
  it("route-registry üzerinden ihtiyac-listesi için doğru şablon rota tanımını döndürür", () => {
    const def = getTemplateRouteDefinition("ihtiyac-listesi");
    expect(def.templateId).toBe("ihtiyac-listesi");
    expect(def.slots.map((s) => s.id)).toEqual([
      "hazirlayan",
      "onaylayan",
      "sunulacakMakam",
    ]);
    expect(def).toEqual(ihtiyacListesiRoute);
  });

  it("varsayılan kaynakları (hazirlayan -> document, onaylayan -> settings, sunulacakMakam -> document) doğru öncelikle çözer", () => {
    const docData = createSyntheticDocumentData({
      hazirlayanPersonelAdi: "Dosyadaki Hazırlayan",
      hazirlayanPersonelUnvan: "Dosya Memuru",
      onaylayanPersonelAdi: "Dosyadaki Onaylayan",
      onaylayanPersonelUnvan: "Dosya Müdürü",
      sunulacakMakamAdi: "DOSYA MAKAMI",
    });

    const documentRouteValues = extractDocumentRouteValues(
      docData,
      ihtiyacListesiRoute,
    );

    const settingsRouteValues = {
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
      definition: ihtiyacListesiRoute,
      document: documentRouteValues,
      settings: settingsRouteValues,
    });

    expect(resolved.validationErrors).toBeUndefined();

    const hazStep = resolved.steps.find((s) => s.id === "hazirlayan")!;
    const onayStep = resolved.steps.find((s) => s.id === "onaylayan")!;
    const makamStep = resolved.steps.find((s) => s.id === "sunulacakMakam")!;

    // hazirlayan defaultSource === 'document' olduğu için dosyadan gelmeli
    expect(hazStep.origin).toBe("document");
    expect(hazStep.value).toMatchObject({
      name: "Dosyadaki Hazırlayan",
      title: "Dosya Memuru",
    });

    // onaylayan defaultSource === 'settings' olduğu için ayarlardan gelmeli
    expect(onayStep.origin).toBe("settings");
    expect(onayStep.value).toMatchObject({
      name: "Ayarlardaki Onaylayan",
      title: "Harcama Yetkilisi (Ayarlar)",
    });

    // sunulacakMakam defaultSource === 'document' olduğu için dosyadan gelmeli
    expect(makamStep.origin).toBe("document");
    expect(makamStep.value).toMatchObject({
      name: "DOSYA MAKAMI",
    });
  });

  it("birincil kaynak boş olduğunda diğer kaynağa (fallback) düşer", () => {
    const resolved = resolveRoute({
      definition: ihtiyacListesiRoute,
      document: {
        // hazirlayan document'ta boş, settings'ten fallback almalı
        onaylayan: {
          id: "doc_onay",
          name: "Dosyadaki Onaylayan",
          title: "Müdür V.",
        },
      },
      settings: {
        // onaylayan settings'te boş, document'tan fallback almalı
        hazirlayan: {
          id: "set_haz",
          name: "Yedek Hazırlayan",
          title: "Memur",
        },
      },
    });

    const hazStep = resolved.steps.find((s) => s.id === "hazirlayan")!;
    const onayStep = resolved.steps.find((s) => s.id === "onaylayan")!;

    expect(hazStep.origin).toBe("settings");
    expect(hazStep.value).toMatchObject({ name: "Yedek Hazırlayan" });

    expect(onayStep.origin).toBe("document");
    expect(onayStep.value).toMatchObject({ name: "Dosyadaki Onaylayan" });
  });

  it("manuel override verildiğinde hem document hem settings değerlerini ezer ve belge alanlarına (hazirlayanPersonelAdi, onaylayanPersonelAdi, sunulacakMakamAdi) yansır", () => {
    const initialDoc = createSyntheticDocumentData();
    const documentValues = extractDocumentRouteValues(
      initialDoc,
      ihtiyacListesiRoute,
    );
    const settingsValues = {
      onaylayan: {
        id: "set_1",
        name: "Ayarlardaki Müdür",
        title: "Müdür",
      },
    };

    const overrides = [
      {
        slotId: "hazirlayan",
        value: {
          id: "ovr_haz",
          name: "Manuel Seçilen Hazırlayan",
          title: "Başmühendis",
        },
      },
      {
        slotId: "onaylayan",
        value: {
          id: "ovr_onay",
          name: "Manuel Seçilen Onaylayan",
          title: "Genel Müdür Yardımcısı",
        },
      },
      {
        slotId: "sunulacakMakam",
        value: {
          id: "ovr_makam",
          name: "GENEL MÜDÜRLÜK MAKAMINA",
        },
      },
    ];

    const mergedPreview = mergeRouteOverrides(documentValues, overrides);
    expect((mergedPreview.hazirlayan as any).name).toBe(
      "Manuel Seçilen Hazırlayan",
    );

    const resolved = resolveRoute({
      definition: ihtiyacListesiRoute,
      document: documentValues,
      settings: settingsValues,
      overrides,
    });

    expect(resolved.steps.every((s) => s.origin === "override")).toBe(true);

    const updatedDoc = applyResolvedRouteToDocumentData(initialDoc, resolved);
    expect(updatedDoc.hazirlayanPersonelAdi).toBe("Manuel Seçilen Hazırlayan");
    expect(updatedDoc.hazirlayanPersonelUnvan).toBe("Başmühendis");
    expect(updatedDoc.onaylayanPersonelAdi).toBe("Manuel Seçilen Onaylayan");
    expect(updatedDoc.onaylayanPersonelUnvan).toBe("Genel Müdür Yardımcısı");
    expect(updatedDoc.sunulacakMakamAdi).toBe("GENEL MÜDÜRLÜK MAKAMINA");
  });

  it("zorunlu slotlar (hazirlayan, onaylayan) boş kaldığında doğrulama hatası üretir, strict modda hata fırlatır", () => {
    const resolved = resolveRoute({
      definition: ihtiyacListesiRoute,
      document: {},
      settings: {},
    });

    const errors = validateRoute(resolved);
    expect(errors).toContain("Hazırlayan Personel: required");
    expect(errors).toContain("Onaylayan (OLUR Makamı): required");
    // sunulacakMakam opsiyonel olduğu için hata üretmemeli
    expect(errors.some((e) => e.includes("Sunulacak Makam"))).toBe(false);

    expect(() =>
      resolveRoute({
        definition: ihtiyacListesiRoute,
        document: {},
        settings: {},
        strict: true,
      }),
    ).toThrow(/Hazırlayan Personel: required/);
  });
});

