import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_anteti',
    aciklama: 'Kurum Anteti',
  },
  kurumAdi: { tablo: 'TANIM_Kurum', sutun: 'kurum_adi', aciklama: 'Kurum Adı' },
  butceYili: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'butce_yili',
    aciklama: 'Bütçe Yılı',
  },
  dosyaTarihi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'tarih',
    aciklama: 'Dosya Tarihi',
  },
  alimTuru: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'tur',
    aciklama: 'Alım Türü',
  },
  teminSekli: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'usul',
    aciklama: 'Alım Usulü',
  },
  isAdi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'konu',
    aciklama: 'İşin Adı / Konusu',
  },
  isinAciklamasi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'isin_aciklamasi',
    aciklama: 'İşin Açıklaması / Gerekçesi',
  },
  yaklasikMaliyet: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'yaklasik_maliyet',
    aciklama: 'Yaklaşık Maliyet',
  },
  sozlesmeBedeli: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'sozlesme_bedeli',
    aciklama: 'Sözleşme / Teklif Bedeli',
  },
  toplamTutar: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'sozlesme_bedeli',
    aciklama: 'Toplam Tutar',
  },
  firmaAdi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'kazanan_firma_adi',
    aciklama: 'Yüklenici Firma Adı',
  },
  firmaVkn: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'kazanan_firma_vkn',
    aciklama: 'Yüklenici Firma VKN / TCKN',
  },
  kdvOrani: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'kdv_orani',
    varsayilan: '20',
    aciklama: 'KDV Oranı (%)',
  },
  solLogo: {
    tablo: 'TANIM_Kurum',
    sutun: 'logo_sol',
    aciklama: 'Sol Logo (Base64)',
  },
  sagLogo: {
    tablo: 'TANIM_Kurum',
    sutun: 'logo_sag',
    aciklama: 'Sağ Logo (Base64)',
  },
};

export const DogrudanTeminDosyasiMapping = dataMapping;
