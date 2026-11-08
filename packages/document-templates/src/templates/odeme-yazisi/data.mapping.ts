import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  dosyaKonusu: { deger: "Ödeme Yazısı", aciklama: "Belge Başlığı / Konusu" },
  evrakSayisi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "evrak_sayisi",
    aciklama: "Evrak Sayısı",
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

export const OdemeYazisiMapping = dataMapping;

export const OdemeEmriBelgesiMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  dosyaKonusu: {
    deger: "Ödeme Emri Belgesi",
    aciklama: "Belge Başlığı / Konusu",
  },
  butceYili: {
    tablo: "DATA_TeminDosyasi",
    sutun: "butce_yili",
    aciklama: "Bütçe Yılı",
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
  gerceklestirmeGorevlisiAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "hazirlayan_personel_ad",
    aciklama: "Gerçekleştirme Görevlisi",
  },
  gerceklestirmeGorevlisiUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "hazirlayan_personel_unvan",
    aciklama: "Gerçekleştirme Görevlisi Ünvanı",
  },
};
