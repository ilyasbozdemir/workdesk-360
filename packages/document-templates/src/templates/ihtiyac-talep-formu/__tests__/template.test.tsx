import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentEngine, TemplateRegistry } from "@worksuite-360/document-engine";
import { registerTeminTemplates } from "../../../engine/registerTeminTemplates";
import { IhtiyacTalepFormu } from "../IhtiyacTalepFormu.template";
import { IhtiyacTalepFormuResolver } from "../../../engine/resolvers/IhtiyacTalepFormuResolver";
import { IhtiyacTalepFormuRenderer } from "../../../engine/renderers/IhtiyacTalepFormuRenderer";
import {
  createSyntheticDocumentData,
  SYNTHETIC_KALEMLER,
} from "../../__tests__/fixtures";

describe("İhtiyaç Talep Formu — Malzeme ve Render Uyumluluk Testleri", () => {
  it("data.ihtiyacKalemleri ile iletilen malzemeleri tabloya eksiksiz basar", () => {
    const data = createSyntheticDocumentData({
      ihtiyacKalemleri: SYNTHETIC_KALEMLER,
    });

    const html = renderToStaticMarkup(<IhtiyacTalepFormu data={data} />);

    expect(html).toContain("İHTİYAÇ TALEP FORMU");
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("80 gr/m² 500 yaprak");
    expect(html).toContain("Telli Dosya");
    expect(html).not.toContain("Kalem bulunamadı");
  });

  it("ihtiyaç listesi gibi data.kalemler ile veri geldiğinde de malzemeleri otomatik tanır ve listeler", () => {
    const data = createSyntheticDocumentData();
    delete (data as any).ihtiyacKalemleri;
    (data as any).kalemler = [
      {
        id: 101,
        siraNo: 1,
        tasinir_kodu: "150.05.01",
        kalem_adi: "Klasör Geniş Sırtlı Mavi",
        aciklama: "A4 boyutunda mekanizmalı plastik klasör",
        birim: "Adet",
        miktar: 150,
      },
      {
        id: 102,
        siraNo: 2,
        tasinir_kodu: "150.05.02",
        kalem_adi: "Tükenmez Kalem Mavi 0.7mm",
        aciklama: "50li kutu kaliteli tükenmez kalem",
        birim: "Kutu",
        miktar: 20,
      },
    ];

    const html = renderToStaticMarkup(<IhtiyacTalepFormu data={data} />);

    expect(html).toContain("Klasör Geniş Sırtlı Mavi");
    expect(html).toContain("A4 boyutunda mekanizmalı plastik klasör");
    expect(html).toContain("Tükenmez Kalem Mavi 0.7mm");
    expect(html).toContain("50li kutu kaliteli tükenmez kalem");
    expect(html).toContain("150");
    expect(html).toContain("20");
    expect(html).not.toContain("Kalem bulunamadı");
  });

  it("data.malzemeler veya data.items ile veri geldiğinde de aynı şekilde malzemeleri listeler", () => {
    const dataMalzemeler = createSyntheticDocumentData();
    delete (dataMalzemeler as any).ihtiyacKalemleri;
    delete (dataMalzemeler as any).kalemler;
    (dataMalzemeler as any).malzemeler = [
      {
        siraNo: 1,
        kod: "150.99",
        ad: "Zımba Teli No:10",
        tanim: "1000lik paket",
        olcuBirimi: "Paket",
        miktar: "35",
      },
    ];

    const html1 = renderToStaticMarkup(<IhtiyacTalepFormu data={dataMalzemeler} />);
    expect(html1).toContain("Zımba Teli No:10");
    expect(html1).toContain("1000lik paket");
    expect(html1).not.toContain("Kalem bulunamadı");

    const dataItems = createSyntheticDocumentData();
    delete (dataItems as any).ihtiyacKalemleri;
    delete (dataItems as any).kalemler;
    delete (dataItems as any).malzemeler;
    (dataItems as any).items = [
      {
        siraNo: 1,
        malzemeAdi: "Sıvı El Sabunu 5 Lt",
        ozelligi: "Antibakteriyel gliserinli",
        birimi: "Bidon",
        miktar: 10,
      },
    ];

    const html2 = renderToStaticMarkup(<IhtiyacTalepFormu data={dataItems} />);
    expect(html2).toContain("Sıvı El Sabunu 5 Lt");
    expect(html2).toContain("Antibakteriyel gliserinli");
    expect(html2).not.toContain("Kalem bulunamadı");
  });

  it("IhtiyacTalepFormuResolver SQLite sorgusundan kalemleri çeker ve IhtiyacTalepFormuRenderer ile basar", async () => {
    TemplateRegistry.clear();
    registerTeminTemplates();

    const mockQueryExecutor = async (sql: string, params: any[]) => {
      if (sql.includes("DATA_TeminKalem")) {
        return [
          {
            id: 1,
            sira_no: 1,
            kalem_adi: "Klavye ve Mouse Seti",
            aciklama: "Kablosuz USB alıcılı Türkçe Q",
            birim: "Set",
            miktar: 8,
            tasinir_kodu: "255.02.01",
            kdv_orani: 20,
          },
        ];
      }
      if (sql.includes("DATA_TeminDosyasi")) {
        return [
          {
            id: 1,
            temin_no: "2026/DT-45",
            konu: "Bilgisayar Sarf ve Çevre Birimleri Alımı",
            isin_aciklamasi: "Müdürlüğümüz büro personeli için",
            dosya_acilis_tarihi: "2026-11-09",
          },
        ];
      }
      if (sql.includes("TANIM_Personel")) {
        return [
          {
            id: 1,
            ad_soyad: "Ahmet YILMAZ",
            unvan: "Veri Hazırlama Kontrol İşletmeni",
          },
        ];
      }
      return [];
    };

    const resolver = new IhtiyacTalepFormuResolver();
    const resolvedData = await resolver.resolve({
      dosyaId: 1,
      templateKey: "ihtiyac_talep_formu",
      headerData: {
        antetSatirlari: ["T.C.", "KONYA BÜYÜKŞEHİR BELEDİYESİ"],
        mudurluk: "Bilgi İşlem Dairesi Başkanlığı",
        harcamaYetkilisiAdi: "Mehmet DEMİR",
        harcamaYetkilisiUnvan: "Daire Başkanı",
        kurumUst: "T.C.",
        kurumAdi: "KONYA BÜYÜKŞEHİR BELEDİYESİ",
        solLogo: null,
        sagLogo: null,
      },
      queryExecutor: mockQueryExecutor,
    });

    expect(resolvedData.ihtiyacKalemleri).toHaveLength(1);
    expect(resolvedData.ihtiyacKalemleri![0].malzemeAdi).toBe("Klavye ve Mouse Seti");

    const html = renderToStaticMarkup(
      <IhtiyacTalepFormuRenderer data={resolvedData} isEditing={false} />
    );

    expect(html).toContain("Klavye ve Mouse Seti");
    expect(html).toContain("Kablosuz USB alıcılı Türkçe Q");
    expect(html).toContain("KONYA BÜYÜKŞEHİR BELEDİYESİ");
    expect(html).toContain("Bilgi İşlem Dairesi Başkanlığı");
    expect(html).not.toContain("Kalem bulunamadı");
  });
});
