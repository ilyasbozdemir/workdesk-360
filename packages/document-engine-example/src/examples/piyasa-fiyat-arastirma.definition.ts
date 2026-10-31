import type { TemplateDefinition } from "../types.js";

/**
 * Sadeleştirilmiş örnek.
 * Gerçek projedeki mevcut mapping alanları korunarak genişletilmelidir.
 */
export const piyasaFiyatArastirmaDefinition: TemplateDefinition = {
  templateId: "piyasa-fiyat-arastirma",
  templateVersion: 1,
  schemaVersion: 1,
  mustacheFile: "piyasa-fiyat-arastirma.mustache",
  mapping: {
    kurumAdi: {
      tablo: "TANIM_Kurum",
      sutun: "ad",
      refreshPolicy: "source"
    },
    dosyaNo: {
      tablo: "DATA_TeminDosyasi",
      sutun: "dosyaNo",
      refreshPolicy: "source"
    },
    kalemler: {
      tablo: "DATA_TeminKalem",
      iliskili_id: "dosyaId",
      refreshPolicy: "source"
    },
    aciklama: {
      refreshPolicy: "preserve",
      varsayilan: ""
    },
    teslimSuresi: {
      tablo: "DATA_TeminDosyasi",
      sutun: "teslimSuresi",
      refreshPolicy: "manual"
    }
  }
};
