// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\piyasa-fiyat-arastirma-tutanagi\index.html.json
export interface PiyasaFiyatArastirmaTutanagiKomisyonItem {
  adSoyad?: string
  unvan?: string
}

export interface PiyasaFiyatArastirmaTutanagiFirmaToplamlariDetayItem {
  toplam?: string
}

export interface PiyasaFiyatArastirmaTutanagiIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: string
  firmaTeklifleriDetay?: object[]
  enUygunFirmaAdi?: string
  enDusukFiyat?: string
  toplamBedel?: string
}

export interface PiyasaFiyatArastirmaTutanagiFirmalarItem {
  unvan?: string
}

export interface IPiyasaFiyatArastirmaTutanagi {
  antetSatirlari?: string[]
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  idareAdi?: string
  tarih?: string
  isAdi?: string
  dosyaTarihi?: string
  evrakSayisi?: string
  firmalar?: PiyasaFiyatArastirmaTutanagiFirmalarItem[]
  ihtiyacKalemleri?: PiyasaFiyatArastirmaTutanagiIhtiyacKalemleriItem[]
  firmaToplamlariDetay?: PiyasaFiyatArastirmaTutanagiFirmaToplamlariDetayItem[]
  genelToplam?: string
  komisyon?: PiyasaFiyatArastirmaTutanagiKomisyonItem[]
  baskanAdi?: string
  baskanUnvan?: string
  solLogo?: string
  sagLogo?: string
}
