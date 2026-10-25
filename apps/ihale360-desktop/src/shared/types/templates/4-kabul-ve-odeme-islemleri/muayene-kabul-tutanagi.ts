// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri\muayene-kabul-tutanagi\index.html.json
export interface MuayeneKabulTutanagiMuayeneKomisyonuItem {
  adSoyad?: string
  unvan?: string
  gorevi?: string
}

export interface MuayeneKabulTutanagiIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  birimi?: string
  miktar?: string
}

export interface IMuayeneKabulTutanagi {
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  evrakSayisi?: string
  dosyaTarihi?: string
  kurumAdi?: string
  yukleniciFirma?: string
  dosyaKonusu?: string
  sozlesmeTarihi?: string
  genelToplam?: string
  sozlesmeBedeli?: string
  faturaTarihi?: string
  faturaNo?: string
  kabulTarihi?: string
  olurGoster?: boolean
  baskanAdi?: string
  baskanUnvan?: string
  ihtiyacKalemleri?: MuayeneKabulTutanagiIhtiyacKalemleriItem[]
  muayeneKomisyonu?: MuayeneKabulTutanagiMuayeneKomisyonuItem[]
}
