// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\yaklasik-maliyet-cetveli\index.html.json
export interface YaklasikMaliyetCetveliKomisyonItem {
  adSoyad?: string
  unvan?: string
  gorevi?: string
}

export interface YaklasikMaliyetCetveliFirmaToplamlariItem {
  toplam?: string
}

export interface YaklasikMaliyetCetveliIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: string
  firmaTeklifleri?: object[]
  enDusukFiyat?: string
  toplamBedel?: string
}

export interface YaklasikMaliyetCetveliFirmalarItem {
  unvan?: string
}

export interface IYaklasikMaliyetCetveli {
  antetSatirlari?: string[]
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  isAdi?: string
  tarih?: string
  dosyaTarihi?: string
  firmalarColspan?: number
  firmalar?: YaklasikMaliyetCetveliFirmalarItem[]
  ihtiyacKalemleri?: YaklasikMaliyetCetveliIhtiyacKalemleriItem[]
  firmaToplamlari?: YaklasikMaliyetCetveliFirmaToplamlariItem[]
  genelToplam?: string
  komisyon?: YaklasikMaliyetCetveliKomisyonItem[]
  baskanAdi?: string
  baskanUnvan?: string
  solLogo?: string
  sagLogo?: string
}
