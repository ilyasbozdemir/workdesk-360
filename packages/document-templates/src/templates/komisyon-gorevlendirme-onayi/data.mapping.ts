import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  kurumUst: {
    tablo: 'TANIM_Kurum',
    sutun: 'ust_kurum_adi',
    aciklama: 'Üst İdari Birim'
  },
  kurumAdi: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_adi',
    aciklama: 'Kurum Adı'
  },
  mudurluk: {
    tablo: 'TANIM_Kurum',
    sutun: 'makam_adi',
    aciklama: 'Müdürlük / Makam'
  },
  kurumumuz: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_adi',
    aciklama: 'Kurum Adı'
  },
  alimTuru: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'tur',
    aciklama: 'Alım Türü'
  },
  evrakSayisi: {
    aciklama: 'E-DETSİS-SDP-NO standart formatına uygun resmi evrak sayısı'
  },
  tarih: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'dosya_acilis_tarihi',
    aciklama: 'Onay Tarihi'
  },
  dosyaTarihi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'dosya_acilis_tarihi',
    aciklama: 'Dosya Tarihi'
  },
  belgeTuru: { deger: 'Onay Yazısı', aciklama: 'Belge Türü (Onay Yazısı / Görevlendirme Emri)' },
  yaziTuru: { deger: 'onay', aciklama: 'Yazı Türü (onay)' },
  olurYazisi: { deger: false, aciklama: 'Olur yazısı mı? (Onay yazısıdır, false)' },
  arzRicaTuru: { deger: 'rica', aciklama: 'Resmî Nezaket İfadesi (rica)' },
  kapanisMetni: { deger: 'Gereğini rica ederim.', aciklama: 'Resmî Kapanış İfadesi' },
  isAdi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'konu',
    aciklama: 'İşin Adı'
  },
  hazirlayanPersonelAdi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'hazirlayan_personel_ad',
    aciklama: 'Hazırlayan Personel'
  },
  hazirlayanPersonelUnvan: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'hazirlayan_personel_unvan',
    aciklama: 'Hazırlayan Personel Ünvanı'
  },
  baskanAdi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'onaylayan_personel_ad',
    aciklama: 'Belediye Başkanı / Harcama Yetkilisi'
  },
  baskanUnvan: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'onaylayan_personel_unvan',
    aciklama: 'Onaylayan Personel Ünvanı'
  },
  kurumIci: {
    deger: true,
    aciklama: 'Kurum içi mi?'
  },
  fiyatKomisyonu: {
    tablo: 'DATA_TeminKomisyon',
    sutun: '*',
    aciklama: 'Piyasa Araştırma ve Satınalma Komisyon Üyeleri'
  },
  muayeneKomisyonu: {
    tablo: 'DATA_TeminKomisyon',
    sutun: '*',
    aciklama: 'Muayene Kabul ve Teslim Alma Komisyon Üyeleri'
  }
};

export const KomisyonGorevlendirmeOnayiMapping = dataMapping;

export const IhaleKomisyonKarariMapping: ProcessMapping = {
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
};
