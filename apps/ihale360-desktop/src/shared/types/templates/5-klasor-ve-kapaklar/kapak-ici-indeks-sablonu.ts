// Kaynak: resources/templates/5-klasor-ve-kapaklar\kapak-ici-indeks-sablonu\index.html.json
export interface KapakIciIndeksSablonuEvraklarItem {
  sira?: string
  tarih?: string
  sayi?: string
  konu?: string
  sayfa?: string
}

export interface IKapakIciIndeksSablonu {
  kurumAdi?: string
  birimAdi?: string
  klasorBasligi?: string
  isAdi?: string
  kararNo?: string
  klasorNo?: string
  arsivNo?: string
  tarih?: string
  tabloBasliklar?: object
  evraklar?: KapakIciIndeksSablonuEvraklarItem[]
}
