import { describe, expect, it } from "vitest";
import { DocumentValidationService } from "../../../services/documentValidationService";
import { IhtiyacKalemiSchema, IhtiyacListesiSchema } from "../index";
import { createSyntheticDocumentData } from "../../__tests__/fixtures";

describe("İhtiyaç Listesi — Zod Şema ve Veri Doğrulama Testleri (schema.test.ts)", () => {
  it("1. Tam ve geçerli belge verisini başarıyla doğrular", () => {
    const data = createSyntheticDocumentData();
    const parsed = IhtiyacListesiSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    const report = DocumentValidationService.validate("ihtiyac-listesi", data);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it("2. Kalem şemasında string/number tip dönüşümlerini ve nullable alanları destekler", () => {
    const parsed = IhtiyacKalemiSchema.safeParse({
      siraNo: 1,
      kodu: null,
      malzemeAdi: "Laser Yazıcı Toneri",
      ozelligi: undefined,
      birimi: "Adet",
      kdvOrani: "20",
      miktar: "12",
    });

    expect(parsed.success).toBe(true);
  });

  it("3. Zorunlu kalem alanları (siraNo, miktar) eksik olduğunda doğrulama hatası döndürür", () => {
    const missingRequired = IhtiyacKalemiSchema.safeParse({
      malzemeAdi: "Eksik Kalem",
    });

    expect(missingRequired.success).toBe(false);
    if (!missingRequired.success) {
      const errorPaths = missingRequired.error.issues.map((i) =>
        i.path.join(".")
      );
      expect(errorPaths).toContain("siraNo");
      expect(errorPaths).toContain("miktar");
    }
  });

  it("4. Opsiyonel üst veri alanları boş/undefined olduğunda şemadan hatasız geçer ve ek alanları (catchall) korur", () => {
    const minimal = IhtiyacListesiSchema.safeParse({
      ihtiyacKalemleri: [],
      customEkAlan: "korunmali",
    });

    expect(minimal.success).toBe(true);
    if (minimal.success) {
      expect(minimal.data.ihtiyacKalemleri).toEqual([]);
      expect(minimal.data.customEkAlan).toBe("korunmali");
    }
  });
});
