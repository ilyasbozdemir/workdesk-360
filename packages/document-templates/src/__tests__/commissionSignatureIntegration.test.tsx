import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  applyResolvedRouteToDocumentData,
  extractDocumentRouteValues,
  resolveRoute,
} from "@worksuite-360/document-engine";
import {
  distributeCommissionMembersBySignatureType,
  formatCommissionMemberForDocument,
  isCommissionAppointmentDocument,
  isReserveCommissionMember,
  isReserveMemberEligibleForDocument,
  normalizeSignatureType,
} from "../services/commissionResolver";
import {
  buildMergedPersonelList,
  filterPersonelByBirim,
} from "../document/ApprovalSignature";
import { getTemplateRouteDefinition } from "../route-registry";
import { PiyasaFiyatGorevliler } from "../templates/piyasa-fiyat-arastirma-tutanagi/components/PiyasaFiyatGorevliler";
import { MuayeneKabulTutanagi } from "../templates/muayene-kabul-tutanagi";

const MOCK_BIRIMLER = [
  { id: 10, ad: "Destek Hizmetleri Müdürlüğü", birim_adi: "Destek Hizmetleri Müdürlüğü", aktif_mi: 1 },
  { id: 20, ad: "Fen İşleri Müdürlüğü", birim_adi: "Fen İşleri Müdürlüğü", aktif_mi: 1 },
  { id: 30, ad: "Mali Hizmetler Müdürlüğü", birim_adi: "Mali Hizmetler Müdürlüğü", aktif_mi: 1 },
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
    id: 201,
    ad_soyad: "Mehmet Demir",
    unvan: "İnşaat Mühendisi",
    birim: "Fen İşleri Müdürlüğü",
    birim_id: 20,
    aktif_mi: 1,
  },
  {
    id: 301,
    ad_soyad: "Ayşe Kaya",
    unvan: "Mali Hizmetler Uzmanı",
    birim: "Mali Hizmetler Müdürlüğü",
    birim_id: 30,
    aktif_mi: 1,
  },
  {
    id: 302,
    ad_soyad: "Caner Öz",
    unvan: "Tekniker",
    birim: "Fen İşleri Müdürlüğü",
    birim_id: 20,
    aktif_mi: 1,
  },
];

