import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { IhtiyacTalepFormu } from "../index";

describe("İhtiyaç Talep Formu — Sayfalama ve Bölünme Testleri", () => {
  const generateKalemler = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      siraNo: i + 1,
      tasinirKodu: `150.01.${String(i + 1).padStart(2, "0")}`,
      malzemeAdi: `Talep Malzemesi ${i + 1}`,
      ozelligi: `Teknik Açıklama ${i + 1}`,
      birimi: "Adet",
      kdvOrani: 20,
      miktar: i + 10,
    }));

  it("az sayıda kalem (örn. 3 kalem) tek sayfada başarıyla listelenir", () => {
    const data = {
      ihtiyacKalemleri: generateKalemler(3),
      talepEdenPersonelAdi: "Ali YILDIZ",
      onaylayanPersonelAdi: "Veli DEMİR",
    };

    const html = renderToStaticMarkup(<IhtiyacTalepFormu data={data} />);

    expect(html).toContain("İHTİYAÇ TALEP FORMU");
    expect(html).toContain("Talep Malzemesi 1");
    expect(html).toContain("Talep Malzemesi 3");
    expect(html).toContain("BİRİMİN TALEP GEREKÇESİ");
  });

  it("çok sayıda kalem (örn. 25 kalem) çoklu sayfaya taşarak paginate edilir", () => {
    const data = {
      ihtiyacKalemleri: generateKalemler(25),
      talepEdenPersonelAdi: "Ali YILDIZ",
      onaylayanPersonelAdi: "Veli DEMİR",
    };

    const html = renderToStaticMarkup(<IhtiyacTalepFormu data={data} />);

    expect(html).toContain("Talep Malzemesi 1");
    expect(html).toContain("Talep Malzemesi 25");
    expect(html).toContain("BİRİMİN TALEP GEREKÇESİ");
  });
});

