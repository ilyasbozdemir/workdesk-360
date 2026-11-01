
const d = (column: string) => ({
  kind: "column" as const,
  table: "documents",
  column,
  whereColumn: "id",
  scopeId: "documentId" as const
});

export const documentFields = {
  "dosya.dosyaNo": {
    key: "dosya.dosyaNo",
    path: "document.dosya.dosyaNo",
    label: "Dosya Numarası",
    mapping: d("dosya_no")
  },

  "dosya.konu": {
    key: "dosya.konu",
    path: "document.dosya.konu",
    label: "Dosya Konusu",
    mapping: d("konu")
  },

  "dosya.tarih": {
    key: "dosya.tarih",
    path: "document.dosya.tarih",
    label: "Dosya Tarihi",
    mapping: d("tarih")
  },

  "dosya.birimAdi": {
    key: "dosya.birimAdi",
    path: "document.dosya.birimAdi",
    label: "Talep Birimi",
    mapping: { kind: "relation" as const, table: "documents", whereColumn: "id", scopeId: "documentId" as const, localColumn: "birim_id", relatedTable: "units", foreignColumn: "id", selectColumn: "ad" }
  },

  "kalemSayisi": {
    key: "kalemSayisi", path: "document.kalemSayisi", label: "Kalem Sayısı",
    mapping: { kind: "computed" as const, operation: "count" as const, sourcePath: "document.kalemler" as const }
  },

  "kalemler": {
    key: "kalemler",
    path: "document.kalemler",
    label: "Kalemler",
    mapping: {
      kind: "collection" as const,
      table: "items",
      whereColumn: "document_id",
      scopeId: "documentId" as const,
      fields: {
        id: "id",
        siraNo: "sira_no",
        ad: "ad",
        miktar: "miktar",
        birim: "birim"
      },
      orderBy: "sira_no"
    }
  },

  "komisyon": {
    key: "komisyon",
    path: "document.komisyon",
    label: "Komisyon",
    mapping: {
      kind: "collection" as const,
      table: "commission",
      whereColumn: "document_id",
      scopeId: "documentId" as const,
      fields: {
        id: "id",
        adSoyad: "ad_soyad",
        unvan: "unvan",
        gorev: "gorev"
      },
      orderBy: "id"
    }
  },

  "teklifler": {
    key: "teklifler",
    path: "document.teklifler",
    label: "Teklifler",
    mapping: {
      kind: "collection" as const,
      table: "offers",
      whereColumn: "document_id",
      scopeId: "documentId" as const,
      fields: {
        id: "id",
        firma: "firma",
        itemId: "item_id",
        birimFiyat: "birim_fiyat"
      },
      orderBy: "id"
    }
  }
} as const;

export const documentFieldOptions =
  Object.values(documentFields).map((field) => ({
    key: field.key,
    path: field.path,
    label: field.label
  }));
