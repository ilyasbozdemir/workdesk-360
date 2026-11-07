import type { KomisyonAtamaModalProps, KomisyonType } from '../../types'

export type { KomisyonAtamaModalProps, KomisyonType }

export type CommissionSignatureType = 'Paraf' | 'Koordinasyon' | 'İmza'

export interface PersonelItem {
  id: number
  ad_soyad: string
  unvan?: string
  birim?: string | null
  birim_id?: number | null
}

export interface KomisyonRow {
  sira: number
  gorev: string
  personelId: number | null
  belgedeGoster: boolean
  imzaTuru?: CommissionSignatureType
  asliYedek?: 'Asil' | 'Yedek'
  vekaletUnvani?: string
  baslangicTarihi?: string
  bitisTarihi?: string
  belgeKapsami?: string
  hedefBelgeler?: string[]
}

export interface KurumInfo {
  kurumAdi?: string
  makamAdi?: string
  kurumTipi?: string
}
