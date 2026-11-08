import {
  ButceTertip,
  KikKotaModel,
  MifKayit,
  TkysZimmetKayit,
  EmanetTeminatKayit,
  SozlesmeTaahhutKayit
} from './types'

/**
 * BKMYBS & 5018 Mali Yönetim Başlangıç/Boş Modelleri
 * Tüm veriler yerel SQLite veritabanındaki gerçek satın alma dosyalarından (DATA_TeminDosyasi),
 * onay belgeleri ve yaklaşık maliyet cetvellerinden (DATA_TeminBelgeSnapshot) RE'SEN üretilir.
 * Sabit/sahte mock veri içermez.
 */

export const INITIAL_BUTCE_TERTIPLERI: ButceTertip[] = []

export const INITIAL_KIK_KOTA: KikKotaModel = {
  idareTuru: 'buyuksehir',
  esikDeger: 864500, // 2026 Eşik Değer
  toplamMalHizmetButcesi: 0,
  yuzde10TavanTutari: 0,
  gerceklesen22dToplami: 0,
  kalanKotaTutari: 0,
  kullanimOrani: 0,
  kikIzinRiski: false,
  birimDagitimlari: []
}

export const INITIAL_MIF_LISTESI: MifKayit[] = []

export const INITIAL_TKYS_LISTESI: TkysZimmetKayit[] = []

export const INITIAL_EMANET_LISTESI: EmanetTeminatKayit[] = []

export const INITIAL_SOZLESME_LISTESI: SozlesmeTaahhutKayit[] = []
