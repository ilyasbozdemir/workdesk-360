/**
 * Doğrudan Temin Dosya Yönetim Sistemi - Harici API & Entegrasyon Veri Modelleri
 */

export interface DosyaBilgileri {
  dosyaNo?: string
  dosyaAcilisTarihi?: string // YYYY-MM-DD
  butceYili?: string // Örn: "2025"
  butce?: 'Genel Bütçe' | 'Döner Sermaye' | 'Diğer' | string
  dogrudanTeminNumarasi?: string
  ihaleTarihi?: string
  ihaleAsamasi?: string
  isinAdi?: string
  aciklama?: string
  ihalesiYapilacakBirim?: string
  sunulacakMakam?: string
  ihtiyacYeri?: string
  talepTarihSayisi?: string
  kurumsalKod?: string
  fonksiyonelKod?: string
  finansalKod?: string
  ihaleTipi?: 'Doğrudan Temin' | string
  alimTuru?: 'Mal Alımı' | 'Hizmet Alımı' | 'Yapım İşi' | 'Danışmanlık' | string
  madde?: '22/d*' | '22/a' | '22/b' | '22/c' | '22/d**' | '22/e' | '22/f' | '3/e' | string
  teklifSozlesmeTuru?: 'Birim Fiyat' | 'Götürü Bedel' | string
  altYuklenici?: 'Hayır' | 'Evet' | string
  kismiTeklif?: 'Hayır' | 'Evet' | string
  fiyatFarkiDayanagi?: string
  yatirimProjeNo?: string
  avans?: 'Hayır' | 'Evet' | string
  yaklasikMaliyetDurumu?: 'Burada Hesaplanacak' | 'Önceden hesaplandı' | 'Hesaplanmayacak' | string
  kdv?: 'Hariç' | 'Dahil' | string
  hesaplamaEsasi?: 'Ortalama fiyat esasına göre' | 'En düşük fiyat esasına göre' | string
  hesaplamada?:
    | 'Sadece araştırma fiyatları dikkate alınacak'
    | 'Komisyon takdiri kullanılacak'
    | 'Son alım fiyatlarını da kullan'
    | string
  tibbiCihaz?: 'Hayır' | 'Evet' | string
  irtibatYetkilisi?: string
  sonTeklifVermeTarihSaati?: string // YYYY-MM-DDTHH:MM
  tahminiBitisTarihi?: string // YYYY-MM-DD
}

export interface MalzemeKalemi {
  siraNo?: number
  malzemeKodu?: string
  malzemeAdi: string
  ozelligi?: string
  birimi?: string // "Adet", "Kg", "Metre", vb.
  kdvOrani?: string | number // "20", "10", vb.
  miktar: number
  birimFiyat?: number
  toplamTutar?: number
  fiyatKaynagi?: string
  tasinirKodu?: string
  okasKodu?: string
}

export interface TeklifKaydi {
  id?: string
  siraNo?: number
  firma: string
  firmaNo?: string
  vergiNo?: string
  iletisim?: string
  yer?: string
  yetkili?: string
  istekTarihi?: string
  istekSekli?:
    | 'E-posta'
    | 'Elden'
    | 'Faks'
    | 'Posta/Kargo'
    | 'Telefon'
    | 'Elektronik (EKAP vb.)'
    | 'Diğer'
    | string
  durum?: 'Teklif İstendi' | 'Teklif Geldi' | 'Teklif Vermedi' | 'Kabul Edildi' | 'Reddedildi' | string
  teklifTarihi?: string
  tutarKdvHaric?: number
  kdvOrani?: string | number
  gecerlilikGun?: string | number
  not?: string
  kalemFiyatlari?: Array<string | number>
}

export interface KazananFirma {
  firmaNo?: string
  firmaUnvani: string
  iletisim?: string
  semtSehir?: string
  sozlesme?: string
}

export interface KomisyonUyesi {
  siraNo?: number
  gorevi: string
  adiSoyadi: string
  unvani?: string
}

export interface Komisyonlar {
  yaklasikMaliyet?: KomisyonUyesi[]
  muayeneKabul?: KomisyonUyesi[]
}

export interface KabulTutanagi {
  id?: string
  kabulTarihi?: string
  firma?: string
  sayi?: string
  teslimAlan?: string
  teslimYeri?: string
  faturaTarihi?: string
  faturaNo?: string
  not?: string
  malzemeler?: Array<{
    siraNo?: number
    malzemeAdi: string
    ozelligi?: string
    birimi?: string
    miktari: string | number
    teslimAlinan?: string | number
    kabulMiktari?: string | number
  }>
}

export interface SablonBilgileri {
  evrakSayisi?: string
  baskanAdi?: string
  baskanUnvan?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
}

export interface DogrudanTeminDosyasi {
  id?: string
  versiyon?: string
  aktarimTarihi?: string
  dosyaBilgileri: DosyaBilgileri
  malzemeler?: MalzemeKalemi[]
  teklifler?: TeklifKaydi[]
  kazananFirmalar?: KazananFirma[]
  komisyonlar?: Komisyonlar
  kabulTutanaklari?: KabulTutanagi[]
  sablon?: SablonBilgileri
  f?: Record<string, string>
  mat?: string[][]
  tek?: unknown[]
  win?: unknown[]
  con?: unknown[]
  yak?: unknown[]
  muay?: unknown[]
  kab?: unknown[]
  ek?: unknown[]
  kfirma?: string[]
  kfirmaBilgi?: Record<string, unknown>
}

export interface ParsedJsonResult {
  success: boolean
  error?: string
  isMulti?: boolean
  totalCount?: number
  files?: DogrudanTeminDosyasi[]
  data?: DogrudanTeminDosyasi
}

export interface ExistingDossierSummary {
  id: number
  temin_no: string
  ekap_no?: string
  konu: string
  butce_yili?: number
  durum_asama_id?: number
  yaklasik_maliyet?: number
  created_at?: string
  kayit_kaynagi?: string
  kaynak_kayit_id?: string
  is_locked?: number
  lock_reason?: string
}

export interface SyncOptions {
  overwriteGeneralInfo: boolean
  overwriteMaterials: boolean
  overwriteOffers: boolean
  overwriteCommissions: boolean
  createNewIfNotFound: boolean
  syncIhtiyacRaporu?: boolean
  lockImported?: boolean
  lockReason?: string
  kayitKaynagi?: 'içe_aktarim' | 'eski_sistem' | 'yeni'
  aktarimGrubuId?: string
  forceUnlockOverwrite?: boolean
}

export interface SyncResult {
  success: boolean
  dosyaId: number
  isNew: boolean
  updatedFields: string[]
  materialsCount: number
  offersCount: number
  commissionsCount: number
  ihtiyacRaporuInfo?: string
  message: string
}

export interface BatchItemResult {
  index: number
  dosyaNo?: string
  isinAdi?: string
  status: 'created' | 'updated' | 'skipped_locked' | 'failed'
  dosyaId?: number
  error?: string
}

export interface BatchSyncResult {
  total: number
  successCount: number
  failedCount: number
  lockedSkippedCount: number
  aktarimGrubuId: string
  details: BatchItemResult[]
}

