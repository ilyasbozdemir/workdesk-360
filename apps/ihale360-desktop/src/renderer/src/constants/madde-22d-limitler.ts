// =============================================
// 4734 / 22-d PARASAL LİMİTLER
// Her yıl 1 Şubat'ta Yİ-ÜFE oranıyla KİK tarafından güncellenir
// =============================================

// Limit kategorileri — tutarlar uygulama ayarlarından okunur
export interface LimitKategorisi {
  kod: string
  aciklama: string
  kdv_dahil: boolean
}

export const MADDE_22D_KATEGORILER: Record<string, LimitKategorisi> = {
  // 22d* → Büyükşehir belediyesi sınırları dahilindeki idareler
  BUYUKSEHIR_SINIRI_DAHIL: {
    kod: '22d*',
    aciklama: 'Büyükşehir Belediyesi Sınırları Dahilinde Bulunan İdareler',
    kdv_dahil: false
  },

  // 22d** → Diğer idareler
  DIGER_IDARELER: {
    kod: '22d**',
    aciklama: 'Diğer İdareler',
    kdv_dahil: false
  }
} as const

// Geçerlilik dönem yapısı
export interface LimitDonemi {
  yil: number
  gecerlilik_baslangic: string // ISO date: YYYY-MM-DD
  gecerlilik_bitis: string // ISO date: YYYY-MM-DD
  guncelleme_orani: string
}

// Standart dönem bilgisi — her yıl 1 Şubat - 31 Ocak arası
export const AKTIF_DONEM: LimitDonemi = {
  yil: 2026,
  gecerlilik_baslangic: '2026-02-01',
  gecerlilik_bitis: '2027-01-31',
  guncelleme_orani: 'Yİ-ÜFE (TÜİK)'
}

// Yüzde sınırı — Yıllık toplam bütçe ödeneğinin %10'unu geçemez
export const YUZDE_SINIRI = 10

// Doğrudan temin yapılabilecek işlem türleri (22-d kapsamı)
export const ISLEM_TURLERI = [
  { kod: 'M', aciklama: 'Mal Alımı' },
  { kod: 'H', aciklama: 'Hizmet Alımı' },
  { kod: 'Y', aciklama: 'Yapım İşi' },
  { kod: 'T', aciklama: 'Temsil, Ağırlama, Konaklama, Seyahat ve İaşe' }
] as const
