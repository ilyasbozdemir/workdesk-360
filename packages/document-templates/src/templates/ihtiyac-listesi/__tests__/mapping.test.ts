import { describe, expect, it, vi } from "vitest";
import { IhtiyacListesiResolver } from "../../../engine/resolvers/IhtiyacListesiResolver";
import {
  formatTurkishNumber,
  normalizeIhtiyacKalemleri,
  resolveIhtiyacListesiLimits,
} from "../IhtiyacListesi.hook";
import { resolveTemplateData } from "../../../resolver/mappingResolver";
import { SYNTHETIC_HEADER_DATA } from "../../__tests__/fixtures";

describe("İhtiyaç Listesi — Mapping ve Veri Hazırlama Testleri", () => {
  it("IhtiyacListesiResolver SQLite DATA_TeminDosyasi, DATA_TeminKalem ve TANIM_Personel kayıtlarını doğru belge alanlarına bağlar", async () => {
    const resolver = new IhtiyacListesiResolver();
    const executedQueries: string[] = [];

    const mockQueryExecutor = vi.fn(async (sql: string, _params: any[]) => {
      executedQueries.push(sql);
      if (sql.includes("FROM DATA_TeminDosyasi")) {
        return [
          {
            id: 42,
            temin_no: "2026/DT-042",
            konu: "Bilgisayar Sarf Malzemesi Alımı",
            isin_aciklamasi: "Bilgisayar Sarf Malzemesi Alımı",
            dosya_acilis_tarihi: "2026-10-15",
            ihale_sekli: "22/d",
            sunulacak_makam: "DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE",
            hazirlayan_personel_id: 10,
            talep_eden_personel_id: 20,
            onay_personel_id: 30,
          },
        ];
      }
      if (sql.includes("FROM DATA_TeminKalem")) {
        return [
          {
            id: 501,
            sira_no: 1,
            kalem_adi: "Lazer Toner",
            aciklama: "Siyah 3000 sayfa kapasiteli",
            birim: "Adet",
            miktar: 12,
            tasinir_kodu: "150.03.01",
            kdv_orani: 20,
          },
        ];
      }
      if (sql.includes("FROM TANIM_Personel WHERE id IN")) {
        return [
          {
            id: 10,
            ad_soyad: "Deniz KAYA",
            unvan: "Bilgisayar İşletmeni",
            telefon: "0312 111 22 33",
            eposta: "deniz@ornek.gov.tr",
          },
          {
            id: 20,
            ad_soyad: "Efe DEMİR",
            unvan: "Şef",
            telefon: "0312 111 22 34",
            eposta: "efe@ornek.gov.tr",
          },
          {
            id: 30,
            ad_soyad: "Selin YILMAZ",
            unvan: "Müdür",
            telefon: "0312 111 22 35",
            eposta: "selin@ornek.gov.tr",
          },
        ];
      }
      return [];
    });

    const result = await resolver.resolve({
      dosyaId: 42,
      templateKey: "ihtiyac-listesi",
      headerData: {
        ...SYNTHETIC_HEADER_DATA,
        hazirlayanPersonelAdi: "",
        talepEdenPersonelAdi: "",
        onaylayanPersonelAdi: "",
        harcamaYetkilisiAdi: "",
      },
      queryExecutor: mockQueryExecutor,
    });

    expect(result.konu).toBe("Bilgisayar Sarf Malzemesi Alımı");
    expect(result.maddeNo).toBe("22/d");
    expect(["2026-10-15", "15.10.2026"]).toContain(result.tarih);
    expect(result.sunulacakMakamAdi).toBe("DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE");
    expect(result.hazirlayanPersonelAdi).toBe("Deniz KAYA");
    expect(result.hazirlayanPersonelUnvan).toBe("Bilgisayar İşletmeni");
    expect(result.talepEdenPersonelAdi).toBe("Efe DEMİR");
    expect(result.onaylayanPersonelAdi).toBe("Selin YILMAZ");
    expect(result.onaylayanPersonelUnvan).toBe("Müdür");

    expect(result.ihtiyacKalemleri).toHaveLength(1);
    expect(result.ihtiyacKalemleri?.[0]).toMatchObject({
      id: 501,
      siraNo: 1,
      kodu: "150.03.01",
      malzemeAdi: "Lazer Toner",
      ozelligi: "Siyah 3000 sayfa kapasiteli",
      birimi: "Adet",
      kdvOrani: 20,
      miktar: 12,
    });

    // İhtiyaç Listesi resolver'ı gereksiz firma veya komisyon sorgusu yapmamalıdır
    expect(
      executedQueries.some((q) => q.includes("DATA_PiyasaArastirmaFirma")),
    ).toBe(false);
    expect(
      executedQueries.some((q) => q.includes("DATA_KomisyonUyeleri")),
    ).toBe(false);
  });

  it("personel ID atanmamışsa aktif ilk personele güvenli fallback yapar", async () => {
    const resolver = new IhtiyacListesiResolver();
    const mockQueryExecutor = vi.fn(async (sql: string) => {
      if (sql.includes("FROM DATA_TeminDosyasi")) {
        return [{ id: 99, konu: "Fallback Testi" }];
      }
      if (sql.includes("FROM TANIM_Personel WHERE COALESCE(aktif_mi, 1) = 1")) {
        return [
          {
            ad_soyad: "Yedek Görevli",
            unvan: "VHKİ",
            telefon: "0312 999 00 00",
            eposta: "yedek@ornek.gov.tr",
          },
        ];
      }
      return [];
    });

    const result = await resolver.resolve({
      dosyaId: 99,
      templateKey: "ihtiyac-listesi",
      headerData: {
        antetSatirlari: ["T.C."],
        kurumUst: "T.C.",
        kurumAdi: "Kurum",
        mudurluk: "Birim",
        solLogo: null,
        sagLogo: null,
      },
      queryExecutor: mockQueryExecutor,
    });

    expect(result.hazirlayanPersonelAdi).toBe("Yedek Görevli");
    expect(result.hazirlayanPersonelUnvan).toBe("VHKİ");
    expect(result.talepEdenPersonelAdi).toBe("Yedek Görevli");
    expect(result.ihtiyacKalemleri).toEqual([]);
  });

  it("normalizeIhtiyacKalemleri farklı kaynak dizilerini (ihtiyacKalemleri, kalemler, malzemeler, items) ve eksik/null değerleri standartlaştırır", () => {
    const fromKalemler = normalizeIhtiyacKalemleri({
      kalemler: [
        {
          kalem_adi: "Клаvye",
          aciklama: "Türkçe Q",
          olcuBirimi: "Adet",
          tasinir_kodu: null,
          kdvOrani: "%10",
          miktar: "1250,5",
        },
      ],
    });

    expect(fromKalemler).toHaveLength(1);
    expect(fromKalemler[0].siraNo).toBe(1);
    expect(fromKalemler[0].kodu).toBe("-");
    expect(fromKalemler[0].malzemeAdi).toBe("Клаvye");
    expect(fromKalemler[0].ozelligi).toBe("Türkçe Q");
    expect(fromKalemler[0].birimi).toBe("Adet");
    expect(fromKalemler[0].kdvOrani).toBe("10");
    expect(fromKalemler[0].miktarRaw).toBe(1250.5);
    expect(fromKalemler[0].miktar).toBe("1.250,5");

    // Boş veri veya null dizilerde boş dizi dönmeli, sessizce hata fırlatmamalı
    expect(normalizeIhtiyacKalemleri({})).toEqual([]);
    expect(
      normalizeIhtiyacKalemleri({
        ihtiyacKalemleri: null,
        kalemler: undefined,
      }),
    ).toEqual([]);
  });

  it("formatTurkishNumber null, undefined, boş string ve sayısal değerleri doğru biçimlendirir", () => {
    expect(formatTurkishNumber(null)).toBe("0");
    expect(formatTurkishNumber(undefined)).toBe("0");
    expect(formatTurkishNumber("")).toBe("0");
    expect(formatTurkishNumber(1000)).toBe("1.000");
    expect(formatTurkishNumber(1250.5)).toBe("1.250,5");
    expect(formatTurkishNumber("1.250,50")).toBe("1.250,50");
  });

  it("resolveIhtiyacListesiLimits dikey ve yatay yönlendirmeye göre sayfa limitlerini doğru çözer", () => {
    const portraitLimits = resolveIhtiyacListesiLimits("portrait");
    const landscapeLimits = resolveIhtiyacListesiLimits("landscape");
    const customLimits = resolveIhtiyacListesiLimits("portrait", 5, 10, 6);

    expect(portraitLimits.firstPage).toBeGreaterThan(0);
    expect(landscapeLimits.firstPage).toBeGreaterThan(0);
    expect(customLimits).toEqual({
      firstPage: 5,
      middle: 10,
      lastPage: 6,
    });
  });

  it("resolveTemplateData ProcessMapping kurallarını (sabit değer, tablo sütunu, tarih formatı ve evrakSayisi) doğru çözer", async () => {
    const mockExecutor = vi.fn(async (sql: string) => {
      if (sql.includes("AS res_val") && sql.includes("konu")) {
        return [{ res_val: "Kırtasiye Alımı" }];
      }
      if (sql.includes("AS res_val") && sql.includes("dosya_acilis_tarihi")) {
        return [{ res_val: "2026-11-07" }];
      }
      if (sql.includes("DATA_TeminDosyasi")) {
        return [
          {
            id: 101,
            temin_no: "2026/DT-101",
            konu: "Kırtasiye Alımı",
            dosya_acilis_tarihi: "2026-11-07",
          },
        ];
      }
      if (sql.includes("TANIM_Kurum")) {
        return [
          {
            kurum_adi: "ÖRNEK VALİLİĞİ",
            mudurluk: "Destek Hizmetleri Müdürlüğü",
            detsis_no: "10000000",
            sdp_kodu: "934.01",
          },
        ];
      }
      return [];
    });

    const resolved = await resolveTemplateData(
      {
        sunulacakMakamAdi: {
          deger: "BAŞKANLIK MAKAMINA (Manuel Düzenleme)",
        },
        konu: {
          tablo: "DATA_TeminDosyasi",
          sutun: "konu",
        },
        tarih: {
          tablo: "DATA_TeminDosyasi",
          sutun: "dosya_acilis_tarihi",
        },
      },
      101,
      mockExecutor,
      "ihtiyac-listesi",
    );

    expect(resolved.sunulacakMakamAdi).toBe(
      "BAŞKANLIK MAKAMINA (Manuel Düzenleme)",
    );
    expect(resolved.konu).toBe("Kırtasiye Alımı");
    expect(resolved.tarih).toBe("07.11.2026");
  });
});
