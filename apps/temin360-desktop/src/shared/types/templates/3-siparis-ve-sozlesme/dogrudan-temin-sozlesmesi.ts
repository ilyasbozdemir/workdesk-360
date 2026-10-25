// Kaynak: resources/templates/3-siparis-ve-sozlesme\dogrudan-temin-sozlesmesi\index.html.json
export interface DogrudanTeminSozlesmesiIhtiyacKalemleriItem {
  siraNo?: number
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  miktar?: string
}

export interface IDogrudanTeminSozlesmesi {
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
  genelToplam?: string
  sozlesmeSuresi?: string
  odemeYeri?: string
  odemeSartlari?: string
  avansSartlari?: string
  destekHizmetleri?: string
  iadeSartlari?: string
  gecikmeCezaOrani?: string
  digerHususlar?: string
  sozlesmeTarihi?: string
  baskanAdi?: string
  baskanUnvan?: string
  kurumIlce?: string
  ihtiyacKalemleri?: DogrudanTeminSozlesmesiIhtiyacKalemleriItem[]
}
