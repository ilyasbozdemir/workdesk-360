// =============================================
// EKAP DÖNEM TİPİ — Ayarlardan okunur, varsayılan aşağıdaki kural
// =============================================

export interface EkapDonemKurali {
  baslangic_ay: number // 1-12, varsayılan: 2 (Şubat)
  baslangic_gun: number // varsayılan: 1
  bitis_ay: number // varsayılan: 1 (Ocak)
  bitis_gun: number // varsayılan: 31
}

// Varsayılan EKAP kuralı: 1 Şubat - 31 Ocak
export const VARSAYILAN_EKAP_DONEM_KURALI: EkapDonemKurali = {
  baslangic_ay: 2,
  baslangic_gun: 1,
  bitis_ay: 1,
  bitis_gun: 31
}

/**
 * donem_kodu (örn: "2027") + EKAP kuralına göre tarih aralığını otomatik üretir
 * "2027" dönemi -> 01.02.2027 - 31.01.2028 (bitiş yılı +1)
 */
export function donemTarihAraligiUret(
  donemKodu: string,
  kural: EkapDonemKurali = VARSAYILAN_EKAP_DONEM_KURALI
): { baslangic_tarihi: string; bitis_tarihi: string } {
  const yil = parseInt(donemKodu, 10)
  if (isNaN(yil)) {
    throw new Error(`Geçersiz dönem kodu: ${donemKodu}`)
  }

  const pad = (n: number): string => n.toString().padStart(2, '0')

  const baslangic_tarihi = `${yil}-${pad(kural.baslangic_ay)}-${pad(kural.baslangic_gun)}`

  // Bitiş ayı, başlangıç ayından küçük veya eşitse (örn Şubat -> Ocak), bitiş yılı +1 olur
  const bitisYili = kural.bitis_ay <= kural.baslangic_ay ? yil + 1 : yil
  const bitis_tarihi = `${bitisYili}-${pad(kural.bitis_ay)}-${pad(kural.bitis_gun)}`

  return { baslangic_tarihi, bitis_tarihi }
}
