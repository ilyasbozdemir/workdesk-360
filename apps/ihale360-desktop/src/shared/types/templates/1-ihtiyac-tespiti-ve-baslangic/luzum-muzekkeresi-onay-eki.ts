// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\luzum-muzekkeresi-onay-eki\index.html.json
export interface LuzumMuzekkeresiOnayEkiIhtiyacKalemleriItem {
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  kdvOrani?: string
  miktar?: number
}

export interface ILuzumMuzekkeresiOnayEki {
  antetSatirlari?: string[]
  ekNo?: string
  kurumAdi?: string
  dosyaKonusu?: string
  talepEdenPersonelAdi?: string
  talepEdenPersonelUnvan?: string
  solLogo?: string
  sagLogo?: string
  ihtiyacKalemleri?: LuzumMuzekkeresiOnayEkiIhtiyacKalemleriItem[]
  dosyaTarihi?: string
}
