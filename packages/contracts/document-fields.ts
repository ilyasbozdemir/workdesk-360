// document-fields.ts

export const DOCUMENT_FIELDS = {
  DOSYA: {
    ID: "dosya.id",
    KONU: "dosya.konu",
    ACILIS_TARIHI: "dosya.acilisTarihi",
    EVRAK_SAYISI: "dosya.evrakSayisi",
  },

  KURUM: {
    ADI: "kurum.adi",
    ANTET: "kurum.antet",
  },

  PERSONEL: {
    HAZIRLAYAN_ADI: "personel.hazirlayan.adSoyad",
    HAZIRLAYAN_UNVAN: "personel.hazirlayan.unvan",
    ONAYLAYAN_ADI: "personel.onaylayan.adSoyad",
    ONAYLAYAN_UNVAN: "personel.onaylayan.unvan",
  },

  IHTIYAC: {
    YERI: "ihtiyac.yeri",
    KALEMLER: "ihtiyac.kalemler",
  },
} as const;