// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\yaklasik-maliyet-teklif-mektubu\index.html.json
export interface YaklasikMaliyetTeklifMektubuIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: number
  birimFiyati?: string
}

export interface IYaklasikMaliyetTeklifMektubu {
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  kurumUstBirim?: string
  kurumBirim?: string
  kurumAdi?: string
  sonTeklifTarihi?: string
  sonTeklifSaati?: string
  baskanAdi?: string
  baskanUnvan?: string
  kurumAdres?: string
  kurumTelefon?: string
  kurumFax?: string
  ihtiyacKalemleri?: YaklasikMaliyetTeklifMektubuIhtiyacKalemleriItem[]
  teklifTarihi?: string
}
