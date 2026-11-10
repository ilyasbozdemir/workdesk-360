import { describe, expect, it } from "vitest";
import {
  DanismanlikIhtiyacTalepFormuSchema,
  HizmetAlimiIhtiyacTalepFormuSchema,
  IhtiyacTalepFormuSchema,
  MalAlimiIhtiyacTalepFormuSchema,
  YapimIsleriIhtiyacTalepFormuSchema,
} from "../index";

describe("İhtiyaç Talep Formu — Zod Şema Doğrulama Testleri", () => {
  it("Mal Alımı şeması geçerli veriyle doğrulanır", () => {
    const validMal = {
      alimTuru: "mal",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          tasinirKodu: "150.01.01",
          malzemeAdi: "Kağıt",
          miktar: 10,
        },
      ],
    };
    expect(MalAlimiIhtiyacTalepFormuSchema.safeParse(validMal).success).toBe(true);
    expect(IhtiyacTalepFormuSchema.safeParse(validMal).success).toBe(true);
  });

  it("Hizmet Alımı şeması geçerli veriyle doğrulanır", () => {
    const validHizmet = {
      alimTuru: "hizmet",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          hizmetKodu: "HZM-10",
          kalemAdi: "Güvenlik",
          miktar: 12,
        },
      ],
    };
    expect(HizmetAlimiIhtiyacTalepFormuSchema.safeParse(validHizmet).success).toBe(true);
    expect(IhtiyacTalepFormuSchema.safeParse(validHizmet).success).toBe(true);
  });

  it("Yapım İşleri şeması geçerli veriyle doğrulanır", () => {
    const validYapim = {
      alimTuru: "yapim",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          pozNo: "Y.15.001",
          kalemAdi: "Beton",
          miktar: 50,
        },
      ],
    };
    expect(YapimIsleriIhtiyacTalepFormuSchema.safeParse(validYapim).success).toBe(true);
    expect(IhtiyacTalepFormuSchema.safeParse(validYapim).success).toBe(true);
  });

  it("Danışmanlık şeması geçerli veriyle doğrulanır", () => {
    const validDanismanlik = {
      alimTuru: "danismanlik",
      ihtiyacKalemleri: [
        {
          siraNo: 1,
          kodu: "DNS-01",
          danismanlikKonusu: "Müşavirlik",
          miktar: 1,
        },
      ],
    };
    expect(DanismanlikIhtiyacTalepFormuSchema.safeParse(validDanismanlik).success).toBe(true);
    expect(IhtiyacTalepFormuSchema.safeParse(validDanismanlik).success).toBe(true);
  });
});
