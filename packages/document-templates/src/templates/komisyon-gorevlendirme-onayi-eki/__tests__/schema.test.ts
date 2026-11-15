import { describe, expect, it } from "vitest";
import { KomisyonGorevlendirmeOnayiEkiSchema } from "../KomisyonGorevlendirmeOnayiEki.schema";

describe("KomisyonGorevlendirmeOnayiEki — Şema Doğrulama Test Paketi", () => {
  it("1. Geçerli onay eki verisini başarıyla doğrular", () => {
    const validData = {
      ekNo: "1",
      alimTuru: "mal alımı",
      kurumumuz: "Kadıköy Belediyesi",
      fiyatKomisyonu: [
        { adSoyad: "Ali Veli", unvan: "Mühendis", gorevi: "Başkan" },
      ],
      muayeneKomisyonu: [
        { adSoyad: "Ayşe Yılmaz", unvan: "Tekniker", gorevi: "Üye" },
      ],
    };

    const parsed = KomisyonGorevlendirmeOnayiEkiSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.ekNo).toBe("1");
      expect(parsed.data.alimTuru).toBe("mal alımı");
      expect(parsed.data.fiyatKomisyonu).toHaveLength(1);
    }
  });

  it("2. Boş nesne varsayılan opsiyonel alanlarla geçerlidir", () => {
    const emptyResult = KomisyonGorevlendirmeOnayiEkiSchema.safeParse({});
    expect(emptyResult.success).toBe(true);
  });
});
