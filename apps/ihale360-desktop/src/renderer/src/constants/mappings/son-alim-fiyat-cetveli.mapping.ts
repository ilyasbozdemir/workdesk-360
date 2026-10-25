import { ProcessMapping } from './types'

export const SonAlimFiyatCetveliMapping: ProcessMapping = {
  antetSatirlari: {
    tablo: 'TANIM_Kurum',
    sutun: 'kurum_anteti',
    aciklama: 'Dosyanın antet satırları'
  },
  dosyaKonusu: {
    deger: 'Son Alım Fiyat Cetveli',
    aciklama: 'Belgenin konusu'
  },
  evrakSayisi: {
    formul:
      '{{TANIM_Kurum.detsis_kodu}}-{{DATA_TeminDosyasi.butce_yili}}/{{DATA_TeminDosyasi.temin_no}}',
    aciklama: 'DETSİS No - Yıl - Dosya No birleşimi'
  },
  tarih: {
    tablo: 'DATA_TeminDosyasi',
    sutun: 'dosya_acilis_tarihi',
    aciklama: 'Dosya tarihi'
  },
  kurumIci: {
    deger: true,
    aciklama: 'Kurum içi mi?'
  },
  kurumAdres: {
    tablo: 'TANIM_Kurum',
    sutun: 'adres',
    varsayilan: '[Adres Belirtilmedi]',
    aciklama: 'Kurum adresi'
  },
  kurumTelefon: {
    tablo: 'TANIM_Kurum',
    sutun: 'telefon',
    varsayilan: '[Telefon Belirtilmedi]',
    aciklama: 'Kurum telefonu'
  },
  kurumWeb: {
    tablo: 'TANIM_Kurum',
    sutun: 'web_sitesi',
    varsayilan: '[Web Adresi Belirtilmedi]',
    aciklama: 'Kurum web sitesi'
  },
  kurumEposta: {
    tablo: 'TANIM_Kurum',
    sutun: 'eposta',
    varsayilan: '[E-Posta Belirtilmedi]',
    aciklama: 'Kurum e-posta adresi'
  },
  kurumKep: {
    tablo: 'TANIM_Kurum',
    sutun: 'kep_adresi',
    varsayilan: '[Kep Adresi Belirtilmedi]',
    aciklama: 'Kurum kep adresi'
  },
  hazirlayanPersonelAdi: {
    tablo: 'TANIM_Personel',
    sutun: 'ad_soyad',
    aciklama: 'Hazırlayan personelin adı soyadı'
  },
  hazirlayanPersonelUnvan: {
    tablo: 'TANIM_Personel',
    sutun: 'unvan',
    aciklama: 'Hazırlayan personelin ünvanı'
  },
  hazirlayanTelefon: {
    tablo: 'TANIM_Personel',
    sutun: 'telefon',
    varsayilan: '',
    aciklama: 'Hazırlayan personelin telefonu'
  },
  hazirlayanEposta: {
    tablo: 'TANIM_Personel',
    sutun: 'eposta',
    varsayilan: '',
    aciklama: 'Hazırlayan personelin e-postası'
  },
  kontrolEdenPersonelAdi: {
    tablo: 'TANIM_Personel',
    sutun: 'ad_soyad',
    aciklama: 'Kontrol eden personelin adı soyadı'
  },
  kontrolEdenPersonelUnvan: {
    tablo: 'TANIM_Personel',
    sutun: 'unvan',
    aciklama: 'Kontrol eden personelin ünvanı'
  },
  fiyatKalemleri: {
    tablo: 'DATA_TeminKalem',
    sutun: '*',
    iliskili_id: 'temin_dosya_id',
    altEslestirme: {
      malzemeKodu: 'tasinir_kodu',
      malzemeAdi: 'kalem_adi',
      ozelligi: 'aciklama',
      birimi: 'birim',
      kdvOrani: 'kdv_orani',
      miktar: 'miktar',
      birimFiyat: 'birim_fiyat',
      toplamTutar: 'toplam_tutar',
      kazananFirma: 'kazanan_firma',
      alimTarihi: 'alim_tarihi'
    },
    aciklama: 'Son alım fiyat cetveli kalemleri'
  }
}
