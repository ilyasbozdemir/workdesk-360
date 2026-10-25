/**
 * Şablon Tanımları, Grupları, Kategorileri ve Komisyon Sabitleri
 *
 * Tek Doğruluk Kaynağı (Single Source of Truth)
 * Uygulama genelinde (main & renderer) tüm şablon isimleri ve gruplandırmaları
 * bu dosyadan çekilir, tekrar eden veri kullanılmaz.
 */

export interface TemplateGroupItem {
  dosya_adi: string
  etiket: string
}

export interface TemplateGroup {
  grup: string
  sablonlar: TemplateGroupItem[]
}

/**
 * Tüm HTML şablonlarının dosya/klasör ID'si ile Türkçe resmi adı eşleşmesi.
 */
export const TEMPLATE_NAMES: Record<string, string> = {
  'harcama-talimati': 'STANDART FORM-KİK024.0/M: DOĞRUDAN TEMİN ONAY BELGESİ (HARCAMA TALİMATI)',
  'ihtiyac-listesi': 'STANDART FORM (): İHTİYAÇ LİSTESİ CETVELİ',
  'ihtiyac-talep-formu':
    'STANDART FORM ( - 4734 KİK m.22): İHTİYAÇ BELGESİ VE HARCAMA TALEP MÜZEKKERESİ',
  'komisyon-gorevlendirme-onayi':
    'STANDART FORM (4734 KİK m.22): PİYASA FİYAT ARAŞTIRMASI VE MUAYENE KABUL GÖREVLENDİRME ONAYI',
  'komisyon-gorevlendirme-onayi-eki':
    'STANDART FORM: GÖREVLENDİRİLEN KOMİSYON VE PERSONEL LİSTESİ EKİ',
  'luzum-muzekkeresi': 'STANDART FORM (): LÜZUM MÜZEKKERESİ',
  'luzum-muzekkeresi-onay-eki': 'STANDART FORM: LÜZUM MÜZEKKERESİ ONAY EKİ',
  'luzum-muzekkeresi-teslim-tesellum': 'STANDART FORM: LÜZUM MÜZEKKERESİ TESLİM TESELLÜM TUTANAĞI',
  'son-alim-fiyat-cetveli': 'STANDART FORM: SON ALIM FİYAT ARAŞTIRMA VE MUKAYESE CETVELİ',
  'arastirma-mektubu': 'STANDART FORM-KİK027.0/M: PİYASA FİYAT ARAŞTIRMA VE TEKLİF İSTEME MEKTUBU',
  'birim-fiyat-teklif-cetveli': 'STANDART FORM-KİK015.2/M: BİRİM FİYAT TEKLİF CETVELİ',
  'birim-fiyat-teklif-mektubu': 'STANDART FORM-KİK015.1/M: BİRİM FİYAT TEKLİF MEKTUBU',
  'dagitim-cizelgesi': 'STANDART FORM: TEKLİF İSTEME DAĞITIM ÇİZELGESİ',
  'dagitim-cizelgesi-karma': 'STANDART FORM: TEKLİF İSTEME KARMA DAĞITIM ÇİZELGESİ',
  'fiyat-arastirma-mektubu':
    'STANDART FORM-KİK027.0/M: BİRİM FİYAT TEKLİF MEKTUBU VE FİYAT İSTEME FORMU',
  'fiyat-arastirmasi': 'STANDART FORM-KİK027.0/M: PİYASA FİYAT ARAŞTIRMASI FORMU',
  'piyasa-fiyat-arastirma-gorevlendirmesi':
    'STANDART FORM (4734 KİK m.22): PİYASA FİYAT ARAŞTIRMASI GÖREVLENDİRME ONAYI',
  'piyasa-fiyat-arastirma-tutanagi':
    'STANDART FORM (MYHBY ÖRNEK NO: 2): PİYASA FİYAT ARAŞTIRMASI TUTANAĞI',
  'teklif-mektubu-dagitim-cizelgesi': 'STANDART FORM: TEKLİF MEKTUBU DAĞITIM ÇİZELGESİ',
  'yaklasik-maliyet-cetveli': 'STANDART FORM-KİK002.0/M: YAKLAŞIK MALİYET HESAP CETVELİ',
  'yaklasik-maliyet-teklif-mektubu':
    'STANDART FORM-KİK002.1/M: YAKLAŞIK MALİYET FİYAT TEKLİF İSTEME MEKTUBU',
  'butce-sorgusu': 'STANDART FORM: BÜTÇE ÖDENEK KONTROL VE BLOKE BELGESİ',
  'dogrudan-temin-onay-belgesi':
    'STANDART FORM-KİK024.0/M: DOĞRUDAN TEMİN ONAY BELGESİ (HARCAMA TALİMATI)',
  'dogrudan-temin-sonuc-onay-belgesi':
    'STANDART FORM (4734 KİK m.22): PİYASA FİYAT ARAŞTIRMASI SONUÇ ONAY BELGESİ',
  'dogrudan-temin-sozlesmesi':
    'STANDART FORM-KİK: DOĞRUDAN TEMİN MAL / HİZMET ALIMI TİP SÖZLEŞMESİ',
  'dogrudan-temin-sozlesmesi-alternatif':
    'STANDART FORM-KİK: DOĞRUDAN TEMİN ALTERNATİF ALIM SÖZLEŞMESİ',
  'dogrudan-temin-sozlesmesi-uzun':
    'STANDART FORM-KİK: DOĞRUDAN TEMİN TİP İDARİ SÖZLEŞMESİ (KAPSAMLI)',
  'idare-onay-belgesi': 'STANDART FORM-KİK001.0/M: İHALE ONAY BELGESİ (HARCAMA TALİMATI)',
  'ihale-komisyon-karari': 'STANDART FORM-KİK018.0/M: İHALE KOMİSYONU KARARI',
  'kabul-edilen-teklif':
    'STANDART FORM (KİK TEBLİĞİ m.22): SİPARİŞ MEKTUBU VE TEBLİĞ-TEBELLÜĞ BELGESİ',
  'kabul-edilen-teklif-alternatif': 'STANDART FORM (KİK TEBLİĞİ m.22): SİPARİŞ FORMU (ALTERNATİF)',
  'sozlesmeye-davet': 'STANDART FORM-KİK023.0/M: SÖZLEŞMEYE DAVET MEKTUBU',
  'teklif-mektubu': 'STANDART FORM-KİK015.1/M: GÖTÜRÜ BEDEL / BİRİM FİYAT TEKLİF MEKTUBU',
  'gunluk-calisma-puantaj-cizelgesi': 'STANDART FORM: GÜNLÜK ÇALIŞMA PUANTAJ ÇİZELGESİ',
  'hakedis-raporu': 'STANDART FORM (MYHBY ÖRNEK NO: 4): HAKEDİŞ RAPORU VE İCMAL CETVELİ',
  'harcama-pusulasi': 'STANDART FORM (MYHBY ÖRNEK NO: 3): HARCAMA PUSULASI VE KLASÖR DİZİ FİHRİSTİ',
  'hizmet-isleri-kabul-teklif-belgesi':
    'STANDART FORM-KİK047.0/H: HİZMET İŞLERİ KABUL TEKLİF BELGESİ',
  'hizmet-isleri-kabul-tutanagi': 'STANDART FORM-KİK048.0/H: HİZMET İŞLERİ KABUL TUTANAĞI',
  'kik048-yapim-gecici-kabul-teklif':
    'STANDART FORM-KİK048.0/Y: YAPIM İŞLERİ GEÇİCİ KABUL TEKLİF BELGESİ',
  'kik049-yapim-gecici-kabul-tutanagi':
    'STANDART FORM-KİK049.0/Y: YAPIM İŞLERİ GEÇİCİ KABUL TUTANAĞI',
  'kik050-yapim-kesin-kabul-teklif':
    'STANDART FORM-KİK050.0/Y: YAPIM İŞLERİ KESİN KABUL TEKLİF BELGESİ',
  'kik051-yapim-kesin-kabul-tutanagi':
    'STANDART FORM-KİK051.0/Y: YAPIM İŞLERİ KESİN KABUL TUTANAĞI',
  'muayene-kabul-komisyonu': 'STANDART FORM-KİK054.0/M: MUAYENE VE KABUL KOMİSYON KARARI',
  'muayene-kabul-tutanagi':
    'STANDART FORM-KİK054.0/M: MAL ALIMLARI MUAYENE VE KABUL KOMİSYONU TUTANAĞI',
  'odeme-emri-belgesi': 'STANDART FORM (MYHBY ÖRNEK NO: 1): ÖDEME EMRİ BELGESİ (MYS/MİF)',
  'odeme-yazisi': 'STANDART FORM: MUHASEBE / MALMÜDÜRLÜĞÜ ÖDEME GÖNDERME MÜZEKKERESİ',
  'tasinir-islem-fisi': 'STANDART FORM (TKKY ÖRNEK NO: 5): TAŞINIR İŞLEM FİŞİ (TİF)',
  'ihale-kapagi': 'STANDART FORM: İHALE VE HARCAMA İŞLEM DOSYASI DIŞ KAPAĞI',
  'kapak-ici-indeks-sablonu':
    'STANDART FORM (MYHBY m.5): İHALE / TEMİN İŞLEM DOSYASI DİZİ FİHRİSTİ',
  'klasor-sirtligi-3cm': 'STANDART FORM: ARŞİV KLASÖR SIRTLIĞI (3 CM)',
  'klasor-sirtligi-5cm': 'STANDART FORM: ARŞİV KLASÖR SIRTLIĞI (5 CM)',
  'klasor-sirtligi-7-5cm': 'STANDART FORM: ARŞİV KLASÖR SIRTLIĞI (7.5 CM)'
}

