import { formatDosyaNo } from './formatDosyaNo'

export interface BuildExportFileNameOptions {
  butceYili?: number | string | null
  teminNo?: string | number | null
  dosya?: Record<string, unknown> | null
  belgeAdi: string
  extension?: string
}

/**
 * Creates standardized file names formatted as:
 * {butceYili}-{dtNo}-{belgeAdi}.{ext}
 *
 * Examples:
 * - "2026-DT-2026-1-Piyasa_Fiyat_Arastirma_Tutanagi.pdf"
 * - "2026-DT-2026-1-Onay_Belgesi.docx"
 * - "2026-DT-2026-1-Tum_Belgeler.zip"
 */
export function buildExportFileName({
  butceYili,
  teminNo,
  dosya,
  belgeAdi,
  extension
}: BuildExportFileNameOptions): string {
  let dateYil: number | null = null
  if (dosya?.dosya_acilis_tarihi && typeof dosya.dosya_acilis_tarihi === 'string') {
    const parsed = new Date(dosya.dosya_acilis_tarihi)
    if (!isNaN(parsed.getTime())) {
      dateYil = parsed.getFullYear()
    }
  }

  const yil =
    butceYili ||
    (dosya?.butce_yili as number | string | undefined) ||
    dateYil ||
    new Date().getFullYear()

  let dtNoPart = ''
  if (dosya) {
    const formatted = formatDosyaNo(dosya) // e.g. "DT-2026/1" or "HAK-2026/1"
    dtNoPart = formatted.replace(/[/\\:*?"<>|]/g, '-')
  } else if (teminNo !== undefined && teminNo !== null && String(teminNo).trim()) {
    dtNoPart = String(teminNo)
      .replace(/[/\\:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .trim()
  } else {
    dtNoPart = `DT-${yil}`
  }

  // Belge adını güvenli hale getir
  const cleanBelgeAdi = (belgeAdi || 'Belge')
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/\.(pdf|docx|udf|html|zip)$/i, '')
    .trim()

  let baseName = `${yil}-${dtNoPart}-${cleanBelgeAdi}`
  // Çoklu tireleri temizle
  baseName = baseName.replace(/--+/g, '-').replace(/__+/g, '_')

  if (extension) {
    const cleanExt = extension.replace(/^\.+/, '')
    return `${baseName}.${cleanExt}`
  }

  return baseName
}

/**
 * Creates standardized ZIP file name for batch downloads
 */
export function buildBatchZipFileName(options: {
  butceYili?: number | string | null
  teminNo?: string | number | null
  dosya?: Record<string, unknown> | null
  customSuffix?: string
}): string {
  return buildExportFileName({
    ...options,
    belgeAdi: options.customSuffix || 'Tum_Belgeler',
    extension: 'zip'
  })
}
