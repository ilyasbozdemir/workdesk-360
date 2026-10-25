// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\dagitim-cizelgesi-karma\index.html.json
export interface DagitimCizelgesiKarmaKomisyonItem {
  gorev?: string
  adSoyad?: string
  unvan?: string
}

export interface DagitimCizelgesiKarmaSatirlarItem {
  sira?: number
}

export interface IDagitimCizelgesiKarma {
  antetSatirlari?: string[]
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  belgeBasligi?: string
  isAdi?: string
  satirlar?: DagitimCizelgesiKarmaSatirlarItem[]
  kalemSayisi?: number
  kalemSayisiYazi?: string
  vtarih?: string
  baskanAdi?: string
  baskanUnvan?: string
  komisyon?: DagitimCizelgesiKarmaKomisyonItem[]
  solLogo?: string
  sagLogo?: string
}
