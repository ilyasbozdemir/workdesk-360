import * as XLSX from 'xlsx'
import ekapData from '../data/ekap/ekap_yapim_sablonu.json'

export interface EkapOkasItem {
  kod: string
  ad: string
}

export interface EkapTemplateMeta {
  version: string
  updatedAt: string
  source: string
  stats: {
    birimSayisi: number
    okasSayisi: number
  }
}

export interface EkapRowValidationError {
  rowNumber: number
  field: string
  message: string
  suggestion?: string
}

export interface EkapParsedKalem {
  rowNumber: number
  pozNo: string
  okasKodu: string
  kalemAdi: string
  miktar: number
  birim: string
  birimFiyat: number
  satirTutari: number
  isValid: boolean
  errors: EkapRowValidationError[]
  suggestedOkas?: EkapOkasItem
}

export interface EkapImportResult {
  fileName: string
  sheetName: string
  totalRows: number
  validRows: number
  errorRows: number
  toplamYaklasikMaliyet: number
  items: EkapParsedKalem[]
  allErrors: EkapRowValidationError[]
}

export interface EkapDiffResult {
  added: EkapOkasItem[]
  changed: Array<{ kod: string; oldAd: string; newAd: string }>
  removed: EkapOkasItem[]
  newBirimlerCount: number
  newOkasCount: number
}

// Hızlı arama haritaları
const okasMap = new Map<string, string>()
const birimlerSet = new Set<string>()

// JSON'ı indeksle
;(ekapData.okas as EkapOkasItem[]).forEach((item) => {
  okasMap.set(item.kod.trim(), item.ad.trim())
})
;(ekapData.birimler as string[]).forEach((birim) => {
  birimlerSet.add(birim.trim().toLowerCase())
})

/**
 * EKAP şablon verisi ve meta bilgisi
 */
export function getEkapTemplateMeta(): EkapTemplateMeta {
  return {
    version: ekapData.version,
    updatedAt: ekapData.updatedAt,
    source: ekapData.source,
    stats: ekapData.stats
  }
}

/**
 * Resmi OKAS kodunun varlığını doğrular
 */
export function isValidOkasCode(kod: string): boolean {
  if (!kod) return false
  return okasMap.has(kod.trim())
}

/**
 * Resmi birimin varlığını doğrular
 */
export function isValidBirim(birim: string): boolean {
  if (!birim) return false
  return birimlerSet.has(birim.trim().toLowerCase())
}

/**
 * OKAS kodunu veya tanımını fuzzy / yakın arama ile önerir
 */
export function suggestClosestOkas(query: string, limit = 3): EkapOkasItem[] {
  if (!query || query.trim().length === 0) return []
  const q = query.trim().toLowerCase()

  const matches: Array<{ item: EkapOkasItem; score: number }> = []

  for (const item of ekapData.okas as EkapOkasItem[]) {
    const kod = item.kod.toLowerCase()
    const ad = item.ad.toLowerCase()

    let score = 0
    if (kod === q) {
      score = 100
    } else if (kod.startsWith(q)) {
      score = 80
    } else if (kod.includes(q)) {
      score = 60
    } else if (ad.includes(q)) {
      score = 50
    }

    if (score > 0) {
      matches.push({ item, score })
      if (matches.length > limit * 5) break
    }
  }

  matches.sort((a, b) => b.score - a.score)
  return matches.slice(0, limit).map((m) => m.item)
}

/**
 * Excel (.xlsx, .xls) ve OpenDocument (.ods) dosyalarını ayrıştırır ve doğrular
 */
