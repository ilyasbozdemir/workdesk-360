// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\son-alim-fiyat-cetveli\index.html.json
export interface SonAlimFiyatCetveliFiyatKalemleriItem {
  siraNo?: number
  malzemeKodu?: string
  malzemeAdi?: string
  ozelligi?: string
  birimi?: string
  kdvOrani?: string
  miktar?: number
  birimFiyat?: string
  toplamTutar?: string
  kazananFirma?: string
  alimTarihi?: string
}

export interface ISonAlimFiyatCetveli {
  antetSatirlari?: string[]
  evrakSayisi?: string
  dosyaKonusu?: string
  tarih?: string
  kurumIci?: boolean
  kurumAdres?: string
  kurumTelefon?: string
  kurumWeb?: string
  kurumEposta?: string
  kurumKep?: string
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  kontrolEdenPersonelAdi?: string
  kontrolEdenPersonelUnvan?: string
  solLogo?: string
  sagLogo?: string
  fiyatKalemleri?: SonAlimFiyatCetveliFiyatKalemleriItem[]
  genelToplam?: string
  olurYazisi?: boolean
  dosyaTarihi?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  hazirlayanTelefon?: string
  hazirlayanEposta?: string
}
