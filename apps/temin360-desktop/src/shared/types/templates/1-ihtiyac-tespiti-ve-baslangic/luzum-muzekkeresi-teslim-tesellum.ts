// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\luzum-muzekkeresi-teslim-tesellum\index.html.json
export interface LuzumMuzekkeresiTeslimTesellumTeslimEdenlerItem {
  adSoyad?: string
  unvan?: string
}

export interface LuzumMuzekkeresiTeslimTesellumTeslimAlanlarItem {
  adSoyad?: string
  unvan?: string
}

export interface LuzumMuzekkeresiTeslimTesellumIhtiyacKalemleriItem {
  siraNo?: number
  kodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  kdvOrani?: string
  miktar?: number
}

export interface ILuzumMuzekkeresiTeslimTesellum {
  antetSatirlari?: string[]
  dosyaKonusu?: string
  isinAdi?: string
  isinDegeri?: string
  dosyaNumarasi?: object
  kurumumuz?: string
  dosyaTarihi?: string
  solLogo?: string
  sagLogo?: string
  ihtiyacKalemleri?: LuzumMuzekkeresiTeslimTesellumIhtiyacKalemleriItem[]
  teslimAlanlar?: LuzumMuzekkeresiTeslimTesellumTeslimAlanlarItem[]
  teslimEdenler?: LuzumMuzekkeresiTeslimTesellumTeslimEdenlerItem[]
}
