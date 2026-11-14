import { describe, expect, it } from "vitest";
import {
  LuzumMuzekkeresiTeslimTesellumSchema,
  MalAlimiLuzumMuzekkeresiTeslimTesellumSchema,
  HizmetAlimiLuzumMuzekkeresiTeslimTesellumSchema,
  DanismanlikLuzumMuzekkeresiTeslimTesellumSchema,
  YapimIsleriLuzumMuzekkeresiTeslimTesellumSchema,
} from "../index";

describe("LuzumMuzekkeresiTeslimTesellum — Zod Şema Doğrulaması", () => {
  const validData = {
    isinAdi: "Doğrudan Temin",
    kurumumuz: "Belediyemiz",
    ihtiyacKalemleri: [
      {
        siraNo: 1,
        kodu: "150.01.01",
        malzemeAdi: "Klasör",
        ozelligi: "Geniş Mavi",
        birimi: "Adet",
        kdvOrani: 20,
        miktar: 10,
      },
    ],
    teslimEdenler: [{ adSoyad: "Ali Veli", unvan: "Yetkili" }],
    teslimAlanlar: [{ adSoyad: "Ahmet Can", unvan: "Memur" }],
  };

  it("1. Temel şema geçerli veriyi hatasız parse eder", () => {
    const parsed = LuzumMuzekkeresiTeslimTesellumSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("2. Alt alım türü şemaları uyumlu parse üretir", () => {
    expect(MalAlimiLuzumMuzekkeresiTeslimTesellumSchema.safeParse(validData).success).toBe(true);
    expect(HizmetAlimiLuzumMuzekkeresiTeslimTesellumSchema.safeParse(validData).success).toBe(true);
    expect(DanismanlikLuzumMuzekkeresiTeslimTesellumSchema.safeParse(validData).success).toBe(true);
    expect(YapimIsleriLuzumMuzekkeresiTeslimTesellumSchema.safeParse(validData).success).toBe(true);
  });
});
