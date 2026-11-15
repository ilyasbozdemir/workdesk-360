import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HarcamaPusulasi } from "../HarcamaPusulasi.template";

describe("HarcamaPusulasi — Şablon Bileşeni Görsel & HTML Testleri", () => {
  const baseData = {
    evrakSayisi: "E-10234521-934.01-0005",
    tarih: "15.11.2026",
    idareAdi: "Kadıköy Belediyesi",
    isAdi: "Bilirkişi Uzman Raporu Alımı",
    alimTuru: "hizmet",
    miktar: "1 Adet",
    birimFiyat: 12500,
    tutar: 12500,
    saticiTcNo: "98765432101",
    saticiAdiSoyadi: "Kemal Güner",
    saticiAdres: "Rasimpaşa Mah. Rıhtım Cad. No:4 Kadıköy / İstanbul",
    onaylayanPersonelAdi: "Mustafa Kaya",
    onaylayanPersonelUnvan: "Harcama Yetkilisi",
  };

  it("1. Harcama Pusulası başlığı, satıcı ve tutar bilgileri eksiksiz render edilir", () => {
    const html = renderToStaticMarkup(<HarcamaPusulasi data={baseData} />);

    expect(html).toContain("HARCAMA PUSULASI");
    expect(html).toContain("98765432101");
    expect(html).toContain("Kemal Güner");
    expect(html).toContain("Rasimpaşa Mah. Rıhtım Cad. No:4");
    expect(html).toContain("12.500,00");
    expect(html).toContain("₺");
    expect(html).toContain("Mustafa Kaya");
    expect(html).toContain("Harcama Yetkilisi");
  });

  it("2. Tutar yazı ile ifadesi otomatik olarak Türkçe hesaplanır", () => {
    const html = renderToStaticMarkup(
      <HarcamaPusulasi
        data={{
          ...baseData,
          tutar: 12500,
          tutarYazi: undefined,
        }}
      />,
    );

    // 12500 TL için otomatik yazı
    expect(html).toContain("ONİKİBİN BEŞYÜZ TL");
  });

  it("3. Manuel tutarYazi girildiğinde otomatik hesaplama yerine manuel metin korunur", () => {
    const html = renderToStaticMarkup(
      <HarcamaPusulasi
        data={{
          ...baseData,
          tutar: 12500,
          tutarYazi: "Yalnız On İki Bin Beş Yüz TL'dir",
        }}
      />,
    );

    expect(html).toContain("Yalnız On İki Bin Beş Yüz TL&#x27;dir");
  });

  it("4. Tüm doğrudan temin alım türlerinde (Mal, Hizmet, Danışmanlık, Yapım) standart yeknesak şablon kullanılır", () => {
    const procurementTypes = ["mal", "hizmet", "danismanlik", "yapim"];

    for (const tur of procurementTypes) {
      const html = renderToStaticMarkup(
        <HarcamaPusulasi
          data={{
            ...baseData,
            alimTuru: tur,
            isAdi: `${tur.toUpperCase()} Alımı Kapsamında Gider Pusulası`,
          }}
        />,
      );

      expect(html).toContain("HARCAMA PUSULASI");
      expect(html).toContain("Kemal Güner");
      expect(html).toContain("Mustafa Kaya");
    }
  });

  it("5. Çoklu kalem (ihtiyacKalemleri) verildiğinde kalem sayısı ve açıklaması otomatik türetilir", () => {
    const dataWithKalemler = {
      ...baseData,
      miktar: undefined,
      ihtiyacKalemleri: [
        { siraNo: 1, malzemeAdi: "Kalem 1" },
        { siraNo: 2, malzemeAdi: "Kalem 2" },
        { siraNo: 3, malzemeAdi: "Kalem 3" },
      ],
    };

    const html = renderToStaticMarkup(<HarcamaPusulasi data={dataWithKalemler} />);
    expect(html).toContain("3 Kalem");
  });
});
