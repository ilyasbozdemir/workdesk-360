
import type {
  TemplateDefinition
} from "../../core/types.js";

import {
  globalFields,
  documentFields
} from "../../data-sources/index.js";

const G = globalFields;
const D = documentFields;

export const definition = {
  id: "piyasa-fiyat-arastirma",
  version: 3,
  schemaVersion: 1,

  fields: [
    {
      path: G["kurum.ad"].path,
      placeholder: "{{global.kurum.ad}}",
      mapping: G["kurum.ad"].mapping,
      refreshPolicy: "preserve",
      valueType: "string",
      required: true
    },
    {
      path: G["kurum.adres"].path,
      placeholder: "{{global.kurum.adres}}",
      mapping: G["kurum.adres"].mapping,
      refreshPolicy: "source",
      valueType: "string"
    },
    {
      path: G["kurum.logo"].path,
      placeholder: "{{global.kurum.logo}}",
      mapping: G["kurum.logo"].mapping,
      refreshPolicy: "preserve",
      valueType: "string"
    },
    {
      path: G["yetkili.adSoyad"].path,
      placeholder: "{{global.yetkili.adSoyad}}",
      mapping: G["yetkili.adSoyad"].mapping,
      refreshPolicy: "preserve",
      valueType: "string"
    },
    {
      path: G["yetkili.unvan"].path,
      placeholder: "{{global.yetkili.unvan}}",
      mapping: G["yetkili.unvan"].mapping,
      refreshPolicy: "preserve",
      valueType: "string"
    },
    {
      path: D["dosya.dosyaNo"].path,
      placeholder: "{{document.dosya.dosyaNo}}",
      mapping: D["dosya.dosyaNo"].mapping,
      refreshPolicy: "preserve",
      valueType: "string",
      required: true
    },
    {
      path: D["dosya.konu"].path,
      placeholder: "{{document.dosya.konu}}",
      mapping: D["dosya.konu"].mapping,
      refreshPolicy: "source",
      valueType: "string",
      required: true
    },
    {
      path: D["dosya.tarih"].path,
      placeholder: "{{document.dosya.tarih}}",
      mapping: D["dosya.tarih"].mapping,
      refreshPolicy: "preserve",
      valueType: "string"
    },
    {
      path: D["dosya.birimAdi"].path,
      placeholder: "{{document.dosya.birimAdi}}",
      mapping: D["dosya.birimAdi"].mapping,
      refreshPolicy: "source", valueType: "string"
    },
    {
      path: D["kalemSayisi"].path,
      placeholder: "{{document.kalemSayisi}}",
      mapping: D["kalemSayisi"].mapping,
      refreshPolicy: "source", valueType: "number"
    },
    {
      path: D["kalemler"].path,
      placeholder: "{{document.kalemler}}",
      mapping: D["kalemler"].mapping,
      refreshPolicy: "source",
      valueType: "array"
    },
    {
      path: D["komisyon"].path,
      placeholder: "{{document.komisyon}}",
      mapping: D["komisyon"].mapping,
      refreshPolicy: "preserve",
      valueType: "array"
    },
    {
      path: D["teklifler"].path,
      placeholder: "{{document.teklifler}}",
      mapping: D["teklifler"].mapping,
      refreshPolicy: "source",
      valueType: "array"
    },
    {
      path: "document.aciklama",
      placeholder: "{{document.aciklama}}",
      mapping: {
        kind: "static",
        value: ""
      },
      refreshPolicy: "manual",
      valueType: "string",
      editable: true
    }
  ],

  form: [
    {
      path: D["dosya.konu"].path,
      label: "Konu",
      kind: "text"
    },
    { path: D["dosya.birimAdi"].path, label: "Birim", kind: "text" },
    { path: D["kalemSayisi"].path, label: "Kalem sayısı", kind: "number" },
    {
      path: D["kalemler"].path,
      label: "Kalemler",
      kind: "table"
    },
    {
      path: "document.aciklama",
      label: "Belge açıklaması",
      kind: "text",
      editable: true
    }
  ]
} satisfies TemplateDefinition;
