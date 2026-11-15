import { describe, expect, it } from "vitest";
import { HarcamaTalimatiSchema } from "../HarcamaTalimati.schema";

describe("HarcamaTalimati — Şema Doğrulama", () => {
  it("1. Geçerli tam veriyi başarıyla doğrular", () => {
    const validData = {
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
      gerceklestirmeGorevlileri: "Ahmet Yılmaz (Mühendis)",
      mutemetAdi: "Mehmet Demir",
      mutemetUnvan: "Mali Hizmetler Uzmanı",
      muhasebeYetkilisiAdi: "Mehmet Demir",
      isTutari: 83000,
      sunumTarihi: "15.11.2026",
      hazirlayanPersonelAdi: "Ahmet Yılmaz",
      hazirlayanPersonelUnvan: "Mühendis",
      olurTarihi: "15.11.2026",
      onaylayanPersonelAdi: "Mustafa Kaya",
      onaylayanPersonelUnvan: "Fen İşleri Müdürü",
    };

    const parsed = HarcamaTalimatiSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isAdi).toBe("Çim Biçme Makinesi Alımı");
      expect(parsed.data.mutemetAdi).toBe("Mehmet Demir");
      expect(parsed.data.gerceklestirmeGorevlisiAdi).toBe("Ahmet Yılmaz");
    }
  });

  it("2. Boş nesne varsayılan opsiyonel alanlarla başarıyla doğrulanır", () => {
    const emptyResult = HarcamaTalimatiSchema.safeParse({});
    expect(emptyResult.success).toBe(true);
  });

  it("3. Sayısal veya metin olarak girilen tutarları kabul eder", () => {
    const numData = {
      yaklasikMaliyet: 12500.5,
      odenekTutari: 15000,
      isTutari: 12000,
    };
    expect(HarcamaTalimatiSchema.safeParse(numData).success).toBe(true);

    const strData = {
      yaklasikMaliyet: "12.500,50 TL",
      odenekTutari: "15.000 TL",
      isTutari: "12.000 TL",
    };
    expect(HarcamaTalimatiSchema.safeParse(strData).success).toBe(true);
  });
});
