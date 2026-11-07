import type {
  DocumentStorageAdapter,
  InstitutionalHeaderData,
} from "@worksuite-360/document-engine";

/**
 * Sentetik Kurumsal Üst Veri (Hiçbir gerçek kişi/kurum verisi içermez)
 */
export const SYNTHETIC_HEADER_DATA: InstitutionalHeaderData = {
  antetSatirlari: [
    "T.C.",
    "ÖRNEK VALİLİĞİ",
    "Destek Hizmetleri Müdürlüğü",
  ],
  kurumAdi: "Örnek Valiliği",
  mudurluk: "Destek Hizmetleri Müdürlüğü",
  evrakSayisi: "E-10000000-934.01-2026/101",
  dosyaNo: "2026/DT-101",
  konu: "Kırtasiye ve Büro Malzemesi Alımı",
  sunulacakMakam: "HARCAMA YETKİLİSİ MAKAMINA",
  hazirlayanPersonelAdi: "Deniz KAYA",
  hazirlayanPersonelUnvan: "Bilgisayar İşletmeni",
  hazirlayanTelefon: "0312 000 00 01",
  hazirlayanEposta: "deniz.kaya@ornek.gov.tr",
  talepEdenPersonelAdi: "Efe DEMİR",
  talepEdenPersonelUnvan: "Şef",
  onaylayanPersonelAdi: "Selin YILMAZ",
  onaylayanPersonelUnvan: "Destek Hizmetleri Müdürü",
  harcamaYetkilisiAdi: "Selin YILMAZ",
  harcamaYetkilisiUnvan: "Destek Hizmetleri Müdürü",
  gerceklestirmeGorevlisiAdi: "Bora ARSLAN",
  gerceklestirmeGorevlisiUnvan: "Memur",
};

/**
 * Sentetik Personel Listesi
 */
export const SYNTHETIC_PERSONEL_LIST = [
  {
    id: 10,
    ad_soyad: "Deniz KAYA",
    adSoyad: "Deniz KAYA",
    unvan: "Bilgisayar İşletmeni",
    telefon: "0312 000 00 01",
    eposta: "deniz.kaya@ornek.gov.tr",
  },
  {
    id: 20,
    ad_soyad: "Efe DEMİR",
    adSoyad: "Efe DEMİR",
    unvan: "Şef",
    telefon: "0312 000 00 02",
    eposta: "efe.demir@ornek.gov.tr",
  },
  {
    id: 30,
    ad_soyad: "Selin YILMAZ",
    adSoyad: "Selin YILMAZ",
    unvan: "Destek Hizmetleri Müdürü",
    telefon: "0312 000 00 03",
    eposta: "selin.yilmaz@ornek.gov.tr",
  },
  {
    id: 40,
    ad_soyad: "Bora ARSLAN",
    adSoyad: "Bora ARSLAN",
    unvan: "Memur",
    telefon: "0312 000 00 04",
    eposta: "bora.arslan@ornek.gov.tr",
  },
];

/**
 * Sentetik İhtiyaç Kalemleri
 */
export const SYNTHETIC_KALEMLER = [
  {
    id: 1,
    siraNo: 1,
    kodu: "150.01.01",
    tasinirKodu: "150.01.01",
    malzemeAdi: "A4 Fotokopi Kağıdı",
    kalemAdi: "A4 Fotokopi Kağıdı",
    ozelligi: "80 gr/m² 500 yaprak",
    aciklama: "80 gr/m² 500 yaprak",
    birimi: "Paket",
    birim: "Paket",
    kdvOrani: 20,
    miktar: 50,
    birimFiyat: 120,
    toplamTutar: 6000,
  },
  {
    id: 2,
    siraNo: 2,
    kodu: "150.01.02",
    tasinirKodu: "150.01.02",
    malzemeAdi: "Telli Dosya",
    kalemAdi: "Telli Dosya",
    ozelligi: "Mavi renk plastik kapak",
    aciklama: "Mavi renk plastik kapak",
    birimi: "Adet",
    birim: "Adet",
    kdvOrani: 20,
    miktar: 200,
    birimFiyat: 15.5,
    toplamTutar: 3100,
  },
];

/**
 * Sentetik Firma ve Teklif Verileri (Piyasa Fiyat & Yaklaşık Maliyet için)
 */
export const SYNTHETIC_FIRMALAR = [
  {
    id: 101,
    unvan: "Alfa Kırtasiye San. Tic. Ltd. Şti.",
    ad: "Alfa Kırtasiye San. Tic. Ltd. Şti.",
    adres: "Örnek Mah. 1. Cad. No:10 Merkez",
    vergiDairesi: "Merkez VD",
    vergiNo: "1111111111",
    birimFiyatlar: [120, 15.5],
  },
  {
    id: 102,
    unvan: "Beta Büro Malzemeleri A.Ş.",
    ad: "Beta Büro Malzemeleri A.Ş.",
    adres: "Örnek Mah. 2. Cad. No:20 Merkez",
    vergiDairesi: "Merkez VD",
    vergiNo: "2222222222",
    birimFiyatlar: [130, 18.0],
  },
  {
    id: 103,
    unvan: "Gama Tedarik Paz. Tic. Ltd. Şti.",
    ad: "Gama Tedarik Paz. Tic. Ltd. Şti.",
    adres: "Örnek Mah. 3. Cad. No:30 Merkez",
    vergiDairesi: "Merkez VD",
    vergiNo: "3333333333",
    birimFiyatlar: [125, 16.0],
  },
];

