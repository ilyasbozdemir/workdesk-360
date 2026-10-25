// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri\muayene-kabul-komisyonu\index.html.json
export interface MuayeneKabulKomisyonuDagitimListesiItem {
  adSoyad?: string
  unvan?: string
}

export interface MuayeneKabulKomisyonuGorevlendirilenlerItem {
  adSoyad?: string
  unvan?: string
  hasMore?: boolean
}

export interface IMuayeneKabulKomisyonu {
  antetSatirlari?: string[]
  dosyaNumarasi?: object
  detsisNo?: string
  dosyaKonusu?: string
  dosyaTarihi?: string
  kurumumuz?: string
  isinAdi?: string
  onayBelgesiTarihi?: string
  onayBelgesiNo?: string
  onayBelgesiYili?: string
  kanunMaddesi?: string
  solLogo?: string
  sagLogo?: string
  gorevlendirilenler?: MuayeneKabulKomisyonuGorevlendirilenlerItem[]
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  hazirlayanTelefon?: string
  hazirlayanEposta?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  dagitimListesi?: MuayeneKabulKomisyonuDagitimListesiItem[]
  kurumAdres?: string
  kurumTelefon?: string
  kurumFaks?: string
  kurumWeb?: string
  kurumEposta?: string
  kurumKep?: string
  kurumIci?: boolean
}
