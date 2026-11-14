import { describe, expect, it } from "vitest";
import {
  LuzumMuzekkeresiOnayEkiSchema,
  MalAlimiLuzumMuzekkeresiOnayEkiSchema,
  HizmetAlimiLuzumMuzekkeresiOnayEkiSchema,
  DanismanlikLuzumMuzekkeresiOnayEkiSchema,
  YapimIsleriLuzumMuzekkeresiOnayEkiSchema,
} from "../index";

describe("LuzumMuzekkeresiOnayEki — Zod Şema Doğrulaması", () => {
  const validData = {
    ekNo: "1",
    dosyaKonusu: "Kırtasiye Alımı",
    kurumMetni: "Belediyemiz",
    talepEdenPersonelAdi: "Mehmet Demir",
    talepEdenPersonelUnvan: "Mühendis",
    ihtiyacKalemleri: [
      {
        siraNo: 1,
        kodu: "150.01.01",
        malzemeAdi: "A4 Kağıt",
        ozelligi: "80 gr 1. Hamur",
        birimi: "Paket",
        kdvOrani: 20,
        miktar: 50,
      },
    ],
    dosyaTarihi: "14.11.2026",
    alimTuru: "mal" as const,
  };

  it("1. Temel onay eki şeması geçerli veriyi hatasız doğrular", () => {
    const parsed = LuzumMuzekkeresiOnayEkiSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("2. Alt alım türü şemaları uyumlu parse üretir", () => {
    expect(MalAlimiLuzumMuzekkeresiOnayEkiSchema.safeParse(validData).success).toBe(true);
    expect(HizmetAlimiLuzumMuzekkeresiOnayEkiSchema.safeParse({ ...validData, alimTuru: "hizmet" }).success).toBe(true);
    expect(DanismanlikLuzumMuzekkeresiOnayEkiSchema.safeParse({ ...validData, alimTuru: "danismanlik" }).success).toBe(true);
    expect(YapimIsleriLuzumMuzekkeresiOnayEkiSchema.safeParse({ ...validData, alimTuru: "yapim" }).success).toBe(true);
  });
});
