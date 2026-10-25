// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\luzum-muzekkeresi\index.html.json
export interface LuzumMuzekkeresiIhtiyacKalemleriItem {
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  kdvOrani?: string
  miktar?: number
}

export interface ILuzumMuzekkeresi {
  antetSatirlari?: string[]
  evrakSayisi?: string
  dosyaKonusu?: string
  maddeNo?: string
  tarih?: string
  sunulacakMakamAdi?: string
  talepEdenPersonelAdi?: string
  talepEdenPersonelUnvan?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  kurumIci?: boolean
  kurumAdres?: string
  kurumTelefon?: string
  kurumFaks?: string
  kurumWeb?: string
  kurumEposta?: string
  kurumKep?: string
  solLogo?: string
  sagLogo?: string
  ihtiyacYeri?: string
  isinAciklamasi?: string
  ihtiyacKalemleri?: LuzumMuzekkeresiIhtiyacKalemleriItem[]
  dosyaTarihi?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  hazirlayanTelefon?: string
}
