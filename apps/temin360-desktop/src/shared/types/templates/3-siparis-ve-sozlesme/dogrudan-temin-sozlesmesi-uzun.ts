// Kaynak: resources/templates/3-siparis-ve-sozlesme\dogrudan-temin-sozlesmesi-uzun\index.html.json
export interface DogrudanTeminSozlesmesiUzunIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: string
}

export interface IDogrudanTeminSozlesmesiUzun {
  kurumAdi?: string
  isinAdi?: string
  yukleniciFirma?: string
  idareAdresi?: string
  idareTelefon?: string
  idareFaks?: string
  idareEposta?: string
  yukleniciAdresi?: string
  yukleniciIlce?: string
  yukleniciIl?: string
  yukleniciTelefon?: string
  yukleniciFaks?: string
  yukleniciEposta?: string
  kalemSayisi?: string
  nitelikAciklama?: string
  genelToplam?: string
  sozlesmeSuresi?: string
  digerGiderler?: string
  malTeslimYeri?: string
  iseBaslamaTarihi?: string
  teslimProgrami?: string
  iadeSartlari?: string
  odemeYeri?: string
  odemeSartlari?: string
  avansSartlari?: string
  fiyatFarki?: string
  gecikmeCezaOrani?: string
  sureUzatimi?: string
  yukleniciYukumlulukleri?: string
  muayene?: string
  digerHususlar?: string
  kurumIlce?: string
  sozlesmeTarihi?: string
  baskanAdi?: string
  baskanUnvan?: string
  ihtiyacKalemleri?: DogrudanTeminSozlesmesiUzunIhtiyacKalemleriItem[]
}
