import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HarcamaTalimati } from "../HarcamaTalimati.template";
import { TemplateEditContext } from "../../../document/TemplateEditContext";

describe("HarcamaTalimati — Şablon Bileşeni Görsel & HTML Testleri", () => {
  const baseData = {
    evrakSayisi: "E-10234521-934.01-0001",
    tarih: "15.11.2026",
    idareAdi: "Kadıköy Belediyesi",
    gerekce: "Park ve Bahçeler bakım malzemesi temini",
    isAdi: "Çim Biçme Makinesi Alımı",
    sure: "15 Gün",
    teminSekli: "22/d Doğrudan Temin",
    yaklasikMaliyet: 85000,
    odenekTutari: 100000,
    gerceklestirmeGorevlisiAdi: "Ahmet Yılmaz",
    gerceklestirmeGorevlisiUnvan: "Mühendis",
    mutemetAdi: "Mehmet Demir",
    mutemetUnvan: "Mali Hizmetler Uzmanı",
    isTutari: 83000,
    sunumTarihi: "15.11.2026",
    onaylayanPersonelAdi: "Mustafa Kaya",
    onaylayanPersonelUnvan: "Fen İşleri Müdürü",
  };

  it("1. Harcama Talimatı başlığı ve ana bölümleri eksiksiz render edilir", () => {
    const html = renderToStaticMarkup(<HarcamaTalimati data={baseData} />);

    expect(html).toContain("HARCAMA TALİMATI");
    expect(html).toContain("Gerçekleştirme Görevlileri");
    expect(html).toContain("harcama yetkilisi mutemedi");
    expect(html).toContain("OLUR");
    expect(html).toContain("Ahmet Yılmaz");
    expect(html).toContain("Mehmet Demir");
    expect(html).toContain("Mustafa Kaya");
  });

  it("2. Mutemet ismi ve Türkçe yönelme eki doğru türetilir", () => {
    const html = renderToStaticMarkup(
      <HarcamaTalimati
        data={{
          ...baseData,
          mutemetAdi: "İlyas Bozdemir",
        }}
      />,
    );

    expect(html).toContain("İlyas Bozdemir");
    // İlyas Bozdemir için yönelme eki 'e
    expect(html).toContain("’e");
  });

  it("3. Düzenleme modunda (isEditing=true) personel seçim listeleri (select) aktifleşir", () => {
    const mockContextValue: any = {
      isEditing: true,
      onFieldChange: () => {},
      personelListesi: [
        { id: 1, ad_soyad: "Ahmet Yılmaz", unvan: "Mühendis", birim: "Fen İşleri" },
        { id: 2, ad_soyad: "Mehmet Demir", unvan: "Mali Hizmetler Uzmanı", birim: "Mali Hizmetler" },
      ],
      data: baseData,
    };

    const html = renderToStaticMarkup(
      <TemplateEditContext.Provider value={mockContextValue}>
        <HarcamaTalimati data={baseData} />
      </TemplateEditContext.Provider>,
    );

    // Gerçekleştirme Görevlileri satırında ve Mutemet alanında select bulunmalıdır
    expect(html).toContain("<select");
    expect(html).toContain("Ahmet Yılmaz");
    expect(html).toContain("Mehmet Demir");
  });

  it("4. Gerçekleştirme görevlisi hazirlayanPersonelAdi üzerinden de güvenle çözümlenir", () => {
    const fallbackData = {
      ...baseData,
      gerceklestirmeGorevlisiAdi: undefined,
      hazirlayanPersonelAdi: "Canan Çetin",
      hazirlayanPersonelUnvan: "Tekniker",
    };

    const html = renderToStaticMarkup(<HarcamaTalimati data={fallbackData} />);
    expect(html).toContain("Canan Çetin");
    expect(html).toContain("Tekniker");
  });
});
