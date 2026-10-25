// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri\hizmet-isleri-kabul-teklif-belgesi\index.html.json
export interface HizmetIsleriKabulTeklifBelgesiMuayeneKomisyonuItem {
  gorevi?: string
  adSoyad?: string
  unvan?: string
}

export interface IHizmetIsleriKabulTeklifBelgesi {
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
  dilekceTarihi?: string
  baskanAdi?: string
  baskanUnvan?: string
  onIncelemeTarihi?: string
  dosyaTarihi?: string
  muayeneKomisyonu?: HizmetIsleriKabulTeklifBelgesiMuayeneKomisyonuItem[]
}
