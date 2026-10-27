import { APP_ROUTES } from '../constants/routeConstants'

export interface NewFeatureItem {
  id: string
  route: string
  title: string
  badgeText?: string
  version: string
  releaseDate: string // YYYY-MM-DD
  daysActive?: number // Belirli bir gün boyunca yeni gösterilsin (varsayılan 30 gün)
  description: string
  category: 'ekran' | 'modul' | 'arac' | 'surec'
}

/**
 * Yeni eklenen ekranlar, modüller ve menüler için merkezi sürüm & gün konfigürasyonu.
 * Her öğenin hangi sürümden geldiği, yayınlanma tarihi ve kaç gün boyunca
 * 'YENİ' olarak parlayıp yanıp söneceği burada tanımlanır.
 */
export const DEFAULT_NEW_FEATURES: NewFeatureItem[] = [
  {
    id: 'piyasa-fiyat-arastirmasi',
    route: APP_ROUTES.PIYASA_FIYAT_ARASTIRMALARI_MASASI,
    title: 'Piyasa Fiyat Araştırmaları Masası',
    badgeText: 'YENİ',
    version: 'v1.0.0-rc.9',
    releaseDate: '2026-10-27',
    daysActive: 30,
    description: 'KİK 22/d doğrudan temin piyasa fiyat araştırmaları, teklifler ve firma karşılaştırma tam ekran masası',
    category: 'ekran'
  },
  {
    id: 'modul-magazasi',
    route: APP_ROUTES.MODUL_MAGAZASI,
    title: 'Modül Mağazası',
    badgeText: 'YENİ',
    version: 'v1.0.0-rc.9',
    releaseDate: '2026-10-25',
    daysActive: 30,
    description: 'Dinamik formlar, EBYS resmî yazışma ve doğrudan temin paketleri mağazası',
    category: 'ekran'
  },
  {
    id: 'harici-dosya-aktar',
    route: APP_ROUTES.HARICI_DOSYA_AKTAR,
    title: 'Harici Dosya Aktar & Eşle (JSON)',
    badgeText: 'YENİ',
    version: 'v1.0.0-rc.8',
    releaseDate: '2026-10-22',
    daysActive: 30,
    description: 'Dış kaynaklı doğrudan temin dosyalarını JSON formatında içe aktarma ve eşleme aracı',
    category: 'arac'
  },
  {
    id: 'belgelerim',
    route: APP_ROUTES.BELGELERIM,
    title: 'Belgelerim (Özel Alan)',
    badgeText: 'YENİ',
    version: 'v1.0.0-rc.8',
    releaseDate: '2026-10-20',
    daysActive: 30,
    description: 'Kullanıcıya özel evrak, klasör ve yerel taslak saklama alanı',
    category: 'ekran'
  },
  {
    id: 'ihtiyac-raporlari',
    route: APP_ROUTES.IHTIYAC_RAPORLARI,
    title: 'İhtiyaç Raporları Havuzu',
    badgeText: 'YENİ',
    version: 'v1.0.0-rc.8',
    releaseDate: '2026-10-21',
    daysActive: 30,
    description: 'Birim ihtiyaç raporları, onay ve lüzum belgeleri merkezi havuzu',
    category: 'ekran'
  },
  {
    id: 'ebys',
    route: APP_ROUTES.EBYS,
    title: 'EBYS Resmî Yazı Şablonları',
    badgeText: 'YENİ',
    version: 'v1.0.0-rc.7',
    releaseDate: '2026-10-18',
    daysActive: 30,
    description: 'Resmî üst yazı ve EBYS entegre şablon stüdyosu',
    category: 'modul'
  },
  {
    id: 'form-builder',
    route: APP_ROUTES.FORM_BUILDER,
    title: 'Form Builder v2 (Sürükle & Bırak)',
    badgeText: 'YENİ',
    version: 'v1.0.0-rc.7',
    releaseDate: '2026-10-15',
    daysActive: 30,
    description: 'Dinamik formlar ve özel evrak bileşenleri stüdyosu',
    category: 'modul'
  },
  {
    id: 'harcama-merkezi',
    route: APP_ROUTES.HARCAMA_MERKEZI,
    title: 'Harcama & KİK Limit Takibi',
    badgeText: 'GÜNCEL',
    version: 'v1.0.0-rc.8',
    releaseDate: '2026-10-23',
    daysActive: 25,
    description: 'Bütçe tüketim tavanı ve mevzuat kontrol raporlama merkezi',
    category: 'ekran'
  }
]
