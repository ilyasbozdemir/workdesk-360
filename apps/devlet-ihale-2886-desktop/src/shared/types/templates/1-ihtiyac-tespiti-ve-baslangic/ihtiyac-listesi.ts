// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\ihtiyac-listesi\index.html.json
export interface IhtiyacListesiIhtiyacKalemleriItem {
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  kdvOrani?: string
  miktar?: number
  siraNo?: number
}

export interface IIhtiyacListesi {
  antetSatirlari?: string[]
  evrakSayisi?: string
  dosyaKonusu?: string
  maddeNo?: string
  tarih?: string
  sunulacakMakamAdi?: string
  talepEdenPersonelAdi?: string
  talepEdenPersonelUnvan?: string
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
  ihtiyacKalemleri?: IhtiyacListesiIhtiyacKalemleriItem[]
  olurYazisi?: boolean
  dosyaTarihi?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  hazirlayanTelefon?: string
  hazirlayanEposta?: string
}
