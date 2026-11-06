// document-fields.ts

/**
 * Standart ve Ortak Belge Veri Modeli Sözleşmesi (CommonDocumentFields)
 * Bütün Temin 360 React belge şablonlarının kullandığı tip-güvenli ortak alanlar.
 * Veritabanı ham kolon adları React şablonlarına doğrudan taşınmaz; bu model aracılığıyla tüketilir.
 */
export interface CommonDocumentFields {
  /** Dosya birincil anahtarı (DATA_TeminDosyasi.id) */
  dosyaId?: number;
  /** Dosya / Temin Numarası (DATA_TeminDosyasi.temin_no) */
  dosyaNo?: string;
  /** Dosyanın konusu / Alım konusu (DATA_TeminDosyasi.konu) */
  dosyaKonusu?: string;
  /** Dosya açılış veya evrak tarihi (DATA_TeminDosyasi.dosya_acilis_tarihi) */
  dosyaTarihi?: string;
  /** Resmî EBYS / E-DETSİS evrak sayısı (DATA_TeminDosyasi.evrak_sayisi) */
  evrakSayisi?: string;

  /** Kurum resmî adı (TANIM_Kurum.kurum_adi) */
  kurumAdi?: string;
  /** Kurum üst metni / T.C. üst başlığı */
  kurumUst?: string;
  /** Kurum anteti ham JSON veya metin (TANIM_Kurum.kurum_anteti) */
  kurumAnteti?: string;
  /** Ayrıştırılmış resmî antet satırları */
  antetSatirlari?: string[];
  /** Sol logo yolu / base64 (TANIM_Kurum.logo_sol) */
  solLogo?: string | null;
  /** Sağ logo yolu / base64 (TANIM_Kurum.logo_sag) */
  sagLogo?: string | null;

  /** Onay/Talep sunulan makam (DATA_TeminDosyasi.sunulacak_makam veya TANIM_Birim.sunum_makami) */
  sunulacakMakamAdi?: string;
  /** İhtiyacın karşılanacağı birim / mahal (DATA_TeminDosyasi.ihtiyac_yeri) */
  ihtiyacYeri?: string;
  /** Harcama birimi adı */
  harcamaBirimi?: string;
  /** Bütçe yılı */
  butceYili?: number | string;

  /** Belgeyi hazırlayan personel adı soyadı */
  hazirlayanPersonelAdi?: string;
  /** Belgeyi hazırlayan personel unvanı */
  hazirlayanPersonelUnvan?: string;
  /** Belgeyi hazırlayan personel telefonu */
  hazirlayanTelefon?: string;
  /** Belgeyi hazırlayan personel e-posta adresi */
  hazirlayanEposta?: string;

  /** Belgeyi talep eden personel adı soyadı */
  talepEdenPersonelAdi?: string;
  /** Belgeyi talep eden personel unvanı */
  talepEdenPersonelUnvan?: string;
  /** Belgeyi talep eden personel telefonu */
  talepEdenTelefon?: string;

  /** Belgeyi onaylayan / Harcama Yetkilisi adı soyadı */
  onaylayanPersonelAdi?: string;
  /** Belgeyi onaylayan / Harcama Yetkilisi unvanı */
  onaylayanPersonelUnvan?: string;
  /** Onay tarihi */
  onayTarihi?: string;
  /** Onaya sunulan tarih */
  onayaSunulanTarih?: string;
}

/**
 * Ortak Kalem / Malzeme Modeli
 */
export interface CommonDocumentItem {
  id?: number | string;
  siraNo: number;
  kodu?: string;
  tasinirKodu?: string;
  malzemeAdi: string;
  ozelligi?: string;
  birimi: string;
  miktar: number | string;
  kdvOrani?: number | string;
  birimFiyat?: number | string;
  toplamTutar?: number | string;
  [key: string]: unknown;
}

/**
 * Alan Tanımlayıcı Sabitleri (Key Paths)
 */
export const DOCUMENT_FIELDS = {
  DOSYA: {
    ID: "dosya.id",
    NO: "dosya.teminNo",
    KONU: "dosya.konu",
    ACILIS_TARIHI: "dosya.acilisTarihi",
    EVRAK_SAYISI: "dosya.evrakSayisi",
    SUNULACAK_MAKAM: "dosya.sunulacakMakam",
    IHTIYAC_YERI: "dosya.ihtiyacYeri",
    BUTCE_YILI: "dosya.butceYili",
    HARCAMA_BIRIMI: "dosya.harcamaBirimi",
  },

  KURUM: {
    ADI: "kurum.adi",
    ANTET: "kurum.antet",
    SOL_LOGO: "kurum.logoSol",
    SAG_LOGO: "kurum.logoSag",
  },

  PERSONEL: {
    HAZIRLAYAN_ADI: "personel.hazirlayan.adSoyad",
    HAZIRLAYAN_UNVAN: "personel.hazirlayan.unvan",
    HAZIRLAYAN_TEL: "personel.hazirlayan.telefon",
    TALEP_EDEN_ADI: "personel.talepEden.adSoyad",
    TALEP_EDEN_UNVAN: "personel.talepEden.unvan",
    ONAYLAYAN_ADI: "personel.onaylayan.adSoyad",
    ONAYLAYAN_UNVAN: "personel.onaylayan.unvan",
    ONAY_TARIHI: "personel.onaylayan.tarih",
  },

  IHTIYAC: {
    YERI: "ihtiyac.yeri",
    KALEMLER: "ihtiyac.kalemler",
  },
} as const;
