import { HakedisKalem, FiyatFarkiParametreleri, KesintiParametreleri } from '../types'

export interface MetrajCalculationResult {
  buHakedisImalatTutari: number
  oncekiImalatTutari: number
  kumulatifImalatTutari: number
  kalemDetaylari: Array<{
    id: string
    pozNo: string
    toplamMetraj: number
    oncekiTutar: number
    buHakedisTutar: number
    toplamTutar: number
    gerceklesmeYuzdesi: number
  }>
}

export interface FiyatFarkiCalculationResult {
  fiyatFarkiTutari: number
  endeksKatsayisiPn: number
  agirlikliOran: number
  endeksArtisOrani: number
}

export interface KesintiVeNetCalculationResult {
  brutHakedisTutari: number // İmalat + Fiyat Farkı
  hesaplananStopaj: number
  hesaplananDamga: number
  hesaplananKararPulu: number
  hesaplananKdv: number
  hesaplananKdvTevkifat: number
  hesaplananTeminatKesintisi: number
  toplamYasalKesintiler: number
  toplamKesintiler: number
  netOdenecekTutar: number
  odenecekKdv: number
}

/**
 * 1. Yeşil Defter Metraj ve İmalat Tutarları Hesabı
 */
export function calculateMetrajTotals(kalemler: HakedisKalem[]): MetrajCalculationResult {
  let buHakedisImalatTutari = 0
  let oncekiImalatTutari = 0
  let kumulatifImalatTutari = 0

  const kalemDetaylari = kalemler.map((k) => {
    const onceki = Number(k.oncekiMetraj) || 0
    const buHakedis = Number(k.buHakedisMetraj) || 0
    const bf = Number(k.birimFiyat) || 0
    const sozlesmeMiktar = Number(k.sozlesmeMiktar) || 0

    const toplamMetraj = onceki + buHakedis
    const oncekiTutar = onceki * bf
    const buHakedisTutar = buHakedis * bf
    const toplamTutar = toplamMetraj * bf
    const gerceklesmeYuzdesi = sozlesmeMiktar > 0 ? (toplamMetraj / sozlesmeMiktar) * 100 : 0

    buHakedisImalatTutari += buHakedisTutar
    oncekiImalatTutari += oncekiTutar
    kumulatifImalatTutari += toplamTutar

    return {
      id: k.id,
      pozNo: k.pozNo,
      toplamMetraj,
      oncekiTutar,
      buHakedisTutar,
      toplamTutar,
      gerceklesmeYuzdesi
    }
  })

  return {
    buHakedisImalatTutari,
    oncekiImalatTutari,
    kumulatifImalatTutari,
    kalemDetaylari
  }
}

/**
 * 2. 4734 Sayılı Kanun Madde 8 / TÜİK Yİ-ÜFE Endeksli Fiyat Farkı Hesabı
 * Formül: F = B * (Pn - 1) * Ağırlıklı Oran
 * Pn = In / I0
 */
export function calculateFiyatFarki(
  buHakedisImalatTutari: number,
  params: FiyatFarkiParametreleri
): FiyatFarkiCalculationResult {
  if (!params.aktifMi || params.temelEndeksI0 <= 0 || buHakedisImalatTutari <= 0) {
    return {
      fiyatFarkiTutari: 0,
      endeksKatsayisiPn: 1,
      agirlikliOran: 0,
      endeksArtisOrani: 0
    }
  }

  const endeksArtisOrani = params.guncelEndeksIn / params.temelEndeksI0 - 1
  const agirlikliOran =
    (Number(params.iscilikKatsayisiA1) || 0) +
    (Number(params.malzemeKatsayisiA2) || 0) +
    (Number(params.akaryakitKatsayisiB1) || 0) +
    (Number(params.makineKatsayisiB2) || 0)

  const fiyatFarkiTutari = Math.max(0, buHakedisImalatTutari * endeksArtisOrani * agirlikliOran)

  return {
    fiyatFarkiTutari,
    endeksKatsayisiPn: params.guncelEndeksIn / params.temelEndeksI0,
    agirlikliOran,
    endeksArtisOrani
  }
}

/**
 * 3. 5018 Sayılı Kanun & 193 Sayılı Gelir Vergisi Kanununa Göre Hakediş Kesintileri ve Net Tutar
 */
export function calculateKesintilerVeNet(
  brutHakedisTutari: number, // İmalat Tutarı + Fiyat Farkı
  params: KesintiParametreleri
): KesintiVeNetCalculationResult {
  const brut = Math.max(0, brutHakedisTutari)

  const stopajOrani = Number(params.stopajOrani) || 0
  const damgaOrani = Number(params.damgaVergisiOrani) || 0
  const kararPuluOrani = Number(params.kararPuluOrani) || 0
  const kdvOrani = Number(params.kdvOrani) || 0
  const pay = Number(params.kdvTevkifatOraniPay) || 0
  const payda = Number(params.kdvTevkifatOraniPayda) || 1
  const teminatOrani = Number(params.teminatKesintisiOrani) || 0
  const avansMahsubu = Number(params.avansMahsubu) || 0
  const cezaKesintisi = Number(params.cezaVeDigerKesintiler) || 0

  const hesaplananStopaj = brut * stopajOrani
  const hesaplananDamga = brut * damgaOrani
  const hesaplananKararPulu = brut * kararPuluOrani
  const hesaplananTeminatKesintisi = brut * teminatOrani

  const hesaplananKdv = brut * kdvOrani
  const hesaplananKdvTevkifat = payda > 0 ? (hesaplananKdv * pay) / payda : 0
  const odenecekKdv = Math.max(0, hesaplananKdv - hesaplananKdvTevkifat)

  const toplamYasalKesintiler =
    hesaplananStopaj +
    hesaplananDamga +
    hesaplananKararPulu +
    hesaplananKdvTevkifat +
    hesaplananTeminatKesintisi

  const toplamKesintiler = toplamYasalKesintiler + avansMahsubu + cezaKesintisi

  // Net Ödenecek = (Brüt + KDV) - Toplam Kesintiler
  const netOdenecekTutar = Math.max(0, brut + hesaplananKdv - toplamKesintiler)

  return {
    brutHakedisTutari: brut,
    hesaplananStopaj,
    hesaplananDamga,
    hesaplananKararPulu,
    hesaplananKdv,
    hesaplananKdvTevkifat,
    hesaplananTeminatKesintisi,
    toplamYasalKesintiler,
    toplamKesintiler,
    netOdenecekTutar,
    odenecekKdv
  }
}
