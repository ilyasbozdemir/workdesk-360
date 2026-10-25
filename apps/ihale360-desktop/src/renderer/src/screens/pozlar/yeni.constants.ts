export const OLCU_BIRIMLERI_LIST = [
  { kod: 'm²', ad: 'Metrekare (m²)' },
  { kod: 'm³', ad: 'Metreküp (m³)' },
  { kod: 'mt', ad: 'Metre / Metretül (mt)' },
  { kod: 'Adet', ad: 'Adet' },
  { kod: 'ton', ad: 'Ton' },
  { kod: 'kg', ad: 'Kilogram (kg)' },
  { kod: 'Set', ad: 'Set / Takım' },
  { kod: 'Götürü', ad: 'Götürü Bedel' },
  { kod: 'saat', ad: 'Saat' },
  { kod: 'ay', ad: 'Ay' },
  { kod: 'yıl', ad: 'Yıl' },
  { kod: 'sefer', ad: 'Sefer' },
  { kod: 'km', ad: 'Kilometre (km)' },
  { kod: 'lt', ad: 'Litre (lt)' },
  { kod: 'kwh', ad: 'Kilowatt-saat (kWh)' }
]

export const POZ_TIPLERI = [
  {
    id: 'Analiz',
    ad: 'Analiz Pozu',
    desc: 'Malzeme + İşçilik + Makine + Müteahhit Kârı içeren komple imalat'
  },
  {
    id: 'Rayiç',
    ad: 'Rayiç (Malzeme / İşçilik / Makine)',
    desc: 'Tekil malzeme rayici veya işçilik saat ücreti'
  },
  { id: 'İmalat', ad: 'İmalat / Montajsız', desc: 'Doğrudan yerinde montajı yapılan kalem' },
  { id: 'Montaj', ad: 'Sadece Montaj Bedeli', desc: 'Cihaz veya ekipman montaj ücreti' },
  {
    id: 'Nakliye',
    ad: 'Nakliye & Taşıma Zammı',
    desc: 'Mesafe ve ağırlık bazlı taşıma formülleri'
  },
  { id: 'Özel', ad: 'Özel İdare / Kurum Pozu', desc: 'Özel teknik şartnameye bağlı imalat' }
]

export const FASIKULLER_MAP: Record<string, string[]> = {
  ÇŞB: [
    'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
    'Çevre ve Şehircilik Bakanlığı 2018 ve Öncesi',
    '15. İnşaat İmalatları Fasikülü',
    '25. Sıhhi Tesisat ve Isıtma Fasikülü',
    '26. Havalandırma ve İklimlendirme Fasikülü',
    '35. Elektrik Tesisatı Fasikülü',
    '36. Zayıf Akım ve Otomasyon Fasikülü',
    '15. Altyapı, Yol ve Çevre Düzenleme'
  ],
  KGM: [
    '04. Karayolları Yol Yapım ve Köprü Fasikülü',
    '04. Asfalt ve Bitümlü Kaplama İmalatları',
    '04. Trafik Güvenliği ve Sinyalizasyon Fasikülü',
    '04. Sanat Yapıları ve Tünel İmalatları'
  ],
  DSİ: [
    '07. DSİ Baraj, Gölet ve Dolgu Fasikülü',
    '07. Sulama, Drenaj ve Kanalet İmalatları',
    '07. Sondaj, Enjeksiyon ve Yeraltı Tesisleri'
  ],
  İLBANK: [
    '18. İller Bankası İçmesuyu Tesisleri Fasikülü',
    '18. Kanalizasyon ve Yağmursuyu Fasikülü',
    '18. Arıtma Tesisi ve Pompa İstasyonları',
    '18. Üstyapı ve İmar Uygulamaları'
  ],
  VAKIF: [
    'Vakıflar Genel Müdürlüğü Restorasyon Fasikülü',
    'Taş, Ahşap ve Kalemişi Onarım İmalatları',
    'Kültür Varlıkları ve Müzeler Koruma Kitabı'
  ],
  ÖZEL: [
    'İdare Özel Birim Fiyat ve Analiz Kitabı',
    'Belediye Fen İşleri Özel Analiz Fasikülü',
    'Üniversite / Hastane Bakım-Onarım Özel Pozları'
  ]
}

export const YAPI_SINIFLARI_LIST = [
  'Genel Yapım İşleri',
  'I-A / I-B (Geçici Yapılar, Basit Depolar)',
  'II-A / II-B (Küçük Sanayi, Hangarlar)',
  'III-A / III-B (Okullar, İdari Binalar, Konutlar)',
  'IV-A / IV-B / IV-C (Hastaneler, Büyük Kamu Binaları)',
  'V-A / V-B / V-C / V-D (Kompleks Tesisler, Üniversiteler)',
  'İnşaat İmalatları (Kaba & İnce İşler)',
  'Mekanik Tesisat ve Havalandırma',
  'Elektrik ve Zayıf Akım Tesisatı',
  'Peyzaj ve Çevre Düzenleme',
  'Altyapı, Yol, Köprü ve Sanat Yapıları',
  'Restorasyon ve Tarihî Eser Onarımı'
]