/**
 * Şablon klasörleri ve aşama başlıkları eşleşmesi.
 */
export const TEMPLATE_CATEGORIES: Record<string, string> = {
  '1-ihtiyac-tespiti-ve-baslangic': '1. İhtiyaç Tespiti & Başlangıç',
  '2-piyasa-fiyat-arastirmasi': '2. Piyasa Fiyat Araştırması',
  '3-siparis-ve-sozlesme': '3. Sipariş & Sözleşme',
  '4-kabul-ve-odeme-islemleri': '4. Muayene & Kabul & Ödeme İşlemleri',
  '5-klasor-ve-kapaklar': '5. Klasör & Kapaklar'
}

/**
 * TEMPLATE_GROUPS — Hangi şablonlar aynı kart veya süreç altında gruplanır.
 * Dizi sırası = grup_siralama (0-indexed). İlk eleman her zaman "Ana Belge" görünür.
 */
export const TEMPLATE_GROUPS: TemplateGroup[] = [
  // İhtiyaç Listesi ailesi
  {
    grup: 'ihtiyac-listesi',
    sablonlar: [
      { dosya_adi: 'ihtiyac-listesi', etiket: 'İhtiyaç Listesi' },
      { dosya_adi: 'ihtiyac-talep-formu', etiket: 'Talep Formu' }
    ]
  },
  // Lüzum Müzekkeresi ailesi
  {
    grup: 'luzum-muzekkeresi',
    sablonlar: [
      { dosya_adi: 'luzum-muzekkeresi', etiket: 'Lüzum Müzekkeresi' },
      { dosya_adi: 'luzum-muzekkeresi-onay-eki', etiket: 'Onay Eki' },
      { dosya_adi: 'luzum-muzekkeresi-teslim-tesellum', etiket: 'Teslim Tesellüm' }
    ]
  },
  // Komisyon Görevlendirme ailesi
  {
    grup: 'komisyon-gorevlendirme',
    sablonlar: [
      { dosya_adi: 'komisyon-gorevlendirme-onayi', etiket: 'Komisyon Atama' },
      { dosya_adi: 'komisyon-gorevlendirme-onayi-eki', etiket: 'Onay Eki' }
    ]
  },
  // Onay Belgesi ailesi
  {
    grup: 'onay-belgesi',
    sablonlar: [
      { dosya_adi: 'dogrudan-temin-onay-belgesi', etiket: 'Doğrudan Temin' },
      { dosya_adi: 'idare-onay-belgesi', etiket: 'İhale' },
      { dosya_adi: 'butce-sorgusu', etiket: 'Bütçe Sorgusu' }
    ]
  },
  // Harcama ailesi
  {
    grup: 'harcama',
    sablonlar: [
      { dosya_adi: 'harcama-talimati', etiket: 'Harcama Talimatı' },
      { dosya_adi: 'harcama-pusulasi', etiket: 'Harcama Pusulası' }
    ]
  },
  // Doğrudan Temin Sözleşmesi ailesi
  {
    grup: 'dt-sozlesmesi',
    sablonlar: [
      { dosya_adi: 'dogrudan-temin-sozlesmesi', etiket: 'Standart' },
      { dosya_adi: 'dogrudan-temin-sozlesmesi-alternatif', etiket: 'Alternatif' },
      { dosya_adi: 'dogrudan-temin-sozlesmesi-uzun', etiket: 'Uzun Form' }
    ]
  },
  // Dağıtım Çizelgesi ailesi
  {
    grup: 'dagitim-cizelgesi',
    sablonlar: [
      { dosya_adi: 'dagitim-cizelgesi', etiket: 'Standart' },
      { dosya_adi: 'dagitim-cizelgesi-karma', etiket: 'Karma' }
    ]
  },
  // Klasör Sırtlığı ailesi
  {
    grup: 'klasor-sirtligi',
    sablonlar: [
      { dosya_adi: 'klasor-sirtligi-3cm', etiket: '3 cm' },
      { dosya_adi: 'klasor-sirtligi-5cm', etiket: '5 cm' },
      { dosya_adi: 'klasor-sirtligi-7-5cm', etiket: '7.5 cm' }
    ]
  },
  // Kabul Edilen Teklif ailesi
  {
    grup: 'kabul-edilen-teklif',
    sablonlar: [
      { dosya_adi: 'kabul-edilen-teklif', etiket: 'Standart' },
      { dosya_adi: 'kabul-edilen-teklif-alternatif', etiket: 'Alternatif' }
    ]
  },
  // Muayene & Kabul ailesi
  {
    grup: 'muayene-kabul',
    sablonlar: [
      { dosya_adi: 'muayene-kabul-komisyonu', etiket: 'Komisyon' },
      { dosya_adi: 'muayene-kabul-tutanagi', etiket: 'Tutanak' }
    ]
  },
  // Yapım İşleri Kabul Ailesi
  {
    grup: 'yapim-kabul',
    sablonlar: [
      {
        dosya_adi: 'kik049-yapim-gecici-kabul-tutanagi',
        etiket: 'Geçici Kabul Tutanağı (KİK049.0/Y)'
      },
      {
        dosya_adi: 'kik048-yapim-gecici-kabul-teklif',
        etiket: 'Geçici Kabul Teklif Belgesi (KİK048.0/Y)'
      },
      {
        dosya_adi: 'kik051-yapim-kesin-kabul-tutanagi',
        etiket: 'Kesin Kabul Tutanağı (KİK051.0/Y)'
      },
      {
        dosya_adi: 'kik050-yapim-kesin-kabul-teklif',
        etiket: 'Kesin Kabul Teklif Belgesi (KİK050.0/Y)'
      }
    ]
  }
]

