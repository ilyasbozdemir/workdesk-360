export interface DosyaKomisyonMember {
  id?: number
  personel_id: number
  ad_soyad: string
  unvan?: string
  gorev_adi?: string
  asli_yedek?: string
  asli_mi?: number
}

export interface DosyaKomisyonItem {
  id: number
  dosya_no: string
  is_tanimi: string
  created_at: string
  history_count: number
  isCustomized: boolean
  source: 'custom' | 'template' | 'empty'
  piyasaMembers: DosyaKomisyonMember[]
  muayeneMembers: DosyaKomisyonMember[]
  totalMembersCount: number
  lastUpdate: string | null
}

export interface GlobalHistoryItem {
  id: number
  temin_dosya_id: number
  dosya_no: string
  is_tanimi: string
  komisyon_turu: string
  islem_turu: string
  islem_yapan: string
  snapshot_data: string
  created_at: string
}

export type KomisyonV2MainTab = 'dosyalar' | 'sablonlar' | 'tarihce'
export type DosyaFilterMode = 'all' | 'custom' | 'template' | 'empty'
