/**
 * TEMİN 360 — Dosya Formatları Standardizasyonu
 * Standart ve tek aktif proje dosyası uzantısı: .temin
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
}

/** Tek aktif standart dosya formatı */
export const PRIMARY_EXTENSION = 'temin'

export const SUPPORTED_FORMATS: FileFormat[] = [
  {
    ext: PRIMARY_EXTENSION,
    label: 'TEMİN 360 Proje Dosyası',
    dialogName: 'TEMİN 360 Proje Dosyası (*.temin)',
    isDefault: true
  }
]

/** Tüm aktif desteklenen uzantılar: Sadece ['temin'] */
export const allExtensions = SUPPORTED_FORMATS.map((f) => f.ext)

/** Varsayılan uzantı (yeni dosya oluştururken kullanılır) */
export const defaultFormat = SUPPORTED_FORMATS[0]

/** Electron dialog filter listesi — sadece standart aktif formatı gösterir */
export const allFormatsFilter = {
  name: 'TEMİN 360 Proje Dosyası (*.temin)',
  extensions: [PRIMARY_EXTENSION]
}

/** Her format için ayrı ayrı dialog filter listesi (Sadece standart format) */
export const perFormatFilters = SUPPORTED_FORMATS.map((f) => ({
  name: f.dialogName,
  extensions: [f.ext]
}))

/**
 * Dosya adından proje uzantısını (.temin) temizler
 */
export function stripProjectExtension(fileName: string): string {
  if (!fileName) return ''
  return fileName.replace(/\.temin$/i, '')
}

/**
 * Dosya yolunun geçerli bir TEMİN 360 proje dosyası (.temin) olup olmadığını doğrular
 */
export function isSupportedFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false
  const cleanPath = filePath
    .trim()
    .replace(/^"+|"+$/g, '')
    .trim()
  if (cleanPath.startsWith('-')) return false
  const lower = cleanPath.toLowerCase()

  return lower.endsWith('.' + PRIMARY_EXTENSION)
}
