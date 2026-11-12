import { describe, expect, it, vi } from "vitest";
import { resolveTemplateData } from "../mappingResolver";
import type { ProcessMapping } from "../types";

describe("resolveTemplateData — Query Cache, Pre-fetch, Logo & Payload Resolution Test Paketi", () => {
  // 1. Static value resolution
  it("1. Static value (rule.deger): veritabanı sorgusu yapmadan doğrudan statik değeri atar", async () => {
    const mapping: ProcessMapping = {
      baslik: { deger: "Örnek Statik Belge Başlığı" },
    };
    const mockQuery = vi.fn().mockResolvedValue([]);

    const result = await resolveTemplateData(mapping, 1, mockQuery);
    expect(result.baslik).toBe("Örnek Statik Belge Başlığı");
  });

  // 2. Formula value resolution
  it("2. Formula value (rule.formul): formül şablonundaki değişkenleri çözer", async () => {
    const mapping: ProcessMapping = {
      birlestirilmis: { formul: "{{TANIM_Kurum.kurum_adi}} - {{TANIM_Kurum.ilce}}" },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("kurum_adi")) {
        return Promise.resolve([{ kurum_adi: "Köyceğiz Belediyesi" }]);
      }
      if (sql.includes("ilce")) {
        return Promise.resolve([{ ilce: "Köyceğiz" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);
    expect(result.birlestirilmis).toBe("Köyceğiz Belediyesi - Köyceğiz");
  });

  // 3. Single column resolution
  it("3. Tekil kolon çözümü: DATA_TeminDosyasi tablosundan tekil alanı okur", async () => {
    const mapping: ProcessMapping = {
      isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", iliskili_id: "id" },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminDosyasi")) {
        return Promise.resolve([{ konu: "Büro Malzemesi Alımı" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 10, mockQuery);
    expect(result.isinAdi).toBe("Büro Malzemesi Alımı");
  });

  // 4. Query Cache Hits (Deduplication)
  it("4. Query Cache: Aynı SQL ve parametreli sorgu tekrarlandığında cache'ten döner ve DB'ye tekrar gitmez", async () => {
    const mapping: ProcessMapping = {
      alan1: { tablo: "DATA_TeminDosyasi", sutun: "konu", iliskili_id: "id" },
      alan2: { tablo: "DATA_TeminDosyasi", sutun: "konu", iliskili_id: "id" },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("SELECT konu AS res_val FROM DATA_TeminDosyasi")) {
        return Promise.resolve([{ res_val: "Hizmet Alımı" }]);
      }
      return Promise.resolve([]);
    });

    await resolveTemplateData(mapping, 5, mockQuery);

    const targetCalls = mockQuery.mock.calls.filter((c) =>
      c[0].includes("SELECT konu AS res_val FROM DATA_TeminDosyasi"),
    );
    // İki farklı alan aynı sorguyu istediğinde cache sayesinde DB'ye sadece 1 kez gidilir
    expect(targetCalls.length).toBe(1);
  });

  // 5. Failed query cache eviction
  it("5. Cache Eviction: Başarısız olan (rejected) sorgu cache'te tutulmaz, sonraki çağrıda tekrar denenir ve başarılı olur", async () => {
    let callCount = 0;
    const flakyQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("ozel_durum")) {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Geçici Ağ Hatası"));
        }
        return Promise.resolve([{ res_val: "Başarılı" }]);
      }
      return Promise.resolve([]);
    });

    const mapping: ProcessMapping = {
      test: { tablo: "DATA_TeminDosyasi", sutun: "ozel_durum", iliskili_id: "id" },
    };

    // İlk çağrıda sorgu başarısız olur ve varsayılan boş string atanır
    const firstResult = await resolveTemplateData(mapping, 1, flakyQuery);
    expect(firstResult.test).toBe("");

    // İkinci çağrıda önbellek başarısız promise'i saklamadığı (tahliye ettiği) için
    // sorgu veritabanına yeniden gönderilir ve 'Başarılı' döner
    const secondResult = await resolveTemplateData(mapping, 1, flakyQuery);
    expect(secondResult.test).toBe("Başarılı");
    expect(callCount).toBe(2);
  });

  // 6. Unified Logo Query
  it("6. Birleşik Logo Sorgusu: solLogo ve sagLogo tek bir TANIM_Kurum sorgusuyla (logo_sol, logo_sag) çekilir", async () => {
    const mapping: ProcessMapping = {};
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("SELECT logo_sol, logo_sag FROM TANIM_Kurum")) {
        return Promise.resolve([
          { logo_sol: "data:image/png;base64,SOL", logo_sag: "data:image/png;base64,SAG" },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.solLogo).toBe("data:image/png;base64,SOL");
    expect(result.sagLogo).toBe("data:image/png;base64,SAG");

    const kurumCalls = mockQuery.mock.calls.filter((c) =>
      c[0].includes("TANIM_Kurum LIMIT 1") && c[0].includes("logo"),
    );
    expect(kurumCalls.length).toBe(1);
  });

  // 7. Logo fallback to settings table
  it("7. Logo Fallback: TANIM_Kurum'da logo yoksa ayarlar tablosundan tek sorgu ile çekilir", async () => {
    const mapping: ProcessMapping = {};
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("TANIM_Kurum")) {
        return Promise.resolve([{ logo_sol: null, logo_sag: "" }]);
      }
      if (sql.includes("FROM settings")) {
        return Promise.resolve([
          { key: "logoLeft", value: "data:image/svg+xml;base64,AYAR_SOL" },
          { key: "logoRight", value: "data:image/svg+xml;base64,AYAR_SAG" },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.solLogo).toBe("data:image/svg+xml;base64,AYAR_SOL");
    expect(result.sagLogo).toBe("data:image/svg+xml;base64,AYAR_SAG");
  });

  // 8. Date formatting: YYYY-MM-DD -> DD.AA.YYYY
  it("8. Tarih Biçimlendirme: ISO tarih formatını (YYYY-MM-DD) Türkçe formata (GG.AA.YYYY) dönüştürür", async () => {
    const mapping: ProcessMapping = {
      belgeTarihi: { deger: "2026-11-12" },
      sozlesmeTarihi: { deger: "2026-05-01" },
    };
    const mockQuery = vi.fn().mockResolvedValue([]);

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.belgeTarihi).toBe("12.11.2026");
    expect(result.sozlesmeTarihi).toBe("01.05.2026");
  });

  // 9. Date formatting: Dizi ve nesneleri bozmaz
  it("9. Tarih Güvenliği: Dizi veya nesne şeklindeki alanları string gibi biçimlendirmeye çalışıp bozmaz", async () => {
    const mapping: ProcessMapping = {
      ihtiyacKalemleri: { deger: [{ id: 1, tarih: "2026-01-01" }] },
      metaBilgi: { deger: { onayTarihi: "2026-02-02" } },
    };
    const mockQuery = vi.fn().mockResolvedValue([]);

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(Array.isArray(result.ihtiyacKalemleri)).toBe(true);
    expect(result.ihtiyacKalemleri[0].id).toBe(1);
    expect(typeof result.metaBilgi).toBe("object");
  });

  // 10. Date fallback to file date
  it("10. Tarih Fallback: Boş kalan tarih değişkenleri dosyanın açılış tarihini alır", async () => {
    const mapping: ProcessMapping = {
      onayTarihi: { deger: "" },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminDosyasi")) {
        return Promise.resolve([{ dosya_acilis_tarihi: "2026-03-15" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.onayTarihi).toBe("15.03.2026");
  });

  // 11. Wasteful DATA_TeminKalem pre-fetch removal
  it("11. Verimsiz Ön Yüklemenin Kaldırılması: DATA_TeminKalem tablosu ön yüklemede boş yere çekilmez", async () => {
    const mapping: ProcessMapping = {};
    const mockQuery = vi.fn().mockResolvedValue([]);

    await resolveTemplateData(mapping, 1, mockQuery);

    const kalemPreFetch = mockQuery.mock.calls.filter((c) =>
      c[0] === "SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ?",
    );
    expect(kalemPreFetch.length).toBe(0);
  });

  // 12. Pre-fetch of DATA_TeminDosyasi and TANIM_Kurum
  it("12. Gerekli Ön Yüklemeler: DATA_TeminDosyasi ve TANIM_Kurum tabloları paralel ön yüklenir", async () => {
    const mapping: ProcessMapping = {};
    const mockQuery = vi.fn().mockResolvedValue([]);

    await resolveTemplateData(mapping, 1, mockQuery);

    const calls = mockQuery.mock.calls.map((c) => c[0]);
    expect(calls.some((sql) => sql.includes("SELECT * FROM DATA_TeminDosyasi WHERE id = ?"))).toBe(true);
    expect(calls.some((sql) => sql.includes("SELECT * FROM TANIM_Kurum LIMIT 1"))).toBe(true);
  });

  // 13. Automatic evrakSayisi resolution
  it("13. Evrak Sayısı: Otomatik E-DETSİS evrakSayisi ve evrakNo formatını üretir", async () => {
    const mapping: ProcessMapping = {};
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("TANIM_Kurum")) {
        return Promise.resolve([{ kurum_kodu: "12345678" }]);
      }
      if (sql.includes("DATA_TeminDosyasi")) {
        return Promise.resolve([{ sdp_kodu: "934.01", temin_no: "2026/50" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.evrakSayisi).toBeDefined();
    expect(result.evrakNo).toBe(result.evrakSayisi);
  });

  // 14. Old-format evrakSayisi replacement
  it("14. Eski Biçim Düzeltme: Bölü çizgili (/) eski evrak numaraları resmi standarda yükseltilir", async () => {
    const mapping: ProcessMapping = {
      evrakSayisi: { deger: "2026/99" }, // Eski usul numara
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("TANIM_Kurum")) {
        return Promise.resolve([{ kurum_kodu: "99999999" }]);
      }
      if (sql.includes("DATA_TeminDosyasi")) {
        return Promise.resolve([{ sdp_kodu: "934.01", temin_no: "2026/99" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.evrakSayisi).not.toContain("/");
    expect(result.evrakSayisi).toMatch(/^\d+-\d+\.\d+-\d+$/);
  });

  // 15. Automatic antetSatirlari resolution
  it("15. Antet Satırları: Şablonda antetSatirlari istendiğinde kurumsal hiyerarşiyi üretir", async () => {
    const mapping: ProcessMapping = {
      antetSatirlari: {},
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("TANIM_Kurum")) {
        return Promise.resolve([{ kurum_anteti: "T.C.\nÖRNEK VALİLİĞİ\nİl Sağlık Müdürlüğü" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.antetSatirlari).toBeDefined();
    expect(Array.isArray(result.antetSatirlari)).toBe(true);
    expect(result.antetSatirlari).toContain("T.C.");
  });

  // 16. Commission members resolution integration
  it("16. Komisyon Üyeleri Entegrasyonu: komisyonUyeleri değişkenini çözer", async () => {
    const mapping: ProcessMapping = {
      komisyonUyeleri: {},
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKomisyon")) {
        return Promise.resolve([
          { gorev: "Baskan", ad_soyad: "Ahmet Yılmaz", unvan: "Şube Müdürü" },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.komisyonUyeleri).toBeDefined();
    expect(Array.isArray(result.komisyonUyeleri)).toBe(true);
  });

  // 17. Graceful handling of empty DB responses
  it("17. Boş Veritabanı: Hiçbir kayıt bulunmadığında çökmez, güvenli varsayılanlar üretir", async () => {
    const mapping: ProcessMapping = {
      aciklama: { tablo: "DATA_TeminDosyasi", sutun: "notlar", iliskili_id: "id" },
    };
    const mockQuery = vi.fn().mockResolvedValue([]);

    const result = await resolveTemplateData(mapping, 999, mockQuery);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  // 18. Table array resolution integration (ihtiyacKalemleri)
  it("18. Tablo Dizisi Entegrasyonu: ihtiyacKalemleri alt eşleştirmeleriyle birlikte çözülür", async () => {
    const mapping: ProcessMapping = {
      ihtiyacKalemleri: {
        tablo: "DATA_TeminKalem",
        sutun: "*",
        iliskili_id: "temin_dosya_id",
        altEslestirme: { malzemeAdi: "kalem_adi" },
      },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Toner" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.ihtiyacKalemleri).toHaveLength(1);
    expect(result.ihtiyacKalemleri[0].malzemeAdi).toBe("Toner");
    expect(result.kalemler).toBe(result.ihtiyacKalemleri);
  });

  // 19. Graceful error handling in date resolution
  it("19. Hata Dayanıklılığı: Tarih sorgusu hata verdiğinde tüm akış durmaz", async () => {
    const mapping: ProcessMapping = {
      tarih: { deger: "" },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("dosya_acilis_tarihi")) {
        return Promise.reject(new Error("Tablo kilitli"));
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.tarih).toBeDefined();
    expect(typeof result.tarih).toBe("string");
  });

  // 20. Graceful error handling in logo resolution
  it("20. Hata Dayanıklılığı: Logo sorgusu hata verdiğinde sessizce loglanır ve devam eder", async () => {
    const mapping: ProcessMapping = {};
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("logo")) {
        return Promise.reject(new Error("Logo kolonu bulunamadı"));
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result).toBeDefined();
    expect(result.solLogo).toBeUndefined();
  });

  // 21. Single column fallback value
  it("21. Tekil Kolon Varsayılanı: Veritabanındaki değer null ise kuraldaki varsayilan değer kullanılır", async () => {
    const mapping: ProcessMapping = {
      teslimSuresi: {
        tablo: "DATA_TeminDosyasi",
        sutun: "teslim_suresi",
        iliskili_id: "id",
        varsayilan: "15 Gün",
      },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminDosyasi")) {
        return Promise.resolve([{ teslim_suresi: null }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(mapping, 1, mockQuery);
    expect(result.teslimSuresi).toBe("15 Gün");
  });

  // 22. Case insensitivity for date field detection
  it("22. Tarih Büyük/Küçük Harf: 'Tarihi', 'TARIH', 'belge_tarihi' alanları doğru algılanır", async () => {
    const mapping: ProcessMapping = {
      ONAY_TARIHI: { deger: "2026-04-23" },
      belgeTarihi: { deger: "2026-10-29" },
    };
    const mockQuery = vi.fn().mockResolvedValue([]);

    const result = await resolveTemplateData(mapping, 1, mockQuery);

    expect(result.ONAY_TARIHI).toBe("23.04.2026");
    expect(result.belgeTarihi).toBe("29.10.2026");
  });

  // 23. Active dosyaId = 0 safety
  it("23. Dosya ID = 0 Güvenliği: activeDosyaId 0 verildiğinde ön yükleme sorguları atlanır", async () => {
    const mapping: ProcessMapping = {
      sabit: { deger: "Test" },
    };
    const mockQuery = vi.fn().mockResolvedValue([]);

    const result = await resolveTemplateData(mapping, 0, mockQuery);

    expect(result.sabit).toBe("Test");
    const preFetches = mockQuery.mock.calls.filter((c) =>
      c[0].includes("SELECT * FROM DATA_TeminDosyasi"),
    );
    expect(preFetches.length).toBe(0);
  });

  // 24. Custom templateId forwarded to sub-resolvers
  it("24. Şablon Kimliği Aktarımı: templateId parametresi alt çözümleyicilere eksiksiz iletilir", async () => {
    const mapping: ProcessMapping = {
      kalemler: {
        tablo: "DATA_TeminKalem",
        sutun: "*",
        iliskili_id: "temin_dosya_id",
        altEslestirme: { malzemeAdi: "kalem_adi" },
      },
    };
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Defter" }]);
      }
      return Promise.resolve([]);
    });

    const result = await resolveTemplateData(
      mapping,
      1,
      mockQuery,
      "piyasa_fiyat_arastirma_tutanagi",
    );

    expect(result.kalemler).toBeDefined();
    expect(result.kalemler).toHaveLength(1);
  });
});
