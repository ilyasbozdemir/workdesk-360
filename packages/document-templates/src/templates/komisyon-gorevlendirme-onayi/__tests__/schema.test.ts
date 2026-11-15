import { describe, expect, it } from "vitest";
import { KomisyonGorevlendirmeOnayiSchema } from "../KomisyonGorevlendirmeOnayi.schema";

describe("KomisyonGorevlendirmeOnayi — Şema Doğrulama Test Paketi", () => {
  it("1. Geçerli tam komisyon onay verisini başarıyla doğrular", () => {
    const validData = {
      evrakSayisi: "E-10234521-934.01-0005",
      tarih: "15.11.2026",
      konu: "Görevlendirme Onayı",
      isAdi: "Park ve Bahçeler Bank ve Çöp Kovası Alımı",
      sunulacakMakamAdi: "KADIKÖY BELEDİYE BAŞKANLIĞINA",
      baskanAdi: "Kemal Sunal",
      baskanUnvan: "Harcama Yetkilisi",
      onaylayanPersonelAdi: "Kemal Sunal",
      onaylayanPersonelUnvan: "Harcama Yetkilisi",
      fiyatKomisyonu: [
        { adSoyad: "Münir Özkul", unvan: "Mühendis", gorevi: "Başkan" },
        { adSoyad: "Adile Naşit", unvan: "Tekniker", gorevi: "Üye" },
      ],
      muayeneKomisyonu: [
        { adSoyad: "Şener Şen", unvan: "Teknik Personel", gorevi: "Başkan" },
        { adSoyad: "İlyas Salman", unvan: "Memur", gorevi: "Üye" },
      ],
    };

    const parsed = KomisyonGorevlendirmeOnayiSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isAdi).toBe("Park ve Bahçeler Bank ve Çöp Kovası Alımı");
      expect(parsed.data.fiyatKomisyonu).toHaveLength(2);
      expect(parsed.data.muayeneKomisyonu).toHaveLength(2);
      expect(parsed.data.baskanAdi).toBe("Kemal Sunal");
    }
  });

  it("2. Boş nesne varsayılan opsiyonel alanlarla geçerlidir", () => {
    const emptyResult = KomisyonGorevlendirmeOnayiSchema.safeParse({});
    expect(emptyResult.success).toBe(true);
  });

  it("3. Komisyon üyeleri şeması görev ve pozisyon alanlarını isteğe bağlı kabul eder", () => {
    const dataWithMembers = {
      fiyatKomisyonu: [{ adSoyad: "Tarık Akan", unvan: "Mimar" }],
    };
    const res = KomisyonGorevlendirmeOnayiSchema.safeParse(dataWithMembers);
    expect(res.success).toBe(true);
  });
});
