import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
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
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  dosyaKonusu: {
    tablo: "DATA_TeminDosyasi",
    sutun: "konu",
    aciklama: "Dosya Konusu",
  },
  toplamBedel: {
    tablo: "DATA_TeminDosyasi",
    sutun: "yaklasik_maliyet",
    aciklama: "Toplam Bedel",
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
  komisyon: {
    tablo: "DATA_TeminKomisyon",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    altEslestirme: {
      adSoyad: "ad_soyad",
      unvan: "unvan",
      gorevi: "gorevi",
    },
  },
  baskanAdi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onay_personel_id",
    iliskiliTablo: "TANIM_Personel",
    iliskiliSutun: "ad_soyad",
    aciklama: "Harcama Yetkilisi / Onaylayan",
  },
  baskanUnvan: {
    tablo: "DATA_TeminDosyasi",
    sutun: "onay_personel_id",
    iliskiliTablo: "TANIM_Personel",
    iliskiliSutun: "unvan",
    aciklama: "Harcama Yetkilisi Unvanı",
  },
  firmalar: {
    tablo: "DATA_TeminFirma",
    sutun: "*",
    iliskili_id: "temin_dosya_id",
    iliskiliTablo: "TANIM_Firma",
    iliskiliSutun: "unvan",
    altEslestirme: {
      unvan: "unvan",
    },
    aciklama: "Firma Listesi",
  },
  hesaplamaEsasi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "hesaplama_esasi",
    aciklama: "Hesaplama Esasi",
  },
};

export const PiyasaFiyatArastirmaTutanagiMapping = dataMapping;
