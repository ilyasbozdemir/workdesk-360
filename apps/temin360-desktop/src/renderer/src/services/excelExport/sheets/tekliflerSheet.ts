import type ExcelJS from 'exceljs'
import type { ExportContext, MasterExcelExportData } from '../types'
import {
  doubleBottomBorder,
  FONT_FAMILY,
  getColumnLetter,
  headerFillOfficial,
  softHighlightFill,
  subHeaderFillOfficial,
  thinBorder,
  zebraFill
} from '../styles'

export function buildTekliflerSheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { kalemler = [], teklifler = [] } = data
  const { dosyaNoStr, effectiveFirms, kalemlerSheetName } = ctx

  const wsTeklif = workbook.addWorksheet('Teklifler & Piyasa', {
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

  const tColDefs: Partial<ExcelJS.Column>[] = [
    { width: 6 }, // A: Sıra
    { width: 38 }, // B: Kalem
    { width: 10 }, // C: Birim
    { width: 12 } // D: Miktar
  ]

  effectiveFirms.forEach(() => {
    tColDefs.push({ width: 18 }) // Birim
    tColDefs.push({ width: 20 }) // Toplam
  })

  tColDefs.push({ width: 20 }) // En Uygun Birim
  tColDefs.push({ width: 22 }) // En Uygun Toplam

  wsTeklif.columns = tColDefs

  const totalColsCount = 4 + effectiveFirms.length * 2 + 2
  const lastColLetter = getColumnLetter(totalColsCount)

  wsTeklif.mergeCells(`A1:${lastColLetter}1`)
  const tTitle = wsTeklif.getCell('A1')
  tTitle.value = `${dosyaNoStr} - PİYASA FİYAT ARAŞTIRMASI VE TEKLİF KARŞILAŞTIRMA CETVELİ`
  tTitle.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } }
  tTitle.fill = headerFillOfficial
  tTitle.alignment = { vertical: 'middle', horizontal: 'center' }
  wsTeklif.getRow(1).height = 26

  wsTeklif.mergeCells(`A2:${lastColLetter}2`)
  const tSub = wsTeklif.getCell('A2')
  tSub.value = `4734 Sayılı Kanun Madde 22/d Uyarınca Alınan Birim Fiyat Teklifleri ve En Avantajlı Fiyat Tespiti (${effectiveFirms.length} İstekli)`
  tSub.font = { name: FONT_FAMILY, size: 10, color: { argb: 'FF374151' } }
  tSub.fill = subHeaderFillOfficial
  tSub.alignment = { vertical: 'middle', horizontal: 'center' }
  wsTeklif.getRow(2).height = 20

  // Header row 4
  const tHeaderRow = wsTeklif.getRow(4)
  tHeaderRow.height = 26
  const tHeaders = ['Sıra', 'İhtiyaç Kalemi / İş Tanımı', 'Birim', 'Miktar']

  effectiveFirms.forEach((f) => {
    const fName = f.unvan || f.ad || 'İstekli'
    tHeaders.push(`${fName} (Birim)`)
    tHeaders.push(`${fName} (Toplam)`)
  })

  tHeaders.push('En Uygun Birim (₺)')
  tHeaders.push('En Uygun Toplam (₺)')

  tHeaders.forEach((th, idx) => {
    const c = tHeaderRow.getCell(idx + 1)
    c.value = th
    c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF000000' } }
    c.fill = subHeaderFillOfficial
    c.border = thinBorder
    c.alignment = {
      vertical: 'middle',
      horizontal: ['Sıra', 'Birim', 'Miktar'].includes(th) ? 'center' : 'right'
    }
  })

  let tRowIdx = 5
  kalemler.forEach((k, idx) => {
    const row = wsTeklif.getRow(tRowIdx)
    row.height = 22
    const isZebra = idx % 2 === 1

    row.getCell(1).value = idx + 1
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }

    // Reference to Kalemler sheet for Kalem Adı, Birim, Miktar
    row.getCell(2).value = { formula: `'${kalemlerSheetName}'!E${idx + 5}` }
    row.getCell(2).font = { name: FONT_FAMILY, size: 10, bold: true }

    row.getCell(3).value = { formula: `'${kalemlerSheetName}'!F${idx + 5}` }
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }

    row.getCell(4).value = { formula: `'${kalemlerSheetName}'!G${idx + 5}` }
    row.getCell(4).numFmt = '#,##0.00'
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }

    const firmUnitColLetters: string[] = []
    let colCursor = 5

    effectiveFirms.forEach((f, fIdx) => {
      const unitCol = colCursor
      const totCol = colCursor + 1
      const unitColLetter = getColumnLetter(unitCol)
      firmUnitColLetters.push(unitColLetter)

      const fBid = Number(
        teklifler.find((t) => t.temin_kalem_id === k.id && t.firma_id === f.id)?.birim_fiyat ||
          (fIdx === 0 ? k.yaklasik_maliyet || 0 : (k.yaklasik_maliyet || 0) * (1 + fIdx * 0.05))
      )

      row.getCell(unitCol).value = fBid
      row.getCell(unitCol).numFmt = '#,##0.00 "₺"'
      row.getCell(totCol).value = {
        formula: `D${tRowIdx}*${unitColLetter}${tRowIdx}`
      }
      row.getCell(totCol).numFmt = '#,##0.00 "₺"'

      colCursor += 2
    })

    // Min formula for best unit price
    const minUnitCol = colCursor
    const minTotCol = colCursor + 1
    const minUnitColLetter = getColumnLetter(minUnitCol)

    const minFormulaCells = firmUnitColLetters.map((l) => `${l}${tRowIdx}`).join(',')
    row.getCell(minUnitCol).value = { formula: `MIN(${minFormulaCells})` }
    row.getCell(minUnitCol).numFmt = '#,##0.00 "₺"'
    row.getCell(minUnitCol).font = { name: FONT_FAMILY, size: 10, bold: true }

    row.getCell(minTotCol).value = {
      formula: `D${tRowIdx}*${minUnitColLetter}${tRowIdx}`
    }
    row.getCell(minTotCol).numFmt = '#,##0.00 "₺"'
    row.getCell(minTotCol).font = { name: FONT_FAMILY, size: 10, bold: true }

    for (let c = 1; c <= totalColsCount; c++) {
      const cell = row.getCell(c)
      cell.font = cell.font || { name: FONT_FAMILY, size: 10 }
      cell.border = thinBorder
      if (isZebra) cell.fill = zebraFill
    }

    tRowIdx++
  })

  // Summary Row for Teklifler
  const tTotRow = wsTeklif.getRow(tRowIdx)
  tTotRow.height = 26
  wsTeklif.mergeCells(`A${tRowIdx}:D${tRowIdx}`)
  wsTeklif.getCell(`A${tRowIdx}`).value = 'FİRMA TEKLİF TOPLAMLARI (KDV HARİÇ):'
  wsTeklif.getCell(`A${tRowIdx}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsTeklif.getCell(`A${tRowIdx}`).alignment = { vertical: 'middle', horizontal: 'right' }
  wsTeklif.getCell(`A${tRowIdx}`).fill = softHighlightFill

  let summaryCursor = 5
  effectiveFirms.forEach(() => {
    const totCol = summaryCursor + 1
    const totColLetter = getColumnLetter(totCol)
    wsTeklif.getCell(`${totColLetter}${tRowIdx}`).value = {
      formula: `SUM(${totColLetter}5:${totColLetter}${tRowIdx - 1})`
    }
    wsTeklif.getCell(`${totColLetter}${tRowIdx}`).numFmt = '#,##0.00 "₺"'
    wsTeklif.getCell(`${totColLetter}${tRowIdx}`).font = { name: FONT_FAMILY, size: 10, bold: true }
    wsTeklif.getCell(`${totColLetter}${tRowIdx}`).fill = softHighlightFill
    summaryCursor += 2
  })

  const minTotColLetter = getColumnLetter(totalColsCount)
  wsTeklif.getCell(`${minTotColLetter}${tRowIdx}`).value = {
    formula: `SUM(${minTotColLetter}5:${minTotColLetter}${tRowIdx - 1})`
  }
  wsTeklif.getCell(`${minTotColLetter}${tRowIdx}`).numFmt = '#,##0.00 "₺"'
  wsTeklif.getCell(`${minTotColLetter}${tRowIdx}`).font = {
    name: FONT_FAMILY,
    size: 11,
    bold: true
  }
  wsTeklif.getCell(`${minTotColLetter}${tRowIdx}`).fill = softHighlightFill

  for (let c = 1; c <= totalColsCount; c++) {
    wsTeklif.getCell(tRowIdx, c).border = doubleBottomBorder
  }
}