/**
 * Hızlı lookup Record: dosya_adi → { grup, etiket, siralama }
 * useDosyaAsamasiSablons ve diğer UI bileşenleri için dinamik olarak üretilir.
 */
export const SABLON_GRUPLARI: Record<string, { grup: string; etiket: string; siralama: number }> =
  {}

for (const g of TEMPLATE_GROUPS) {
  g.sablonlar.forEach((s, i) => {
    SABLON_GRUPLARI[s.dosya_adi] = {
      grup: g.grup,
      etiket: s.etiket,
      siralama: i
    }
  })
}

/**
 * Yaklaşık Maliyet komisyonuna otomatik atanacak varsayılan şablon listesi.
 */
export const DEFAULT_YAKLASIK_SABLONLAR = [
  'piyasa-fiyat-arastirma-gorevlendirmesi',
  'komisyon-gorevlendirme-onayi',
  'komisyon-gorevlendirme-onayi-eki',
  'arastirma-mektubu',
  'fiyat-arastirma-mektubu',
  'birim-fiyat-teklif-mektubu',
  'birim-fiyat-teklif-cetveli',
  'dagitim-cizelgesi',
  'dagitim-cizelgesi-karma',
  'piyasa-fiyat-arastirma-tutanagi',
  'yaklasik-maliyet-cetveli',
  'son-alim-fiyat-cetveli'
] as const

