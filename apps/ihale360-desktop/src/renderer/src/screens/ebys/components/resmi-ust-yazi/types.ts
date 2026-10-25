export interface RotaAdimi {
  t: 'Hazırlayan' | 'Paraf' | 'İmza' | 'Bilgi'
  a: string
  u: string
}

export interface PresetData {
  konu: string
  muhatap: string
  aciklama: string
  imzalar: string
  kalemler: string
  fiyat: boolean
  firma: boolean
  kurumici: boolean
  ilgi: string
  ek: string
  gereg: string
  bilgi: string
  eimza: boolean
}
