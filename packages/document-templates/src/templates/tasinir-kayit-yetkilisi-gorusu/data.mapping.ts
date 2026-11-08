import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  antetSatirlari: { tablo: 'TANIM_Kurum', sutun: 'kurum_anteti', aciklama: 'Kurum Anteti' },
  evrakSayisi: { aciklama: 'E-DETSİS-SDP-NO standart formatına uygun resmi evrak sayısı' },
  dosyaKonusu: { deger: 'Taşınır Kayıt ve Kontrol Yetkilisi Görüşü', aciklama: 'Belge Konusu' },
  tarih: { tablo: 'DATA_TeminDosyasi', sutun: 'dosya_acilis_tarihi', aciklama: 'Belge Tarihi' },
  sunulacakMakamAdi: { tablo: 'TANIM_Kurum', sutun: 'makam_adi', aciklama: 'Sunulacak Makam' },
  kurumIci: { deger: true }
};

export const TasinirKayitYetkilisiGorusuMapping = dataMapping;
