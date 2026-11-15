import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MuayeneKabulKomisyonu } from "../MuayeneKabulKomisyonu.template";
import { getTemplateDefinition } from "../../../registry";
import { dataMapping } from "../data.mapping";

describe("MuayeneKabulKomisyonu — Şablon Bileşen ve Data Mapping Testleri", () => {
  it("1. Görevlendirilen muayene kabul personelleri, hazırlayan ve harcama yetkilisi eksiksiz çizilir", () => {
    const mockData = {
      evrakSayisi: "E-10234521-934.01-0008",
      dosyaTarihi: "15.11.2026",
      kurumumuz: "Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü",
      kurumAdi: "Kadıköy Belediyesi",
      kurumUst: "T.C.",
      isinAdi: "Bilgisayar Donanımı Alımı",
      dosyaKonusu: "Muayene ve Kabul Komisyonu",
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

    const html = renderToStaticMarkup(<MuayeneKabulKomisyonu data={mockData} />);

    // Başlık ve iş adı kontrolü
    expect(html).toContain("Bilgisayar Donanımı Alımı");

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
    const html = renderToStaticMarkup(<MuayeneKabulKomisyonu data={{}} />);
    expect(html).toContain("Gereğini olurlarınıza arz ederim");
  });

  it("3. Template Registry üzerinden `muayene-kabul-komisyonu` ile çözümlenip başarıyla render edilir", () => {
    const def = getTemplateDefinition("muayene-kabul-komisyonu");
    expect(def).toBeDefined();
    expect(def?.id).toBe("muayene-kabul-komisyonu");

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

  it("4. data.mapping.ts kurum ve birim alanlarını (kurumAdi, kurumUst, harcamaBirimi, mudurluk, birimId) eksiksiz içerir", () => {
    expect(dataMapping.kurumAdi).toBeDefined();
    expect(dataMapping.kurumUst).toBeDefined();
    expect(dataMapping.harcamaBirimi).toBeDefined();
    expect(dataMapping.mudurluk).toBeDefined();
    expect(dataMapping.birimId).toBeDefined();
    expect(dataMapping.antetEkSatir).toBeDefined();
  });
});
