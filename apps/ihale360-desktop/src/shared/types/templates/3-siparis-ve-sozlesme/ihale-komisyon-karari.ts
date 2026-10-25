// Kaynak: resources/templates/3-siparis-ve-sozlesme\ihale-komisyon-karari\index.html.json
export interface IhaleKomisyonKarariIhaleKomisyonuItem {
  gorevi?: string
  adSoyad?: string
  unvan?: string
}

export interface IhaleKomisyonKarariTekliflerItem {
  siraNo?: string
  istekliUnvani?: string
  teklifBedeli?: string
  yaziIle?: string
}

export interface IIhaleKomisyonKarari {
  ihaleKayitNo?: string
  kararNo?: string
  kurumAdi?: string
  isinAdi?: string
  dosyaKonusu?: string
  ihaleTarihiVeSaati?: string
  ihaleUsulu?: string
  dokumanAlanSayisi?: string
  toplamTeklifSayisi?: string
  gecerliTeklifSayisi?: string
  enAvantajliTeklifSahibi?: string
  enAvantajliTeklifBedeli?: string
  ikinciAvantajliTeklifSahibi?: string
  ikinciAvantajliTeklifBedeli?: string
  tutanakTarihi?: string
  dosyaTarihi?: string
  tutanakSaati?: string
  teklifler?: IhaleKomisyonKarariTekliflerItem[]
  gerekceler?: string
  ihaleKomisyonu?: IhaleKomisyonKarariIhaleKomisyonuItem[]
}
