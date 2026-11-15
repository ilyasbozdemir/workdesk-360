import { describe, expect, it } from "vitest";
import { PiyasaFiyatArastirmaGorevlendirmesiSchema } from "../PiyasaFiyatArastirmaGorevlendirmesi.schema";

describe("PiyasaFiyatArastirmaGorevlendirmesi — Şema Doğrulama", () => {
  it("1. Geçerli tam veriyi başarıyla doğrular", () => {
    const validData = {
      evrakSayisi: "E-10234521-934.01-0001",
      dosyaTarihi: "15.11.2026",
      tarih: "15.11.2026",
      kurumAdi: "Kadıköy Belediyesi",
      kurumumuz: "Kadıköy Belediye Başkanlığı Destek Hizmetleri Müdürlüğü",
      isinAdi: "Bilgisayar ve Donanım Malzemesi Alımı",
      dosyaKonusu: "Piyasa Fiyat Araştırma Görevlendirmesi",
      hazirlayanPersonelAdi: "Ahmet Yılmaz",
      hazirlayanPersonelUnvan: "Mühendis",
      onaylayanPersonelAdi: "Mustafa Kaya",
      onaylayanPersonelUnvan: "Harcama Yetkilisi",
      gorevlendirilenler: [
        { adSoyad: "Ali Veli", unvan: "Tekniker" },
        { adSoyad: "Ayşe Demir", unvan: "V.H.K.İ." },
      ],
      dagitimListesi: [
        { adSoyad: "Ali Veli", unvan: "Tekniker" },
        { adSoyad: "Ayşe Demir", unvan: "V.H.K.İ." },
      ],
      kurumIci: true,
    };

    const parsed = PiyasaFiyatArastirmaGorevlendirmesiSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isinAdi).toBe("Bilgisayar ve Donanım Malzemesi Alımı");
      expect(parsed.data.gorevlendirilenler).toHaveLength(2);
      expect(parsed.data.hazirlayanPersonelAdi).toBe("Ahmet Yılmaz");
      expect(parsed.data.onaylayanPersonelAdi).toBe("Mustafa Kaya");
    }
  });

  it("2. Boş nesne varsayılan opsiyonel alanlarla geçerlidir", () => {
    const emptyResult = PiyasaFiyatArastirmaGorevlendirmesiSchema.safeParse({});
    expect(emptyResult.success).toBe(true);
  });

  it("3. Dağıtım listesinde hem string hem nesne formatını destekler", () => {
    const mixedData = {
      dagitimListesi: [
        "Ali Veli",
        { adSoyad: "Ayşe Demir", unvan: "Memur" },
      ],
    };
    const res = PiyasaFiyatArastirmaGorevlendirmesiSchema.safeParse(mixedData);
    expect(res.success).toBe(true);
  });
});
