import { describe, expect, it } from "vitest";
import {
  applyResolvedRouteToDocumentData,
  extractDocumentRouteValues,
  resolveRoute,
} from "@worksuite-360/document-engine";
import { piyasaFiyatRoute } from "../route.definition";
import { createSyntheticDocumentData } from "../../__tests__/fixtures";

describe("Piyasa Fiyat Araştırma Tutanağı — Rota (person-list & person) Testleri", () => {
  it("piyasaFiyatRoute içindeki komisyon (person-list, fieldKey: fiyatArastirmaGorevlileri) ve onaylayan (person) slotlarını doğru çözer", () => {
    const docData = createSyntheticDocumentData();
    const docValues = extractDocumentRouteValues(docData, piyasaFiyatRoute);

    const resolved = resolveRoute({
      definition: piyasaFiyatRoute,
      document: docValues,
      settings: {
        onaylayan: {
          id: "set_onay",
          name: "Ayarlardaki İdare Yetkilisi",
          title: "Daire Başkanı",
        },
      },
    });

    expect(resolved.validationErrors).toBeUndefined();

    const gorevlilerStep = resolved.steps.find((s) => s.id === "komisyon")!;
    const onayStep = resolved.steps.find((s) => s.id === "onaylayan")!;

    expect(gorevlilerStep.origin).toBe("document");
    expect(Array.isArray(gorevlilerStep.value)).toBe(true);
    expect(gorevlilerStep.value).toHaveLength(2);

    expect(onayStep.origin).toBe("settings");
    expect(onayStep.value).toMatchObject({
      name: "Ayarlardaki İdare Yetkilisi",
      title: "Daire Başkanı",
    });
  });

  it("person-list slotuna manuel override verildiğinde fiyatArastirmaGorevlileri ve komisyon dizilerini belge verisine yazar", () => {
    const docData = createSyntheticDocumentData();
    const resolved = resolveRoute({
      definition: piyasaFiyatRoute,
      document: {},
      settings: {},
      overrides: [
        {
          slotId: "komisyon",
          value: [
            {
              id: "p1",
              name: "Zeynep KORKMAZ",
              title: "Mühendis",
              role: "Başkan",
            },
            {
              id: "p2",
              name: "Mert ÇELİK",
              title: "Tekniker",
              role: "Üye",
            },
            {
              id: "p3",
              name: "Elif ŞAHİN",
              title: "Memur",
              role: "Üye",
            },
          ],
        },
        {
          slotId: "onaylayan",
          value: {
            id: "p_onay",
            name: "Hakan YILDIZ",
            title: "Bölge Müdürü",
          },
        },
      ],
    });

    const updated = applyResolvedRouteToDocumentData(docData, resolved);

    expect(updated.fiyatArastirmaGorevlileri).toHaveLength(3);
    expect(updated.fiyatArastirmaGorevlileri[0]).toMatchObject({
      adSoyad: "Zeynep KORKMAZ",
      unvan: "Mühendis",
      gorevi: "Başkan",
    });
    expect(updated.baskanAdi).toBe("Hakan YILDIZ");
    expect(updated.onaylayanPersonelAdi).toBe("Hakan YILDIZ");
  });
});
