/**
 * TEMİN 360 — Dosya Formatları Standardizasyonu
 * Standart ve varsayılan yeni proje dosyası uzantısı: .temin
 * Geriye dönük uyumluluk (Legacy) uzantıları: .hkmp, .tmn360
 */

export interface FileFormat {
  /** Uzantı (nokta olmadan, örn: 'temin') */
  ext: string
  /** Kullanıcıya gösterilecek açıklama */
  label: string
  /** Kısa açıklama (dialog filtresi adı) */
  dialogName: string
  /** Bu format varsayılan yeni dosya uzantısı mı? */
  isDefault?: boolean
  /** Eski/geriye dönük uyumluluk formatı mı? */
  isLegacy?: boolean
}

/** Varsayılan ve birincil aktif proje dosyası uzantısı */
export const PRIMARY_EXTENSION = 'temin'

/** Geriye dönük uyumluluk için desteklenen eski formatlar */
export const LEGACY_EXTENSIONS = ['hkmp', 'tmn360']

/** Dosya açma işleminde kabul edilen tüm geçerli Temin 360 uzantıları */
export const OPEN_SUPPORTED_EXTENSIONS = [PRIMARY_EXTENSION, ...LEGACY_EXTENSIONS]

export const SUPPORTED_FORMATS: FileFormat[] = [
  {
    ext: PRIMARY_EXTENSION,
    label: 'TEMİN 360 Proje Dosyası',
    dialogName: 'TEMİN 360 Proje Dosyası (*.temin)',
    isDefault: true
  },
  {
    ext: 'hkmp',
    label: 'HakimPro Doğrudan Temin Dosyası (Eski Sürüm)',
    dialogName: 'HakimPro Doğrudan Temin Dosyası (*.hkmp)',
    isLegacy: true
  },
  {
    ext: 'tmn360',
    label: 'Temin 360 Arşiv Dosyası (Geçiş Sürümü)',
    dialogName: 'Temin 360 Arşiv Dosyası (*.tmn360)',
    isLegacy: true
  }
]

/** Tüm aktif desteklenen uzantılar */
export const allExtensions = SUPPORTED_FORMATS.map((f) => f.ext)

/** Varsayılan uzantı (yeni dosya oluştururken kullanılır) */
export const defaultFormat = SUPPORTED_FORMATS[0]

/** Kaydetme (Save As / New) dialog filter listesi — sadece standart birincil formatı gösterir */
export const allFormatsFilter = {
  name: 'TEMİN 360 Proje Dosyası (*.temin)',
  extensions: [PRIMARY_EXTENSION]
}

/** Açma (Open) dialog filter listesi — hem standart hem de eski .hkmp dosyalarını destekler */
export const openDialogFilters = [
  {
    name: 'Desteklenen Tüm Formatlar (*.temin, *.hkmp, *.tmn360)',
    extensions: OPEN_SUPPORTED_EXTENSIONS
  },
  {
    name: 'TEMİN 360 Proje Dosyası (*.temin)',
    extensions: [PRIMARY_EXTENSION]
  },
  {
    name: 'Eski HakimPro Dosyaları (*.hkmp, *.tmn360)',
    extensions: LEGACY_EXTENSIONS
  },
  {
    name: 'Tüm Dosyalar (*.*)',
    extensions: ['*']
  }
]

/** Her format için ayrı ayrı dialog filter listesi */
export const perFormatFilters = SUPPORTED_FORMATS.map((f) => ({
  name: f.dialogName,
  extensions: [f.ext]
}))

/**
 * Dosya adından proje uzantısını (.temin, .hkmp, .tmn360) temizler
 */
export function stripProjectExtension(fileName: string): string {
  if (!fileName) return ''
  return fileName.replace(/\.(temin|hkmp|tmn360)$/i, '')
}

/**
 * Dosya yolunun geçerli bir TEMİN 360 proje dosyası olup olmadığını doğrular.
 * Standart .temin dosyalarının yanı sıra geriye dönük uyumluluk için .hkmp ve .tmn360
 * dosyalarını da açılışta kabul eder. İhale 360 veya 2886 uzantılarını KESİNLİKLE kabul etmez.
 */
export function isSupportedFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false
  const cleanPath = filePath
    .trim()
    .replace(/^"+|"+$/g, '')
    .trim()
  if (cleanPath.startsWith('-')) return false
  const lower = cleanPath.toLowerCase()

  // Kesin izolasyon: İhale 360 ve Devlet İhale 2886 uzantılarını reddet
  if (
    lower.endsWith('.ihale') ||
    lower.endsWith('.ihale360') ||
    lower.endsWith('.ihale2886') ||
    lower.endsWith('.dihale')
  ) {
    return false
  }

  return OPEN_SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith('.' + ext))
}
