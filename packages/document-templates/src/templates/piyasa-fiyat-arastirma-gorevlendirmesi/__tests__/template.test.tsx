import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PiyasaFiyatArastirmaGorevlendirmesi } from "../PiyasaFiyatArastirmaGorevlendirmesi.template";
import { getTemplateDefinition } from "../../../registry";

describe("PiyasaFiyatArastirmaGorevlendirmesi — Şablon Bileşen Render Testleri", () => {
  it("1. Görevlendirilen personeller, doğrudan emir yazısı ve harcama yetkilisi tekil imzası eksiksiz çizilir", () => {
    const mockData = {
      evrakSayisi: "E-10234521-934.01-0005",
      dosyaTarihi: "15.11.2026",
      kurumumuz: "Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü",
      isinAdi: "Temizlik Malzemesi Temini",
      dosyaKonusu: "Piyasa Fiyat Araştırma Görevlendirmesi",
      onaylayanPersonelAdi: "Halit Akçatepe",
      onaylayanPersonelUnvan: "Destek Hizmetleri Müdürü",
      gorevlendirilenler: [
        { adSoyad: "Münir Özkul", unvan: "Mühendis" },
        { adSoyad: "Adile Naşit", unvan: "Tekniker" },
      ],
      dagitimListesi: [
        { adSoyad: "Münir Özkul", unvan: "Mühendis" },
        { adSoyad: "Adile Naşit", unvan: "Tekniker" },
      ],
    };

    const html = renderToStaticMarkup(<PiyasaFiyatArastirmaGorevlendirmesi data={mockData} />);

    // Başlık ve iş adı kontrolü
    expect(html).toContain("Temizlik Malzemesi Temini");

    // Görevlendirilen üyelerin metin içinde yer alması
    expect(html).toContain("Münir Özkul");
    expect(html).toContain("Adile Naşit");

    // Doğrudan emir yazısı metni ("Gereğini rica ederim.")
    expect(html).toContain("Gereğini rica ederim.");

    // Harcama Yetkilisi / Onay Makamı tekil imzası
    expect(html).toContain("Halit Akçatepe");
    expect(html).toContain("Destek Hizmetleri Müdürü");

    // OLUR onay başlığı olmamalıdır (Olur yazısı değil, amir görevlendirme emridir)
    expect(html).not.toContain("OLUR");
    expect(html).not.toContain("olurlarınıza arz ederim");

    // DAĞITIM
    expect(html).toContain("DAĞITIM:");
  });

  it("2. Boş veri sağlandığında çökmeksizin varsayılan metinleri ve rica ederim ifadesini çizer", () => {
    const html = renderToStaticMarkup(<PiyasaFiyatArastirmaGorevlendirmesi data={{}} />);
    expect(html).toContain("Gereğini rica ederim.");
    expect(html).toContain("Harcama Yetkilisi");
  });

  it("3. Template Registry üzerinden `piyasa-arastirma-gorevlendirmesi` alias'ı ile çözümlenip başarıyla render edilir", () => {
    const def = getTemplateDefinition("piyasa-arastirma-gorevlendirmesi");
    expect(def).toBeDefined();
    expect(def?.id).toBe("piyasa-fiyat-arastirma-gorevlendirmesi");

    const Component = def!.component as React.FC<any>;
    const html = renderToStaticMarkup(
      <Component
        data={{
          isinAdi: "Kırtasiye Alımı",
          dosyaKonusu: "Kırtasiye Alımı", // Dosya konusu yerine yanlışlıkla iş adı gelse bile şablon doğru belge konusunu korumalı
          hazirlayanPersonelAdi: "Test Personel",
        }}
      />
    );
    expect(html).toContain("Kırtasiye Alımı");
    expect(html).toContain("Piyasa Fiyat Araştırma Görevlendirmesi");
  });

  it("4. Standart MetadataBlock kullanılarak 'Konu :' alanında 'Piyasa Fiyat Araştırma Görevlendirmesi' basılır", () => {
    const html = renderToStaticMarkup(
      <PiyasaFiyatArastirmaGorevlendirmesi data={{}} />
    );
    expect(html).toContain("Konu");
    expect(html).toContain("Piyasa Fiyat Araştırma Görevlendirmesi");
  });
});