describe("Komisyon Yönetimi ve Belge İmza Entegrasyonu (Paraf / Koordinasyon / İmza)", () => {
  describe("1. Kurum -> Birim -> Personel Filtrelemesi ve Farklı Birimlerden Komisyon Üyesi Seçimi", () => {
    it("birim seçimine göre personel listesini filtreler ve farklı birimlerden personel aynı komisyona eklenebilir", () => {
      const merged = buildMergedPersonelList(MOCK_PERSONELLER);

      // Birim 10 filtresi
      const birim10Filtered = filterPersonelByBirim(merged, {
        birimId: 10,
        birimList: MOCK_BIRIMLER,
        includeOtherUnits: false,
      });
      expect(birim10Filtered.filteredList.map((p) => p.ad_soyad)).toEqual(["Ahmet Yılmaz"]);

      // Birim 20 filtresi
      const birim20Filtered = filterPersonelByBirim(merged, {
        birimId: 20,
        birimList: MOCK_BIRIMLER,
        includeOtherUnits: false,
      });
      expect(birim20Filtered.filteredList.map((p) => p.ad_soyad)).toEqual([
        "Mehmet Demir",
        "Caner Öz",
      ]);

      // Farklı birimlerden seçilen personellerle komisyon oluşturma
      const rawCrossUnitMembers = [
        {
          personel_id: 101,
          ad_soyad: "Ahmet Yılmaz",
          unvan: "Destek Hizmetleri Müdürü",
          birim_id: 10,
          birim: "Destek Hizmetleri Müdürlüğü",
          gorev: "Komisyon Başkanı",
          imza_turu: "İmza",
          asil_mi: 1,
        },
        {
          personel_id: 201,
          ad_soyad: "Mehmet Demir",
          unvan: "İnşaat Mühendisi",
          birim_id: 20,
          birim: "Fen İşleri Müdürlüğü",
          gorev: "Üye",
          imza_turu: "İmza",
          asil_mi: 1,
        },
        {
          personel_id: 301,
          ad_soyad: "Ayşe Kaya",
          unvan: "Mali Hizmetler Uzmanı",
          birim_id: 30,
          birim: "Mali Hizmetler Müdürlüğü",
          gorev: "Üye",
          imza_turu: "İmza",
          asil_mi: 1,
        },
      ];

      const dist = distributeCommissionMembersBySignatureType(
        rawCrossUnitMembers,
        { docId: "muayene-kabul-tutanagi" },
      );
      expect(dist.wetSignatureMembers).toHaveLength(3);
      expect(dist.wetSignatureMembers.map((m) => m.birimId)).toEqual([10, 20, 30]);
      expect(dist.wetSignatureMembers.map((m) => m.birim)).toEqual([
        "Destek Hizmetleri Müdürlüğü",
        "Fen İşleri Müdürlüğü",
        "Mali Hizmetler Müdürlüğü",
      ]);
    });
  });

  describe("2. Komisyon Görevi (Başkan, Üye, Yedek Üye) ve İmza Türü (Paraf, Koordinasyon, İmza) Ayrımı", () => {
    it("komisyon görevi (gorevi) ile imza türünü (imzaTuru) birbirine karıştırmaz ve komisyon üyeliğini koordinasyon ile eşitlemez", () => {
      const baskanParaf = formatCommissionMemberForDocument({
        personel_id: 101,
        ad_soyad: "Ahmet Yılmaz",
        unvan: "Şube Müdürü",
        gorev: "Komisyon Başkanı",
        imza_turu: "Paraf",
        asil_mi: 1,
      });

      expect(baskanParaf.gorevi).toBe("Komisyon Başkanı");
      expect(baskanParaf.imzaTuru).toBe("Paraf");
      // Komisyon görevi "Paraf" olmamalı, imzaTuru da "Komisyon Başkanı" olmamalı
      expect(baskanParaf.gorevi).not.toBe("Paraf");
      expect(baskanParaf.imzaTuru).not.toBe("Komisyon Başkanı");

      const uyeKoordinasyon = formatCommissionMemberForDocument({
        personel_id: 201,
        ad_soyad: "Mehmet Demir",
        unvan: "Mühendis",
        gorev: "Uzman Üye",
        imza_turu: "Koordinasyon",
        asil_mi: 1,
      });

      expect(uyeKoordinasyon.gorevi).toBe("Uzman Üye");
      expect(uyeKoordinasyon.imzaTuru).toBe("Koordinasyon");

      const uyeVarsayilan = formatCommissionMemberForDocument({
        personel_id: 301,
        ad_soyad: "Ayşe Kaya",
        unvan: "Mali Uzman",
        gorev: "Üye",
      });
      // Varsayılan imza türü 'İmza' olmalı, 'Koordinasyon' ile eşitlenmemeli
      expect(uyeVarsayilan.imzaTuru).toBe("İmza");
      expect(uyeVarsayilan.gorevi).toBe("Üye");
    });

    it("normalizeSignatureType geçerli türleri çözer ve bilinmeyen değerlerde güvenli 'İmza' varsayılanına döner", () => {
      expect(normalizeSignatureType("Paraf")).toBe("Paraf");
      expect(normalizeSignatureType("paraf")).toBe("Paraf");
      expect(normalizeSignatureType("Koordinasyon")).toBe("Koordinasyon");
      expect(normalizeSignatureType("KOORDİNASYON")).toBe("Koordinasyon");
      expect(normalizeSignatureType("İmza")).toBe("İmza");
      expect(normalizeSignatureType(undefined)).toBe("İmza");
      expect(normalizeSignatureType(null)).toBe("İmza");
    });
  });

  describe("3. İmza Türüne Göre Belge Rotası ve Islak İmza Yerleşimine Aktarım", () => {
    it("İmza türündeki üyeleri ıslak imza alanına, Paraf ve Koordinasyon türündeki üyeleri ise belge rotasına (rota) aktarır", () => {
      const members = [
        {
          personel_id: 101,
          ad_soyad: "Ahmet Yılmaz",
          unvan: "Şube Müdürü",
          gorev: "Komisyon Başkanı",
          imza_turu: "İmza",
          asil_mi: 1,
        },
        {
          personel_id: 201,
          ad_soyad: "Mehmet Demir",
          unvan: "İnşaat Mühendisi",
          gorev: "Üye",
          imza_turu: "İmza",
          asil_mi: 1,
        },
        {
          personel_id: 301,
          ad_soyad: "Ayşe Kaya",
          unvan: "Mali Hizmetler Uzmanı",
          gorev: "Finans Üyesi",
          imza_turu: "Koordinasyon",
          asil_mi: 1,
        },
        {
          personel_id: 302,
          ad_soyad: "Caner Öz",
          unvan: "Tekniker",
          gorev: "Raportör Üye",
          imza_turu: "Paraf",
          asil_mi: 1,
        },
      ];

      const dist = distributeCommissionMembersBySignatureType(members, {
        docId: "yaklasik-maliyet-cetveli",
      });

      // Islak imza alanında 2 kişi olmalı (Ahmet ve Mehmet)
      expect(dist.wetSignatureMembers).toHaveLength(2);
      expect(dist.wetSignatureMembers.map((m) => m.adSoyad)).toEqual([
        "Ahmet Yılmaz",
        "Mehmet Demir",
      ]);

      // Koordinasyon listesinde Ayşe Kaya olmalı ve görevi korunmalı
      expect(dist.koordinasyonMembers).toHaveLength(1);
      expect(dist.koordinasyonMembers[0].adSoyad).toBe("Ayşe Kaya");
      expect(dist.koordinasyonMembers[0].gorevi).toBe("Finans Üyesi");
      expect(dist.koordinasyonMembers[0].imzaTuru).toBe("Koordinasyon");

      // Paraf listesinde Caner Öz olmalı ve görevi korunmalı
      expect(dist.parafMembers).toHaveLength(1);
      expect(dist.parafMembers[0].adSoyad).toBe("Caner Öz");
      expect(dist.parafMembers[0].gorevi).toBe("Raportör Üye");
      expect(dist.parafMembers[0].imzaTuru).toBe("Paraf");
    });

    it("routeDataBridge (applyResolvedRouteToDocumentData) üzerinden komisyon üyelerinin imzaTuru ve gorevi alanlarını koruyarak belge verisine uygular", () => {
      const routeDef = getTemplateRouteDefinition("piyasa-fiyat-arastirma-tutanagi");
      const initialDoc: Record<string, any> = {
        belgeTuru: "piyasa-fiyat-arastirma-tutanagi",
        fiyatArastirmaGorevlileri: [],
      };

      const overrides = [
        {
          slotId: "komisyon",
          value: [
            {
              id: "101",
              name: "Ahmet Yılmaz",
              title: "Şube Müdürü",
              role: "Komisyon Başkanı",
              imzaTuru: "İmza" as const,
              asilMi: 1,
            },
            {
              id: "201",
              name: "Mehmet Demir",
              title: "Mühendis",
              role: "Fiyat Araştırma Görevlisi",
              imzaTuru: "İmza" as const,
              asilMi: 1,
            },
            {
              id: "301",
              name: "Ayşe Kaya",
              title: "Mali Uzman",
              role: "Üye",
              imzaTuru: "Koordinasyon" as const,
              asilMi: 1,
            },
          ],
        },
      ];

      const resolved = resolveRoute({
        definition: routeDef,
        document: extractDocumentRouteValues(initialDoc, routeDef),
        settings: {},
        overrides,
      });

      const updatedDoc = applyResolvedRouteToDocumentData(initialDoc, resolved);

      // Islak imza listesinde yalnızca imzaTuru === 'İmza' olan 2 üye yer almalı
      expect(updatedDoc.fiyatArastirmaGorevlileri).toHaveLength(2);
      expect(updatedDoc.fiyatArastirmaGorevlileri[0]).toMatchObject({
        adSoyad: "Ahmet Yılmaz",
        unvan: "Şube Müdürü",
        gorevi: "Komisyon Başkanı",
        imzaTuru: "İmza",
      });
      expect(updatedDoc.fiyatArastirmaGorevlileri[1]).toMatchObject({
        adSoyad: "Mehmet Demir",
        unvan: "Mühendis",
        gorevi: "Fiyat Araştırma Görevlisi",
        imzaTuru: "İmza",
      });

      // Koordinasyon imzalı üye ise belge rotasına (rota) yönlendirilmeli
      expect(Array.isArray(updatedDoc.rota)).toBe(true);
      expect(
        updatedDoc.rota.some(
          (r: any) =>
            r.a === "Ayşe Kaya" &&
            r.t === "Koordinasyon" &&
            r.gorevi === "Üye",
        ),
      ).toBe(true);
    });
  });

  describe("4. Aynı Evrak Üzerinde Çoklu Islak İmza Alanı ve Unvan / Komisyon Görevi Gösterimi", () => {
    it("PiyasaFiyatGorevliler bileşeninde birden fazla ıslak imza alanı oluşturur ve her üyenin unvanı ile komisyon görevini gösterir", () => {
      const gorevliler = [
        {
          id: "1",
          adSoyad: "Ahmet Yılmaz",
          unvan: "Destek Hizmetleri Müdürü",
          gorevi: "Komisyon Başkanı",
        },
        {
          id: "2",
          adSoyad: "Mehmet Demir",
          unvan: "İnşaat Mühendisi",
          gorevi: "Fiyat Araştırma Görevlisi",
        },
        {
          id: "3",
          adSoyad: "Ayşe Kaya",
          unvan: "Mali Hizmetler Uzmanı",
          gorevi: "Üye",
        },
      ];

      const html = renderToStaticMarkup(
        <PiyasaFiyatGorevliler displayKomisyon={gorevliler} />,
      );

      expect(html).toContain("Ahmet Yılmaz");
      expect(html).toContain("Destek Hizmetleri Müdürü");
      expect(html).toContain("Komisyon Başkanı");

      expect(html).toContain("Mehmet Demir");
      expect(html).toContain("İnşaat Mühendisi");
      expect(html).toContain("Fiyat Araştırma Görevlisi");

      expect(html).toContain("Ayşe Kaya");
      expect(html).toContain("Mali Hizmetler Uzmanı");
      expect(html).toContain("Üye");
    });

    it("MuayeneKabulTutanagi şablonunda birden fazla komisyon üyesi için ıslak imza bloğu, unvan ve komisyon görevini doğru görüntüler", () => {
      const members = [
        {
          id: "m1",
          adSoyad: "Ahmet Yılmaz",
          unvan: "Şube Müdürü",
          gorevi: "Komisyon Başkanı",
        },
        {
          id: "m2",
          adSoyad: "Mehmet Demir",
          unvan: "İnşaat Mühendisi",
          gorevi: "Üye",
        },
      ];

      const html = renderToStaticMarkup(
        <MuayeneKabulTutanagi
          data={{
            muayeneKomisyonu: members,
          }}
        />,
      );

      expect(html).toContain("Komisyon Başkanı");
      expect(html).toContain("Ahmet Yılmaz");
      expect(html).toContain("Şube Müdürü");
      expect(html).toContain("Üye");
      expect(html).toContain("Mehmet Demir");
      expect(html).toContain("İnşaat Mühendisi");
    });
  });

  describe("5. Yedek Üyelerin Komisyon İşleyiş Kurallarına Göre İmza Alanı Yönetimi", () => {
    const membersWithReserves = [
      {
        personel_id: 101,
        ad_soyad: "Ahmet Yılmaz",
        unvan: "Şube Müdürü",
        gorev: "Komisyon Başkanı",
        asil_mi: 1,
        imza_turu: "İmza",
      },
      {
        personel_id: 201,
        ad_soyad: "Mehmet Demir",
        unvan: "Mühendis",
        gorev: "Üye",
        asil_mi: 1,
        imza_turu: "İmza",
      },
      {
        personel_id: 401,
        ad_soyad: "Selim Yedek",
        unvan: "Tekniker",
        gorev: "Yedek Üye",
        asil_mi: 0,
        asli_yedek: "Yedek",
        imza_turu: "İmza",
      },
    ];

    it("yedek üyeleri doğru tespit eder (isReserveCommissionMember)", () => {
      expect(isReserveCommissionMember(membersWithReserves[0])).toBe(false);
      expect(isReserveCommissionMember(membersWithReserves[2])).toBe(true);
      expect(isReserveCommissionMember({ gorev: "Yedek Üye" })).toBe(true);
      expect(isReserveCommissionMember({ asli_yedek: "Yedek" })).toBe(true);
      expect(isReserveCommissionMember({ asil_mi: 0 })).toBe(true);
    });

    it("tutanak ve karar belgelerinde (örn. muayene-kabul-tutanagi, piyasa-fiyat-arastirma-tutanagi) yedek üyeleri otomatik olarak ıslak imza alanına eklemez", () => {
      expect(isCommissionAppointmentDocument("muayene-kabul-tutanagi")).toBe(false);
      expect(isCommissionAppointmentDocument("piyasa-fiyat-arastirma-tutanagi")).toBe(false);
      expect(
        isReserveMemberEligibleForDocument(
          membersWithReserves[2],
          "muayene-kabul-tutanagi",
        ),
      ).toBe(false);

      const dist = distributeCommissionMembersBySignatureType(
        membersWithReserves,
        { docId: "muayene-kabul-tutanagi" },
      );

      expect(dist.wetSignatureMembers.map((m) => m.adSoyad)).toEqual([
        "Ahmet Yılmaz",
        "Mehmet Demir",
      ]);
      expect(dist.excludedReserveMembers).toHaveLength(1);
      expect(dist.excludedReserveMembers[0].adSoyad).toBe("Selim Yedek");
    });

    it("komisyon görevlendirme / onay belgelerinde (örn. komisyon-gorevlendirme-onayi, muayene-kabul-komisyonu) yedek üyeleri listeye dahil eder", () => {
      expect(isCommissionAppointmentDocument("komisyon-gorevlendirme-onayi")).toBe(true);
      expect(isCommissionAppointmentDocument("muayene-kabul-komisyonu")).toBe(true);

      const dist = distributeCommissionMembersBySignatureType(
        membersWithReserves,
        { docId: "komisyon-gorevlendirme-onayi" },
      );

      expect(dist.wetSignatureMembers).toHaveLength(3);
      expect(dist.wetSignatureMembers.map((m) => m.adSoyad)).toContain("Selim Yedek");
      expect(dist.excludedReserveMembers).toHaveLength(0);
    });

    it("asil üye yerine aktif katılımı (aktifKatilim: true) işaretlenen yedek üyeyi tutanak imza alanına dahil eder", () => {
      const membersWithActiveReserve = [
        membersWithReserves[0],
        {
          ...membersWithReserves[2],
          aktifKatilim: true,
        },
      ];

      const dist = distributeCommissionMembersBySignatureType(
        membersWithActiveReserve,
        { docId: "muayene-kabul-tutanagi" },
      );

      expect(dist.wetSignatureMembers.map((m) => m.adSoyad)).toEqual([
        "Ahmet Yılmaz",
        "Selim Yedek",
      ]);
      expect(dist.excludedReserveMembers).toHaveLength(0);
    });
  });
});
