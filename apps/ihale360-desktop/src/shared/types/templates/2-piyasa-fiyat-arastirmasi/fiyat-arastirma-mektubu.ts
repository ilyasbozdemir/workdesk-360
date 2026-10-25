// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\fiyat-arastirma-mektubu\index.html.json
export interface FiyatArastirmaMektubuIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: number
}

export interface FiyatArastirmaMektubuKomisyonUyeleriItem {
  adSoyad?: string
  unvan?: string
}

export interface IFiyatArastirmaMektubu {
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  kurumAdi?: string
  isinAdi?: string
  gunSayisi?: string
  gunSayisiYazi?: string
  komisyonUyeleri?: FiyatArastirmaMektubuKomisyonUyeleriItem[]
  teklifSahibi?: string
  tebligatAdresi?: string
  vergiNo?: string
  telefonFaks?: string
  eposta?: string
  aciklama?: string
  kdvOrani?: string
  ihtiyacKalemleri?: FiyatArastirmaMektubuIhtiyacKalemleriItem[]
  kurumIci?: boolean
  kurumAdres?: string
  kurumTelefon?: string
  kurumWeb?: string
  kurumEposta?: string
  kurumKep?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  hazirlayanTelefon?: string
  hazirlayanEposta?: string
}
