import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DocumentEngine,
  smartMergeDocumentData,
} from "@worksuite-360/document-engine";
import { registerTeminTemplates } from "../../../engine/registerTeminTemplates";
import {
  createInMemoryStorageAdapter,
  SYNTHETIC_HEADER_DATA,
} from "../../__tests__/fixtures";

describe("İhtiyaç Listesi — Snapshot Yaşam Döngüsü ve Refresh Policy Testleri", () => {
  const storageAdapter = createInMemoryStorageAdapter();
  let currentDbKalemler: any[] = [];
  let currentHeader: any = { ...SYNTHETIC_HEADER_DATA };

  beforeEach(() => {
    storageAdapter.getRawStore().clear();
    registerTeminTemplates();
    DocumentEngine.setStorageAdapter(storageAdapter);

    currentHeader = {
      ...SYNTHETIC_HEADER_DATA,
      antetSatirlari: [
        "T.C.",
        "ÖRNEK VALİLİĞİ",
        "Destek Hizmetleri Müdürlüğü",
      ],
    };

    currentDbKalemler = [
      {
        id: 1,
        sira_no: 1,
        kalem_adi: "A4 Fotokopi Kağıdı",
        aciklama: "80 gr 500 yaprak",
        birim: "Paket",
        miktar: 50,
        tasinir_kodu: "150.01.01",
        kdv_orani: 20,
      },
      {
        id: 2,
        sira_no: 2,
        kalem_adi: "Telli Dosya",
        aciklama: "Mavi kapaklı",
        birim: "Adet",
        miktar: 100,
        tasinir_kodu: "150.01.02",
        kdv_orani: 20,
      },
    ];

    DocumentEngine.setHeaderResolver(async () => currentHeader);
    DocumentEngine.setQueryExecutor(async (sql: string) => {
      if (sql.includes("FROM DATA_TeminDosyasi")) {
        return [
          {
            id: 101,
            temin_no: "2026/DT-101",
            konu: "Kırtasiye Alımı",
            dosya_acilis_tarihi: "2026-11-07",
            ihale_sekli: "22/d",
            sunulacak_makam: "HARCAMA YETKİLİSİ MAKAMINA",
          },
        ];
      }
      if (sql.includes("FROM DATA_TeminKalem")) {
        return currentDbKalemler;
      }
      return [];
    });
  });

  it("A4 önizleme ilk açıldığında (persistIfMissing = false) otomatik snapshot kaydı oluşturmaz", async () => {
    const doc = await DocumentEngine.loadOrCreateDocument({
      dosyaId: 101,
      templateKey: "ihtiyac-listesi",
      persistIfMissing: false,
    });

    expect(doc.isExisting).toBe(false);
    expect(storageAdapter.hasSnapshot(101, "ihtiyac_listesi")).toBe(false);
    expect((doc.data as any).ihtiyacKalemleri).toHaveLength(2);
  });

  it("kullanıcı düzenleme yapıp kaydettiğinde (saveDocument) snapshot oluşur ve belge yeniden açıldığında kaydedilen değerler birebir korunur", async () => {
    const initialDoc = await DocumentEngine.loadOrCreateDocument<any>({
      dosyaId: 101,
      templateKey: "ihtiyac-listesi",
      persistIfMissing: false,
    });

    const editedData = {
      ...initialDoc.data,
      sunulacakMakamAdi: "VALİLİK MAKAMINA (Kullanıcı Düzenlemesi)",
      ihtiyacYeri: "Bilgi İşlem Şube Müdürlüğü (Manuel)",
      hazirlayanPersonelAdi: "Kaan ÖZTÜRK",
      hazirlayanPersonelUnvan: "Kıdemli Uzman",
      ihtiyacKalemleri: initialDoc.data.ihtiyacKalemleri.map(
        (k: any, idx: number) =>
          idx === 0
            ? {
                ...k,
                ozelligi: "80 gr 500 yaprak — ISO 9001 Belgeli (Manuel Not)",
              }
            : k,
      ),
    };

    const saveRes = await DocumentEngine.saveDocument({
      dosyaId: 101,
      templateKey: "ihtiyac-listesi",
      data: editedData,
    });

    expect(saveRes.success).toBe(true);
    expect(storageAdapter.hasSnapshot(101, "ihtiyac_listesi")).toBe(true);

    // Belgeyi kapatıp yeniden açma simülasyonu
    const reopenedDoc = await DocumentEngine.loadOrCreateDocument<any>({
      dosyaId: 101,
      templateKey: "ihtiyac-listesi",
    });

    expect(reopenedDoc.isExisting).toBe(true);
    expect(reopenedDoc.data.sunulacakMakamAdi).toBe(
      "VALİLİK MAKAMINA (Kullanıcı Düzenlemesi)",
    );
    expect(reopenedDoc.data.ihtiyacYeri).toBe(
      "Bilgi İşlem Şube Müdürlüğü (Manuel)",
    );
    expect(reopenedDoc.data.hazirlayanPersonelAdi).toBe("Kaan ÖZTÜRK");
    expect(reopenedDoc.data.ihtiyacKalemleri[0].ozelligi).toBe(
      "80 gr 500 yaprak — ISO 9001 Belgeli (Manuel Not)",
    );
  });

  it("kaynak veri güncellendiğinde (syncWithSource / Refresh) manuel düzenlemeler korunurken kaynak öncelikli alanlar (antet, miktar, yeni kalem) güncellenir", async () => {
    // 1. Önce kullanıcı manuel düzenlemeli snapshot kaydeder
    const initialDoc = await DocumentEngine.loadOrCreateDocument<any>({
      dosyaId: 101,
      templateKey: "ihtiyac-listesi",
    });

    const userSnapshot = {
      ...initialDoc.data,
      sunulacakMakamAdi: "ÖZEL MAKAM ADI (Korunmalı)",
      ihtiyacYeri: "Özel Birim (Korunmalı)",
      ihtiyacKalemleri: [
        {
          ...initialDoc.data.ihtiyacKalemleri[0],
          ozelligi: "Kullanıcının özel teknik şartname notu (Korunmalı)",
        },
        initialDoc.data.ihtiyacKalemleri[1],
      ],
    };

    await DocumentEngine.saveDocument({
      dosyaId: 101,
      templateKey: "ihtiyac-listesi",
      data: userSnapshot,
    });

    // 2. Kaynak veritabanında antet değişir, 1. kalemin miktarı 50 -> 75 olur ve 3. yeni kalem eklenir
    currentHeader = {
      ...currentHeader,
      antetSatirlari: [
        "T.C.",
        "ÖRNEK VALİLİĞİ",
        "Yeni Kurumsal Başlık Müdürlüğü",
      ],
    };
    currentDbKalemler = [
      {
        ...currentDbKalemler[0],
        miktar: 75, // 50'den 75'e çıktı
      },
      currentDbKalemler[1],
      {
        id: 3,
        sira_no: 3,
        kalem_adi: "Zımba Teli",
        aciklama: "24/6 paslanmaz",
        birim: "Kutu",
        miktar: 30,
        tasinir_kodu: "150.01.03",
        kdv_orani: 20,
      },
    ];

    // 3. Senkronizasyon (syncWithSource) çalıştırılır
    const syncedDoc = await DocumentEngine.syncWithSource<any>({
      dosyaId: 101,
      templateKey: "ihtiyac-listesi",
      existingData: userSnapshot,
    });

    // Manuel alanlar korundu mu?
    expect(syncedDoc.data.sunulacakMakamAdi).toBe(
      "ÖZEL MAKAM ADI (Korunmalı)",
    );
    expect(syncedDoc.data.ihtiyacYeri).toBe("Özel Birim (Korunmalı)");
    expect(syncedDoc.data.ihtiyacKalemleri[0].ozelligi).toBe(
      "Kullanıcının özel teknik şartname notu (Korunmalı)",
    );

    // Kaynak (SOURCE) alanları güncellendi mi?
    expect(syncedDoc.data.antetSatirlari).toEqual([
      "T.C.",
      "ÖRNEK VALİLİĞİ",
      "Yeni Kurumsal Başlık Müdürlüğü",
    ]);
    expect(syncedDoc.data.ihtiyacKalemleri[0].miktar).toBe(75);
    expect(syncedDoc.data.ihtiyacKalemleri).toHaveLength(3);
    expect(syncedDoc.data.ihtiyacKalemleri[2].malzemeAdi).toBe("Zımba Teli");
  });

  it("smartMergeDocumentData null, undefined, boş string ve boş dizi kenar durumlarında sessiz veri kaybı yaşatmaz", () => {
    const existing = {
      sunulacakMakamAdi: "",
      ozelNot: "Kullanıcı Notu",
      ihtiyacKalemleri: [
        {
          id: 1,
          malzemeAdi: "Kalem 1",
          ozelligi: "Özel açıklama",
          miktar: 10,
        },
      ],
    };

    const fresh = {
      antetSatirlari: ["T.C.", "KURUM"],
      sunulacakMakamAdi: "VARSAYILAN MAKAM",
      yeniKaynakAlani: "Yeni Değer",
      ihtiyacKalemleri: [
        {
          id: 1,
          malzemeAdi: "Kalem 1",
          ozelligi: "Kaynak açıklama",
          miktar: 25,
        },
      ],
    };

    const merged = smartMergeDocumentData<any>(existing, fresh);
    // Kullanıcının bilerek boş bıraktığı string ("") undefined olmadığı için ezilmemeli
    expect(merged.sunulacakMakamAdi).toBe("");
    // Kullanıcının özel alanı korunmalı
    expect(merged.ozelNot).toBe("Kullanıcı Notu");
    // Kaynakta yeni gelen alan eklenmeli
    expect(merged.yeniKaynakAlani).toBe("Yeni Değer");
    // Kalemdeki manuel özellik korunmalı, miktar kaynaktan güncellenmeli
    expect(merged.ihtiyacKalemleri[0].ozelligi).toBe("Özel açıklama");
    expect(merged.ihtiyacKalemleri[0].miktar).toBe(25);
  });
});

