// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\teklif-mektubu-dagitim-cizelgesi\index.html.json
export interface TeklifMektubuDagitimCizelgesiKomisyonItem {
  gorev?: string
  adSoyad?: string
  unvan?: string
}

export interface TeklifMektubuDagitimCizelgesiSatirlarItem {
  sira?: number
}

export interface ITeklifMektubuDagitimCizelgesi {
  antetSatirlari?: string[]
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  belgeBasligi?: string
  isAdi?: string
  satirlar?: TeklifMektubuDagitimCizelgesiSatirlarItem[]
  kalemSayisi?: number
  kalemSayisiYazi?: string
  vtarih?: string
  baskanAdi?: string
  baskanUnvan?: string
  komisyon?: TeklifMektubuDagitimCizelgesiKomisyonItem[]
  solLogo?: string
  sagLogo?: string
}
