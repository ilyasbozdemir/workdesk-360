// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri\odeme-talep-dilekcesi\index.html.json
export interface IOdemeTalepDilekcesi {
  dilekceTarihi?: string
  kurumAdi?: string
  birimAdi?: string
  yukleniciFirma?: string
  yukleniciVergiNo?: string
  yukleniciVergiDairesi?: string
  yukleniciTelefon?: string
  yukleniciAdresi?: string
  dosyaKonusu?: string
  evrakSayisi?: string
  teslimTarihi?: string
  isMal?: boolean
  kabulTarihi?: string
  faturaTarihi?: string
  faturaNo?: string
  genelToplam?: string
  kdvDahilToplam?: string
  bankaAdi?: string
  subeAdi?: string
  subeKodu?: string
  iban?: string
  hesapSahibi?: string
  ekler?: string[]
}