/**
 * Tüm şablon tiplerini besleyebilecek kapsamlı sentetik belge verisi oluşturur.
 */
export function createSyntheticDocumentData(
  overrides: Record<string, any> = {},
): Record<string, any> {
  return {
    antetSatirlari: [...SYNTHETIC_HEADER_DATA.antetSatirlari],
    kurumAdi: SYNTHETIC_HEADER_DATA.kurumAdi,
    mudurluk: SYNTHETIC_HEADER_DATA.mudurluk,
    birimAdi: SYNTHETIC_HEADER_DATA.mudurluk,
    ihtiyacYeri: SYNTHETIC_HEADER_DATA.mudurluk,
    evrakSayisi: SYNTHETIC_HEADER_DATA.evrakSayisi,
    dosyaNo: SYNTHETIC_HEADER_DATA.dosyaNo,
    tarih: "2026-11-07",
    dosyaTarihi: "2026-11-07",
    onayaSunulanTarih: "2026-11-07",
    onayTarihi: "2026-11-07",
    tutanakTarihi: "2026-11-07",
    konu: SYNTHETIC_HEADER_DATA.konu,
    dosyaKonusu: SYNTHETIC_HEADER_DATA.konu,
    isinAdi: SYNTHETIC_HEADER_DATA.konu,
    isinNiteligi: "Mal Alımı",
    isinMiktari: "2 Kalem Kırtasiye Malzemesi",
    maddeNo: "22/d",
    alimUsulu: "Doğrudan Temin",
    sunulacakMakamAdi: "HARCAMA YETKİLİSİ MAKAMINA",
    sunulacakMakam: "HARCAMA YETKİLİSİ MAKAMINA",
    olurYazisi: true,
    olurBaslik: "OLUR",
    hazirlayanPersonelAdi: SYNTHETIC_HEADER_DATA.hazirlayanPersonelAdi,
    hazirlayanPersonelUnvan: SYNTHETIC_HEADER_DATA.hazirlayanPersonelUnvan,
    hazirlayanTelefon: SYNTHETIC_HEADER_DATA.hazirlayanTelefon,
    hazirlayanEposta: SYNTHETIC_HEADER_DATA.hazirlayanEposta,
    talepEdenPersonelAdi: SYNTHETIC_HEADER_DATA.talepEdenPersonelAdi,
    talepEdenPersonelUnvan: SYNTHETIC_HEADER_DATA.talepEdenPersonelUnvan,
    onaylayanPersonelAdi: SYNTHETIC_HEADER_DATA.onaylayanPersonelAdi,
    onaylayanPersonelUnvan: SYNTHETIC_HEADER_DATA.onaylayanPersonelUnvan,
    harcamaYetkilisiAdi: SYNTHETIC_HEADER_DATA.harcamaYetkilisiAdi,
    harcamaYetkilisiUnvan: SYNTHETIC_HEADER_DATA.harcamaYetkilisiUnvan,
    baskanAdi: SYNTHETIC_HEADER_DATA.onaylayanPersonelAdi,
    baskanUnvan: SYNTHETIC_HEADER_DATA.onaylayanPersonelUnvan,
    gerceklestirmeGorevlisiAdi: SYNTHETIC_HEADER_DATA.gerceklestirmeGorevlisiAdi,
    gerceklestirmeGorevlisiUnvan: SYNTHETIC_HEADER_DATA.gerceklestirmeGorevlisiUnvan,
    gerceklestirmeGorevlisiUnvani: SYNTHETIC_HEADER_DATA.gerceklestirmeGorevlisiUnvan,
    ihtiyacKalemleri: SYNTHETIC_KALEMLER.map((k) => ({ ...k })),
    kalemler: SYNTHETIC_KALEMLER.map((k) => ({ ...k })),
    malzemeler: SYNTHETIC_KALEMLER.map((k) => ({ ...k })),
    firmalar: SYNTHETIC_FIRMALAR.map((f) => ({ ...f })),
    firmaTeklifleriDetay: [
      {
        kalemId: 1,
        siraNo: 1,
        malzemeAdi: "A4 Fotokopi Kağıdı",
        ozelligi: "80 gr/m² 500 yaprak",
        miktar: 50,
        birimi: "Paket",
        teklifler: [120, 130, 125],
      },
      {
        kalemId: 2,
        siraNo: 2,
        malzemeAdi: "Telli Dosya",
        ozelligi: "Mavi renk plastik kapak",
        miktar: 200,
        birimi: "Adet",
        teklifler: [15.5, 18.0, 16.0],
      },
    ],
    uygunGorulenFirma: {
      ad: "Alfa Kırtasiye San. Tic. Ltd. Şti.",
      unvan: "Alfa Kırtasiye San. Tic. Ltd. Şti.",
      adres: "Örnek Mah. 1. Cad. No:10 Merkez",
      toplamTeklif: "9.100,00",
    },
    kazananFirmaUnvan: "Alfa Kırtasiye San. Tic. Ltd. Şti.",
    kazananFirmaAdres: "Örnek Mah. 1. Cad. No:10 Merkez",
    sozlesmeBedeli: "9.100,00 TL",
    yaklasikMaliyet: "9.450,00",
    kullanilabilirOdenek: "25.000,00",
    butceTertibi: "03.02.1.01",
    fiyatArastirmaGorevlileri: [
      {
        id: "10",
        adSoyad: "Deniz KAYA",
        ad_soyad: "Deniz KAYA",
        unvan: "Bilgisayar İşletmeni",
        gorevi: "Başkan",
      },
      {
        id: "40",
        adSoyad: "Bora ARSLAN",
        ad_soyad: "Bora ARSLAN",
        unvan: "Memur",
        gorevi: "Üye",
      },
    ],
    komisyonUyeleri: [
      {
        id: "20",
        adSoyad: "Efe DEMİR",
        ad_soyad: "Efe DEMİR",
        unvan: "Şef",
        gorevi: "Komisyon Başkanı",
      },
      {
        id: "10",
        adSoyad: "Deniz KAYA",
        ad_soyad: "Deniz KAYA",
        unvan: "Bilgisayar İşletmeni",
        gorevi: "Üye",
      },
      {
        id: "40",
        adSoyad: "Bora ARSLAN",
        ad_soyad: "Bora ARSLAN",
        unvan: "Memur",
        gorevi: "Üye",
      },
    ],
    muayeneKomisyonu: [
      {
        id: "20",
        adSoyad: "Efe DEMİR",
        ad_soyad: "Efe DEMİR",
        unvan: "Şef",
        gorevi: "Başkan",
      },
      {
        id: "10",
        adSoyad: "Deniz KAYA",
        ad_soyad: "Deniz KAYA",
        unvan: "Bilgisayar İşletmeni",
        gorevi: "Üye",
      },
    ],
    ...overrides,
  };
}