export function parseEkapFile(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string,
  preferredSheet?: string
): EkapImportResult {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName =
    preferredSheet && workbook.SheetNames.includes(preferredSheet)
      ? preferredSheet
      : workbook.SheetNames.includes('Sayfa1')
        ? 'Sayfa1'
        : workbook.SheetNames[0]

  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) {
    throw new Error(`Çalışma sayfasında '${sheetName}' sekmesi bulunamadı.`)
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 })
  if (rawRows.length < 2) {
    throw new Error('Dosyada işlenecek veri satırı bulunamadı.')
  }

  // Başlık satırını bul ve sütun indekslerini eşleştir
  const headerRow = (rawRows[0] || []).map((h) =>
    String(h || '')
      .trim()
      .toLowerCase()
  )

  const colIdx = {
    pozNo: headerRow.findIndex((h) => h.includes('poz')),
    okas: headerRow.findIndex((h) => h.includes('okas')),
    ad: headerRow.findIndex(
      (h) => h.includes('ad') || h.includes('açıklama') || h.includes('aciklama')
    ),
    miktar: headerRow.findIndex((h) => h.includes('miktar')),
    birim: headerRow.findIndex((h) => h.includes('birim') && !h.includes('fiyat')),
    fiyat: headerRow.findIndex((h) => h.includes('fiyat'))
  }

  // Varsayılan EKAP Yapım İhalesi şablon sütun dizilimi (Poz, OKAS, Ad, Miktar, Birim, Birim Fiyat)
  if (colIdx.pozNo === -1) colIdx.pozNo = 0
  if (colIdx.okas === -1) colIdx.okas = 1
  if (colIdx.ad === -1) colIdx.ad = 2
  if (colIdx.miktar === -1) colIdx.miktar = 3
  if (colIdx.birim === -1) colIdx.birim = 4
  if (colIdx.fiyat === -1) colIdx.fiyat = 5

  const items: EkapParsedKalem[] = []
  const allErrors: EkapRowValidationError[] = []

  let validRowsCount = 0
  let errorRowsCount = 0
  let toplamYaklasikMaliyet = 0

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i]
    if (!row || row.length === 0) continue

    const rowNumber = i + 1 // 1-tabanlı Excel satır no

    const rawPozNo = row[colIdx.pozNo] !== undefined ? String(row[colIdx.pozNo]).trim() : ''
    const rawOkas = row[colIdx.okas] !== undefined ? String(row[colIdx.okas]).trim() : ''
    const rawAd = row[colIdx.ad] !== undefined ? String(row[colIdx.ad]).trim() : ''
    const rawMiktar = row[colIdx.miktar]
    const rawBirim = row[colIdx.birim] !== undefined ? String(row[colIdx.birim]).trim() : ''
    const rawFiyat = row[colIdx.fiyat]

    // Boş satır kontrolü
    if (
      !rawPozNo &&
      !rawOkas &&
      !rawAd &&
      rawMiktar === undefined &&
      !rawBirim &&
      rawFiyat === undefined
    ) {
      continue
    }

    const errors: EkapRowValidationError[] = []

    // 1. Poz No / Kalem Adı Zorunluluk Kontrolü
    if (!rawAd && !rawPozNo) {
      errors.push({
        rowNumber,
        field: 'Ad / Poz No',
        message: 'Kalem adı veya poz numarası zorunludur, boş bırakılamaz.'
      })
    }

    // 2. Miktar Kontrolü
    let miktar = 0
    if (rawMiktar === undefined || rawMiktar === null || String(rawMiktar).trim() === '') {
      errors.push({
        rowNumber,
        field: 'Miktar',
        message: 'Miktar alanı boş bırakılamaz.'
      })
    } else {
      const parsedMiktar = Number(String(rawMiktar).replace(',', '.'))
      if (isNaN(parsedMiktar) || parsedMiktar <= 0) {
        errors.push({
          rowNumber,
          field: 'Miktar',
          message: `Miktar geçerli pozitif bir sayı olmalıdır (Girilen: ${String(rawMiktar)}).`
        })
      } else {
        miktar = parsedMiktar
      }
    }

    // 3. Birim Kontrolü
    const birim = rawBirim || 'Adet'
    if (!rawBirim) {
      errors.push({
        rowNumber,
        field: 'Birim',
        message: 'Birim alanı belirtilmemiş (Varsayılan "Adet" atandı).'
      })
    } else if (!isValidBirim(rawBirim)) {
      errors.push({
        rowNumber,
        field: 'Birim',
        message: `Birim ('${rawBirim}') resmi EKAP birim listesinde tam eşleşmedi.`,
        suggestion: 'Standart birim seçiniz (Örn: Adet, Metre, m²)'
      })
    }

    // 4. Birim Fiyat Kontrolü
    let birimFiyat = 0
    if (rawFiyat !== undefined && rawFiyat !== null && String(rawFiyat).trim() !== '') {
      const parsedFiyat = Number(String(rawFiyat).replace(',', '.'))
      if (isNaN(parsedFiyat) || parsedFiyat < 0) {
        errors.push({
          rowNumber,
          field: 'Birim Fiyat',
          message: `Birim fiyat geçerli bir sayı olmalıdır (Girilen: ${String(rawFiyat)}).`
        })
      } else {
        birimFiyat = parsedFiyat
      }
    }

    // 5. OKAS Kodu Ayrıştırma ve Doğrulama
    let okasKodu = rawOkas
    let suggestedOkas: EkapOkasItem | undefined

    if (rawOkas) {
      // Eğer "Kalem Adı-Kod" formatında geldiyse kodu ayıkla
      const lastDash = rawOkas.lastIndexOf('-')
      if (lastDash !== -1 && lastDash < rawOkas.length - 1) {
        const potentialKod = rawOkas.substring(lastDash + 1).trim()
        if (/^\d+$/.test(potentialKod)) {
          okasKodu = potentialKod
        }
      }

      if (!isValidOkasCode(okasKodu)) {
        const suggestions = suggestClosestOkas(okasKodu || rawAd, 1)
        suggestedOkas = suggestions[0]
        errors.push({
          rowNumber,
          field: 'OKAS Kodu',
          message: `Girilen OKAS kodu ('${okasKodu}') resmi EKAP listesinde bulunamadı.`,
          suggestion: suggestedOkas
            ? `Önerilen: ${suggestedOkas.kod} (${suggestedOkas.ad})`
            : undefined
        })
      }
    }

    const isValid =
      errors.filter((e) => e.field !== 'Birim' && e.field !== 'OKAS Kodu').length === 0
    const satirTutari = miktar * birimFiyat

    if (isValid) {
      validRowsCount++
      toplamYaklasikMaliyet += satirTutari
    } else {
      errorRowsCount++
    }

    errors.forEach((err) => allErrors.push(err))

    items.push({
      rowNumber,
      pozNo: rawPozNo,
      okasKodu,
      kalemAdi: rawAd || rawPozNo,
      miktar,
      birim,
      birimFiyat,
      satirTutari,
      isValid,
      errors,
      suggestedOkas
    })
  }

  return {
    fileName,
    sheetName,
    totalRows: items.length,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    toplamYaklasikMaliyet,
    items,
    allErrors
  }
}

