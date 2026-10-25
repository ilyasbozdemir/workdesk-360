// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\ihtiyac-talep-formu\index.html.json
export interface IhtiyacTalepFormuIhtiyacKalemleriItem {
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  kdvOrani?: string
  miktar?: number
}

export interface IIhtiyacTalepFormu {
  antetSatirlari?: string[]
  kurum_adi?: string
  birim_adi?: string
  evrakSayisi?: string
  dosyaKonusu?: string
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
  ihtiyacKalemleri?: IhtiyacTalepFormuIhtiyacKalemleriItem[]
  olurYazisi?: boolean
  dosyaTarihi?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  gerekce?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  hazirlayanTelefon?: string
  hazirlayanEposta?: string
  altNotlar?: string
  schema?: object
}
