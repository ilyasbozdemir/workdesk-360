// document-source.mapping.ts

import { DOCUMENT_FIELDS } from "./document-fields";

export interface MappingSourceRule {
  source: string;
  column: string;
  scope?: string;
  foreignKey?: string;
  relationTable?: string;
  relationColumn?: string;
  fallbackColumn?: string;
  description?: string;
}

/**
 * Merkezi Ortak Belge Veri Eşlemesi (COMMON_DOCUMENT_MAPPING)
 * SQLite veri tablosu ve kolonları doğrulanmış merkezi harita.
 * - DATA_TeminDosyasi: konu, dosya_acilis_tarihi, temin_no, evrak_sayisi, sunulacak_makam, ihtiyac_yeri
 * - TANIM_Kurum: kurum_adi, kurum_anteti, logo_sol, logo_sag
 * - TANIM_Personel: ad_soyad, unvan, telefon, eposta
 */
export const COMMON_DOCUMENT_MAPPING: Record<string, MappingSourceRule> = {
  dosyaId: {
    source: "DATA_TeminDosyasi",
    column: "id",
    scope: "documentId",
    description: "Dosya birincil anahtarı",
  },

  dosyaNo: {
    source: "DATA_TeminDosyasi",
    column: "temin_no",
    scope: "documentId",
    description: "Temin / dosya numarası",
  },

  dosyaKonusu: {
    source: "DATA_TeminDosyasi",
    column: "konu",
    scope: "documentId",
    description: "Alım / dosya konusu",
  },

  dosyaTarihi: {
    source: "DATA_TeminDosyasi",
    column: "dosya_acilis_tarihi",
    scope: "documentId",
    description: "Dosya açılış tarihi",
  },

  evrakSayisi: {
    source: "DATA_TeminDosyasi",
    column: "evrak_sayisi",
    scope: "documentId",
    description: "Resmî EBYS evrak kayıt numarası",
  },

  kurumAdi: {
    source: "TANIM_Kurum",
    column: "kurum_adi",
    scope: "kurumId",
    description: "İdarenin resmî adı",
  },

  kurumAnteti: {
    source: "TANIM_Kurum",
    column: "kurum_anteti",
    scope: "kurumId",
    description: "İdare resmî antet satırları",
  },

  solLogo: {
    source: "TANIM_Kurum",
    column: "logo_sol",
    scope: "kurumId",
    description: "Sol amblem / kurum logosu",
  },

  sagLogo: {
    source: "TANIM_Kurum",
    column: "logo_sag",
    scope: "kurumId",
    description: "Sağ amblem / ikinci logo",
  },

  sunulacakMakamAdi: {
    source: "DATA_TeminDosyasi",
    column: "sunulacak_makam",
    scope: "documentId",
    description: "Onay veya talep sunulan yetkili makam",
  },

  ihtiyacYeri: {
    source: "DATA_TeminDosyasi",
    column: "ihtiyac_yeri",
    scope: "documentId",
    description: "Hizmetin / malın kullanılacağı birim veya yer",
  },

  harcamaBirimi: {
    source: "DATA_TeminDosyasi",
    column: "harcama_birimi",
    scope: "documentId",
    description: "Harcamayı gerçekleştiren idari birim",
  },

  butceYili: {
    source: "DATA_TeminDosyasi",
    column: "butce_yili",
    scope: "documentId",
    description: "Mali bütçe yılı",
  },

  onayTarihi: {
    source: "DATA_TeminDosyasi",
    column: "onay_tarihi",
    fallbackColumn: "dosya_acilis_tarihi",
    scope: "documentId",
    description: "Harcama yetkilisi onay tarihi",
  },

  hazirlayanPersonelAdi: {
    source: "DATA_TeminDosyasi",
    foreignKey: "hazirlayan_personel_id",
    relationTable: "TANIM_Personel",
    column: "hazirlayan_personel_id",
    relationColumn: "ad_soyad",
    scope: "documentId",
    description: "Hazırlayan personelin adı ve soyadı",
  },

  hazirlayanPersonelUnvan: {
    source: "DATA_TeminDosyasi",
    foreignKey: "hazirlayan_personel_id",
    relationTable: "TANIM_Personel",
    column: "hazirlayan_personel_id",
    relationColumn: "unvan",
    scope: "documentId",
    description: "Hazırlayan personelin unvanı",
  },

  onaylayanPersonelAdi: {
    source: "DATA_TeminDosyasi",
    foreignKey: "onay_personel_id",
    relationTable: "TANIM_Personel",
    column: "onay_personel_id",
    relationColumn: "ad_soyad",
    scope: "documentId",
    description: "Onaylayan personelin adı ve soyadı",
  },

  onaylayanPersonelUnvan: {
    source: "DATA_TeminDosyasi",
    foreignKey: "onay_personel_id",
    relationTable: "TANIM_Personel",
    column: "onay_personel_id",
    relationColumn: "unvan",
    scope: "documentId",
    description: "Onaylayan personelin unvanı",
  },
};

/**
 * Geriye dönük uyumluluk eşlemesi (Sabit anahtar tabanlı)
 */
export const DOCUMENT_SOURCE_MAPPING = {
  [DOCUMENT_FIELDS.DOSYA.ID]: {
    source: "DATA_TeminDosyasi",
    column: "id",
    scope: "documentId",
  },

  [DOCUMENT_FIELDS.DOSYA.NO]: {
    source: "DATA_TeminDosyasi",
    column: "temin_no",
    scope: "documentId",
  },

  [DOCUMENT_FIELDS.DOSYA.KONU]: {
    source: "DATA_TeminDosyasi",
    column: "konu",
    scope: "documentId",
  },

  [DOCUMENT_FIELDS.DOSYA.ACILIS_TARIHI]: {
    source: "DATA_TeminDosyasi",
    column: "dosya_acilis_tarihi",
    scope: "documentId",
  },

  [DOCUMENT_FIELDS.DOSYA.EVRAK_SAYISI]: {
    source: "DATA_TeminDosyasi",
    column: "evrak_sayisi",
    scope: "documentId",
  },

  [DOCUMENT_FIELDS.KURUM.ADI]: {
    source: "TANIM_Kurum",
    column: "kurum_adi",
    scope: "kurumId",
  },

  [DOCUMENT_FIELDS.KURUM.ANTET]: {
    source: "TANIM_Kurum",
    column: "kurum_anteti",
    scope: "kurumId",
  },
};
