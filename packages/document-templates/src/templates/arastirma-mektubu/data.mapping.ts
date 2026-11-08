import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  dosyaKonusu: {
    deger: "Fiyat Araştırması",
    aciklama: "Belge Başlığı / Konusu",
  },
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
  gorevlendirilenler: {
    tablo: "DATA_TeminKomisyon",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      adSoyad: "ad_soyad",
      unvan: "unvan",
      komisyonGorevi: "gorevi",
      gorevi: "gorevi",
    },
  },
  fiyatKomisyonu: {
    tablo: "DATA_TeminKomisyon",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      adSoyad: "ad_soyad",
      unvan: "unvan",
      komisyonGorevi: "gorevi",
      gorevi: "gorevi",
    },
  },
};

export const ArastirmaMektubuMapping = dataMapping;

export const TeklifMektubuDagitimCizelgesiMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  kurumUst: {
    tablo: "TANIM_Kurum",
    sutun: "ust_kurum_adi",
    aciklama: "Üst İdari Birim",
  },
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  mudurluk: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Müdürlük / Makam",
  },
  isAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Başkan (Onaylayan)",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Başkan Ünvanı",
  },
};

export const DagitimCizelgesiMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  kurumUst: {
    tablo: "TANIM_Kurum",
    sutun: "ust_kurum_adi",
    aciklama: "Üst İdari Birim",
  },
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  mudurluk: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Müdürlük / Makam",
  },
  isAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Başkan (Onaylayan)",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Başkan Ünvanı",
  },
};
