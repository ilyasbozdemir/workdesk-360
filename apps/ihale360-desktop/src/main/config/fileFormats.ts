/**
 * İHALE 360 — Dosya Formatları Standardizasyonu
 * Standart ve aktif proje dosyası uzantısı: .ihale (ve .ihale360)
 */

export interface FileFormat {
  /** Uzantı (nokta olmadan, örn: 'ihale') */
  ext: string
  /** Standart MIME Türü (örn: 'application/x-ihale') */
  mimeType: string
  /** Windows ProgID (örn: 'Ihale360.Document') */
  progId: string
  /** Windows PerceivedType */
  perceivedType?: 'document'
  /** Kullanıcıya gösterilecek açıklama */
  label: string
  /** Kısa açıklama (dialog filtresi adı) */
  dialogName: string
  /** Bu format varsayılan yeni dosya uzantısı mı? */
  isDefault?: boolean
}

/** Tek aktif standart dosya formatı */
export const PRIMARY_EXTENSION = 'ihale'

export const SUPPORTED_FORMATS: FileFormat[] = [
  {
    ext: PRIMARY_EXTENSION,
    mimeType: 'application/x-ihale',
    progId: 'Ihale360.Document',
    perceivedType: 'document',
    label: 'İHALE 360 Proje Dosyası',
    dialogName: 'İHALE 360 Proje Dosyası (*.ihale)',
    isDefault: true
  },
  {
    ext: 'ihale360',
    mimeType: 'application/x-ihale360',
    progId: 'Ihale360.Document',
    perceivedType: 'document',
    label: 'İHALE 360 Proje Dosyası (Alternatif)',
    dialogName: 'İHALE 360 Proje Dosyası (*.ihale360)'
  }
]

/** Tüm aktif desteklenen uzantılar */
export const allExtensions = SUPPORTED_FORMATS.map((f) => f.ext)

/** Varsayılan uzantı (yeni dosya oluştururken kullanılır) */
export const defaultFormat = SUPPORTED_FORMATS[0]

/** Electron dialog filter listesi — tüm desteklenen formatları gösterir */
export const allFormatsFilter = {
  name: 'İHALE 360 Proje Dosyası (*.ihale, *.ihale360)',
  extensions: allExtensions
}

/** Her format için ayrı ayrı dialog filter listesi */
export const perFormatFilters = SUPPORTED_FORMATS.map((f) => ({
  name: f.dialogName,
  extensions: [f.ext]
}))

/**
 * Dosya adından proje uzantısını (.ihale veya .ihale360) temizler
 */
export function stripProjectExtension(fileName: string): string {
  if (!fileName) return ''
  return fileName.replace(/\.(ihale|ihale360)$/i, '')
}

/**
 * Dosya yolunun geçerli bir İHALE 360 proje dosyası olup olmadığını doğrular
 */
export function isSupportedFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false
  const cleanPath = filePath
    .trim()
    .replace(/^"+|"+$/g, '')
    .trim()
  if (cleanPath.startsWith('-')) return false
  const lower = cleanPath.toLowerCase()

  // Kesin izolasyon: Temin 360 ve Devlet İhale 2886 uzantılarını kesinlikle reddet
  if (
    lower.endsWith('.temin') ||
    lower.endsWith('.hkmp') ||
    lower.endsWith('.tmn360') ||
    lower.endsWith('.ihale2886') ||
    lower.endsWith('.dihale')
  ) {
    return false
  }

  return allExtensions.some((ext) => lower.endsWith('.' + ext))
}
