// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\dagitim-cizelgesi\index.html.json
export interface DagitimCizelgesiKomisyonItem {
  gorev?: string
  adSoyad?: string
  unvan?: string
}

export interface DagitimCizelgesiSatirlarItem {
  sira?: number
}

export interface IDagitimCizelgesi {
  antetSatirlari?: string[]
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  belgeBasligi?: string
  isAdi?: string
  satirlar?: DagitimCizelgesiSatirlarItem[]
  kalemSayisi?: number
  kalemSayisiYazi?: string
  vtarih?: string
  baskanAdi?: string
  baskanUnvan?: string
  komisyon?: DagitimCizelgesiKomisyonItem[]
  solLogo?: string
  sagLogo?: string
}
