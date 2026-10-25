// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri\tasinir-islem-fisi\index.html.json
export interface TasinirIslemFisiIhtiyacKalemleriItem {
  siraNo?: string
  kodu?: string
  sicilNo?: string
  malzemeAdi?: string
  birimi?: string
  miktar?: string
  birimFiyat?: string
  toplamBedel?: string
}

export interface ITasinirIslemFisi {
  fisNo?: string
  fisTarihi?: string
  dosyaTarihi?: string
  ilIlce?: string
  ilIlceKodu?: string
  kurumAdi?: string
  harcamaBirimiAdi?: string
  harcamaBirimiKodu?: string
  tasinirAmbariAdi?: string
  tasinirAmbariKodu?: string
  muhasebeBirimiAdi?: string
  muhasebeBirimiKodu?: string
  muayeneTarihi?: string
  muayeneSayisi?: string
  faturaTarihi?: string
  faturaNo?: string
  islemCesidi?: string
  neredenGeldigi?: string
  kimeVerildigi?: string
  nereyeVerildigi?: string
  gonderHarcamaBirimiAdi?: string
  gonderHarcamaBirimiKodu?: string
  gonderTasinirAmbariAdi?: string
  gonderTasinirAmbariKodu?: string
  gonderMuhasebeBirimiAdi?: string
  gonderMuhasebeBirimiKodu?: string
  kalemSayisi?: string
  toplamMiktar?: string
  genelToplam?: string
  yukleniciFirma?: string
  ihtiyacKalemleri?: TasinirIslemFisiIhtiyacKalemleriItem[]
  girisKayitTarihi?: string
  girisKontrolYetkilisiAdi?: string
  girisKontrolYetkilisiUnvan?: string
  cikisKayitTarihi?: string
  cikisKontrolYetkilisiAdi?: string
  cikisKontrolYetkilisiUnvan?: string
  teslimEdenTarihi?: string
  teslimEdenAdi?: string
  teslimEdenUnvan?: string
  teslimAlanTarihi?: string
  teslimAlanAdi?: string
  teslimAlanUnvan?: string
  onayTarihi?: string
  baskanAdi?: string
  baskanUnvan?: string
}
