/**
 * Belgelerim Eklentisi - Çekirdek Tip Tanımları
 */

/** Yer tutucu veri tipleri */
export type YerTutucuTipi = 'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli' | 'liste'

/** Liste tipi yer tutucu için alt alan tanımı */
export interface AltAlanTanimi {
  anahtar: string
  etiket: string
  tip: Exclude<YerTutucuTipi, 'liste'>
  varsayilan?: string | number
  secenekler?: string[]
}

/** Yer tutucu kapsamı */
export type YerTutucuKapsam = 'genel' | 'grup' | 'belge'

/**
 * Yer tutucu tanımı (CustomField tipini yeniden kullanır ve genişletir)
 */
export interface YerTutucuTanimi {
  id?: string
  anahtar: string
  etiket: string
  tip: YerTutucuTipi
  varsayilan?: unknown
  secenekler?: string[]
  /** Liste tipi için alt alan şeması */
  altAlanlar?: AltAlanTanimi[]
  kapsam: YerTutucuKapsam
  kapsamId?: string | number | null
  kaynak?: string | 'elle'
  zorunlu?: boolean
  sira?: number
  aciklama?: string
}

/** Koşul karşılaştırma operatörleri */
export type KosulOperatoru = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'dolu' | 'bos' | 'icerir'

/** Tekil koşul kuralı */
export interface KosulKurali {
  ad: string
  kaynak: string // Değişken anahtarı
  op: KosulOperatoru
  deger?: unknown
}

/** Mantıksal bağlaç */
export type MantiksalBaglac = 'VE' | 'VEYA'

/** Birleşik koşul ifadesi (en fazla 1 seviye) */
export interface KosulGrubu {
  ad: string
  baglac: MantiksalBaglac
  kurallar: KosulKurali[]
}

export type KosulTanimi = KosulKurali | KosulGrubu

/** Render bağlamı verisi */
export type RenderContext = Record<string, unknown>
