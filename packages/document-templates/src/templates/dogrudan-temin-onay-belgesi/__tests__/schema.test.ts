import { describe, expect, it } from "vitest";
import { DogrudanTeminOnayBelgesiSchema } from "../DogrudanTeminOnayBelgesi.schema";

describe("DogrudanTeminOnayBelgesi — Schema Validation Testleri", () => {
  it("1. Boş veri nesnesi şemadan başarıyla geçer (tüm alanlar opsiyoneldir)", () => {
    const parsed = DogrudanTeminOnayBelgesiSchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it("2. Eksiksiz veri sağlandığında doğru tiplerle doğrulanır", () => {
    const validData = {
      teminNo: "2026/105",
      idareAdi: "Kadıköy Belediyesi",
      makam: "Destek Hizmetleri Müdürlüğü Harcama Yetkilisi Makamına",
      dosyaTarihi: "15.11.2026",
      evrakSayisi: "E-10234521-934.01-0012",
      isAdi: "Bilgisayar Donanımı Alımı",
      teminSekli: "4734 Sayılı K.İ.K. Madde 22/d",
      alimTuru: "Mal Alımı",
      yaklasikMaliyet: 85000,
      odenekTutari: 100000,
      projeNo: "2026-01",
      butceTertibi: ["46.34.02.05 - 03.2.1.01", "46.34.02.05 - 03.7.1.90"],
      avansSartlari: "Avans verilmeyecektir.",
      fiyatFarkiSartlari: "Fiyat Farkı Ödenmeyecektir.",
      dokumanHazirlik: "Sadece teknik şartname hazırlanacaktır.",
      isinAciklamasi: "İhtiyaç doğrultusunda doğrudan temin usulüyle temin edilecektir.",
      hazirlayanPersonelAdi: "Kemal Sunal",
      hazirlayanPersonelUnvan: "Satınalma Şefi",
      onaylayanPersonelAdi: "Halit Akçatepe",
      onaylayanPersonelUnvan: "Destek Hizmetleri Müdürü",
      ekler: ["1 Adet Yaklaşık Maliyet Hesap Cetveli", "1 Adet Teknik Şartname"],
    };

    const parsed = DogrudanTeminOnayBelgesiSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isAdi).toBe("Bilgisayar Donanımı Alımı");
      expect(parsed.data.yaklasikMaliyet).toBe(85000);
      expect(parsed.data.butceTertibi).toHaveLength(2);
      expect(parsed.data.ekler).toHaveLength(2);
    }
  });

  it("3. Yaklaşık maliyet ve ödenek tutarı hem string hem number olarak kabul edilir", () => {
    const stringNumbers = {
      yaklasikMaliyet: "85.000,00 ₺",
      odenekTutari: "100.000,00 ₺",
    };
    const parsed = DogrudanTeminOnayBelgesiSchema.safeParse(stringNumbers);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.yaklasikMaliyet).toBe("85.000,00 ₺");
      expect(parsed.data.odenekTutari).toBe("100.000,00 ₺");
    }
  });
});
