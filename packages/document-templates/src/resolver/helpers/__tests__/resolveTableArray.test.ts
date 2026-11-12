import { describe, expect, it, vi } from "vitest";
import {
  assertSafeIdentifier,
  formatTR,
  resolveTableArray,
} from "../resolveTableArray";
import type { TableColumnMapping } from "../../types";

describe("resolveTableArray — SQL Güvenliği, Veri Bütünlüğü & Test Paketi", () => {
  const baseRule: TableColumnMapping = {
    tablo: "DATA_TeminKalem",
    iliskili_id: "temin_dosya_id",
    sutun: "*",
    altEslestirme: {
      malzemeAdi: "kalem_adi",
      tasinirKodu: "tasinir_kodu",
      miktar: "miktar",
      birimi: "birim",
      aciklama: "aciklama",
    },
  };

  // 1. Normal kalem listeleme
  it("1. Normal kalem listeleme: temel kalem verilerini ve standart alanları eksiksiz çözer", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([
          {
            id: 1,
            temin_dosya_id: 10,
            sira_no: 1,
            kalem_adi: "A4 Kağıt",
            tasinir_kodu: "150.01.01",
            miktar: 10,
            birim: "Paket",
            aciklama: "80 gr beyaz kağıt",
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "ihtiyacKalemleri",
      "ihtiyac_listesi",
    );

    expect(payload.ihtiyacKalemleri).toHaveLength(1);
    const item = payload.ihtiyacKalemleri[0];
    expect(item.id).toBe(1);
    expect(item.siraNo).toBe(1);
    expect(item.malzemeAdi).toBe("A4 Kağıt");
    expect(item.kalemAdi).toBe("A4 Kağıt");
    expect(item.miktar).toBe(10);
    expect(item.birimi).toBe("Paket");
    expect(item.aciklama).toBe("80 gr beyaz kağıt");
  });

  // 2. Aynı kalem adına sahip birden fazla TANIM_Kalem kaydı
  it("2. Aynı kalem adına sahip birden fazla TANIM_Kalem kaydı olduğunda deterministik tek tanım seçilir", async () => {
    let capturedSql = "";
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      capturedSql = sql;
      return Promise.resolve([
        {
          id: 1,
          temin_dosya_id: 10,
          kalem_adi: "Fotokopi Kağıdı",
          aciklama: "Tanım 1 Özelliği", // Correlated subquery simulates picking first id deterministically
          ozelligi: "Tanım 1 Özelliği",
        },
      ]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "ihtiyacKalemleri",
      "ihtiyac_listesi",
    );

    expect(capturedSql).toContain("ORDER BY tanim.id ASC LIMIT 1");
    expect(payload.ihtiyacKalemleri[0].ozelligi).toBe("Tanım 1 Özelliği");
  });

  // 3. Aynı taşınır koduna sahip birden fazla tanım
  it("3. Aynı taşınır koduna sahip birden fazla tanım olduğunda taşınır kodu önceliklidir ve deterministiktir", async () => {
    let capturedSql = "";
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      capturedSql = sql;
      return Promise.resolve([
        {
          id: 2,
          temin_dosya_id: 10,
          kalem_adi: "Genel Kağıt",
          tasinir_kodu: "150.01.01",
          aciklama: "Öncelikli Taşınır Özelliği",
          ozelligi: "Öncelikli Taşınır Özelliği",
        },
      ]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "ihtiyacKalemleri",
      "ihtiyac_listesi",
    );

    expect(capturedSql).toContain("tanim.tasinir_kodu = tk.tasinir_kodu");
    expect(capturedSql).toContain("ORDER BY tanim.id ASC LIMIT 1");
    expect(payload.ihtiyacKalemleri[0].tasinirKodu).toBe("150.01.01");
  });

  // 4. JOIN nedeniyle mükerrer kalem oluşması (Kartezyen patlama engelleme)
  it("4. Correlated subquery sayesinde kalem sayısı asla çoğalmaz ve mükerrer oluşmaz", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([
          { id: 1, kalem_adi: "Kalem 1" },
          { id: 2, kalem_adi: "Kalem 2" },
        ]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "ihtiyacKalemleri",
      "ihtiyac_listesi",
    );

    expect(payload.ihtiyacKalemleri).toHaveLength(2);
    expect(payload.ihtiyacKalemleri.map((i: any) => i.id)).toEqual([1, 2]);
  });

  // 5. Firma bulunmaması
  it("5. Teklifli şablonda firma bulunmadığında kontrollü varsayılanlar üretilir", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([
          { id: 1, kalem_adi: "Test Malzemesi", miktar: 5 },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    expect(payload.kalemler).toHaveLength(1);
    expect(payload.firmalar).toBeUndefined();
    expect(payload.kalemler[0].enUygunFirmaAdi).toBe("-");
    expect(payload.kalemler[0].enDusukFiyat).toBe("-");
    expect(payload.kalemler[0].toplamBedel).toBe("-");
  });

  // 6. Teklif bulunmaması
  it("6. Firmalar var ancak teklif bulunmadığında teklif alanları tire (-) döner", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([
          { id: 1, kalem_adi: "Test Malzemesi", miktar: 5 },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([{ temin_firma_id: 101, unvan: "A Ltd." }]);
      }
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    expect(payload.kalemler[0].firmaTeklifleriDetay).toEqual([
      { birimFiyat: "-", tutar: "-" },
    ]);
    expect(payload.kalemler[0].enUygunFirmaAdi).toBe("-");
    expect(payload.firmaToplamlariDetay).toEqual([{ toplam: "-" }]);
  });

  // 7. Birden fazla firmanın teklif vermesi
  it("7. Birden fazla firmanın teklif vermesi durumunda tüm teklifler ve firma toplamları eksiksiz hesaplanır", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([
          { temin_kalem_id: 1, temin_firma_id: 101, birim_fiyat: 20 },
          { temin_kalem_id: 1, temin_firma_id: 102, birim_fiyat: 25 },
          { temin_kalem_id: 2, temin_firma_id: 101, birim_fiyat: 50 },
          { temin_kalem_id: 2, temin_firma_id: 102, birim_fiyat: 40 },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([
          { temin_firma_id: 101, unvan: "Firma X" },
          { temin_firma_id: 102, unvan: "Firma Y" },
        ]);
      }
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([
          { id: 1, kalem_adi: "Malzeme A", miktar: 10 },
          { id: 2, kalem_adi: "Malzeme B", miktar: 5 },
        ]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    // Firma X: 10*20 + 5*50 = 200 + 250 = 450
    // Firma Y: 10*25 + 5*40 = 250 + 200 = 450
    expect(payload.firmaToplamlariDetay[0].toplam).toBe("450,00");
    expect(payload.firmaToplamlariDetay[1].toplam).toBe("450,00");
  });

  // 8. En düşük teklifin doğru belirlenmesi
  it("8. En düşük teklif ve toplam bedel doğru ve hatasız belirlenir", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([
          { temin_kalem_id: 1, temin_firma_id: 101, birim_fiyat: 30000 },
          { temin_kalem_id: 1, temin_firma_id: 102, birim_fiyat: 25000 },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([
          { temin_firma_id: 101, unvan: "Pahalı Bilişim" },
          { temin_firma_id: 102, unvan: "Uygun Bilişim" },
        ]);
      }
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([
          { id: 1, kalem_adi: "Dizüstü Bilgisayar", miktar: 2 },
        ]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    const item = payload.kalemler[0];
    expect(item.enUygunFirmaAdi).toBe("Uygun Bilişim");
    expect(item.enDusukFiyat).toBe("25.000,00");
    expect(item.toplamBedel).toBe("50.000,00");
  });

  // 9. Aynı fiyat veren firmalarda deterministik seçim
  it("9. Aynı teklifi veren firmalarda deterministik olarak ilk kayıtlı firma seçilir", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([
          { temin_kalem_id: 1, temin_firma_id: 1, birim_fiyat: 5000 },
          { temin_kalem_id: 1, temin_firma_id: 2, birim_fiyat: 5000 },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([
          { temin_firma_id: 1, unvan: "A Firması" },
          { temin_firma_id: 2, unvan: "B Firması" },
        ]);
      }
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Lazer Yazıcı", miktar: 1 }]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    expect(payload.kalemler[0].enUygunFirmaAdi).toBe("A Firması");
    expect(payload.kalemler[0].enDusukFiyat).toBe("5.000,00");
  });

  // 10. Mükerrer teklif kayıtları
  it("10. Aynı kalem ve firma için mükerrer teklif kaydı varsa en düşük geçerli teklif deterministik seçilir", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([
          { id: 1, temin_kalem_id: 1, temin_firma_id: 10, birim_fiyat: 2000 },
          { id: 2, temin_kalem_id: 1, temin_firma_id: 10, birim_fiyat: 1500 }, // Revize indirimli teklif
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([{ temin_firma_id: 10, unvan: "Mobilya Ltd." }]);
      }
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Masa", miktar: 1 }]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    expect(payload.kalemler[0].enDusukFiyat).toBe("1.500,00");
  });

  // 11. NULL ve geçersiz fiyat
  it("11. NULL, boşluk veya geçersiz (NaN) fiyatlar teklif olarak işlenmez", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([
          { temin_kalem_id: 1, temin_firma_id: 10, birim_fiyat: null },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([{ temin_firma_id: 10, unvan: "Teknoloji A.Ş." }]);
      }
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Klavye", miktar: 1 }]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    expect(payload.kalemler[0].firmaTeklifleriDetay[0].birimFiyat).toBe("-");
    expect(payload.kalemler[0].enDusukFiyat).toBe("-");
  });

  // 12. Negatif fiyat
  it("12. Negatif fiyatlar kesinlikle teklif olarak kabul edilmez ve yoksayılır", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([
          { temin_kalem_id: 1, temin_firma_id: 10, birim_fiyat: -500 },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([{ temin_firma_id: 10, unvan: "Ekran Ltd." }]);
      }
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Monitör", miktar: 1 }]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    expect(payload.kalemler[0].firmaTeklifleriDetay[0].birimFiyat).toBe("-");
    expect(payload.kalemler[0].enDusukFiyat).toBe("-");
  });

  // 13. Ondalıklı miktar ve fiyat
  it("13. Ondalıklı miktar ve birim fiyat hesaplamalarında kuruş hassasiyeti korunur", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalemTeklif")) {
        return Promise.resolve([
          { temin_kalem_id: 1, temin_firma_id: 10, birim_fiyat: 33.33 },
        ]);
      }
      if (sql.includes("DATA_TeminFirma")) {
        return Promise.resolve([{ temin_firma_id: 10, unvan: "Elektrik A.Ş." }]);
      }
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Kablo", miktar: 12.5 }]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "kalemler",
      "piyasa_fiyat_arastirma_tutanagi",
    );

    // 12.5 * 33.33 = 416.625 -> 416.63
    expect(payload.kalemler[0].enDusukFiyat).toBe("33,33");
    expect(payload.kalemler[0].toplamBedel).toBe("416,63");
    expect(payload.firmaToplamlariDetay[0].toplam).toBe("416,63");
  });

  // 14. SQL identifier injection denemeleri
  it("14. SQL identifier injection denemeleri engellenir ve kontrollü hata fırlatılır", async () => {
    const maliciousRule: TableColumnMapping = {
      tablo: "DATA_TeminKalem; DROP TABLE users;--",
      iliskili_id: "temin_dosya_id",
      sutun: "*",
    };

    const mockQuery = vi.fn();
    const payload: Record<string, any> = {};

    await expect(
      resolveTableArray(maliciousRule, 10, mockQuery, payload, "kalemler"),
    ).rejects.toThrow("Güvenlik Hatası: Geçersiz veya güvensiz tablo adı");
  });

  // 15. Bilinmeyen tablo/kolon
  it("15. Allowlist dışındaki bilinmeyen tablo veya kolon durumunda kontrollü hata fırlatılır", async () => {
    const unknownRule: TableColumnMapping = {
      tablo: "BILINMEYEN_GIZLI_TABLO",
      iliskili_id: "temin_dosya_id",
      sutun: "*",
    };

    const mockQuery = vi.fn();
    const payload: Record<string, any> = {};

    await expect(
      resolveTableArray(unknownRule, 10, mockQuery, payload, "kalemler"),
    ).rejects.toThrow("İzin verilmeyen veya bilinmeyen tablo");
  });

  // 16. Query executor hatası
  it("16. Beklenmeyen bir veritabanı yürütme hatası olduğunda hata fırlatılır, sessizce gizlenmez", async () => {
    const mockQuery = vi.fn().mockRejectedValue(
      new Error("Veritabanı bağlantısı koptu (Disk I/O Error)"),
    );
    const payload: Record<string, any> = {};

    await expect(
      resolveTableArray(
        baseRule,
        10,
        mockQuery,
        payload,
        "ihtiyacKalemleri",
        "ihtiyac_listesi",
      ),
    ).rejects.toThrow("Disk I/O Error");
  });

  // 17. Boş sonuç
  it("17. Dosyada hiçbir kalem olmadığında boş dizi döner", async () => {
    const mockQuery = vi.fn().mockResolvedValue([]);
    const payload: Record<string, any> = {};

    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "ihtiyacKalemleri",
      "ihtiyac_listesi",
    );

    expect(payload.ihtiyacKalemleri).toEqual([]);
    expect(payload.kalemler).toEqual([]);
    expect(payload.items).toEqual([]);
  });

  // 18. ihtiyacKalemleri alias kontrolü (kalemler ve items)
  it("18. ihtiyacKalemleri çözümlendiğinde geriye dönük uyumluluk için kalemler ve items alias'ları üretilir", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Dosya Klasörü" }]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "ihtiyacKalemleri",
      "ihtiyac_listesi",
    );

    expect(payload.ihtiyacKalemleri).toBeDefined();
    expect(payload.kalemler).toBe(payload.ihtiyacKalemleri);
    expect(payload.items).toBe(payload.ihtiyacKalemleri);
  });

  // 19. Luzum/ihtiyaç şablonlarında firma sorgularının çalıştırılmaması
  it("19. Lüzum ve ihtiyaç listesi şablonlarında firma ve teklif sorguları gereksiz yere çalıştırılmaz", async () => {
    const mockQuery = vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("DATA_TeminKalem")) {
        return Promise.resolve([{ id: 1, kalem_adi: "Defter" }]);
      }
      return Promise.resolve([]);
    });

    const payload: Record<string, any> = {};
    await resolveTableArray(
      baseRule,
      10,
      mockQuery,
      payload,
      "ihtiyacKalemleri",
      "luzum_muzekkeresi",
    );

    const calledQueries = mockQuery.mock.calls.map((c) => c[0]);
    expect(calledQueries.some((q: string) => q.includes("DATA_TeminFirma"))).toBe(false);
    expect(calledQueries.some((q: string) => q.includes("DATA_TeminKalemTeklif"))).toBe(false);
  });

  // 20. Teklif detayları formatı (Türkçe para formatı)
  it("20. Para ve teklif tutarları standart Türkçe formata (binlik nokta, kuruş virgül) dönüştürülür", () => {
    expect(formatTR(1250000.5)).toBe("1.250.000,50");
    expect(formatTR(0)).toBe("0,00");
    expect(formatTR(14.99)).toBe("14,99");
  });
});
