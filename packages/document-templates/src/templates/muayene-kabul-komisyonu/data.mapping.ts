import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_anteti',
    aciklama: 'Kurum Anteti'
  },
  detsisNo: {
    tablo: 'TANIM_Kurum',
    sutun: 'detsis_kodu',
    aciklama: 'Kurum DETSİS Numarası'
  },
  yili: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'butce_yili',
    aciklama: 'Bütçe Yılı'
  },
  sayisi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'temin_no',
    aciklama: 'Temin Numarası'
  },
  dosyaKonusu: { deger: 'Muayene ve Kabul Komisyonu', aciklama: 'Belgenin konusu' },
  belgeTuru: { deger: 'Onay Yazısı', aciklama: 'Belge Türü (Onay Yazısı / Görevlendirme Emri)' },
  yaziTuru: { deger: 'onay', aciklama: 'Yazı Türü (onay)' },
  olurYazisi: { deger: false, aciklama: 'Olur yazısı mı? (Onay yazısıdır, false)' },
  arzRicaTuru: { deger: 'rica', aciklama: 'Resmî Nezaket İfadesi (rica)' },
  kapanisMetni: { deger: 'Gereğini rica ederim.', aciklama: 'Resmî Kapanış İfadesi' },
  dosyaTarihi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'dosya_tarihi',
    aciklama: 'Dosya Tarihi'
  },
  kurumumuz: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_adi',
    aciklama: 'Kurum Adı'
  },
  kurumAdi: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_adi',
    aciklama: 'Kurum Adı'
  },
  kurumUst: {
    tablo: 'TANIM_Kurum',
    sutun: 'ust_kurum_adi',
    aciklama: 'Üst İdare Adı'
  },
  harcamaBirimi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'harcama_birimi',
    aciklama: 'Harcama Birimi'
  },
  mudurluk: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'islem_yapan_birim',
    aciklama: 'İşlem Yapan Birim / Müdürlük'
  },
  birimId: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'birim_id',
    aciklama: 'Birim ID'
  },
  antetEkSatir: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'antet_ek_satir',
    aciklama: 'Antet Ek Satırı'
  },
  isinAdi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'konu',
    aciklama: 'İşin Adı'
  },
  kanunMaddesi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'ihale_sekli',
    aciklama: 'Kanun Maddesi / İhale Şekli'
  },
  ihaleSekli: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'ihale_sekli',
    aciklama: 'İhale Şekli'
  },
  teminSekli: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'ihale_sekli',
    aciklama: 'Temin Şekli'
  },
  onayBelgesiTarihi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'dosya_tarihi',
    aciklama: 'Onay Belgesi Tarihi'
  },
  onayBelgesiSayisi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'temin_no',
    aciklama: 'Onay Belgesi Numarası / Sayısı'
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
  onaylayanPersonelAdi: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'onaylayan_personel_ad',
    aciklama: 'Onaylayan Yetkili (Harcama Yetkilisi)'
  },
  onaylayanPersonelUnvan: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'onaylayan_personel_unvan',
    aciklama: 'Onaylayan Yetkili Ünvanı'
  },
  kurumAdres: {
    tablo: 'TANIM_Kurum',
    sutun: 'adres',
    aciklama: 'Kurum Adresi'
  },
  kurumTelefon: {
    tablo: 'TANIM_Kurum',
    sutun: 'telefon',
    aciklama: 'Kurum Telefonu'
  },
  kurumFaks: {
    tablo: 'TANIM_Kurum',
    sutun: 'faks',
    aciklama: 'Kurum Faksı'
  },
  kurumWeb: {
    tablo: 'TANIM_Kurum',
    sutun: 'web_sitesi',
    aciklama: 'Kurum Web Sitesi'
  },
  kurumEposta: {
    tablo: 'TANIM_Kurum',
    sutun: 'eposta',
    aciklama: 'Kurum E-Posta'
  },
  kurumKep: {
    tablo: 'TANIM_Kurum',
    sutun: 'kep_adresi',
    aciklama: 'Kurum KEP Adresi'
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

export const MuayeneKabulKomisyonuMapping = dataMapping;
