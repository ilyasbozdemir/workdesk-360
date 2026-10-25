/**
 * resources/templates klasör yapısından türetilmiş sabit şablon kaydı.
 * Klasör adı → kategori adı ve içindeki şablon dizin adları.
 */

export interface SablonKategori {
  kategori: string
  klasorAdi: string
  sablonlar: string[]
}

export const SABLON_KATEGORILERI: SablonKategori[] = [
  {
    kategori: '1. İhtiyaç Tespiti & Başlangıç',
    klasorAdi: '1-ihtiyac-tespiti-ve-baslangic',
    sablonlar: [
      'harcama-talimati',
      'ihtiyac-listesi',
      'ihtiyac-talep-formu',
      'komisyon-gorevlendirme-onayi',
      'komisyon-gorevlendirme-onayi-eki',
      'luzum-muzekkeresi',
      'luzum-muzekkeresi-onay-eki',
      'luzum-muzekkeresi-teslim-tesellum',
      'son-alim-fiyat-cetveli'
    ]
  },
  {
    kategori: '2. Piyasa Fiyat Araştırması',
    klasorAdi: '2-piyasa-fiyat-arastirmasi',
    sablonlar: [
      'arastirma-mektubu',
      'birim-fiyat-teklif-cetveli',
      'birim-fiyat-teklif-mektubu',
      'dagitim-cizelgesi',
      'dagitim-cizelgesi-karma',
      'fiyat-arastirma-mektubu',
      'fiyat-arastirmasi',
      'piyasa-fiyat-arastirma-gorevlendirmesi',
      'piyasa-fiyat-arastirma-tutanagi',
      'teklif-mektubu-dagitim-cizelgesi',
      'yaklasik-maliyet-cetveli',
      'yaklasik-maliyet-teklif-mektubu'
    ]
  },
  {
    kategori: '3. Sipariş & Sözleşme',
    klasorAdi: '3-siparis-ve-sozlesme',
    sablonlar: [
      'butce-sorgusu',
      'dogrudan-temin-onay-belgesi',
      'dogrudan-temin-sonuc-onay-belgesi',
      'dogrudan-temin-sozlesmesi',
      'dogrudan-temin-sozlesmesi-alternatif',
      'dogrudan-temin-sozlesmesi-uzun',
      'idare-onay-belgesi',
      'ihale-komisyon-karari',
      'kabul-edilen-teklif',
      'kabul-edilen-teklif-alternatif',
      'sozlesmeye-davet',
      'teklif-mektubu'
    ]
  },
  {
    kategori: '4. Muayene & Kabul & Ödeme İşlemleri',
    klasorAdi: '4-kabul-ve-odeme-islemleri',
    sablonlar: [
      'banka-degisiklik-bildirimi',
      'gunluk-calisma-puantaj-cizelgesi',
      'hakedis-raporu',
      'harcama-pusulasi',
      'hizmet-isleri-kabul-teklif-belgesi',
      'hizmet-isleri-kabul-tutanagi',
      'is-deneyim-belgesi-talebi',
      'kesin-teminat-iadesi',
      'kik048-yapim-gecici-kabul-teklif',
      'kik049-yapim-gecici-kabul-tutanagi',
      'kik050-yapim-kesin-kabul-teklif',
      'kik051-yapim-kesin-kabul-tutanagi',
      'muayene-kabul-komisyonu',
      'muayene-kabul-tutanagi',
      'odeme-emri-belgesi',
      'odeme-talep-dilekcesi',
      'odeme-yazisi',
      'sure-uzatim-talebi',
      'tasinir-islem-fisi'
    ]
  },
  {
    kategori: '5. Klasör & Kapaklar (BETA)',
    klasorAdi: '5-klasor-ve-kapaklar',
    sablonlar: [
      'ihale-kapagi',
      'kapak-ici-indeks-sablonu',
      'klasor-sirtligi-3cm',
      'klasor-sirtligi-5cm',
      'klasor-sirtligi-7-5cm'
    ]
  }
]

/** Şablon dosya adından kategori adını döndürür */
export const SABLON_DOSYAADI_KATEGORI: Record<string, string> = Object.fromEntries(
  SABLON_KATEGORILERI.flatMap((kat) => kat.sablonlar.map((dosyaAdi) => [dosyaAdi, kat.kategori]))
)

/** Kategori adlarının sıralı listesi (UI grupları için) */
export const KATEGORI_SIRASI: string[] = SABLON_KATEGORILERI.map((k) => k.kategori)
