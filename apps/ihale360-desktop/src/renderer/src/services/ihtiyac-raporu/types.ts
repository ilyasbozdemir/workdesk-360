export type TransferKalemMode = 'append_if_missing' | 'replace_all' | 'append_all'

export interface LinkToDosyaOptions {
  copyItemsToDosya?: boolean
  transferMode?: TransferKalemMode
}

export interface LinkToDosyaResult {
  success: boolean
  transferredCount: number
  skippedCount: number
  totalRaporKalemCount: number
}

export type IhtiyacRaporuDurum =
  | 'taslak'
  | 'inceleniyor'
  | 'onaylandi'
  | 'dosyaya_aktarildi'
  | 'iptal'

export type KalemTipi = 'Mal' | 'Hizmet' | 'Yapım' | 'Danışmanlık'

export interface IhtiyacRaporuKalem {
  id?: number
  rapor_id?: number
  sira_no?: number
  kalem_adi: string
  tipi: KalemTipi
  birim: string
  miktar: number
  kdv_orani?: number
  tasinir_kodu?: string | null
  okas_kodu?: string | null
  poz_no?: string | null
  aciklama?: string | null
  tahmini_birim_fiyat?: number
  created_at?: string
  updated_at?: string
}

export interface IhtiyacRaporu {
  id: number
  rapor_no: string
  baslik: string
  gerekce?: string | null
  birim_id?: number | null
  birim_adi?: string | null
  talep_eden_personel_id?: number | null
  talep_eden_personel?: string | null
  talep_eden_unvan?: string | null
  durum: IhtiyacRaporuDurum
  temin_dosya_id?: number | null
  tarih: string
  onay_tarihi?: string | null
  /** Ön bilgi / bütçe öngörüsü tutarı (Resmi yaklaşık maliyet hesabı değildir) */
  tahmini_butce?: number
  notlar?: string | null
  evrak_sayisi?: string | null
  created_at?: string
  updated_at?: string
  // İlişkili alanlar (Join)
  kalem_sayisi?: number
  dosya_no?: string | null
  dosya_konu?: string | null
  dosya_tur?: string | null
  dosya_evrak_sayisi?: string | null
}

export interface DosyaOption {
  id: number
  temin_no?: string | null
  dosya_no?: string | null
  konu: string
  tur?: string | null
  tarih?: string | null
  status?: string | null
}

export interface IhtiyacRaporuFilters {
  search?: string
  durum?: string
  baglantiDurumu?: 'all' | 'bagli' | 'bagimsiz'
  temin_dosya_id?: number | null
}

/**
 * Lüzum Müzekkeresi ve Onay Eki şablonlarının beklediği tekil kalem veri yapısı
 */
export interface LuzumMuzekkeresiKalemItem {
  siraNo: number
  kodu: string
  malzemeAdi: string
  ozelligi: string
  birimi: string
  kdvOrani: number
  miktar: number
  tasinirKodu: string
  okasKodu: string
  pozNo: string
  tahminiBirimFiyat: number
  satirTutari: number
}

/**
 * Lüzum Müzekkeresi şablonuna doğrudan aktarılabilir tam belge veri modeli
 */
export interface LuzumMuzekkeresiDocumentData {
  antetSatirlari?: string[]
  dosyaKonusu: string
  evrakSayisi: string
  tarih: string
  onayaSunulanTarih: string
  onayTarihi: string
  sunulacakMakamAdi: string
  isinAciklamasi: string
  gerekce: string
  talepEdenPersonelAdi: string
  talepEdenPersonelUnvan: string
  ihtiyacYeri: string
  ihtiyacKalemleri: LuzumMuzekkeresiKalemItem[]
  tahminiButce: number
  notlar: string
  olurYazisi: boolean
  kurumIci: boolean
  [key: string]: unknown
}

/**
 * Mevcut alım dosyasının İhtiyaç Listesi tablosuna (DATA_TeminKalem) eklenecek veri modeli
 */
export interface TeminKalemInsertPayload {
  temin_dosya_id: number
  sira_no: number
  kalem_adi: string
  tipi: string
  birim: string
  miktar: number
  kdv_orani: number
  tasinir_kodu: string | null
  okas_kodu: string | null
  poz_no: string | null
  aciklama: string | null
}
