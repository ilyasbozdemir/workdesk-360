import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { IhtiyacListesi } from "../index";
import {
  createSyntheticDocumentData,
  extractRenderedPages,
} from "../../__tests__/fixtures";

function buildKalemListesi(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    siraNo: i + 1,
    kodu: `150.01.${String(i + 1).padStart(2, "0")}`,
    malzemeAdi: `Sayfalama Kalemi #${i + 1}`,
    ozelligi: `Özellik #${i + 1}`,
    birimi: "Adet",
    kdvOrani: 20,
    miktar: (i + 1) * 2,
  }));
}

describe("İhtiyaç Listesi — Sayfalama ve İmza Yerleşimi Testleri (pagination.test.tsx)", () => {
  it("1. Tek sayfaya sığan kalem listesinde yalnızca 1 adet DocumentLayout sayfası üretir ve hem Hazırlayan hem OLUR imzasını aynı sayfada gösterir", () => {
    const data = createSyntheticDocumentData({
      ihtiyacKalemleri: buildKalemListesi(5),
    });

    const html = renderToStaticMarkup(
      <IhtiyacListesi
        data={data}
        firstPageLimit={10}
        middlePageLimit={15}
        lastPageLimit={12}
      />,
    );

    const pages = extractRenderedPages(html);
    expect(pages).toHaveLength(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].totalPages).toBe(1);
    expect(pages[0].html).toContain("ÖRNEK VALİLİĞİ");
    expect(pages[0].html).toContain("Deniz KAYA");
    expect(pages[0].html).toContain("Selin YILMAZ");
    expect(pages[0].html).toContain("Sayfalama Kalemi #1");
    expect(pages[0].html).toContain("Sayfalama Kalemi #5");
    // Tek sayfalı belgede "1 / 1" sayfa numarası basılmamalı
    expect(pages[0].html).not.toContain("Sayfa 1 / 1");
  });

  it("2. Çok sayfalı (3 sayfa) belgede her sayfa kapsayıcısını ayrı üretir; üst antet/Hazırlayan yalnızca 1. sayfada, OLUR imzası yalnızca son sayfada yer alır", () => {
    const data = createSyntheticDocumentData({
      ihtiyacKalemleri: buildKalemListesi(22),
    });

    const html = renderToStaticMarkup(
      <IhtiyacListesi
        data={data}
        firstPageLimit={8}
        middlePageLimit={10}
        lastPageLimit={8}
      />,
    );

    const pages = extractRenderedPages(html);
    expect(pages).toHaveLength(3);
    expect(pages.map((p) => p.pageNumber)).toEqual([1, 2, 3]);
    expect(pages.map((p) => p.totalPages)).toEqual([3, 3, 3]);

    // 1. Sayfa (Kalem 1..8 + Antet + Hazırlayan)
    expect(pages[0].html).toContain("ÖRNEK VALİLİĞİ");
    expect(pages[0].html).toContain("HARCAMA YETKİLİSİ MAKAMINA");
    expect(pages[0].html).toContain("Deniz KAYA");
    expect(pages[0].html).toContain("Sayfalama Kalemi #1");
    expect(pages[0].html).toContain("Sayfalama Kalemi #8");
    expect(pages[0].html).not.toContain("Sayfalama Kalemi #9");
    expect(pages[0].html).not.toContain("Selin YILMAZ");
    expect(pages[0].html).toContain("1 / 3");
    expect(pages[0].html).toContain("page-break-after:always");

    // 2. Sayfa (Kalem 9..18, Antet yok, Sunuş metni ve Hazırlayan imza kartı yok, OLUR yok; alt bilgi var)
    expect(pages[1].html).toContain("Sayfalama Kalemi #9");
    expect(pages[1].html).toContain("Sayfalama Kalemi #18");
    expect(pages[1].html).not.toContain("Sayfalama Kalemi #19");
    expect(pages[1].html).not.toContain("ÖRNEK VALİLİĞİ");
    expect(pages[1].html).not.toContain("HARCAMA YETKİLİSİ MAKAMINA");
    expect(pages[1].html).not.toContain("gereğini olurlarınıza arz ederim");
    expect(pages[1].html).not.toContain("Selin YILMAZ");
    expect(pages[1].html).toContain("Bilgi İçin:");
    expect(pages[1].html).toContain("2 / 3");
    expect(pages[1].html).toContain("page-break-after:always");

    // 3. Sayfa / Son Sayfa (Kalem 19..22 + OLUR İmza Bloğu)
    expect(pages[2].html).toContain("Sayfalama Kalemi #19");
    expect(pages[2].html).toContain("Sayfalama Kalemi #22");
    expect(pages[2].html).not.toContain("ÖRNEK VALİLİĞİ");
    expect(pages[2].html).toContain("OLUR");
    expect(pages[2].html).toContain("Selin YILMAZ");
    expect(pages[2].html).toContain("Destek Hizmetleri Müdürü");
    expect(pages[2].html).toContain("3 / 3");
    expect(pages[2].html).toContain("page-break-after:avoid");
  });

  it("3. İlk sayfa tablo kapasitesini doldurup imza bloğuna yer kalmadığında (firstPageLimit < kalem <= firstPageLimitWithoutFooter) imza bloğu için 2. sayfaya taşar", () => {
    // 10 kalem: firstPageLimit=8 olduğu için 8+2 şeklinde 2 sayfaya bölünmeli ve OLUR 2. sayfada kalmalı
    const data = createSyntheticDocumentData({
      ihtiyacKalemleri: buildKalemListesi(10),
    });

    const html = renderToStaticMarkup(
      <IhtiyacListesi
        data={data}
        firstPageLimit={8}
        middlePageLimit={12}
        lastPageLimit={8}
      />,
    );

    const pages = extractRenderedPages(html);
    expect(pages).toHaveLength(2);
    expect(pages[0].html).toContain("Sayfalama Kalemi #8");
    expect(pages[0].html).not.toContain("Selin YILMAZ");
    expect(pages[1].html).toContain("Sayfalama Kalemi #9");
    expect(pages[1].html).toContain("Sayfalama Kalemi #10");
    expect(pages[1].html).toContain("Selin YILMAZ");
  });
});
