import { describe, expect, it } from "vitest";
import { InstitutionalHeaderProvider } from "../InstitutionalHeaderProvider";
import { DEFAULT_OFFICIAL_HEADER, HeaderDefinition } from "@temin360/contracts";

describe("InstitutionalHeaderProvider - Dinamik Antet ve Logo Mimarisi Testleri (Codex)", () => {
  const mockSettings = {
    countryPrefix: "T.C.",
    institutionName: "GÜNEYDERE BELEDİYE BAŞKANLIĞI",
    parentInstitution: "KARAMAN VALİLİĞİ",
    spendingUnit: "Fen İşleri Müdürlüğü",
  };

  const mockDocument = {
    birimAdi: "Fen İşleri Müdürlüğü",
    resolvedTenderUnit: {
      name: "Fen İşleri Müdürlüğü",
      antetEkSatir: "Fen İşleri Müdürlüğü",
    },
    sunulacakMakamAdi: "BAŞKANLIK MAKAMINA",
  };

  describe("1. Key Tabanlı ve Kaynak Eşlemeli Antet Çözümlemesi", () => {
    it("standart resmi antet tanımını settings ve document kaynaklarından eksiksiz çözer", () => {
      const lines = InstitutionalHeaderProvider.resolveDynamicHeader(
        DEFAULT_OFFICIAL_HEADER,
        {
          settings: mockSettings,
          document: mockDocument,
          fallbackInstitutionName: "GÜNEYDERE BELEDİYE BAŞKANLIĞI",
        },
      );

      expect(lines).toEqual([
        "T.C.",
        "KARAMAN VALİLİĞİ",
        "GÜNEYDERE BELEDİYE BAŞKANLIĞI",
        "Fen İşleri Müdürlüğü",
      ]);
    });

    it("DETSİS hiyerarşi ayracı '>' içeren birim adlarını temizleyip saf birim adını döner", () => {
      const docWithHierarchy = {
        resolvedTenderUnit: {
          name: "Güneydere Belediye Başkanlığı > Fen İşleri Müdürlüğü",
        },
      };

      const lines = InstitutionalHeaderProvider.resolveDynamicHeader(
        DEFAULT_OFFICIAL_HEADER,
        {
          settings: mockSettings,
          document: docWithHierarchy,
          fallbackInstitutionName: "Güneydere Belediye Başkanlığı",
        },
      );

      expect(lines[lines.length - 1]).toBe("Fen İşleri Müdürlüğü");
      expect(lines).not.toContain(
        "Güneydere Belediye Başkanlığı > Fen İşleri Müdürlüğü",
      );
    });

    it("şablon tanımındaki satır sıralamasına harfiyen uyar", () => {
      const customOrderDef: HeaderDefinition = {
        logoMode: "none",
        profile: "custom",
        lines: [
          { key: "unit", source: "document", path: "resolvedTenderUnit.name" },
          { key: "inst", source: "settings", path: "institutionName" },
        ],
      };

      const lines = InstitutionalHeaderProvider.resolveDynamicHeader(
        customOrderDef,
        {
          settings: mockSettings,
          document: mockDocument,
        },
      );

      expect(lines).toEqual([
        "Fen İşleri Müdürlüğü",
        "GÜNEYDERE BELEDİYE BAŞKANLIĞI",
      ]);
    });

    it("boş veya tanımsız değerler için gereksiz boş satır basmaz", () => {
      const defWithEmpty: HeaderDefinition = {
        logoMode: "none",
        profile: "custom",
        lines: [
          { key: "c", source: "settings", path: "countryPrefix" },
          { key: "missing", source: "settings", path: "nonExistentField" },
          { key: "inst", source: "settings", path: "institutionName" },
        ],
      };

      const lines = InstitutionalHeaderProvider.resolveDynamicHeader(
        defWithEmpty,
        {
          settings: { countryPrefix: "T.C.", institutionName: "ÖRNEK İDARE" },
        },
      );

      expect(lines).toEqual(["T.C.", "ÖRNEK İDARE"]);
    });

    it("manual kaynak override edildiğinde form verisindeki özel değeri kullanır", () => {
      const defManual: HeaderDefinition = {
        logoMode: "none",
        profile: "custom",
        lines: [
          { key: "title", source: "manual", path: "ozelBaslik" },
          { key: "inst", source: "settings", path: "institutionName" },
        ],
      };

      const lines = InstitutionalHeaderProvider.resolveDynamicHeader(
        defManual,
        {
          settings: { institutionName: "ÖRNEK KURUM" },
          manual: { ozelBaslik: "ÖZEL KOMİSYON BAŞKANLIĞI" },
        },
      );

      expect(lines).toEqual(["ÖZEL KOMİSYON BAŞKANLIĞI", "ÖRNEK KURUM"]);
    });

    it("aynı tanım içinde yinelenen (duplicate) key olduğunda doğrulama hatası verir", () => {
      const duplicateDef: HeaderDefinition = {
        logoMode: "none",
        lines: [
          { key: "inst", source: "settings", path: "institutionName" },
          { key: "inst", source: "settings", path: "institutionName" },
        ],
      };

      expect(() =>
        InstitutionalHeaderProvider.resolveDynamicHeader(duplicateDef, {
          settings: mockSettings,
        })
      ).toThrow(/Yinelenen antet satır key'i/);
    });
  });

  describe("2. composeBirimAntetLines Güvenlik ve Saflaştırma Testleri", () => {
    it("temel antet dizisinde '>' varsa ayıklar ve saf birim satırını ekler", () => {
      const baseWithArrow = [
        "T.C.",
        "GÜNEYDERE BELEDİYE BAŞKANLIĞI",
        "Güneydere Belediye Başkanlığı > Belediye Meclisi",
      ];

      const composed = InstitutionalHeaderProvider.composeBirimAntetLines(
        baseWithArrow,
        "Fen İşleri Müdürlüğü",
        undefined,
        ["Belediye Meclisi", "Fen İşleri Müdürlüğü"],
        "GÜNEYDERE BELEDİYE BAŞKANLIĞI",
      );

      expect(composed).toEqual([
        "T.C.",
        "GÜNEYDERE BELEDİYE BAŞKANLIĞI",
        "Fen İşleri Müdürlüğü",
      ]);
    });

    it("birim seçilmediğinde yalnızca temel kurum antetini korur", () => {
      const base = ["T.C.", "GÜNEYDERE BELEDİYE BAŞKANLIĞI"];
      const composed = InstitutionalHeaderProvider.composeBirimAntetLines(
        base,
        null,
      );
      expect(composed).toEqual(["T.C.", "GÜNEYDERE BELEDİYE BAŞKANLIĞI"]);
    });
  });
});
