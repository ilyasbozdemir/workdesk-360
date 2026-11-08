import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: "TANIM_Kurum",
    sutun: "kurum_anteti",
    aciklama: "Kurum Anteti",
  },
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  dosyaKonusu: { deger: "Bütçe Sorgusu", aciklama: "Belge Başlığı / Konusu" },
  evrakSayisi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "evrak_sayisi",
    aciklama: "Evrak Sayısı",
  },
  butceYili: {
    tablo: "DATA_TeminDosyasi",
    sutun: "butce_yili",
    aciklama: "Bütçe Yılı",
  },
  butceTertibi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "butce_tertibi",
    aciklama: "Bütçe Tertibi",
  },
  isAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  harcamaYetkilisiAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Harcama Yetkilisi (Onaylayan)",
  },
  harcamaYetkilisiUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Harcama Yetkilisi Ünvanı",
  },
  onaylayanPersonelAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Harcama Yetkilisi",
  },
  onaylayanPersonelUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Harcama Yetkilisi Ünvanı",
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Harcama Yetkilisi",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Harcama Yetkilisi Ünvanı",
  },
  hazirlayanPersonelAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "Harcama Yetkilisi",
  },
  hazirlayanPersonelUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Harcama Yetkilisi Ünvanı",
  },
};

export const ButceSorgusuMapping = dataMapping;
