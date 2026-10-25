// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri\hizmet-isleri-kabul-tutanagi\index.html.json
export interface HizmetIsleriKabulTutanagiMuayeneKomisyonuItem {
  gorevi?: string
  adSoyad?: string
  unvan?: string
}

export interface IHizmetIsleriKabulTutanagi {
  dosyaKonusu?: string
  yukleniciFirma?: string
  sozlesmeTarihi?: string
  genelToplam?: string
  sozlesmeBedeli?: string
  sozlesmeSuresi?: string
  sozlesmeBitisTarihi?: string
  sureUzatimlari?: string
  sureUzatimliBitisTarihi?: string
  isinBitirildigiTarih?: string
  kurumAdi?: string
  ancakMetni?: string
  bitimTarihi?: string
  nushaSayisi?: string
  duzenlemeTarihi?: string
  dosyaTarihi?: string
  onayTarihi?: string
  baskanAdi?: string
  baskanUnvan?: string
  muayeneKomisyonu?: HizmetIsleriKabulTutanagiMuayeneKomisyonuItem[]
}
