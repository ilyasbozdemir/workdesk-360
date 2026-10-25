import {
  IhtiyacRaporu,
  IhtiyacRaporuKalem,
  IhtiyacRaporuDurum,
  KalemTipi
} from '../../services/ihtiyacRaporuService'

export type { IhtiyacRaporu, IhtiyacRaporuKalem, IhtiyacRaporuDurum, KalemTipi }

export interface BirimOption {
  id: number
  birim_adi: string
}

export interface PersonelOption {
  id: number
  ad_soyad: string
  unvan?: string | null
}

export interface CatalogKalemOption {
  id: number
  kalem_adi: string
  tipi?: string
  birim?: string
  kdv_orani?: number
  aciklama?: string
  poz_no?: string
  tasinir_kodu?: string
}
