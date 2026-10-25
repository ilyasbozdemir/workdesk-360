// Kaynak: resources/templates/4-kabul-ve-odeme-islemleri/gunluk-calisma-puantaj-cizelgesi/index.html.json

export interface IHizmetKalemiItem {
  siraNo?: number | string
  kalemAdi?: string
  ozelligi?: string
  d1?: string
  d2?: string
  d3?: string
  d4?: string
  d5?: string
  d6?: string
  d7?: string
  d8?: string
  d9?: string
  d10?: string
  d11?: string
  d12?: string
  d13?: string
  d14?: string
  d15?: string
  d16?: string
  d17?: string
  d18?: string
  d19?: string
  d20?: string
  d21?: string
  d22?: string
  d23?: string
  d24?: string
  d25?: string
  d26?: string
  d27?: string
  d28?: string
  d29?: string
  d30?: string
  d31?: string
  toplamMiktar?: string | number
  birim?: string
  aciklama?: string
}

export interface IPuantajPersonelItem {
  siraNo?: number | string
  adSoyad?: string
  gorevi?: string
  d1?: string
  d2?: string
  d3?: string
  d4?: string
  d5?: string
  d6?: string
  d7?: string
  d8?: string
  d9?: string
  d10?: string
  d11?: string
  d12?: string
  d13?: string
  d14?: string
  d15?: string
  d16?: string
  d17?: string
  d18?: string
  d19?: string
  d20?: string
  d21?: string
  d22?: string
  d23?: string
  d24?: string
  d25?: string
  d26?: string
  d27?: string
  d28?: string
  d29?: string
  d30?: string
  d31?: string
  toplamGun?: string | number
  aciklama?: string
}

export interface IGunlukCalismaPuantajCizelgesi {
  kurumAdi?: string
  belgeBasligi?: string
  dosyaKonusu?: string
  isinAdi?: string
  yukleniciFirma?: string
  ayYil?: string
  hizmetYeri?: string
  teminNo?: string
  sozlesmeTarihi?: string
  kontrolGorevlisi?: string
  baskanAdi?: string
  kalemBasligi?: string
  ozellikBasligi?: string
  lejantMetni?: string
  kabulBeyani?: string
  yukleniciUnvan?: string
  kontrolUnvan?: string
  komisyonUnvan?: string
  hizmetKalemleri?: IHizmetKalemiItem[]
  personeller?: IPuantajPersonelItem[]
}
