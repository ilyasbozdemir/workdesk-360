import type { DtMalzemeSatiri } from './types'

export interface ExcelRowMapping {
  sira?: string
  kod?: string
  ad: string
  aciklama?: string
  birim: string
  kdvOrani?: string
  miktar: string
  birimFiyat?: string
  kazananFirma?: string
}

export interface ExcelParseResult {
  sheetName: string
  headers: string[]
  rows: Record<string, unknown>[]
  materials: DtMalzemeSatiri[]
}

/**
 * Excel kolon başlıklarını otomatik olarak standart malzeme alanlarına eşler
 */
export function autoMapColumns(headers: string[]): Partial<Record<keyof ExcelRowMapping, string>> {
  const mapping: Partial<Record<keyof ExcelRowMapping, string>> = {}

  headers.forEach((h) => {
    const lower = h.toLowerCase().trim()
    if (lower.includes('sıra') || lower === 'no' || lower === 'sira') mapping.sira = h
    else if (lower.includes('kod') || lower.includes('barkod')) mapping.kod = h
    else if (lower.includes('malzeme') || lower.includes('ürün') || lower.includes('ad') || lower.includes('tanım') || lower.includes('isin adi')) mapping.ad = h
    else if (lower.includes('açıklama') || lower.includes('aciklama') || lower.includes('detay')) mapping.aciklama = h
    else if (lower.includes('birim') && !lower.includes('fiyat')) mapping.birim = h
    else if (lower.includes('kdv')) mapping.kdvOrani = h
    else if (lower.includes('miktar') || lower.includes('adet')) mapping.miktar = h
    else if (lower.includes('fiyat') || lower.includes('tutar')) mapping.birimFiyat = h
    else if (lower.includes('firma') || lower.includes('yüklenici') || lower.includes('kazanan')) mapping.kazananFirma = h
  })

  return mapping
}

/**
 * Excel satırlarını DtMalzemeSatiri formatına dönüştürür
 */
export function mapRowsToMaterials(
  rows: Record<string, unknown>[],
  columnMap: Partial<Record<keyof ExcelRowMapping, string>>
): DtMalzemeSatiri[] {
  return rows.map((row, idx) => {
    const sira = columnMap.sira ? String(row[columnMap.sira] ?? '') : String(idx + 1)
    const ad = columnMap.ad ? String(row[columnMap.ad] ?? '').trim() : ''
    const birim = columnMap.birim ? String(row[columnMap.birim] ?? 'Adet').trim() : 'Adet'
    const miktar = columnMap.miktar ? Number(row[columnMap.miktar] ?? 1) : 1
    const birimFiyat = columnMap.birimFiyat ? Number(row[columnMap.birimFiyat] ?? 0) : 0

    return {
      sira,
      kod: columnMap.kod ? String(row[columnMap.kod] ?? '') : '',
      ad: ad || `Kalem #${idx + 1}`,
      aciklama: columnMap.aciklama ? String(row[columnMap.aciklama] ?? '') : '',
      birim: birim || 'Adet',
      kdvOrani: columnMap.kdvOrani ? Number(row[columnMap.kdvOrani] ?? 20) : 20,
      miktar: isNaN(miktar) ? 1 : miktar,
      birimFiyat: isNaN(birimFiyat) ? 0 : birimFiyat,
      kazananFirma: columnMap.kazananFirma ? String(row[columnMap.kazananFirma] ?? '') : ''
    }
  })
}
