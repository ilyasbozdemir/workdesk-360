// Kaynak: resources/templates/2-piyasa-fiyat-arastirmasi\fiyat-arastirmasi\index.html.json
export interface FiyatArastirmasiOnaylayanlarItem {
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  dosyaTarihi?: string
}

export interface FiyatArastirmasiIhtiyacKalemleriItem {
  siraNo?: number
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  kdvOrani?: string
  miktar?: number
}

export interface IFiyatArastirmasi {
  ekNo?: string
  evrakSayisi?: string
  tarih?: string
  antetSatir1?: string
  antetSatir2?: string
  antetSatir3?: string
  solLogo?: string
  sagLogo?: string
  kurumIci?: boolean
  kurumAdres?: string
  kurumTelefon?: string
  kurumFaks?: string
  kurumEposta?: string
  kurumKep?: string
  sunulacakMakamAdi?: string
  dosyaKonusu?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  ihtiyacKalemleri?: FiyatArastirmasiIhtiyacKalemleriItem[]
  dosyaTarihi?: string
  onaylayanlar?: FiyatArastirmasiOnaylayanlarItem[]
  hazirlayanTelefon?: string
  hazirlayanEposta?: string
}
