import { TopluPozRow } from './toplu.types'

export const DEFAULT_GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/ilyasbozdemir/workdesk-360/main/catalogs/pozlar.json'

export const ORNEK_GITHUB_JSON_DATA = [
  {
    poz_no: '15.110.1001',
    eski_poz_no: '14.040/1',
    kalem_adi: 'Her cins zeminde el ile yapılan (geniş-dar) derin kazılarda derinlik zammı',
    birim: 'm³',
    poz_tipi: 'Analiz',
    poz_kurumu: 'ÇŞB',
    fasikul: 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
    birim_fiyat: 425.5,
    fiyat_donemi: '2026/1',
    okas_kodu: '45112000',
    yapi_sinifi: 'İnşaat İmalatları (Kaba & İnce İşler)',
    kdv_orani: 20,
    ozelligi:
      'Her cins zeminde el ile yapılan derin kazılara derinlik zammı (%25 yüklenici kârı dahil)',
    birim_fiyatlar: [
      { donem: '2026/1', fiyat: 425.5 },
      { donem: '2025/2', fiyat: 365.0 },
      { donem: '2025/1', fiyat: 310.25 }
    ]
  },
  {
    poz_no: '15.150.1005',
    eski_poz_no: '16.025/C',
    kalem_adi: 'Basınç dayanım sınıfı C 25/30 olan hazır beton dökülmesi',
    birim: 'm³',
    poz_tipi: 'Analiz',
    poz_kurumu: 'ÇŞB',
    fasikul: '15. İnşaat İmalatları Fasikülü',
    birim_fiyat: 2850.0,
    fiyat_donemi: '2026/1',
    okas_kodu: '45000000',
    yapi_sinifi: 'İnşaat İmalatları (Kaba & İnce İşler)',
    kdv_orani: 20,
    ozelligi: 'Beton pompası ve mikser ile yerleştirme dahil.',
    birim_fiyatlar: [
      { donem: '2026/1', fiyat: 2850.0 },
      { donem: '2025/2', fiyat: 2450.0 }
    ]
  },
  {
    poz_no: '04.100.1002',
    eski_poz_no: '04.002',
    kalem_adi: 'Çimento esaslı harçlar için kum (0-3 mm elenmiş yıkanmış)',
    birim: 'm³',
    poz_tipi: 'Rayiç',
    poz_kurumu: 'ÇŞB',
    fasikul: '04. İnşaat Malzemeleri Rayiçleri',
    birim_fiyat: 580.0,
    fiyat_donemi: '2026/1',
    okas_kodu: '14210000',
    yapi_sinifi: 'Hammadde & Rayiçler',
    kdv_orani: 20,
    ozelligi: 'İnce sıva ve duvar harçları için standart agrega.',
    birim_fiyatlar: [{ donem: '2026/1', fiyat: 580.0 }]
  }
]

export const createEmptyRow = (): TopluPozRow => ({
  id: Math.random().toString(36).substring(2, 9),
  poz_no: '',
  eski_poz_no: '',
  kalem_adi: '',
  birim: 'm³',
  poz_tipi: 'Analiz',
  poz_kurumu: 'ÇŞB',
  fasikul: 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
  birim_fiyat: '',
  fiyat_donemi: '2026/1',
  okas_kodu: '45000000',
  yapi_sinifi: 'İnşaat İmalatları (Kaba & İnce İşler)',
  kdv_orani: 20,
  ozelligi: ''
})
