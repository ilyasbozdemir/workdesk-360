import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentEngine } from "@worksuite-360/document-engine";
import { registerTeminTemplates } from "../../../engine/registerTeminTemplates";
import { DocumentValidationService } from "../../../services/documentValidationService";
import {
  IhtiyacKalemiSchema,
  IhtiyacListesi,
  IhtiyacListesiSchema,
} from "../index";
import { IhtiyacListesiRenderer } from "../../../engine/renderers/IhtiyacListesiRenderer";
import {
  createSyntheticDocumentData,
  SYNTHETIC_PERSONEL_LIST,
} from "../../__tests__/fixtures";

describe("İhtiyaç Listesi — Render, Schema ve PDF Uyumluluk Testleri", () => {
  it("sentetik gerçekçi veriyle React şablonunu hatasız render eder ve temel alanları içerir", () => {
    const data = createSyntheticDocumentData();
    const html = renderToStaticMarkup(
      <IhtiyacListesi
        data={data}
      />,
    );

    expect(html).toContain("ÖRNEK VALİLİĞİ");
    expect(html).toContain("Destek Hizmetleri Müdürlüğü");
    expect(html).toContain("E-10000000-934.01-2026/101");
    expect(html).toContain("Kırtasiye ve Büro Malzemesi Alımı");
    expect(html).toContain("HARCAMA YETKİLİSİ MAKAMINA");
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("80 gr/m² 500 yaprak");
    expect(html).toContain("Telli Dosya");
    expect(html).toContain("Deniz KAYA");
    expect(html).toContain("Bilgisayar İşletmeni");
    expect(html).toContain("Selin YILMAZ");
    expect(html).toContain("Destek Hizmetleri Müdürü");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });

  it("olurYazisi: false olduğunda baskı modunda OLUR imzasını gizler, düzenleme modunda bilgi yer tutucusunu gösterir", () => {
    const data = createSyntheticDocumentData({ olurYazisi: false });
    const printHtml = renderToStaticMarkup(
      <IhtiyacListesiRenderer data={data} isEditing={false} />,
    );
    expect(printHtml).not.toContain("Selin YILMAZ");

    const editHtml = renderToStaticMarkup(
      <IhtiyacListesiRenderer
        data={data}
        isEditing={true}
        onFieldChange={() => {}}
      />,
    );
    expect(editHtml).toContain("OLUR Bloğu Gizli (Göster ve Düzenle)");
  });

  it("çoklu kalem listesinde (sayfa sınırı aşıldığında) birden fazla A4 sayfası üretir ve son sayfada imza bloğunu korur", () => {
    const cokluKalemler = Array.from({ length: 18 }, (_, i) => ({
      id: i + 1,
      siraNo: i + 1,
      kodu: `150.01.${String(i + 1).padStart(2, "0")}`,
      malzemeAdi: `Test Kalemi ${i + 1}`,
      ozelligi: `Teknik Özellik ${i + 1}`,
      birimi: "Adet",
      kdvOrani: 20,
      miktar: (i + 1) * 5,
    }));

    const data = createSyntheticDocumentData({
      ihtiyacKalemleri: cokluKalemler,
    });

    const html = renderToStaticMarkup(
      <IhtiyacListesi
        data={data}
        firstPageLimit={8}
        middlePageLimit={8}
        lastPageLimit={8}
      />,
    );

    expect(html).toContain("Test Kalemi 1");
    expect(html).toContain("Test Kalemi 18");
    expect(html).toContain("Deniz KAYA");
    expect(html).toContain("Selin YILMAZ");
  });

  it("boş, null ve undefined alanlarla çökmeksizin güvenli biçimde render edilir", () => {
    const html = renderToStaticMarkup(
      <IhtiyacListesi
        data={{
          antetSatirlari: undefined,
          evrakSayisi: undefined,
          sunulacakMakamAdi: "",
          ihtiyacKalemleri: [],
        }}
      />,
    );

    expect(html).toBeTruthy();
    expect(html).not.toContain("NaN");
  });

  it("IhtiyacListesiSchema ve IhtiyacKalemiSchema geçerli/eksik/farklı tipteki verileri doğru doğrular", () => {
    const validItem = IhtiyacKalemiSchema.safeParse({
      siraNo: 1,
      kodu: null,
      malzemeAdi: "Deneme Malzeme",
      ozelligi: null,
      birimi: "Adet",
      kdvOrani: "20",
      miktar: "15",
    });
    expect(validItem.success).toBe(true);

    const invalidItem = IhtiyacKalemiSchema.safeParse({
      // siraNo ve miktar eksik
      malzemeAdi: "Eksik Kalem",
    });
    expect(invalidItem.success).toBe(false);

    const validDoc = IhtiyacListesiSchema.safeParse(
      createSyntheticDocumentData(),
    );
    expect(validDoc.success).toBe(true);

    const validationReport = DocumentValidationService.validate(
      "ihtiyac-listesi",
      createSyntheticDocumentData(),
    );
    expect(validationReport.isValid).toBe(true);
    expect(validationReport.errors).toHaveLength(0);
  });

  it("DocumentEngine.compileHtml ile A4 dikey ve yatay PDF uyumlu tam HTML çıktısı üretir", () => {
    registerTeminTemplates();
    const data = createSyntheticDocumentData();

    const portraitHtml = DocumentEngine.compileHtml({
      templateKey: "ihtiyac-listesi",
      data,
      orientation: "portrait",
    });

    expect(portraitHtml).toContain("<!DOCTYPE html>");
    expect(portraitHtml).toContain("size: 210mm 297mm;");
    expect(portraitHtml).toContain("A4 Fotokopi Kağıdı");
    expect(portraitHtml).toContain("Deniz KAYA");

    const landscapeHtml = DocumentEngine.compileHtml({
      templateKey: "ihtiyac-listesi",
      data,
      orientation: "landscape",
    });

    expect(landscapeHtml).toContain("size: 297mm 210mm;");
  });

  it("IhtiyacListesiRenderer üzerinden de aynı belge yapısını oluşturur", () => {
    const data = createSyntheticDocumentData();
    const html = renderToStaticMarkup(
      <IhtiyacListesiRenderer
        data={data}
        orientation="portrait"
        isEditing={false}
      />,
    );
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("Selin YILMAZ");
  });
});
