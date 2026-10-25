// Kaynak: resources/templates/3-siparis-ve-sozlesme\kabul-edilen-teklif-alternatif\index.html.json
export interface KabulEdilenTeklifAlternatifIhtiyacKalemleriItem {
  siraNo?: number
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  enDusukFiyat?: string
  miktar?: string
  toplamBedel?: string
}

export interface IKabulEdilenTeklifAlternatif {
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
  ihtiyacKalemleri?: KabulEdilenTeklifAlternatifIhtiyacKalemleriItem[]
}
