import fs from 'fs'
import { AppConfig } from '../shared/types'
import { getStoragePaths } from './paths'

const DEFAULT_CONFIG: AppConfig = {
  version: '1.0.0',
  appName: 'Arsiv 360',
  rootFolder: 'Belgeler',
  autoScan: true,
  lazyHashing: true,
  groupBy: ['category', 'date_year_month'],
  views: [
    {
      id: 'all',
      name: 'Tüm Dosyalar',
      icon: 'Folder',
      description: 'Kök klasördeki taranan tüm dosyalar',
      rules: {}
    },
    {
      id: 'pdf',
      name: 'PDF Belgeleri',
      icon: 'FileText',
      description: 'Tüm PDF uzantılı dokümanlar',
      rules: { ext: ['pdf'] }
    },
    {
      id: 'word',
      name: 'Word Belgeleri',
      icon: 'FileEdit',
      description: 'DOC ve DOCX formatlı metin dosyaları',
      rules: { ext: ['doc', 'docx', 'odt', 'rtf'] }
    },
    {
      id: 'excel',
      name: 'Excel & Hesap Tabloları',
      icon: 'Sheet',
      description: 'XLS, XLSX ve CSV formatlı tablolar',
      rules: { ext: ['xls', 'xlsx', 'csv', 'ods'] }
    },
    {
      id: 'images',
      name: 'Görseller & Fotoğraflar',
      icon: 'Image',
      description: 'PNG, JPG, JPEG, WEBP resim dosyaları',
      rules: { ext: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'] }
    },
    {
      id: 'archives',
      name: 'Sıkıştırılmış Arşivler',
      icon: 'Archive',
      description: 'ZIP, RAR, 7Z, TAR paketleri',
      rules: { ext: ['zip', 'rar', '7z', 'tar', 'gz'] }
    },
    {
      id: 'last_7_days',
      name: 'Son 7 Gün',
      icon: 'Calendar',
      description: 'Son 7 gün içerisinde değiştirilen dosyalar',
      rules: { modifiedWithinDays: 7 }
    },
    {
      id: 'this_month',
      name: 'Bu Ay Değişenler',
      icon: 'Clock',
      description: 'Son 30 gün içerisinde güncellenen dosyalar',
      rules: { modifiedWithinDays: 30 }
    },
    {
      id: 'large_files',
      name: 'Büyük Dosyalar (>50 MB)',
      icon: 'HardDrive',
      description: 'Boyutu 50 Megabayttan büyük dosyalar',
      rules: { minSizeMB: 50 }
    },
    {
      id: 'duplicates',
      name: 'Mükerrer Dosyalar (Kopyalar)',
      icon: 'Copy',
      description: 'Aynı dosya içeriğine (SHA-256) sahip kopyalar',
      isDuplicateView: true,
      rules: {}
    }
  ]
}

export function loadConfig(): { config: AppConfig; warning?: string } {
  const { configPath } = getStoragePaths()
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8')
      const parsed = JSON.parse(raw) as AppConfig
      return { config: { ...DEFAULT_CONFIG, ...parsed, views: parsed.views || DEFAULT_CONFIG.views } }
    }
  } catch (err: any) {
    console.error('Config okuma hatası, varsayılan yapılandırma kullanılıyor:', err)
    return {
      config: DEFAULT_CONFIG,
      warning: `Yapılandırma dosyası okunamadı (${err.message}). Varsayılan ayarlar yüklendi.`
    }
  }

  // Dosya yoksa varsayılanı yaz
  try {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
  } catch (err) {
    console.error('Varsayılan config kaydedilemedi:', err)
  }

  return { config: DEFAULT_CONFIG }
}

export function saveConfig(newConfig: AppConfig): { success: boolean; error?: string } {
  const { configPath } = getStoragePaths()
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export const loadAppConfig = loadConfig
export const saveAppConfig = saveConfig


