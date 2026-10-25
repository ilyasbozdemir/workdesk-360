export type ImzaTipi = 'Hazırlayan' | 'Kontrol' | 'Onay'

export type IslakImzaDurum = 'Taslak' | 'CiktiAlindi' | 'Imzada' | 'ImzaliTeslimAlindi'

export interface ImzaciSatiri {
  id: string
  sira: number
  adSoyad: string
  unvan: string
  imzaTipi: ImzaTipi
  parafVar: boolean
  imzaKutusuVar: boolean
  tarihVar: boolean
}

export interface IslakImzaBelgeBilgileri {
  belgeTuru: string
  konu: string
  belgeSayisi: string
  muhatap: string
  hitap: string
  tarih: string
  aciliyet: 'Normal' | 'Acele' | 'Günlüdür'
  ekSayisi: number
  icerikGovde: string
}

export interface SurecAsamasi {
  durum: IslakImzaDurum
  etiket: string
  tarih?: string
  not?: string
  tamamlandi: boolean
}

export interface YuklenenEvrak {
  id: string
  dosyaAdi: string
  boyut: string
  yuklemeTarihi: string
}