/**
 * Snapshot ve Refresh testleri için bellek-içi (In-Memory) DocumentStorageAdapter.
 * Yalnızca çağrı sayısını değil, gerçek kaydedilen veriyi saklar ve geri döndürür.
 */
export function createInMemoryStorageAdapter() {
  const store = new Map<
    string,
    {
      id: number;
      dosyaId: number;
      templateKey: string;
      data: Record<string, unknown>;
      sablonVersiyon: number;
      createdAt: string;
      updatedAt: string;
    }
  >();
  let seq = 1;

  const keyOf = (dosyaId: number, templateKey: string) =>
    `${dosyaId}::${templateKey}`;

  const adapter: DocumentStorageAdapter & {
    getRawStore: () => typeof store;
    hasSnapshot: (dosyaId: number, templateKey: string) => boolean;
    getSnapshotData: (
      dosyaId: number,
      templateKey: string,
    ) => Record<string, unknown> | undefined;
  } = {
    getRawStore: () => store,
    hasSnapshot: (dosyaId, templateKey) => store.has(keyOf(dosyaId, templateKey)),
    getSnapshotData: (dosyaId, templateKey) =>
      store.get(keyOf(dosyaId, templateKey))?.data,

    async getDocument({ dosyaId, templateKey }) {
      const rec = store.get(keyOf(dosyaId, templateKey));
      if (!rec) {
        return { success: true, exists: false };
      }
      return {
        success: true,
        exists: true,
        record: {
          id: rec.id,
          data: structuredClone(rec.data),
          sablonVersiyon: rec.sablonVersiyon,
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
        },
      };
    },

    async saveDocument({ dosyaId, templateKey, data, sablonVersiyon = 1 }) {
      const k = keyOf(dosyaId, templateKey);
      const existing = store.get(k);
      const now = new Date().toISOString();
      const id = existing ? existing.id : seq++;

      store.set(k, {
        id,
        dosyaId,
        templateKey,
        data: structuredClone(data),
        sablonVersiyon,
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now,
      });

      return {
        success: true,
        id,
        updatedAt: now,
      };
    },

    async resetDocument({ dosyaId, templateKey }) {
      store.delete(keyOf(dosyaId, templateKey));
      return { success: true };
    },

    async deleteDocument({ dosyaId, templateKey }) {
      store.delete(keyOf(dosyaId, templateKey));
      return { success: true };
    },
  };

  return adapter;
}

