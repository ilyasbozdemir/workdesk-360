import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  hazirlayanPersonelAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "hazirlayan_personel_ad",
    aciklama: "Hazırlayan Personel",
  },
  hazirlayanPersonelUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "hazirlayan_personel_unvan",
    aciklama: "Hazırlayan Personel Ünvanı",
  },
  kurumAdres: {
    tablo: "TANIM_Kurum",
    sutun: "adres",
    aciklama: "Kurum Adresi",
  },
  kurumTelefon: {
    tablo: "TANIM_Kurum",
    sutun: "telefon",
    aciklama: "Kurum Telefonu",
  },
  kurumEposta: {
    tablo: "TANIM_Kurum",
    sutun: "eposta",
    aciklama: "Kurum E-Posta",
  },
  kurumKep: {
    tablo: "TANIM_Kurum",
    sutun: "kep_adresi",
    aciklama: "Kurum KEP Adresi",
  },
  kurumIci: { deger: true },
  ihtiyacKalemleri: {
    tablo: "DATA_TeminKalem",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      malzemeAdi: "kalem_adi",
      ozelligi: "aciklama",
      birimi: "birim",
      miktar: "miktar",
    },
  },
};

export const BirimFiyatTeklifMektubuMapping = dataMapping;

export const BirimFiyatTeklifCetveliMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  dosyaKonusu: {
    deger: "Birim Fiyat Teklif Cetveli",
    aciklama: "Belge Başlığı / Konusu",
  },
  idareAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "İdare Adı" },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  hazirlayanPersonelAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "hazirlayan_personel_ad",
    aciklama: "Hazırlayan Personel",
  },
  hazirlayanPersonelUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "hazirlayan_personel_unvan",
    aciklama: "Hazırlayan Personel Ünvanı",
  },
  kurumAdres: {
    tablo: "TANIM_Kurum",
    sutun: "adres",
    aciklama: "Kurum Adresi",
  },
  kurumTelefon: {
    tablo: "TANIM_Kurum",
    sutun: "telefon",
    aciklama: "Kurum Telefonu",
  },
  kurumEposta: {
    tablo: "TANIM_Kurum",
    sutun: "eposta",
    aciklama: "Kurum E-Posta",
  },
  kurumKep: {
    tablo: "TANIM_Kurum",
    sutun: "kep_adresi",
    aciklama: "Kurum KEP Adresi",
  },
  kurumIci: { deger: true },
  ihtiyacKalemleri: {
    tablo: "DATA_TeminKalem",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      malzemeAdi: "kalem_adi",
      ozelligi: "aciklama",
      birimi: "birim",
      miktar: "miktar",
    },
  },
};

export const TeklifMektubuMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
};
