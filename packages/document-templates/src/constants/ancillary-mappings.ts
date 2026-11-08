import type { ProcessMapping } from '../resolver/types';

export const TasinirIslemFisiMapping: ProcessMapping = {
  kurumAdi: { tablo: 'TANIM_Kurum', sutun: 'kurum_adi', aciklama: 'Kurum Adı' },
  ihtiyacKalemleri: {
    tablo: 'DATA_TeminKalem',
    sutun: '*',
    iliskili_id: 'temin_dosya_id',
    altEslestirme: {
      malzemeAdi: 'kalem_adi',
      ozelligi: 'aciklama',
      birimi: 'birim',
      miktar: 'miktar'
    }
  }
};

export const IhaleKapagiMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_anteti',
    aciklama: 'Kurum Anteti'
  },
  isAdi: { tablo: 'DATA_TeminDosyasi', sutun: 'konu', aciklama: 'İşin Adı' },
  isinAciklamasi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'isin_aciklamasi',
    aciklama: 'İşin Açıklaması'
  },
  yaklasikMaliyet: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'yaklasik_maliyet',
    aciklama: 'Yaklaşık Maliyet'
  },
  teminNo: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'temin_no',
    aciklama: 'Temin Numarası'
  },
  alimTuru: { tablo: 'DATA_TeminDosyasi', sutun: 'tur', aciklama: 'Alım Türü' },
  butceTertibi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'butce_tertibi',
    aciklama: 'Bütçe Tertibi'
  }
};

export const KapakIciIndeksSablonuMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_anteti',
    aciklama: 'Kurum Anteti'
  },
  solLogo: {
    tablo: 'TANIM_Kurum',
    sutun: 'logo_sol',
    aciklama: 'Sol Logo (Base64)'
  },
  sagLogo: {
    tablo: 'TANIM_Kurum',
    sutun: 'logo_sag',
    aciklama: 'Sağ Logo (Base64)'
  },
  kurumAdi: { tablo: 'TANIM_Kurum', sutun: 'kurum_adi', aciklama: 'Kurum Adı' },
  isAdi: { tablo: 'DATA_TeminDosyasi', sutun: 'konu', aciklama: 'İşin Adı' }
};

export const KlasorSirtligi3cmMapping: ProcessMapping = {
  kurumAdi: { tablo: 'TANIM_Kurum', sutun: 'kurum_adi', aciklama: 'Kurum Adı' },
  solLogo: {
    tablo: 'TANIM_Kurum',
    sutun: 'logo_sol',
    aciklama: 'Sol Logo (Base64)'
  },
  yil: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'butce_yili',
    aciklama: 'Bütçe Yılı'
  },
  konu: { tablo: 'DATA_TeminDosyasi', sutun: 'konu', aciklama: 'İşin Adı' }
};

export const KlasorSirtligi5cmMapping: ProcessMapping = {
  kurumAdi: { tablo: 'TANIM_Kurum', sutun: 'kurum_adi', aciklama: 'Kurum Adı' },
  solLogo: {
    tablo: 'TANIM_Kurum',
    sutun: 'logo_sol',
    aciklama: 'Sol Logo (Base64)'
  },
  yil: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'butce_yili',
    aciklama: 'Bütçe Yılı'
  },
  konu: { tablo: 'DATA_TeminDosyasi', sutun: 'konu', aciklama: 'İşin Adı' }
};

export const KlasorSirtligi75cmMapping: ProcessMapping = {
  kurumAdi: { tablo: 'TANIM_Kurum', sutun: 'kurum_adi', aciklama: 'Kurum Adı' },
  solLogo: {
    tablo: 'TANIM_Kurum',
    sutun: 'logo_sol',
    aciklama: 'Sol Logo (Base64)'
  },
  yil: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'butce_yili',
    aciklama: 'Bütçe Yılı'
  },
  konu: { tablo: 'DATA_TeminDosyasi', sutun: 'konu', aciklama: 'İşin Adı' }
};

export const ANCILLARY_MAPPINGS: Record<string, ProcessMapping> = {
  'tasinir-islem-fisi': TasinirIslemFisiMapping,
  'tasinirislemfisi': TasinirIslemFisiMapping,
  'tif': TasinirIslemFisiMapping,
  'ihale-kapagi': IhaleKapagiMapping,
  'ihalekapagi': IhaleKapagiMapping,
  'kapak': IhaleKapagiMapping,
  'kapak-ici-indeks-sablonu': KapakIciIndeksSablonuMapping,
  'kapak-ici-indeks': KapakIciIndeksSablonuMapping,
  'indeks': KapakIciIndeksSablonuMapping,
  'klasor-sirtligi-3cm': KlasorSirtligi3cmMapping,
  'klasor-sirtligi-5cm': KlasorSirtligi5cmMapping,
  'klasor-sirtligi-7-5cm': KlasorSirtligi75cmMapping,
  'klasor-sirtligi-7.5cm': KlasorSirtligi75cmMapping,
};

