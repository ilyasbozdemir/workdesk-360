// Kaynak: resources/templates/5-klasor-ve-kapaklar\ihale-kapagi\index.html.json
export interface IhaleKapagiKapakDetaylariItem {
  label?: string
  lines?: string[]
  isBold?: boolean
}

export interface IIhaleKapagi {
  antetSatirlari?: string[]
  solLogo?: string
  sagLogo?: string
  isAdi?: string
  isinAciklamasi?: string
  alimTuru?: string
  teminNo?: string
  yaklasikMaliyet?: string
  butceTertibi?: string[]
  yukleniciFirma?: string
  dosyaTarihi?: string
  tarih?: string
  kapakDetaylari?: IhaleKapagiKapakDetaylariItem[]
}
