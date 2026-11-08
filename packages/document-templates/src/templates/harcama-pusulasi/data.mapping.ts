import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  evrakSayisi: {
    aciklama:
      "E-DETSİS-SDP-NO standart formatına uygun resmi evrak sayısı (örn: E-10234521-934.01-0001)",
  },
  tarih: {
    tablo: "DATA_TeminDosyasi",
    sutun: "dosya_acilis_tarihi",
    aciklama: "Onay Tarihi",
  },
  idareAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "İdare Adı" },
  isAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  alimTuru: { tablo: "DATA_TeminDosyasi", sutun: "tur", aciklama: "Alım Türü" },
  tutar: {
    tablo: "DATA_TeminDosyasi",
    sutun: "odenek_tutari",
    aciklama: "Ödenek / Toplam Tutar (₺)",
  },
  // tutarYazi şablonda otomatik hesaplanır; gerekirse snapshot üzerinden override edilebilir
  tutarYazi: { aciklama: "Tutarın yazı ile ifadesi (otomatik)" },
  miktar: { aciklama: "Satın alınan mal/hizmet miktarı" },
  birimFiyat: { aciklama: "Birim fiyatı (₺)" },
  aciklama: { aciklama: "Harcama pusulası açıklaması" },
  saticiTcNo: { aciklama: "Satıcının T.C. Kimlik No" },
  saticiAdiSoyadi: { aciklama: "Satıcının Adı Soyadı" },
  saticiAdres: { aciklama: "Satıcının Adresi" },
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

export const HarcamaPusulasiMapping = dataMapping;