export const POPULER_CPV_KODLARI = [
  { kod: '45000000', ad: 'Genel İnşaat İşleri' },
  { kod: '45210000', ad: 'Bina Yapım İşleri' },
  { kod: '45310000', ad: 'Elektrik Tesisatı İşleri' },
  { kod: '45330000', ad: 'Sıhhi ve Mekanik Tesisat' },
  { kod: '45233140', ad: 'Yol Bakım ve Onarımı' },
  { kod: '45400000', ad: 'Bina Tamamlama & İnce İşler' },
  { kod: '45112000', ad: 'Hafriyat ve Kazı İşleri' },
  { kod: '45261000', ad: 'Çatı Kaplama ve İskele' }
]

export const ORNEK_POZ_SABLONLARI = [
  {
    baslik: 'Derin Kazı Zammı (Örnek)',
    kurum: 'ÇŞB',
    poz_no: '15.110.1001',
    eski_poz_no: '14.040/1',
    fasikul: 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
    poz_tipi: 'Analiz',
    kalem_adi:
      'Her cins zeminde el ile yapılan (geniş-dar) derin kazılarda derinlik zammı (iksasız kazılarda) F=103,125 x H -206,25 (%25 yüklenici karı ve genel giderler dahil)',
    birim: 'm³',
    yapi_sinifi: 'İnşaat İmalatları (Kaba & İnce İşler)',
    okas_kodu: '45112000',
    ozelligi:
      'Her cins zeminde el ile yapılan (geniş-dar) derin kazılara derinlik zammı (iksasız kazılarda) F=103,125 x H -206,25 (%25 yüklenici kârı ve genel giderler dahil)',
    fiyatlar: [
      { donem: '2026/1', fiyat: 425.5 },
      { donem: '2025/2', fiyat: 365.0 },
      { donem: '2025/1', fiyat: 310.25 },
      { donem: '2024/2', fiyat: 245.0 }
    ]
  },
  {
    baslik: 'C 25/30 Hazır Beton',
    kurum: 'ÇŞB',
    poz_no: '15.150.1005',
    eski_poz_no: '16.025/C',
    fasikul: '15. İnşaat İmalatları Fasikülü',
    poz_tipi: 'Analiz',
    kalem_adi: 'Basınç dayanım sınıfı C 25/30 olan hazır beton dökülmesi',
    birim: 'm³',
    yapi_sinifi: 'İnşaat İmalatları (Kaba & İnce İşler)',
    okas_kodu: '45000000',
    ozelligi: 'Beton pompası, mikser ve vibratör ile yerleştirme, sıkıştırma ve kürü dahil.',
    fiyatlar: [
      { donem: '2026/1', fiyat: 2850.0 },
      { donem: '2025/2', fiyat: 2450.0 },
      { donem: '2025/1', fiyat: 2100.0 }
    ]
  },
  {
    baslik: 'Nervürlü Donatı Çeliği',
    kurum: 'ÇŞB',
    poz_no: '15.160.1003',
    eski_poz_no: '23.014',
    fasikul: '15. İnşaat İmalatları Fasikülü',
    poz_tipi: 'Analiz',
    kalem_adi: 'Nervürlü çelik çubuğun bükülmesi, projesine göre yerine konulması (B420C)',
    birim: 'ton',
    yapi_sinifi: 'İnşaat İmalatları (Kaba & İnce İşler)',
    okas_kodu: '45000000',
    ozelligi: 'Bağlama teli, paspayı, kesme, bükme ve montaj zayiyatları dahil.',
    fiyatlar: [
      { donem: '2026/1', fiyat: 38500.0 },
      { donem: '2025/2', fiyat: 34000.0 },
      { donem: '2025/1', fiyat: 29500.0 }
    ]
  },
  {
    baslik: 'Özel İdare Tadilat Pozu',
    kurum: 'ÖZEL',
    poz_no: 'ÖZEL.01',
    eski_poz_no: 'ÖZEL-2023/4',
    fasikul: 'İdare Özel Birim Fiyat ve Analiz Kitabı',
    poz_tipi: 'Özel',
    kalem_adi: 'Mevcut bina içi asma tavan ve aydınlatma armatürlerinin sökülmesi ve yenilenmesi',
    birim: 'm²',
    yapi_sinifi: 'Bina Tamamlama & İnce İşler',
    okas_kodu: '45400000',
    ozelligi: 'İdarece onaylı özel teknik şartnameye ve birim fiyat analizine uygun olarak.',
    fiyatlar: [
      { donem: '2026/1', fiyat: 650.0 },
      { donem: '2025/2', fiyat: 520.0 }
    ]
  }
]
