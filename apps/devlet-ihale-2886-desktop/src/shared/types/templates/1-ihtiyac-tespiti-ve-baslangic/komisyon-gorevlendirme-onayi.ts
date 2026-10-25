// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\komisyon-gorevlendirme-onayi\index.html.json
export interface KomisyonGorevlendirmeOnayiMuayeneKomisyonuItem {
  gorevi?: string
  adSoyad?: string
  unvan?: string
}

export interface KomisyonGorevlendirmeOnayiFiyatKomisyonuItem {
  gorevi?: string
  adSoyad?: string
  unvan?: string
}

export interface IKomisyonGorevlendirmeOnayi {
  kurumUst?: string
  kurumAdi?: string
  mudurluk?: string
  kurumumuz?: string
  alimTuru?: string
  evrakSayisi?: string
  tarih?: string
  dosyaTarihi?: string
  isAdi?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  fiyatKomisyonu?: KomisyonGorevlendirmeOnayiFiyatKomisyonuItem[]
  muayeneKomisyonu?: KomisyonGorevlendirmeOnayiMuayeneKomisyonuItem[]
  baskanAdi?: string
  baskanUnvan?: string
  solLogo?: string
  sagLogo?: string
  kurumIci?: boolean
}
