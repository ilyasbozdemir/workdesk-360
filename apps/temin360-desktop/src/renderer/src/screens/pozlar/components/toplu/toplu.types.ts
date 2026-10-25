export interface TopluPozRow {
  id: string
  poz_no: string
  eski_poz_no: string
  kalem_adi: string
  birim: string
  poz_tipi: string
  poz_kurumu: string
  fasikul: string
  birim_fiyat: number | string
  fiyat_donemi: string
  okas_kodu: string
  yapi_sinifi: string
  kdv_orani: number
  ozelligi: string
}

export type TopluTabType = 'excel_grid' | 'github_sync' | 'raw_paste'
