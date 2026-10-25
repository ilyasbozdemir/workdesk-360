// Kaynak: resources/templates/1-ihtiyac-tespiti-ve-baslangic\piyasa-fiyat-arastirma-gorevlendirmesi\index.html.json
export interface PiyasaFiyatArastirmaGorevlendirmesiDagitimListesiItem {
  adSoyad?: string
  unvan?: string
}

export interface PiyasaFiyatArastirmaGorevlendirmesiGorevlendirilenlerItem {
  adSoyad?: string
  unvan?: string
  hasMore?: boolean
}

export interface IPiyasaFiyatArastirmaGorevlendirmesi {
  antetSatirlari?: string[]
  dosyaNumarasi?: object
  detsisNo?: string
  dosyaKonusu?: string
  dosyaTarihi?: string
  kurumumuz?: string
  isinAdi?: string
  solLogo?: string
  sagLogo?: string
  gorevlendirilenler?: PiyasaFiyatArastirmaGorevlendirmesiGorevlendirilenlerItem[]
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  dagitimListesi?: PiyasaFiyatArastirmaGorevlendirmesiDagitimListesiItem[]
  kurumAdres?: string
  kurumTelefon?: string
  kurumFaks?: string
  kurumWeb?: string
  kurumEposta?: string
  kurumKep?: string
  kurumIci?: boolean
  hazirlayanTelefon?: string
  hazirlayanEposta?: string
}