/**
 * Muayene ve Kabul komisyonuna otomatik atanacak varsayılan şablon listesi.
 */
export const DEFAULT_MUAYENE_SABLONLAR = [
  'muayene-kabul-komisyonu',
  'muayene-kabul-tutanagi',
  'harcama-pusulasi',
  'luzum-muzekkeresi-teslim-tesellum',
  'hizmet-isleri-kabul-tutanagi',
  'hizmet-isleri-kabul-teklif-belgesi',
  'kik048-yapim-gecici-kabul-teklif',
  'kik049-yapim-gecici-kabul-tutanagi',
  'kik050-yapim-kesin-kabul-teklif',
  'kik051-yapim-kesin-kabul-tutanagi'
] as const

/**
 * Olur / Onay ve Harcama Yetkilisi / Gerçekleştirme Görevlisine atanacak varsayılan şablon listesi.
 */
export const DEFAULT_OLUR_ONAY_SABLONLAR = [
  'dogrudan-temin-onay-belgesi',
  'idare-onay-belgesi',
  'harcama-talimati',
  'dogrudan-temin-sonuc-onay-belgesi',
  'ihale-komisyon-karari',
  'dogrudan-temin-sozlesmesi',
  'dogrudan-temin-sozlesmesi-alternatif',
  'dogrudan-temin-sozlesmesi-uzun',
  'sozlesmeye-davet',
  'kabul-edilen-teklif',
  'kabul-edilen-teklif-alternatif',
  'odeme-emri-belgesi',
  'odeme-yazisi',
  'butce-sorgusu'
] as const
