// Kaynak: resources/templates/3-siparis-ve-sozlesme\sozlesmeye-davet\index.html.json
export interface SozlesmeyeDavetIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  birimi?: string
  miktar?: string
  enDusukFiyat?: string
  toplamBedel?: string
}

export interface ISozlesmeyeDavet {
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  evrakSayisi?: string
  dosyaTarihi?: string
  yukleniciFirma?: string
  yukleniciAdresi?: string
  yukleniciIlce?: string
  yukleniciIl?: string
  kurumAdi?: string
  dosyaKonusu?: string
  baskanAdi?: string
  baskanUnvan?: string
  genelToplam?: string
  sozlesmeBedeli?: string
  pulBedeli?: string
  ihtiyacKalemleri?: SozlesmeyeDavetIhtiyacKalemleriItem[]
}
