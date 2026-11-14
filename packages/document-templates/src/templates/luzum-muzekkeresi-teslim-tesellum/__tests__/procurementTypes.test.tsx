import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { LuzumMuzekkeresiTeslimTesellum } from "../LuzumMuzekkeresiTeslimTesellum.template";
import { MalAlimiLuzumMuzekkeresiTeslimTesellum } from "../MalAlimi/MalAlimiLuzumMuzekkeresiTeslimTesellum";
import { HizmetAlimiLuzumMuzekkeresiTeslimTesellum } from "../HizmetAlimi/HizmetAlimiLuzumMuzekkeresiTeslimTesellum";
import { DanismanlikLuzumMuzekkeresiTeslimTesellum } from "../DanismanlikHizmetAlimi/DanismanlikLuzumMuzekkeresiTeslimTesellum";
import { YapimIsleriLuzumMuzekkeresiTeslimTesellum } from "../YapimIsleri/YapimIsleriLuzumMuzekkeresiTeslimTesellum";

describe("LuzumMuzekkeresiTeslimTesellum — Alım Türü Varyantları", () => {
  const baseData = {
    isinAdi: "Test Alımı",
    kurumumuz: "Test Belediyesi",
    ihtiyacKalemleri: [
      {
        siraNo: 1,
        kodu: "253.01.01",
        malzemeAdi: "A4 Fotokopi Kağıdı",
        ozelligi: "80 gr Beyaz",
        birimi: "Koli",
        kdvOrani: 20,
        miktar: 50,
      },
    ],
    teslimEdenler: [{ adSoyad: "Ahmet Yılmaz", unvan: "Yüklenici Yetkilisi" }],
    teslimAlanlar: [{ adSoyad: "Mehmet Demir", unvan: "Ambar Memuru" }],
  };

  it("1. Mal Alımı varyantı doğru başlık ve 'Taşınır Kodu' sütununu içerir", () => {
    const html = renderToString(
      <MalAlimiLuzumMuzekkeresiTeslimTesellum data={baseData} />,
    );
    expect(html).toContain("TESLİM TESELLÜM BELGESİ");
    expect(html).toContain("Taşınır Kodu");
    expect(html).toContain("A4 Fotokopi Kağıdı");
  });

  it("2. Hizmet Alımı varyantı 'Hizmet Kodu' ve 'Hizmet / İşin Adı' sütunlarını içerir", () => {
    const html = renderToString(
      <HizmetAlimiLuzumMuzekkeresiTeslimTesellum data={baseData} />,
    );
    expect(html).toContain("TESLİM TESELLÜM BELGESİ");
    expect(html).toContain("Hizmet Kodu");
    expect(html).toContain("Hizmet / İşin Adı");
  });

  it("3. Danışmanlık varyantı 'Danışmanlık / Proje Adı' sütununu içerir", () => {
    const html = renderToString(
      <DanismanlikLuzumMuzekkeresiTeslimTesellum data={baseData} />,
    );
    expect(html).toContain("TESLİM TESELLÜM BELGESİ");
    expect(html).toContain("Danışmanlık / Proje Adı");
  });

  it("4. Yapım İşleri varyantı 'Poz No' ve 'İş Kalemi Adı / İmalat' sütunlarını içerir", () => {
    const html = renderToString(
      <YapimIsleriLuzumMuzekkeresiTeslimTesellum data={baseData} />,
    );
    expect(html).toContain("TESLİM TESELLÜM BELGESİ");
    expect(html).toContain("Poz No");
    expect(html).toContain("İş Kalemi Adı / İmalat");
  });

  it("5. Ana LuzumMuzekkeresiTeslimTesellum alimTuru='yapim' verildiğinde otomatik yönlendirir", () => {
    const html = renderToString(
      <LuzumMuzekkeresiTeslimTesellum data={{ ...baseData, alimTuru: "yapim" }} />,
    );
    expect(html).toContain("Poz No");
    expect(html).toContain("İş Kalemi Adı / İmalat");
  });
});
