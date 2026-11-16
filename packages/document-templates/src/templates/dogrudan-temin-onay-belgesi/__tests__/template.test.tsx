import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DogrudanTeminOnayBelgesi } from "../DogrudanTeminOnayBelgesi.template";
import { getTemplateDefinition } from "../../../registry";
import { dataMapping } from "../data.mapping";

describe("DogrudanTeminOnayBelgesi — Şablon Bileşen ve Data Mapping Testleri", () => {
  it("1. Eksiksiz veri sağlandığında tüm tablo satırları, onay makamı ve imzalar çizilir", () => {
    const mockData = {
      idareAdi: "Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü",
      teminNo: "2026/042",
      evrakSayisi: "E-10234521-934.01-0042",
      dosyaTarihi: "15.11.2026",
      makam: "DESTEK HİZMETLERİ MÜDÜRLÜĞÜ HARCAMA YETKİLİSİ MAKAMINA",
      isAdi: "Yazılım Lisans Sözleşmesi",
      teminSekli: "4734 Sayılı K.İ.K. Madde 22/d",
      alimTuru: "Hizmet Alımı",
      yaklasikMaliyet: 125000,
      odenekTutari: 150000,
      projeNo: "2026-PRJ-09",
      butceTertibi: ["46.34.02.05 - 03.7.1.90"],
      avansSartlari: "Avans verilmeyecektir.",
      fiyatFarkiSartlari: "Fiyat Farkı Ödenmeyecektir.",
      dokumanHazirlik: "Sadece teknik şartname hazırlanacaktır.",
      isinAciklamasi: "İhtiyaç duyulan yazılım lisanslarının temini gerçekleştirilecektir.",
      hazirlayanPersonelAdi: "Kemal Sunal",
      hazirlayanPersonelUnvan: "Satınalma Şefi",
      onaylayanPersonelAdi: "Halit Akçatepe",
      onaylayanPersonelUnvan: "Destek Hizmetleri Müdürü",
      ekler: ["1 Adet Piyasa Araştırma Tutanağı", "1 Adet Şartname"],
    };

    const html = renderToStaticMarkup(<DogrudanTeminOnayBelgesi data={mockData} />);

    // Başlık ve muhatap makam kontrolü
    expect(html).toContain("ONAY BELGESİ");
    expect(html).toContain("DESTEK HİZMETLERİ MÜDÜRLÜĞÜ HARCAMA YETKİLİSİ MAKAMINA");

    // İşin Adı ve Temin No
    expect(html).toContain("Yazılım Lisans Sözleşmesi");
    expect(html).toContain("2026/042");

    // Maliyet ve Ödenek
    expect(html).toContain("125.000,00");
    expect(html).toContain("150.000,00");

    // Bütçe tertibi ve açıklamalar
    expect(html).toContain("46.34.02.05 - 03.7.1.90");
    expect(html).toContain("Avans verilmeyecektir.");

    // Gerçekleştirme Görevlisi (sol sütun)
    expect(html).toContain("Kemal Sunal");
    expect(html).toContain("Satınalma Şefi");
    expect(html).toContain("Gerçekleştirme Görevlisi");

    // Harcama Yetkilisi (sağ sütun)
    expect(html).toContain("UYGUNDUR");
    expect(html).toContain("Halit Akçatepe");
    expect(html).toContain("Destek Hizmetleri Müdürü");
    expect(html).toContain("Harcama Yetkilisi");

    // Ekler listesi
    expect(html).toContain("EKLER:");
    expect(html).toContain("1 Adet Piyasa Araştırma Tutanağı");
  });

  it("2. Boş veri sağlandığında çökmeksizin varsayılan metinleri ve tablo yapısını çizer", () => {
    const html = renderToStaticMarkup(<DogrudanTeminOnayBelgesi data={{}} />);
    expect(html).toContain("ONAY BELGESİ");
    expect(html).toContain("UYGUNDUR");
    expect(html).toContain("Harcama Yetkilisi");
  });

  it("3. Template Registry üzerinden `dogrudan-temin-onay-belgesi` ile çözümlenip başarıyla render edilir", () => {
    const def = getTemplateDefinition("dogrudan-temin-onay-belgesi");
    expect(def).toBeDefined();
    expect(def?.id).toBe("dogrudan-temin-onay-belgesi");

    const Component = def!.component as React.FC<any>;
    const html = renderToStaticMarkup(
      <Component
        data={{
          isAdi: "Test Alımı",
          hazirlayanPersonelAdi: "Test Memur",
        }}
      />
    );
    expect(html).toContain("Test Alımı");
  });

  it("4. data.mapping.ts onay belgesinin temel alanlarını eksiksiz tanımlar", () => {
    expect(dataMapping.isAdi).toBeDefined();
    expect(dataMapping.teminNo).toBeDefined();
    expect(dataMapping.yaklasikMaliyet).toBeDefined();
    expect(dataMapping.hazirlayanPersonelAdi).toBeDefined();
    expect(dataMapping.onaylayanPersonelAdi).toBeDefined();
  });
});
