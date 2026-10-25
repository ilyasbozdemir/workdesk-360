// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\birim-fiyat-teklif-mektubu\index.html.json
export interface BirimFiyatTeklifMektubuIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: number
}

export interface IBirimFiyatTeklifMektubu {
  dosyaTarihi?: string
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  hitap?: string
  isinAdi?: string
  teklifSahibi?: string
  uyrugu?: string
  tcKimlikNo?: string
  ortaklarinTcNo?: string
  vergiNo?: string
  tebligatAdresi?: string
  telefonFaks?: string
  eposta?: string
  aciklama?: string
  sonTeklifVermeTarihi?: string
  sonTeklifVermeSaati?: string
  ihtiyacKalemleri?: BirimFiyatTeklifMektubuIhtiyacKalemleriItem[]
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