/**
 * Hatalı satırları dışa aktarmak için CSV formatında hata raporu üretir
 */
export function generateErrorReportCsv(errors: EkapRowValidationError[]): string {
  const headers = ['Satır No', 'Alan Adı', 'Hata Açıklaması', 'Öneri / Çözüm']
  const lines = [headers.join(';')]

  errors.forEach((err) => {
    lines.push(
      [
        err.rowNumber,
        `"${err.field.replace(/"/g, '""')}"`,
        `"${err.message.replace(/"/g, '""')}"`,
        `"${(err.suggestion || '').replace(/"/g, '""')}"`
      ].join(';')
    )
  })

  return '\uFEFF' + lines.join('\r\n')
}

/**
 * Yeni yüklenen ODS / Excel Sayfa2'sini mevcut şablonla karşılaştırır (Diff Motoru)
 */
export function diffNewTemplateFromBuffer(newBuffer: ArrayBuffer | Uint8Array): EkapDiffResult {
  const workbook = XLSX.read(newBuffer, { type: 'array' })
  const sayfa2 = workbook.Sheets['Sayfa2']
  if (!sayfa2) {
    throw new Error("Yüklenen dosyada 'Sayfa2' şablon referans sekmesi bulunamadı.")
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sayfa2, { header: 1 })
  const newBirimlerSet = new Set<string>()
  const newOkasMap = new Map<string, string>()

  rawRows.forEach((row, idx) => {
    if (!row || idx < 2) return
    const birim = row[0]
    const okasRaw = row[1]

    if (birim && typeof birim === 'string' && birim.trim() && birim.trim() !== 'DEĞİŞTİRMEYİN') {
      newBirimlerSet.add(birim.trim())
    }

    if (
      okasRaw &&
      typeof okasRaw === 'string' &&
      okasRaw.trim() &&
      okasRaw.trim() !== 'DEĞİŞTİRMEYİN'
    ) {
      const lastDash = okasRaw.lastIndexOf('-')
      if (lastDash > 0) {
        const ad = okasRaw.substring(0, lastDash).trim()
        const kod = okasRaw.substring(lastDash + 1).trim()
        if (kod) newOkasMap.set(kod, ad)
      }
    }
  })

  const added: EkapOkasItem[] = []
  const changed: Array<{ kod: string; oldAd: string; newAd: string }> = []
  const removed: EkapOkasItem[] = []

  newOkasMap.forEach((newAd, kod) => {
    if (!okasMap.has(kod)) {
      added.push({ kod, ad: newAd })
    } else {
      const oldAd = okasMap.get(kod)!
      if (oldAd !== newAd) {
        changed.push({ kod, oldAd, newAd })
      }
    }
  })

  okasMap.forEach((oldAd, kod) => {
    if (!newOkasMap.has(kod)) {
      removed.push({ kod, ad: oldAd })
    }
  })

  return {
    added,
    changed,
    removed,
    newBirimlerCount: newBirimlerSet.size,
    newOkasCount: newOkasMap.size
  }
}
