import { describe, expect, it } from "vitest";
import { InstitutionalHeaderProvider } from "@worksuite-360/document-engine";
import {
  buildMergedPersonelList,
  doesPersonelBelongToBirim,
  filterPersonelByBirim,
  isPersonelActive,
  validateBirimAndPersonelAssignments,
} from "../document/ApprovalSignature";
import { resolveAntetSatirlari } from "../resolver/helpers/resolveAntetSatirlari";

const MOCK_KURUM = {
  id: 1,
  ust_kurum_adi: "ANKARA VALİLİĞİ",
  kurum_adi: "ÇANKAYA BELEDİYE BAŞKANLIĞI",
  kurum_anteti: JSON.stringify([
    "T.C.",
    "ANKARA VALİLİĞİ",
    "ÇANKAYA BELEDİYE BAŞKANLIĞI",
  ]),
  makam_adi: "BAŞKANLIK MAKAMINA",
};

const MOCK_BIRIMLER = [
  {
    id: 10,
    ad: "Destek Hizmetleri Müdürlüğü",
    birim_adi: "Destek Hizmetleri Müdürlüğü",
    kisa_ad: "DHM",
    antet_ek_satir: "Destek Hizmetleri Müdürlüğü",
    sunum_makami: "DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE",
    ihtiyac_yeri_eki: "Destek Hizmetleri Müdürlüğümüzde",
    harcama_yetkilisi_id: 101,
    harcama_yetkilisi_unvan: "Destek Hizmetleri Müdürü",
    gerceklestirme_gorevlisi_id: 102,
    gerceklestirme_gorevlisi_unvan: "Satınalma Şefi",
    aktif_mi: 1,
  },
  {
    id: 20,
    ad: "Fen İşleri Müdürlüğü",
    birim_adi: "Fen İşleri Müdürlüğü",
    kisa_ad: "FİM",
    antet_ek_satir: "Fen İşleri Müdürlüğü",
    sunum_makami: "FEN İŞLERİ MÜDÜRLÜĞÜNE",
    ihtiyac_yeri_eki: "Fen İşleri Müdürlüğümüzde",
    harcama_yetkilisi_id: 201,
    harcama_yetkilisi_unvan: "Fen İşleri Müdürü",
    aktif_mi: 1,
  },
  {
    id: 30,
    ad: "Kapatılan Eski Müdürlük",
    birim_adi: "Kapatılan Eski Müdürlük",
    antet_ek_satir: "Kapatılan Eski Müdürlük",
    aktif_mi: 0,
  },
];

const MOCK_PERSONELLER = [
  {
    id: 101,
    ad_soyad: "Ahmet Yılmaz",
    unvan: "Destek Hizmetleri Müdürü",
    birim: "Destek Hizmetleri Müdürlüğü",
    birim_id: 10,
    aktif_mi: 1,
  },
  {
    id: 102,
    ad_soyad: "Zeynep Kaya",
    unvan: "Satınalma Şefi",
    birim: "Destek Hizmetleri Müdürlüğü",
    birim_id: 10,
    aktif_mi: 1,
  },
  {
    id: 201,
    ad_soyad: "Mehmet Demir",
    unvan: "Fen İşleri Müdürü",
    birim: "Fen İşleri Müdürlüğü",
    birim_id: 20,
    aktif_mi: 1,
  },
  {
    id: 202,
    ad_soyad: "Ali Çelik",
    unvan: "İnşaat Mühendisi",
    birim: "Fen İşleri Müdürlüğü",
    birim_id: 20,
    aktif_mi: 1,
  },
  {
    id: 999,
    ad_soyad: "Emekli Personel",
    unvan: "Eski Şef",
    birim: "Destek Hizmetleri Müdürlüğü",
    birim_id: 10,
    aktif_mi: 0,
  },
];

