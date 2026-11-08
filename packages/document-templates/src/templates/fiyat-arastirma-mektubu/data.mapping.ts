import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
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
  sunulacakMakam: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Sunulacak Makam Adı",
  },
  sunulacakMakamAdi: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Sunulacak Makam Adı",
  },
  kurumIci: { deger: true },
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
  komisyonUyeleri: {
    tablo: "DATA_TeminKomisyon",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      adSoyad: "ad_soyad",
      unvan: "unvan",
      gorev: "gorev",
    },
  },
  komisyon: {
    tablo: "DATA_TeminKomisyon",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      adSoyad: "ad_soyad",
      unvan: "unvan",
      gorev: "gorev",
    },
  },
  fiyatKomisyonu: {
    tablo: "DATA_TeminKomisyon",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      adSoyad: "ad_soyad",
      unvan: "unvan",
      gorev: "gorev",
    },
  },
  gorevlendirilenler: {
    tablo: "DATA_TeminKomisyon",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      adSoyad: "ad_soyad",
      unvan: "unvan",
      gorev: "gorev",
    },
  },
};

export const FiyatArastirmaMektubuMapping = dataMapping;

export const FiyatArastirmasiMapping: ProcessMapping = {
  evrakSayisi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "evrak_sayisi",
    aciklama: "Evrak Sayısı",
  },
  dosyaKonusu: {
    deger: "Fiyat Araştırması",
    aciklama: "Belge Başlığı / Konusu",
  },
  sunulacakMakamAdi: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Sunulacak Makam Adı",
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
  kurumEposta: {
    tablo: "TANIM_Kurum",
    sutun: "eposta",
    aciklama: "Kurum E-Posta",
  },
  kurumFaks: { tablo: "TANIM_Kurum", sutun: "faks", aciklama: "Kurum Faksı" },
  kurumTelefon: {
    tablo: "TANIM_Kurum",
    sutun: "telefon",
    aciklama: "Kurum Telefonu",
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

export const DagitimCizelgesiKarmaMapping: ProcessMapping = {
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
