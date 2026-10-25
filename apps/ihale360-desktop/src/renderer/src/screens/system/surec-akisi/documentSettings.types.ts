import type {
  MuhatapHiyerarsi,
  GonderimKanali,
  EbysMuhatap,
  EbysDagitimKalemi,
  EbysRotaAdimi
} from '../../ebys/ebys.types'

export type { MuhatapHiyerarsi, GonderimKanali, EbysMuhatap, EbysDagitimKalemi, EbysRotaAdimi }

export interface EvrakIlgiKalemi {
  id: string
  metin: string
  tarih?: string
  sayi?: string
  onaylandi?: boolean
}

export interface EvrakEkKalemi {
  id: string
  ad: string
  adet?: number
  tur?: string
  onaylandi?: boolean
}

export interface DocumentEvrakSettings {
  muhatap?: EbysMuhatap
  kapanisIbaresi?: string
  ilgiListesi?: EvrakIlgiKalemi[]
  ekListesi?: EvrakEkKalemi[]
  dagitimListesi?: EbysDagitimKalemi[]
  rotaAdimlari?: EbysRotaAdimi[]
  rotaOnaylandi?: boolean
  sonGuncelleme?: string
}

export interface DocumentValidationResult {
  docId: string
  isValid: boolean
  warnings: string[]
  missingFields: ('muhatap' | 'ilgi' | 'ek' | 'dagitim' | 'rota')[]
}
