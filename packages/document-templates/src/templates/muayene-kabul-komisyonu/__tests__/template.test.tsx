import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MuayeneKabulKomisyonu } from "../MuayeneKabulKomisyonu.template";
import { getTemplateDefinition } from "../../../registry";
import { dataMapping } from "../data.mapping";

describe("MuayeneKabulKomisyonu — Şablon Bileşen ve Data Mapping Testleri", () => {
  it("1. Görevlendirilen muayene kabul personelleri, doğrudan emir yazısı ve harcama yetkilisi tekil imzası eksiksiz çizilir", () => {
    const mockData = {
      evrakSayisi: "E-10234521-934.01-0008",
      dosyaTarihi: "15.11.2026",
      kurumumuz: "Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü",
      kurumAdi: "Kadıköy Belediyesi",
      kurumUst: "T.C.",
      isinAdi: "Bilgisayar Donanımı Alımı",
      dosyaKonusu: "Muayene ve Kabul Komisyonu",
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

    const html = renderToStaticMarkup(<MuayeneKabulKomisyonu data={mockData} />);

    // Başlık ve iş adı kontrolü
    expect(html).toContain("Bilgisayar Donanımı Alımı");

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
    // DAĞITIM YERLERİNE hitabı kontrolü
    expect(html).toContain("DAĞITIM YERLERİNE");
  });

  it("2. Boş veri sağlandığında çökmeksizin varsayılan metinleri ve rica ederim ifadesini çizer", () => {
    const html = renderToStaticMarkup(<MuayeneKabulKomisyonu data={{}} />);
    expect(html).toContain("Gereğini rica ederim.");
    expect(html).toContain("Harcama Yetkilisi");
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
        }}
      />
    );
    expect(html).toContain("Kırtasiye Alımı");
  });

  it("4. data.mapping.ts kurum, birim, komisyon ve kanun maddesi alanlarını eksiksiz içerir", () => {
    expect(dataMapping.kurumAdi).toBeDefined();
    expect(dataMapping.kurumUst).toBeDefined();
    expect(dataMapping.harcamaBirimi).toBeDefined();
    expect(dataMapping.mudurluk).toBeDefined();
    expect(dataMapping.birimId).toBeDefined();
    expect(dataMapping.antetEkSatir).toBeDefined();
    expect(dataMapping.muayeneKomisyonu).toBeDefined();
    expect(dataMapping.fiyatKomisyonu).toBeDefined();
    expect(dataMapping.kanunMaddesi).toBeDefined();
    expect((dataMapping.kanunMaddesi as any).sutun).toBe("ihale_sekli");
  });

  it("5. Dosyadan seçilen ihale/temin şekli (kanunMaddesi) metne otomatik ve temiz formatta yansıtılır", () => {
    // 22/a testi
    const htmlA = renderToStaticMarkup(
      <MuayeneKabulKomisyonu data={{ kanunMaddesi: "22/a" }} />
    );
    expect(htmlA).toContain("4734 Sayılı Kanunun");
    expect(htmlA).toContain("22/a");

    // 22/d* yıldızlı seçimi temizleyip 22/d olarak basma testi
    const htmlD = renderToStaticMarkup(
      <MuayeneKabulKomisyonu data={{ ihaleSekli: "22/d*" }} />
    );
    expect(htmlD).toContain("22/d");

    // 4734 Sayılı KİK Md. 22/c seçiminden madde ayıklama testi
    const htmlC = renderToStaticMarkup(
      <MuayeneKabulKomisyonu data={{ teminSekli: "4734 Sayılı KİK Md. 22/c (Mevcut Uyumluluk)" }} />
    );
    expect(htmlC).toContain("22/c");
  });

  it("6. Dağıtım listesi olduğunda DAĞITIM YERLERİNE hitabı çizilir, özel hitapMetni veya makam adı verildiğinde önceliklendirilir", () => {
    // Dağıtım listesi varsa otomatik DAĞITIM YERLERİNE
    const html1 = renderToStaticMarkup(
      <MuayeneKabulKomisyonu
        data={{
          dagitimListesi: [{ adSoyad: "Ali Veli", unvan: "Mühendis" }],
        }}
      />
    );
    expect(html1).toContain("DAĞITIM YERLERİNE");
    expect(html1).toContain("DAĞITIM:");
    expect(html1).toContain("Ali Veli");

    // Özel hitapMetni verildiğinde
    const html2 = renderToStaticMarkup(
      <MuayeneKabulKomisyonu
        data={{
          hitapMetni: "DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE",
          dagitimListesi: [{ adSoyad: "Ali Veli", unvan: "Mühendis" }],
        }}
      />
    );
    expect(html2).toContain("DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE");

    // Dağıtım listesi yokken sunulacakMakamAdi varsa o gösterilir
    const html3 = renderToStaticMarkup(
      <MuayeneKabulKomisyonu
        data={{
          sunulacakMakamAdi: "BAŞKANLIK MAKAMINA",
          dagitimListesi: [],
          gorevlendirilenler: [],
        }}
      />
    );
    expect(html3).toContain("BAŞKANLIK MAKAMINA");
    expect(html3).not.toContain("DAĞITIM:");
  });
});
