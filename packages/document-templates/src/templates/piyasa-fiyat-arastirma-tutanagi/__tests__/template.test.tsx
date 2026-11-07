import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentEngine } from "@worksuite-360/document-engine";
import { registerTeminTemplates } from "../../../engine/registerTeminTemplates";
import {
  PiyasaFiyatArastirmaTutanagi,
  PiyasaFiyatArastirmaTutanagiSchema,
} from "../index";
import { createSyntheticDocumentData } from "../../__tests__/fixtures";

describe("Piyasa Fiyat Araştırma Tutanağı — Render, Schema ve PDF Uyumluluk Testleri", () => {
  it("sentetik firma teklifleri ve komisyon verisiyle React şablonunu hatasız render eder", () => {
    const items = [
      {
        siraNo: 1,
        malzemeAdi: "A4 Fotokopi Kağıdı",
        ozelligi: "80 gr",
        birimi: "Paket",
        miktar: 50,
        firmaTeklifleriDetay: [{ birimFiyat: 120 }, { birimFiyat: 135 }],
      },
    ];
    const data = createSyntheticDocumentData({
      firmalar: [
        { unvan: "Alfa Kırtasiye Ltd. Şti." },
        { unvan: "Beta Büro A.Ş." },
      ],
      firmaTeklifleriDetay: undefined,
      ihtiyacKalemleri: items,
      kalemler: items,
      malzemeler: items,
    });

    const html = renderToStaticMarkup(
      <PiyasaFiyatArastirmaTutanagi data={data} isEditing={false} />,
    );

    expect(html).toContain("Alfa Kırtasiye Ltd. Şti.");
    expect(html).toContain("Beta Büro A.Ş.");
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("6.000,00");
    expect(html).toContain("Deniz KAYA");
    expect(html).toContain("Selin YILMAZ");
    expect(html).not.toContain("NaN");
  });

  it("boş, null ve undefined alanlarla çökmeden güvenli render edilir", () => {
    const html = renderToStaticMarkup(
      <PiyasaFiyatArastirmaTutanagi
        data={{
          firmalar: [],
          kalemler: [],
          fiyatArastirmaGorevlileri: [],
        }}
        isEditing={false}
      />,
    );

    expect(html).toBeTruthy();
    expect(html).not.toContain("NaN");
  });

  it("PiyasaFiyatArastirmaTutanagiSchema şema doğrulamasını geçer", () => {
    const parsed = PiyasaFiyatArastirmaTutanagiSchema.safeParse(
      createSyntheticDocumentData(),
    );
    expect(parsed.success).toBe(true);
  });

  it("DocumentEngine.compileHtml ile A4 yatay/dikey PDF uyumlu HTML çıktısı üretir", () => {
    registerTeminTemplates();
    const html = DocumentEngine.compileHtml({
      templateKey: "piyasa-fiyat-arastirma-tutanagi",
      data: createSyntheticDocumentData(),
      orientation: "landscape",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("size: 297mm 210mm;");
    expect(html).toContain("A4 Fotokopi Kağıdı");
  });
});
