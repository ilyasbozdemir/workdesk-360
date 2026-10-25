// Kaynak: resources/templates/3-siparis-ve-sozlesme\dogrudan-temin-sonuc-onay-belgesi\index.html.json
export interface DogrudanTeminSonucOnayBelgesiUygunGorulenlerItem {
  unvan?: string
  adres?: string
  fiyat?: string
}

export interface DogrudanTeminSonucOnayBelgesiTekliflerItem {
  unvan?: string
  fiyat?: string
  uygunMu?: string
  aciklama?: string
}

export interface IDogrudanTeminSonucOnayBelgesi {
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  idareAdi?: string
  vmakamina?: string
  tarih?: string
  dosyaTarihi?: string
  evrakSayisi?: string
  isAdi?: string
  isinAciklamasi?: string
  teminSekli?: string
  alimTuru?: string
  yaklasikMaliyet?: string
  teklifler?: DogrudanTeminSonucOnayBelgesiTekliflerItem[]
  uygunGorulenler?: DogrudanTeminSonucOnayBelgesiUygunGorulenlerItem[]
  vonayasunustarihi?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  vonaytarihi?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  baskanAdi?: string
  baskanUnvan?: string
  ekler?: string[]
}
