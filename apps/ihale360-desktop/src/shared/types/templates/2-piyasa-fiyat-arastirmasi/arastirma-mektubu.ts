// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\arastirma-mektubu\index.html.json
export interface ArastirmaMektubuIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: number
}

export interface ArastirmaMektubuGorevlendirilenlerItem {
  adSoyad?: string
  unvan?: string
  komisyonGorevi?: string
}

export interface IArastirmaMektubu {
  detsisNo?: string
  dosyaNumarasi?: object
  dosyaKonusu?: string
  dosyaTarihi?: string
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  sayinIlgili?: string
  aciklamaMetni?: string
  gorevlendirilenler?: ArastirmaMektubuGorevlendirilenlerItem[]
  ihtiyacKalemleri?: ArastirmaMektubuIhtiyacKalemleriItem[]
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
