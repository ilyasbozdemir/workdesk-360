// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\komisyon-gorevlendirme-onayi-eki\index.html.json
export interface KomisyonGorevlendirmeOnayiEkiMuayeneKomisyonuItem {
  gorevi?: string
  adSoyad?: string
  unvan?: string
}

export interface KomisyonGorevlendirmeOnayiEkiFiyatKomisyonuItem {
  gorevi?: string
  adSoyad?: string
  unvan?: string
}

export interface IKomisyonGorevlendirmeOnayiEki {
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  kurumumuz?: string
  alimTuru?: string
  ekNo?: string
  evrakSayisi?: string
  tarih?: string
  dosyaTarihi?: string
  isAdi?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  fiyatKomisyonu?: KomisyonGorevlendirmeOnayiEkiFiyatKomisyonuItem[]
  muayeneKomisyonu?: KomisyonGorevlendirmeOnayiEkiMuayeneKomisyonuItem[]
  baskanAdi?: string
  baskanUnvan?: string
  solLogo?: string
  sagLogo?: string
  kurumIci?: boolean
}
