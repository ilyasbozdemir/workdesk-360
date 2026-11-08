import type { ProcessMapping } from '../../resolver/types';

export const dataMapping: ProcessMapping = {
  isinAdi: { tablo: "DATA_TeminDosyasi", sutun: "konu", aciklama: "İşin Adı" },
  dosyaKonusu: {
    tablo: "DATA_TeminDosyasi",
    sutun: "konu",
    aciklama: "Dosya Konusu",
  },
  kurumAdi: { tablo: "TANIM_Kurum", sutun: "kurum_adi", aciklama: "Kurum Adı" },
  sozlesmeTarihi: {
    tablo: "DATA_TeminDosyasi",
    sutun: "sozlesme_tarihi",
    aciklama: "Sözleşme Tarihi",
  },
  sozlesmeBedeli: {
    tablo: "DATA_TeminDosyasi",
    sutun: "sozlesme_bedeli",
    aciklama: "Sözleşme Bedeli",
  },
};

export const Kik051YapimKesinKabulTutanagiMapping = dataMapping;
