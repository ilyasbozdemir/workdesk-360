// Kaynak: resources/templates/3-siparis-ve-sozlesme\dogrudan-temin-sozlesmesi-alternatif\index.html.json
export interface DogrudanTeminSozlesmesiAlternatifIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  enDusukFiyat?: string
  miktar?: string
  toplamBedel?: string
}

export interface IDogrudanTeminSozlesmesiAlternatif {
  kurumAdi?: string
  isinAdi?: string
  yukleniciFirma?: string
  idareAdresi?: string
  idareTelefon?: string
  idareFaks?: string
  idareEposta?: string
  idareVergiDairesi?: string
  idareVergiNo?: string
  yukleniciAdresi?: string
  yukleniciIlce?: string
  yukleniciIl?: string
  yukleniciTelefon?: string
  yukleniciFaks?: string
  yukleniciEposta?: string
  yukleniciVergiDairesi?: string
  yukleniciVergiNo?: string
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
  odemeSartlari2?: string
  avansSartlari?: string
  fiyatFarki?: string
  gecikmeCezaOrani?: string
  sureUzatimi?: string
  yukleniciYukumlulukleri?: string
  muayene?: string
  digerHususlar?: string
  kurumIlce?: string
  sozlesmeTarihi?: string
  nusha?: string
  baskanAdi?: string
  baskanUnvan?: string
  ihtiyacKalemleri?: DogrudanTeminSozlesmesiAlternatifIhtiyacKalemleriItem[]
}
