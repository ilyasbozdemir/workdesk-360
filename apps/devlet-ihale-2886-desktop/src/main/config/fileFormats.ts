/**
 * DEVLET İHALE 2886 — Dosya Formatları Standardizasyonu
 * Standart ve aktif proje dosyası uzantısı: .ihale2886 (ve .dihale)
 */

export interface FileFormat {
  /** Uzantı (nokta olmadan, örn: 'ihale2886') */
  ext: string
  /** Standart MIME Türü (örn: 'application/x-ihale2886') */
  mimeType: string
  /** Windows ProgID (örn: 'DevletIhale2886.Document') */
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
export const PRIMARY_EXTENSION = 'ihale2886'

export const SUPPORTED_FORMATS: FileFormat[] = [
  {
    ext: PRIMARY_EXTENSION,
    mimeType: 'application/x-ihale2886',
    progId: 'DevletIhale2886.Document',
    perceivedType: 'document',
    label: 'Devlet İhale 2886 Proje Dosyası',
    dialogName: 'Devlet İhale 2886 Proje Dosyası (*.ihale2886)',
    isDefault: true
  },
  {
    ext: 'dihale',
    mimeType: 'application/x-dihale',
    progId: 'DevletIhale2886.Document',
    perceivedType: 'document',
    label: 'Devlet İhale 2886 Proje Dosyası (Alternatif)',
    dialogName: 'Devlet İhale 2886 Proje Dosyası (*.dihale)'
  }
]

/** Tüm aktif desteklenen uzantılar */
export const allExtensions = SUPPORTED_FORMATS.map((f) => f.ext)

/** Varsayılan uzantı (yeni dosya oluştururken kullanılır) */
export const defaultFormat = SUPPORTED_FORMATS[0]

/** Electron dialog filter listesi — tüm desteklenen formatları gösterir */
export const allFormatsFilter = {
  name: 'Devlet İhale 2886 Proje Dosyası (*.ihale2886, *.dihale)',
  extensions: allExtensions
}

/** Her format için ayrı ayrı dialog filter listesi */
export const perFormatFilters = SUPPORTED_FORMATS.map((f) => ({
  name: f.dialogName,
  extensions: [f.ext]
}))

/**
 * Dosya adından proje uzantısını (.ihale2886 veya .dihale) temizler
 */
export function stripProjectExtension(fileName: string): string {
  if (!fileName) return ''
  return fileName.replace(/\.(ihale2886|dihale)$/i, '')
}

/**
 * Dosya yolunun geçerli bir DEVLET İHALE 2886 proje dosyası olup olmadığını doğrular
 */
export function isSupportedFile(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false
  const cleanPath = filePath
    .trim()
    .replace(/^"+|"+$/g, '')
    .trim()
  if (cleanPath.startsWith('-')) return false
  const lower = cleanPath.toLowerCase()

  // Kesin izolasyon: Temin 360 ve İhale 360 uzantılarını kesinlikle reddet
  if (
    lower.endsWith('.temin') ||
    lower.endsWith('.hkmp') ||
    lower.endsWith('.tmn360') ||
    lower.endsWith('.ihale') ||
    lower.endsWith('.ihale360')
  ) {
    return false
  }

  return allExtensions.some((ext) => lower.endsWith('.' + ext))
}
