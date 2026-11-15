export interface KurulumKurumData {
  kurumAdi: string
  ustKurumAdi: string
  il: string
  ilce: string
  makamAdi: string
  detsisNo: string
  harcamaBirimAdi: string
}

export interface KurulumBirimItem {
  id?: string | number
  birimAdi: string
  antetEkSatir?: string
  sunumMakami?: string
}

export interface KurulumPersonelItem {
  id?: string | number
  adSoyad: string
  unvan: string
  gorev: string
  birim: string
  rol: 'harcama_yetkilisi' | 'gerceklestirme_gorevlisi' | 'muhasebe' | 'fiyat_arastirma' | 'muayene_kabul' | 'uye'
}

export interface KurulumRotaData {
  varsayilanHarcamaYetkilisiId?: string | number
  varsayilanGerceklestirmeId?: string | number
  varsayilanMuhasebeId?: string | number
  varsayilanBirimAdi?: string
  limitTipi?: string
}

export interface KurulumFormState {
  step: number
  kurum: KurulumKurumData
  birimler: KurulumBirimItem[]
  personeller: KurulumPersonelItem[]
  rota: KurulumRotaData
  isCompleted: boolean
}
