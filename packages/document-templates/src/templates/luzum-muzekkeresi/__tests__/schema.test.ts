import { describe, expect, it } from "vitest";
import {
  LuzumMuzekkeresiSchema,
  MalAlimiLuzumMuzekkeresiSchema,
  HizmetAlimiLuzumMuzekkeresiSchema,
  DanismanlikLuzumMuzekkeresiSchema,
  YapimIsleriLuzumMuzekkeresiSchema,
} from "../index";

describe("Lüzum Müzekkeresi — Şema (Schema) Validasyon Testleri", () => {
  it("temel lüzum müzekkeresi verisini başarıyla doğrular", () => {
    const data = {
      evrakSayisi: "E-999-01",
      sunulacakMakamAdi: "Makam",
      ihtiyacYeri: "Birim",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          malzemeAdi: "Malzeme",
          birimi: "Adet",
          miktar: 10,
        },
      ],
    };
    const res = LuzumMuzekkeresiSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it("4 alım türünün alt şemaları doğru doğrulanır", () => {
    expect(MalAlimiLuzumMuzekkeresiSchema.safeParse({ siraNo: 1, malzemeAdi: "A" }).success).toBe(true);
    expect(HizmetAlimiLuzumMuzekkeresiSchema.safeParse({ siraNo: 1, kalemAdi: "H" }).success).toBe(true);
    expect(DanismanlikLuzumMuzekkeresiSchema.safeParse({ siraNo: 1, danismanlikKonusu: "D" }).success).toBe(true);
    expect(YapimIsleriLuzumMuzekkeresiSchema.safeParse({ siraNo: 1, imalatAdi: "Y", pozNo: "P1" }).success).toBe(true);
  });
});
