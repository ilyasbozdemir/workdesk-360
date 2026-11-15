import { describe, expect, it } from "vitest";
import { HarcamaPusulasiSchema } from "../HarcamaPusulasi.schema";

describe("HarcamaPusulasi — Şema Doğrulama", () => {
  it("1. Geçerli tam veriyi başarıyla doğrular", () => {
    const validData = {
      evrakSayisi: "E-10234521-934.01-0002",
      tarih: "15.11.2026",
      idareAdi: "Kadıköy Belediyesi",
      alimTuru: "hizmet",
      isAdi: "Bilirkişi Danışmanlık ve Raporlama Hizmeti",
      miktar: "1 Adet",
      birimFiyat: 15000,
      tutar: 15000,
      tutarYazi: "On Beş Bin Türk Lirası",
      aciklama: "Uzman bilirkişi hizmeti alımına ilişkindir.",
      saticiTcNo: "12345678901",
      saticiAdiSoyadi: "Ahmet Demir",
      saticiAdres: "Caferağa Mah. Moda Cad. No:12 Kadıköy / İstanbul",
      onaylayanPersonelAdi: "Mustafa Kaya",
      onaylayanPersonelUnvan: "Fen İşleri Müdürü",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          malzemeAdi: "Bilirkişi Hizmeti",
          miktar: 1,
          birimFiyat: 15000,
          tutar: 15000,
        },
      ],
    };

    const parsed = HarcamaPusulasiSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.saticiTcNo).toBe("12345678901");
      expect(parsed.data.saticiAdiSoyadi).toBe("Ahmet Demir");
      expect(parsed.data.tutar).toBe(15000);
    }
  });

  it("2. Boş nesne varsayılan opsiyonel alanlarla başarıyla doğrulanır", () => {
    const emptyResult = HarcamaPusulasiSchema.safeParse({});
    expect(emptyResult.success).toBe(true);
  });

  it("3. Sayısal veya metin olarak girilen tutar ve birim fiyatları kabul eder", () => {
    const numData = {
      birimFiyat: 4500.5,
      tutar: 4500.5,
    };
    expect(HarcamaPusulasiSchema.safeParse(numData).success).toBe(true);

    const strData = {
      birimFiyat: "4.500,50 ₺",
      tutar: "4.500,50 ₺",
    };
    expect(HarcamaPusulasiSchema.safeParse(strData).success).toBe(true);
  });
});
