import type ExcelJS from 'exceljs'
import type { ExportContext, MasterExcelExportData } from '../types'
import {
  doubleBottomBorder,
  FONT_FAMILY,
  headerFillOfficial,
  softHighlightFill,
  subHeaderFillOfficial,
  thinBorder,
  zebraFill
} from '../styles'

export function buildKalemlerSheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { dosya, kalemler = [] } = data
  const { dosyaNoStr, dosyaKonusu, turLabel, kurumAdi, kalemlerSheetName, kalemTotalRow } = ctx

  const wsKalem = workbook.addWorksheet(kalemlerSheetName, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
      showGridLines: true
    },
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  })

  wsKalem.columns = [
    { width: 6 }, // A: Sıra No
    { width: 14 }, // B: Tür
    { width: 22 }, // C: Taşınır / Poz No
    { width: 16 }, // D: OKAS Kodu
    { width: 44 }, // E: Kalem / İmalat Tanımı
    { width: 12 }, // F: Birim
    { width: 14 }, // G: Miktar
    { width: 12 }, // H: KDV (%)
    { width: 20 }, // I: Yaklaşık Birim (₺)
    { width: 24 }, // J: Toplam Tutar (₺)
    { width: 35 } // K: Açıklama / Teknik Özellik
  ]

  // Sheet Title
  wsKalem.mergeCells('A1:K1')
  const kTitle = wsKalem.getCell('A1')
  kTitle.value = `${dosyaNoStr} - İHTİYAÇ, MALZEME VE İMALAT LİSTESİ CETVELİ`
  kTitle.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } }
  kTitle.fill = headerFillOfficial
  kTitle.alignment = { vertical: 'middle', horizontal: 'center' }
  wsKalem.getRow(1).height = 26

  wsKalem.mergeCells('A2:K2')
  const kSub = wsKalem.getCell('A2')
  kSub.value = `İşin Adı: ${dosyaKonusu} | Alım Türü: ${turLabel} | İdare: ${kurumAdi}`
  kSub.font = { name: FONT_FAMILY, size: 10, color: { argb: 'FF374151' } }
  kSub.fill = subHeaderFillOfficial
  kSub.alignment = { vertical: 'middle', horizontal: 'center' }
  wsKalem.getRow(2).height = 20

  // Column Headers
  const kalemHeaders = [
    'Sıra',
    'Tür',
    'Taşınır Kod / Poz No',
    'OKAS Kodu',
    'Kalem / İş / İmalat Tanımı',
    'Birim',
    'Miktar',
    'KDV (%)',
    'Yaklaşık Birim (₺)',
    'Toplam Tutar (₺)',
    'Açıklama / Teknik Özellik'
  ]
  const kHeaderRow = wsKalem.getRow(4)
  kHeaderRow.height = 24
  kalemHeaders.forEach((h, idx) => {
    const c = kHeaderRow.getCell(idx + 1)
    c.value = h
    c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF000000' } }
    c.fill = subHeaderFillOfficial
    c.border = thinBorder
    c.alignment = {
      vertical: 'middle',
      horizontal: ['Sıra', 'Tür', 'Birim', 'Miktar', 'KDV (%)', 'OKAS Kodu'].includes(h)
        ? 'center'
        : ['Yaklaşık Birim (₺)', 'Toplam Tutar (₺)'].includes(h)
          ? 'right'
          : 'left'
    }
  })

  let kRowIdx = 5
  kalemler.forEach((k, idx) => {
    const row = wsKalem.getRow(kRowIdx)
    row.height = 22
    const isZebra = idx % 2 === 1

    row.getCell(1).value = idx + 1
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }

    row.getCell(2).value =
      k.tipi ||
      (dosya?.tur === 'yapim_isi' || dosya?.tur === 'yapim'
        ? 'Yapım'
        : dosya?.tur === 'hizmet'
          ? 'Hizmet'
          : 'Mal')
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }

    row.getCell(3).value = k.tasinir_kodu || k.poz_no || '-'
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' }

    row.getCell(4).value = k.okas_kodu || '-'
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }

    row.getCell(5).value = k.kalem_adi || k.adi || ''
    row.getCell(5).font = { name: FONT_FAMILY, size: 10, bold: true }

    row.getCell(6).value = k.birim || 'Adet'
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' }

    row.getCell(7).value = Number(k.miktar || 0)
    row.getCell(7).numFmt = '#,##0.00'
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' }

    row.getCell(8).value = Number(k.kdv_orani ?? 20) / 100
    row.getCell(8).numFmt = '0%'
    row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' }

    const birimFiyat = Number(k.yaklasik_maliyet || k.birim_fiyat || 0)
    row.getCell(9).value = birimFiyat
    row.getCell(9).numFmt = '#,##0.00 "₺"'
    row.getCell(9).alignment = { vertical: 'middle', horizontal: 'right' }

    // Formula for Total = Miktar * Birim Fiyat (Column G * Column I)
    row.getCell(10).value = {
      formula: `G${kRowIdx}*I${kRowIdx}`,
      result: Number(k.miktar || 0) * birimFiyat
    }
    row.getCell(10).numFmt = '#,##0.00 "₺"'
    row.getCell(10).font = { name: FONT_FAMILY, size: 10, bold: true }
    row.getCell(10).alignment = { vertical: 'middle', horizontal: 'right' }

    row.getCell(11).value = k.aciklama || ''

    for (let c = 1; c <= 11; c++) {
      const cell = row.getCell(c)
      cell.font = cell.font || { name: FONT_FAMILY, size: 10 }
      cell.border = thinBorder
      if (isZebra) cell.fill = zebraFill
    }

    kRowIdx++
  })

  // Summary Row for Kalemler
  const kTotRow = wsKalem.getRow(kalemTotalRow)
  kTotRow.height = 26
  wsKalem.mergeCells(`A${kalemTotalRow}:I${kalemTotalRow}`)
  const totLabel = wsKalem.getCell(`A${kalemTotalRow}`)
  totLabel.value = 'GENEL YAKLAŞIK MALİYET TOPLAMI (KDV HARİÇ):'
  totLabel.font = { name: FONT_FAMILY, size: 10, bold: true }
  totLabel.alignment = { vertical: 'middle', horizontal: 'right' }
  totLabel.fill = softHighlightFill

  const totFormula = wsKalem.getCell(`J${kalemTotalRow}`)
  totFormula.value = {
    formula: `SUM(J5:J${kalemTotalRow - 1})`
  }
  totFormula.numFmt = '#,##0.00 "₺"'
  totFormula.font = { name: FONT_FAMILY, size: 11, bold: true }
  totFormula.fill = softHighlightFill
  totFormula.alignment = { vertical: 'middle', horizontal: 'right' }

  for (let c = 1; c <= 11; c++) {
    wsKalem.getCell(kalemTotalRow, c).border = doubleBottomBorder
  }
}
