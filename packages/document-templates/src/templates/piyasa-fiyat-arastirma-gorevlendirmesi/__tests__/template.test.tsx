import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PiyasaFiyatArastirmaGorevlendirmesi } from "../PiyasaFiyatArastirmaGorevlendirmesi.template";
import { getTemplateDefinition } from "../../../registry";

describe("PiyasaFiyatArastirmaGorevlendirmesi — Şablon Bileşen Render Testleri", () => {
  it("1. Görevlendirilen personeller, hazırlayan ve harcama yetkilisi eksiksiz çizilir", () => {
    const mockData = {
      evrakSayisi: "E-10234521-934.01-0005",
      dosyaTarihi: "15.11.2026",
      kurumumuz: "Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü",
      isinAdi: "Temizlik Malzemesi Temini",
      dosyaKonusu: "Piyasa Fiyat Araştırma Görevlendirmesi",
      hazirlayanPersonelAdi: "Kemal Sunal",
      hazirlayanPersonelUnvan: "Satınalma Şefi",
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
      olurYazisi: true,
    };

    const html = renderToStaticMarkup(<PiyasaFiyatArastirmaGorevlendirmesi data={mockData} />);

    // Başlık ve iş adı kontrolü
    expect(html).toContain("Temizlik Malzemesi Temini");

    // Görevlendirilen üyelerin metin içinde yer alması
    expect(html).toContain("Münir Özkul");
    expect(html).toContain("Adile Naşit");

    // Hazırlayan ve Onaylayan imzaları
    expect(html).toContain("Kemal Sunal");
    expect(html).toContain("Satınalma Şefi");
    expect(html).toContain("Halit Akçatepe");
    expect(html).toContain("Destek Hizmetleri Müdürü");

    // OLUR onay başlığı ve DAĞITIM
    expect(html).toContain("OLUR");
    expect(html).toContain("DAĞITIM:");
  });

  it("2. Boş veri sağlandığında çökmeksizin varsayılan metinleri çizer", () => {
    const html = renderToStaticMarkup(<PiyasaFiyatArastirmaGorevlendirmesi data={{}} />);
    expect(html).toContain("Gereğini olurlarınıza arz ederim");
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
          hazirlayanPersonelAdi: "Test Personel",
        }}
      />
    );
    expect(html).toContain("Kırtasiye Alımı");
  });
});
