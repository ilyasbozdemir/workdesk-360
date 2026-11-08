import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  evrakSayisi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "evrak_sayisi",
    aciklama: "Evrak Sayısı",
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Onaylayan Yetkili",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Onaylayan Yetkili Ünvanı",
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
};

export const MuayeneKabulTutanagiMapping = dataMapping;

export const HizmetIsleriKabulTeklifBelgesiMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  dosyaKonusu: {
    deger: "Hizmet İşleri Kabul Teklif Belgesi",
    aciklama: "Belge Başlığı / Konusu",
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Onaylayan Yetkili",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Onaylayan Yetkili Ünvanı",
  },
};

export const HizmetIsleriKabulTutanagiMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  dosyaKonusu: {
    deger: "Hizmet İşleri Kabul Tutanağı",
    aciklama: "Belge Başlığı / Konusu",
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Onaylayan Yetkili",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Onaylayan Yetkili Ünvanı",
  },
};

export const HakedisRaporuMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  onaylayanPersonelAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Onaylayan Yetkili",
  },
  onaylayanPersonelUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Onaylayan Yetkili Ünvanı",
  },
};
