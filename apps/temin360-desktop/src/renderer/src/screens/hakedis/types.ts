export interface HakedisKalem {
  id: string
  pozNo: string
  aciklama: string
  birim: string
  sozlesmeMiktar: number
  birimFiyat: number
  oncekiMetraj: number
  buHakedisMetraj: number
}

export interface FiyatFarkiParametreleri {
  aktifMi: boolean
  temelEndeksI0: number // İhale ayı Yİ-ÜFE
  guncelEndeksIn: number // Hakediş ayı Yİ-ÜFE
  iscilikKatsayisiA1: number // a1
  malzemeKatsayisiA2: number // a2
  akaryakitKatsayisiB1: number // b1
  makineKatsayisiB2: number // b2
}

export interface KesintiParametreleri {
  stopajOrani: number // %5 (0.05)
  damgaVergisiOrani: number // ‰ 9.48 (0.00948)
  kararPuluOrani: number // ‰ 5.69 (0.00569)
  kdvOrani: number // %20 (0.20)
  kdvTevkifatOraniPay: number // 5 (5/10)
  kdvTevkifatOraniPayda: number // 10
  avansMahsubu: number
  cezaVeDigerKesintiler: number
  teminatKesintisiOrani: number // %6 nakit teminat kesintisi varsa
}

export interface HakedisBilgileri {
  hakedisNo: number
  hakedisTarihi: string
  hakedisTuru: 'ara_hakedis' | 'kesin_hakedis'
  dosyaId?: string | number | null
  dosyaNo: string
  isAdi: string
  yukleniciFirma: string
  sozlesmeTarihi: string
  iseBaslamaTarihi: string
  isBitimTarihi: string
  sureUzatimiGun: number
  sozlesmeBedeli: number
  oncekiHakedislerToplami: number
}

