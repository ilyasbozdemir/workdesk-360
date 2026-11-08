import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: { tablo: 'TANIM_Kurum', sutun: 'kurum_anteti', aciklama: 'Kurum Anteti' },
  isinAdi: { tablo: 'DATA_TeminDosyasi', sutun: 'konu', aciklama: 'İşin Adı' },
  dosyaKonusu: { deger: 'Teknik Şartname', aciklama: 'Belge Konusu' },
  tarih: { tablo: 'DATA_TeminDosyasi', sutun: 'dosya_acilis_tarihi', aciklama: 'Belge Tarihi' },
  ihtiyacKalemleri: {
    tablo: 'DATA_TeminKalem',
    sutun: '*',
    iliskili_id: 'temin_dosya_id',
    altEslestirme: { malzemeAdi: 'kalem_adi', ozelligi: 'aciklama', birimi: 'birim', miktar: 'miktar' }
  }
};

export const TeknikSartnameMapping = dataMapping;
