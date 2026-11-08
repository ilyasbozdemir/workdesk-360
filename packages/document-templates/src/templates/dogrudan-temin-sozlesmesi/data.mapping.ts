import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  idareAdresi: {
    tablo: "TANIM_Kurum",
    sutun: "adres",
    aciklama: "İdare Adresi",
  },
  idareTelefon: {
    tablo: "TANIM_Kurum",
    sutun: "telefon",
    aciklama: "İdare Telefonu",
  },
  idareFaks: { tablo: "TANIM_Kurum", sutun: "faks", aciklama: "İdare Faksı" },
  idareEposta: {
    tablo: "TANIM_Kurum",
    sutun: "eposta",
    aciklama: "İdare E-Posta",
  },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  genelToplam: {
    tablo: "DATA_TeminDosyasi",
    sutun: "yaklasik_maliyet",
    aciklama: "Sözleşme Genel Toplamı",
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "İdare Yetkilisi",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "İdare Yetkilisi Ünvanı",
  },
};

export const DogrudanTeminSozlesmesiMapping = dataMapping;

export const DogrudanTeminSozlesmesiAlternatifMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  idareAdresi: {
    tablo: "TANIM_Kurum",
    sutun: "adres",
    aciklama: "İdare Adresi",
  },
  idareTelefon: {
    tablo: "TANIM_Kurum",
    sutun: "telefon",
    aciklama: "İdare Telefonu",
  },
  idareFaks: { tablo: "TANIM_Kurum", sutun: "faks", aciklama: "İdare Faksı" },
  idareEposta: {
    tablo: "TANIM_Kurum",
    sutun: "eposta",
    aciklama: "İdare E-Posta",
  },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  genelToplam: {
    tablo: "DATA_TeminDosyasi",
    sutun: "yaklasik_maliyet",
    aciklama: "Sözleşme Genel Toplamı",
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "İdare Yetkilisi",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "İdare Yetkilisi Ünvanı",
  },
};

export const DogrudanTeminSozlesmesiUzunMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  idareAdresi: {
    tablo: "TANIM_Kurum",
    sutun: "adres",
    aciklama: "İdare Adresi",
  },
  idareTelefon: {
    tablo: "TANIM_Kurum",
    sutun: "telefon",
    aciklama: "İdare Telefonu",
  },
  idareFaks: { tablo: "TANIM_Kurum", sutun: "faks", aciklama: "İdare Faksı" },
  idareEposta: {
    tablo: "TANIM_Kurum",
    sutun: "eposta",
    aciklama: "İdare E-Posta",
  },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  genelToplam: {
    tablo: "DATA_TeminDosyasi",
    sutun: "yaklasik_maliyet",
    aciklama: "Sözleşme Genel Toplamı",
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_ad",
    aciklama: "İdare Yetkilisi",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "İdare Yetkilisi Ünvanı",
  },
};