describe("Kurum - Birim - Personel İlişkisi: Antet ve Personel Filtreleme Testleri", () => {
  describe("1. Seçili birimId Üzerinden Resmi Antet Çözümlemesi", () => {
    it("seçili birimId ile kurum anteti + birim antet satırını ve birim yetkililerini çözer", () => {
      const baseLines = InstitutionalHeaderProvider.parseKurumBaseAntetLines(
        MOCK_KURUM,
      );
      const res = InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: 10,
        birimList: MOCK_BIRIMLER,
        kurumRow: MOCK_KURUM,
        personelList: MOCK_PERSONELLER,
        baseAntetLines: baseLines,
      });

      expect(res.birimFound).toBe(true);
      expect(res.birimPassive).toBe(false);
      expect(res.warning).toBeUndefined();
      expect(res.birimId).toBe(10);
      expect(res.birimAdi).toBe("Destek Hizmetleri Müdürlüğü");
      expect(res.antetSatirlari).toEqual([
        "T.C.",
        "ANKARA VALİLİĞİ",
        "ÇANKAYA BELEDİYE BAŞKANLIĞI",
        "Destek Hizmetleri Müdürlüğü",
      ]);
      expect(res.sunulacakMakamAdi).toBe("DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE");
      expect(res.ihtiyacYeri).toBe("Destek Hizmetleri Müdürlüğümüzde");
      expect(res.harcamaYetkilisiAdi).toBe("Ahmet Yılmaz");
      expect(res.gerceklestirmeGorevlisiAdi).toBe("Zeynep Kaya");
    });

    it("birimId değiştirildiğinde önceki birimin antet satırını yenisiyle değiştirir (mükerrer birim satırı eklemez)", () => {
      const firstRes = InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: 10,
        birimList: MOCK_BIRIMLER,
        kurumRow: MOCK_KURUM,
      });
      expect(firstRes.antetSatirlari[3]).toBe("Destek Hizmetleri Müdürlüğü");

      const secondRes = InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: 20,
        birimList: MOCK_BIRIMLER,
        kurumRow: MOCK_KURUM,
        baseAntetLines: firstRes.antetSatirlari,
      });

      expect(secondRes.antetSatirlari).toEqual([
        "T.C.",
        "ANKARA VALİLİĞİ",
        "ÇANKAYA BELEDİYE BAŞKANLIĞI",
        "Fen İşleri Müdürlüğü",
      ]);
    });

    it("birim bulunamadığında güvenli kurumsal fallback döndürür ve uyarı üretir", () => {
      const res = InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: 9999,
        birimList: MOCK_BIRIMLER,
        kurumRow: MOCK_KURUM,
      });

      expect(res.birimFound).toBe(false);
      expect(res.warning).toContain("bulunamadı");
      expect(res.antetSatirlari).toEqual([
        "T.C.",
        "ANKARA VALİLİĞİ",
        "ÇANKAYA BELEDİYE BAŞKANLIĞI",
      ]);
    });

    it("pasif birim seçildiğinde birim pasif uyarısı üretir", () => {
      const res = InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: 30,
        birimList: MOCK_BIRIMLER,
        kurumRow: MOCK_KURUM,
      });

      expect(res.birimFound).toBe(true);
      expect(res.birimPassive).toBe(true);
      expect(res.warning).toContain("pasif");
    });

    it("resolveAntetSatirlari seçili overrideBirimId parametresi ile doğru anteti döner", async () => {
      const mockQuery = async (sql: string, params: any[]) => {
        if (sql.includes("FROM TANIM_Kurum")) return [MOCK_KURUM];
        if (sql.includes("FROM TANIM_Birim WHERE id = ?")) {
          return MOCK_BIRIMLER.filter((b) => b.id === Number(params[0]));
        }
        return [];
      };

      const lines = await resolveAntetSatirlari(1, mockQuery, 20);
      expect(lines).toEqual([
        "T.C.",
        "ANKARA VALİLİĞİ",
        "ÇANKAYA BELEDİYE BAŞKANLIĞI",
        "Fen İşleri Müdürlüğü",
      ]);
    });
  });

  describe("2. Birim Bazlı Personel Filtreleme ve Yetkili Diğer Birim Seçimi", () => {
    it("varsayılan olarak yalnızca seçili birimin aktif personellerini filtreler, pasif personeli gizler", () => {
      const merged = buildMergedPersonelList(MOCK_PERSONELLER);
      const res = filterPersonelByBirim(merged, {
        birimId: 10,
        birimList: MOCK_BIRIMLER,
        includeOtherUnits: false,
      });

      expect(res.hasUnitDataInPool).toBe(true);
      expect(res.primaryUnitPersonel.map((p) => p.ad_soyad)).toEqual([
        "Ahmet Yılmaz",
        "Zeynep Kaya",
      ]);
      expect(res.filteredList.map((p) => p.ad_soyad)).toEqual([
        "Ahmet Yılmaz",
        "Zeynep Kaya",
      ]);
      expect(res.filteredList.some((p) => p.ad_soyad === "Emekli Personel"))
        .toBe(false);
    });

    it("includeOtherUnits: true olduğunda diğer birimlerdeki yetkili personelleri de dahil eder", () => {
      const merged = buildMergedPersonelList(MOCK_PERSONELLER);
      const res = filterPersonelByBirim(merged, {
        birimId: 10,
        birimList: MOCK_BIRIMLER,
        includeOtherUnits: true,
      });

      expect(res.primaryUnitPersonel).toHaveLength(2);
      expect(res.otherUnitPersonel).toHaveLength(2);
      expect(res.filteredList.map((p) => p.ad_soyad)).toEqual([
        "Ahmet Yılmaz",
        "Zeynep Kaya",
        "Mehmet Demir",
        "Ali Çelik",
      ]);
    });

    it("birim değiştiğinde mevcut manuel görevli seçimi farklı birimde olsa bile listeden silinmez", () => {
      const merged = buildMergedPersonelList(MOCK_PERSONELLER);
      // Birim 10 seçili ama manuel olarak Birim 20'den Ali Çelik seçilmiş durumda
      const res = filterPersonelByBirim(merged, {
        birimId: 10,
        birimList: MOCK_BIRIMLER,
        includeOtherUnits: false,
        currentSelectedNames: ["Ali Çelik"],
      });

      expect(res.filteredList.map((p) => p.ad_soyad)).toContain("Ali Çelik");
    });

    it("doesPersonelBelongToBirim hem birim_id hem birim adı üzerinden eşleşme yapar", () => {
      expect(doesPersonelBelongToBirim(MOCK_PERSONELLER[0], 10, MOCK_BIRIMLER))
        .toBe(true);
      expect(doesPersonelBelongToBirim(MOCK_PERSONELLER[0], 20, MOCK_BIRIMLER))
        .toBe(false);
      expect(isPersonelActive(MOCK_PERSONELLER[0])).toBe(true);
      expect(isPersonelActive(MOCK_PERSONELLER[4])).toBe(false);
    });
  });

  describe("3. Birim Değişiminde Manuel Seçimleri Silmeden Uyarı Üretme", () => {
    it("farklı birime ait veya pasif görevli seçili olduğunda uyarı üretir", () => {
      const warnings = validateBirimAndPersonelAssignments({
        birimId: 10,
        birimList: MOCK_BIRIMLER,
        personelList: MOCK_PERSONELLER,
        assignedPersons: [
          {
            slotId: "hazirlayan",
            slotLabel: "Hazırlayan",
            name: "Ali Çelik",
            id: 202,
          },
          {
            slotId: "onaylayan",
            slotLabel: "Onaylayan",
            name: "Emekli Personel",
            id: 999,
          },
        ],
      });

      expect(warnings).toHaveLength(2);
      expect(
        warnings.some((w) =>
          w.type === "personel_different_birim" &&
          w.personelName === "Ali Çelik"
        ),
      ).toBe(true);
      expect(
        warnings.some((w) =>
          w.type === "personel_passive" && w.personelName === "Emekli Personel"
        ),
      ).toBe(true);
    });

    it("bulunamayan birimId için birim_not_found uyarısı üretir", () => {
      const warnings = validateBirimAndPersonelAssignments({
        birimId: 404,
        birimList: MOCK_BIRIMLER,
        personelList: MOCK_PERSONELLER,
        assignedPersons: [],
      });

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe("birim_not_found");
    });
  });

  describe("4. DocumentHeader Antet Birim Bütünlüğü (Talep Eden / İşleten Birim)", () => {
    it("antetBirimGosterilsin: true olduğunda birim/müdürlük satırını antete ekler", async () => {
      const { DocumentHeader } = await import("../document/DocumentHeader");
      const { renderToStaticMarkup } = await import("react-dom/server");
      const React = await import("react");

      const html = renderToStaticMarkup(
        React.createElement(DocumentHeader, {
          data: {
            antetSatirlari: ["T.C.", "ÇANKAYA BELEDİYE BAŞKANLIĞI"],
            birim: "Destek Hizmetleri Müdürlüğü",
            antetBirimGosterilsin: true,
          },
        }),
      );

      expect(html).toContain("T.C.");
      expect(html).toContain("ÇANKAYA BELEDİYE BAŞKANLIĞI");
      expect(html).toContain("Destek Hizmetleri Müdürlüğü");
    });

    it("antetSatirlari zaten birim adını içeriyorsa mükerrer ekleme yapmaz", async () => {
      const { DocumentHeader } = await import("../document/DocumentHeader");
      const { renderToStaticMarkup } = await import("react-dom/server");
      const React = await import("react");

      const html = renderToStaticMarkup(
        React.createElement(DocumentHeader, {
          data: {
            antetSatirlari: [
              "T.C.",
              "ÇANKAYA BELEDİYE BAŞKANLIĞI",
              "Destek Hizmetleri Müdürlüğü",
            ],
            mudurluk: "Destek Hizmetleri Müdürlüğü",
          },
        }),
      );

      // Sadece 1 kez geçmeli
      const matches = html.match(/Destek Hizmetleri Müdürlüğü/g);
      expect(matches).toHaveLength(1);
    });

    it("antetBirimGosterilsin: false olduğunda birim satırını gizler ve sadece üst kurum antetini gösterir", async () => {
      const { DocumentHeader } = await import("../document/DocumentHeader");
      const { renderToStaticMarkup } = await import("react-dom/server");
      const React = await import("react");

      const html = renderToStaticMarkup(
        React.createElement(DocumentHeader, {
          data: {
            antetSatirlari: [
              "T.C.",
              "ÇANKAYA BELEDİYE BAŞKANLIĞI",
              "Destek Hizmetleri Müdürlüğü",
            ],
            mudurluk: "Destek Hizmetleri Müdürlüğü",
            birim: "Destek Hizmetleri Müdürlüğü",
            antetBirimGosterilsin: false,
          },
        }),
      );

      expect(html).toContain("T.C.");
      expect(html).toContain("ÇANKAYA BELEDİYE BAŞKANLIĞI");
      expect(html).not.toContain("Destek Hizmetleri Müdürlüğü");
    });
  });
});
