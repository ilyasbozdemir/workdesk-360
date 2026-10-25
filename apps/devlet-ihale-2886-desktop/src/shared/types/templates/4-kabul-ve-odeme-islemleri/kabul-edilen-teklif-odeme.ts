// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri\kabul-edilen-teklif-odeme\index.html.json
export interface KabulEdilenTeklifOdemeIhtiyacKalemleriItem {
  siraNo?: number
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  enDusukFiyat?: string
  miktar?: string
  toplamBedel?: string
}

export interface IKabulEdilenTeklifOdeme {
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  evrakSayisi?: string
  dosyaTarihi?: string
  teminSekli?: string
  yukleniciFirma?: string
  yukleniciAdresi?: string
  yukleniciIlce?: string
  yukleniciIl?: string
  teslimGun?: string
  kurumAdi?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  baskanAdi?: string
  baskanUnvan?: string
  genelToplam?: string
  ihtiyacKalemleri?: KabulEdilenTeklifOdemeIhtiyacKalemleriItem[]
}
