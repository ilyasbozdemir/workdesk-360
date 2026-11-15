import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { KomisyonGorevlendirmeOnayi } from "../KomisyonGorevlendirmeOnayi.template";
import { getTemplateDefinition } from "../../../registry";

describe("KomisyonGorevlendirmeOnayi — Şablon Bileşen Render Testleri", () => {
  it("1. Fiyat ve Muayene komisyonu tabloları, onay makamı ve rica ederim metni eksiksiz çizilir", () => {
    const mockData = {
      evrakSayisi: "E-10234521-934.01-0005",
      tarih: "15.11.2026",
      konu: "Komisyon Görevlendirmesi",
      kurumumuz: "Kadıköy Belediye Başkanlığı Destek Hizmetleri Müdürlüğü",
      isAdi: "Bilişim Donanımları Mal Alımı",
      sunulacakMakamAdi: "KADIKÖY BELEDİYE BAŞKANLIĞINA",
      baskanAdi: "Zeki Alasya",
      baskanUnvan: "Harcama Yetkilisi",
      fiyatKomisyonu: [
        { adSoyad: "Münir Özkul", unvan: "Mühendis", gorevi: "Başkan" },
        { adSoyad: "Adile Naşit", unvan: "Tekniker", gorevi: "Üye" },
      ],
      muayeneKomisyonu: [
        { adSoyad: "Metin Akpınar", unvan: "Şube Müdürü", gorevi: "Başkan" },
        { adSoyad: "Halit Akçatepe", unvan: "Teknisyen", gorevi: "Üye" },
      ],
    };

    const html = renderToStaticMarkup(<KomisyonGorevlendirmeOnayi data={mockData} />);

    // Başlık ve iş adı
    expect(html).toContain("Bilişim Donanımları Mal Alımı");
    expect(html).toContain("KADIKÖY BELEDİYE BAŞKANLIĞINA");

    // Tablolar
    expect(html).toContain("PİYASA ARAŞTIRMA VE SATINALMA KOMİSYONU");
    expect(html).toContain("Münir Özkul");
    expect(html).toContain("Adile Naşit");

    expect(html).toContain("MUAYENE KABUL VE TESLİM ALMA KOMİSYONU");
    expect(html).toContain("Metin Akpınar");
    expect(html).toContain("Halit Akçatepe");

    // Kapanış ve onay makamı
    expect(html).toContain("Gereğini rica ederim.");
    expect(html).toContain("Zeki Alasya");
    expect(html).toContain("Harcama Yetkilisi");
  });

  it("2. Boş veri sağlandığında çökmeksizin varsayılan metinleri çizer", () => {
    const html = renderToStaticMarkup(<KomisyonGorevlendirmeOnayi data={{}} />);
    expect(html).toContain("KURUM BAŞKANLIĞINA");
    expect(html).toContain("Gereğini rica ederim.");
    expect(html).toContain("Harcama Yetkilisi");
  });

  it("3. Template Registry üzerinden `komisyon-gorevlendirme-onayi` tanımı çözümlenir", () => {
    const def = getTemplateDefinition("komisyon-gorevlendirme-onayi");
    expect(def).toBeDefined();
    expect(def?.id).toBe("komisyon-gorevlendirme-onayi");
  });
});
