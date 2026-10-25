// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\birim-fiyat-teklif-cetveli\index.html.json
export interface BirimFiyatTeklifCetveliIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: number
}

export interface IBirimFiyatTeklifCetveli {
  detsisNo?: string
  dosyaNumarasi?: object
  dosyaKonusu?: string
  dosyaTarihi?: string
  aciklama?: string
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  idareAdi?: string
  dogrudanTeminNo?: string
  isinAdi?: string
  sonTeklifVermeTarihi?: string
  sonTeklifVermeSaati?: string
  taahhutMetni?: string
  ihtiyacKalemleri?: BirimFiyatTeklifCetveliIhtiyacKalemleriItem[]
  kurumIci?: boolean
  kurumAdres?: string
  kurumTelefon?: string
  kurumWeb?: string
  kurumEposta?: string
  kurumKep?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  hazirlayanTelefon?: string
}
