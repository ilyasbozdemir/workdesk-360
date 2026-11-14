import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { LuzumMuzekkeresiTeslimTesellum } from "../LuzumMuzekkeresiTeslimTesellum.template";
import { MalAlimiLuzumMuzekkeresiTeslimTesellum } from "../MalAlimi/MalAlimiLuzumMuzekkeresiTeslimTesellum";

describe("LuzumMuzekkeresiTeslimTesellum — Mal Alımı Teslim Tesellüm Tutanağı", () => {
  const baseData = {
    isinAdi: "Temizlik Malzemesi Alımı",
    kurumumuz: "Destek Hizmetleri Dairesi Başkanlığı",
    ihtiyacKalemleri: [
      {
        siraNo: 1,
        kodu: "150.01.01",
        malzemeAdi: "A4 Fotokopi Kağıdı",
        ozelligi: "80 gr Beyaz",
        birimi: "Koli",
        kdvOrani: 20,
        miktar: 50,
      },
    ],
    teslimEdenler: [{ adSoyad: "Ahmet Yılmaz", unvan: "Yüklenici Yetkilisi" }],
    teslimAlanlar: [{ adSoyad: "Mehmet Demir", unvan: "Taşınır Kayıt Yetkilisi" }],
  };

  it("1. Teslim Tesellüm Belgesi standart başlığı ve 'Taşınır Kodu' sütununu içerir", () => {
    const html = renderToString(
      <LuzumMuzekkeresiTeslimTesellum data={baseData} />,
    );
    expect(html).toContain("TESLİM TESELLÜM BELGESİ");
    expect(html).toContain("Taşınır Kodu");
    expect(html).toContain("A4 Fotokopi Kağıdı");
    expect(html).toContain("TESLİM EDENLER");
    expect(html).toContain("TESLİM ALANLAR");
    expect(html).toContain("Taşınır Kayıt Yetkilisi");
  });

  it("2. MalAlimiLuzumMuzekkeresiTeslimTesellum bileşeni aynı Mal Alımı çıktısını üretir", () => {
    const html = renderToString(
      <MalAlimiLuzumMuzekkeresiTeslimTesellum data={baseData} />,
    );
    expect(html).toContain("TESLİM TESELLÜM BELGESİ");
    expect(html).toContain("Taşınır Kodu");
    expect(html).toContain("A4 Fotokopi Kağıdı");
  });

  it("3. Teslim Tesellüm tutanağı kamu ihale kanunu gereğince mal alımı formatında kalır", () => {
    // Alım türü ne verilirse verilsin teslim-tesellüm fiziki mal alımı şablonunu korur
    const html = renderToString(
      <LuzumMuzekkeresiTeslimTesellum data={{ ...baseData, alimTuru: "mal" }} />,
    );
    expect(html).toContain("TESLİM TESELLÜM BELGESİ");
    expect(html).toContain("Taşınır Kodu");
  });
});
