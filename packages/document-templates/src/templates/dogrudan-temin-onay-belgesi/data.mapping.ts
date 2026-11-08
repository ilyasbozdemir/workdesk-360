import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
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
  makam: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Sunulacak Makam",
  },
  vmakamina: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Sunulacak Makam",
  },
  makamAdi: {
    tablo: "TANIM_Kurum",
    sutun: "makam_adi",
    aciklama: "Sunulacak Makam",
  },
  idareAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "İdare Adı" },
  evrakSayisi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "evrak_sayisi",
    aciklama: "Evrak Sayısı",
  },
  teminNo: {
    tablo: "DATA_TeminDosyasi",
    sutun: "temin_no",
    aciklama: "Temin Numarası",
  },
  isAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  isinAciklamasi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "isin_aciklamasi",
    aciklama: "İşin Açıklaması",
  },
  yaklasikMaliyet: {
    tablo: "DATA_TeminDosyasi",
    sutun: "yaklasik_maliyet",
    aciklama: "Yaklaşık Maliyet",
  },
  odenekTutari: {
    tablo: "DATA_TeminDosyasi",
    sutun: "odenek_tutari",
    aciklama: "Ödenek Tutarı",
  },
  butceTertibi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "butce_tertibi",
    aciklama: "Bütçe Tertibi",
  },
  teminSekli: {
    tablo: "DATA_TeminDosyasi",
    sutun: "ihale_sekli",
    aciklama: "Temin Åekli",
  },
  alimTuru: { tablo: "DATA_TeminDosyasi", sutun: "tur", aciklama: "Alım Türü" },
  tarih: {
    tablo: "DATA_TeminDosyasi",
    sutun: "dosya_acilis_tarihi",
    aciklama: "Onay Tarihi",
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
    aciklama: "Başkan / Harcama Yetkilisi",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Başkan Ünvanı",
  },
};

export const DogrudanTeminOnayBelgesiMapping = dataMapping;

export const DogrudanTeminSonucOnayBelgesiMapping: ProcessMapping = {
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
  idareAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "İdare Adı" },
  evrakSayisi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "evrak_sayisi",
    aciklama: "Evrak Sayısı",
  },
  isAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  isinAciklamasi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "isin_aciklamasi",
    aciklama: "İşin Açıklaması",
  },
  yaklasikMaliyet: {
    tablo: "DATA_TeminDosyasi",
    sutun: "yaklasik_maliyet",
    aciklama: "Yaklaşık Maliyet",
  },
  teminSekli: {
    tablo: "DATA_TeminDosyasi",
    sutun: "ihale_sekli",
    aciklama: "Temin Åekli",
  },
  alimTuru: { tablo: "DATA_TeminDosyasi", sutun: "tur", aciklama: "Alım Türü" },
  tarih: {
    tablo: "DATA_TeminDosyasi",
    sutun: "dosya_acilis_tarihi",
    aciklama: "Onay Tarihi",
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
    aciklama: "Başkan / Harcama Yetkilisi",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onaylayan_personel_unvan",
    aciklama: "Başkan Ünvanı",
  },
};

export const IdareOnayBelgesiMapping: ProcessMapping = {
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
  idareAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "İdare Adı" },
  evrakSayisi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "evrak_sayisi",
    aciklama: "Evrak Sayısı",
  },
  teminNo: {
    tablo: "DATA_TeminDosyasi",
    sutun: "temin_no",
    aciklama: "Temin Numarası",
  },
  isAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  isinAciklamasi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "isin_aciklamasi",
    aciklama: "İşin Açıklaması",
  },
  yaklasikMaliyet: {
    tablo: "DATA_TeminDosyasi",
    sutun: "yaklasik_maliyet",
    aciklama: "Yaklaşık Maliyet",
  },
  odenekTutari: {
    tablo: "DATA_TeminDosyasi",
    sutun: "odenek_tutari",
    aciklama: "Ödenek Tutarı",
  },
  butceTertibi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "butce_tertibi",
    aciklama: "Bütçe Tertibi",
  },
  teminSekli: {
    tablo: "DATA_TeminDosyasi",
    sutun: "ihale_sekli",
    aciklama: "Temin Åekli",
  },
  tarih: {
    tablo: "DATA_TeminDosyasi",
    sutun: "dosya_acilis_tarihi",
    aciklama: "Onay Tarihi",
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
};
