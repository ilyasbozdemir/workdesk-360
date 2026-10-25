import type ExcelJS from 'exceljs'
import type { ExportContext, MasterExcelExportData } from '../types'
import { boxBorder, FONT_FAMILY, getColumnLetter, softGrayFill, thinBorder } from '../styles'

export function buildA4IhtiyacSheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { dosya, kalemler = [] } = data
  const { kurumAdi, birimAdi, dosyaNoStr, dosyaKonusu, kalemlerSheetName } = ctx

  const wsA4Ihtiyac = workbook.addWorksheet('A4 - İhtiyaç Listesi Formu', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
      showGridLines: true
    },
    views: [{ showGridLines: true }]
  })

  wsA4Ihtiyac.columns = [
    { width: 6 }, // A: Sıra
    { width: 20 }, // B: Kod / Poz
    { width: 38 }, // C: Malzeme / Hizmet Adı
    { width: 12 }, // D: Miktar
    { width: 12 }, // E: Birim
    { width: 22 } // F: Açıklama
  ]

  // A4 Document Header (Official Republic of Turkey Bureaucratic Style)
  wsA4Ihtiyac.mergeCells('A1:F1')
  wsA4Ihtiyac.getCell('A1').value = `T.C.`
  wsA4Ihtiyac.getCell('A1').font = { name: FONT_FAMILY, size: 12, bold: true }
  wsA4Ihtiyac.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }

  wsA4Ihtiyac.mergeCells('A2:F2')
  wsA4Ihtiyac.getCell('A2').value = kurumAdi
  wsA4Ihtiyac.getCell('A2').font = { name: FONT_FAMILY, size: 12, bold: true }
  wsA4Ihtiyac.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' }

  wsA4Ihtiyac.mergeCells('A3:F3')
  wsA4Ihtiyac.getCell('A3').value = birimAdi
  wsA4Ihtiyac.getCell('A3').font = { name: FONT_FAMILY, size: 11, bold: true }
  wsA4Ihtiyac.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' }

  wsA4Ihtiyac.mergeCells('A5:F5')
  wsA4Ihtiyac.getCell('A5').value = `İHTİYAÇ LİSTESİ VE TALEP FORMU`
  wsA4Ihtiyac.getCell('A5').font = { name: FONT_FAMILY, size: 13, bold: true, underline: true }
  wsA4Ihtiyac.getCell('A5').alignment = { vertical: 'middle', horizontal: 'center' }
  wsA4Ihtiyac.getRow(5).height = 24

  // Info Block
  wsA4Ihtiyac.getCell('A7').value = 'Dosya No:'
  wsA4Ihtiyac.getCell('A7').font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Ihtiyac.getCell('B7').value = dosyaNoStr
  wsA4Ihtiyac.getCell('B7').font = { name: FONT_FAMILY, size: 10 }

  wsA4Ihtiyac.getCell('E7').value = 'Tarih:'
  wsA4Ihtiyac.getCell('E7').font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Ihtiyac.getCell('F7').value = dosya?.tarih || new Date().toLocaleDateString('tr-TR')
  wsA4Ihtiyac.getCell('F7').font = { name: FONT_FAMILY, size: 10 }

  wsA4Ihtiyac.getCell('A8').value = 'İşin Konusu:'
  wsA4Ihtiyac.getCell('A8').font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Ihtiyac.mergeCells('B8:F8')
  wsA4Ihtiyac.getCell('B8').value = dosyaKonusu
  wsA4Ihtiyac.getCell('B8').font = { name: FONT_FAMILY, size: 10 }

  // A4 Table Header
  const a4Headers = [
    'Sıra No',
    'Taşınır / Poz No',
    'Malzeme / Hizmet / İmalat Tanımı',
    'Miktar',
    'Birim',
    'Açıklama'
  ]
  const a4HeaderRow = wsA4Ihtiyac.getRow(10)
  a4HeaderRow.height = 22
  a4Headers.forEach((ah, idx) => {
    const c = a4HeaderRow.getCell(idx + 1)
    c.value = ah
    c.font = { name: FONT_FAMILY, size: 10, bold: true }
    c.fill = softGrayFill
    c.border = thinBorder
    c.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 || idx === 3 || idx === 4 ? 'center' : 'left'
    }
  })

  let a4RowIdx = 11
  kalemler.forEach((_, idx) => {
    const row = wsA4Ihtiyac.getRow(a4RowIdx)
    row.height = 20

    row.getCell(1).value = idx + 1
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }

    // Live reference to Kalemler Sheet
    row.getCell(2).value = { formula: `'${kalemlerSheetName}'!C${idx + 5}` }
    row.getCell(3).value = { formula: `'${kalemlerSheetName}'!E${idx + 5}` }
    row.getCell(4).value = { formula: `'${kalemlerSheetName}'!G${idx + 5}` }
    row.getCell(4).numFmt = '#,##0.00'
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }

    row.getCell(5).value = { formula: `'${kalemlerSheetName}'!F${idx + 5}` }
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }

    row.getCell(6).value = { formula: `'${kalemlerSheetName}'!K${idx + 5}` }

    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = thinBorder
      row.getCell(c).font = { name: FONT_FAMILY, size: 10 }
    }
    a4RowIdx++
  })

  // Signatures on A4
  a4RowIdx += 2
  wsA4Ihtiyac.mergeCells(`A${a4RowIdx}:C${a4RowIdx}`)
  wsA4Ihtiyac.getCell(`A${a4RowIdx}`).value = 'Talep Eden / Hazırlayan Görevli'
  wsA4Ihtiyac.getCell(`A${a4RowIdx}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Ihtiyac.getCell(`A${a4RowIdx}`).alignment = { horizontal: 'center' }

  wsA4Ihtiyac.mergeCells(`D${a4RowIdx}:F${a4RowIdx}`)
  wsA4Ihtiyac.getCell(`D${a4RowIdx}`).value = 'Birim Yetkilisi / Harcama Yetkilisi'
  wsA4Ihtiyac.getCell(`D${a4RowIdx}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Ihtiyac.getCell(`D${a4RowIdx}`).alignment = { horizontal: 'center' }

  a4RowIdx++
  wsA4Ihtiyac.mergeCells(`A${a4RowIdx}:C${a4RowIdx}`)
  wsA4Ihtiyac.getCell(`A${a4RowIdx}`).value = 'İmza'
  wsA4Ihtiyac.getCell(`A${a4RowIdx}`).font = { name: FONT_FAMILY, size: 9, italic: true }
  wsA4Ihtiyac.getCell(`A${a4RowIdx}`).alignment = { horizontal: 'center' }

  wsA4Ihtiyac.mergeCells(`D${a4RowIdx}:F${a4RowIdx}`)
  wsA4Ihtiyac.getCell(`D${a4RowIdx}`).value = 'İmza / Mühür'
  wsA4Ihtiyac.getCell(`D${a4RowIdx}`).font = { name: FONT_FAMILY, size: 9, italic: true }
  wsA4Ihtiyac.getCell(`D${a4RowIdx}`).alignment = { horizontal: 'center' }
}

export function buildA4OnaySheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { dosya, komisyon = [] } = data
  const { kurumAdi, birimAdi, dosyaKonusu, ihaleSekli, kalemlerSheetName, kalemTotalRow } = ctx

  const wsA4Onay = workbook.addWorksheet('A4 - Doğrudan Temin Onayı', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
      showGridLines: true
    },
    views: [{ showGridLines: true }]
  })

  wsA4Onay.columns = [{ width: 6 }, { width: 28 }, { width: 44 }]

  wsA4Onay.mergeCells('A1:C1')
  wsA4Onay.getCell('A1').value = kurumAdi
  wsA4Onay.getCell('A1').font = { name: FONT_FAMILY, size: 12, bold: true }
  wsA4Onay.getCell('A1').alignment = { horizontal: 'center' }

  wsA4Onay.mergeCells('A2:C2')
  wsA4Onay.getCell('A2').value = `DOĞRUDAN TEMİN ONAY BELGESİ (HARCAMA TALİMATI)`
  wsA4Onay.getCell('A2').font = { name: FONT_FAMILY, size: 12, bold: true, underline: true }
  wsA4Onay.getCell('A2').alignment = { horizontal: 'center' }
  wsA4Onay.getRow(2).height = 24

  const onayFields = [
    ['1', 'İdarenin Adı:', kurumAdi],
    ['2', 'Harcama Birimi:', birimAdi],
    ['3', 'İşin / Alımın Adı ve Niteliği:', dosyaKonusu],
    ['4', 'Alım / İhale Usulü:', ihaleSekli],
    [
      '5',
      'Bütçe Tertibi & Yılı:',
      `${dosya?.butce_yili || '2026'} / ${dosya?.butce_kodu || '03.2'}`
    ],
    [
      '6',
      'Yaklaşık Maliyet Tutarı (KDV Hariç):',
      { formula: `'${kalemlerSheetName}'!J${kalemTotalRow}` }
    ],
    ['7', 'Kullanılabilir Ödenek Tutarı:', { formula: `'${kalemlerSheetName}'!J${kalemTotalRow}` }],
    [
      '8',
      'Piyasa Fiyat Araştırması Görevlileri:',
      komisyon
        .map((k) => k.ad_soyad || k.personel_adi)
        .filter(Boolean)
        .join(', ') || 'Satınalma Görevlileri'
    ],
    [
      '9',
      'Açıklamalar / Gerekçe:',
      '4734 Sayılı Kanun Madde 22/d uyarınca doğrudan temin usulüyle yapılması uygundur.'
    ]
  ]

  let oRow = 4
  for (const f of onayFields) {
    wsA4Onay.getRow(oRow).height = 24
    wsA4Onay.getCell(`A${oRow}`).value = f[0]
    wsA4Onay.getCell(`A${oRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
    wsA4Onay.getCell(`A${oRow}`).border = thinBorder
    wsA4Onay.getCell(`A${oRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }

    wsA4Onay.getCell(`B${oRow}`).value = f[1]
    wsA4Onay.getCell(`B${oRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
    wsA4Onay.getCell(`B${oRow}`).fill = softGrayFill
    wsA4Onay.getCell(`B${oRow}`).border = thinBorder
    wsA4Onay.getCell(`B${oRow}`).alignment = { vertical: 'middle' }

    wsA4Onay.getCell(`C${oRow}`).value = f[2] as any
    wsA4Onay.getCell(`C${oRow}`).font = { name: FONT_FAMILY, size: 10 }
    wsA4Onay.getCell(`C${oRow}`).border = thinBorder
    wsA4Onay.getCell(`C${oRow}`).alignment = { vertical: 'middle' }
    if (f[0] === '6' || f[0] === '7') {
      wsA4Onay.getCell(`C${oRow}`).numFmt = '#,##0.00 "₺"'
      wsA4Onay.getCell(`C${oRow}`).font = { name: FONT_FAMILY, size: 11, bold: true }
    }
    oRow++
  }

  // Onay Kutusu
  oRow += 2
  wsA4Onay.mergeCells(`A${oRow}:C${oRow}`)
  wsA4Onay.getCell(`A${oRow}`).value = 'HARCAMA YETKİLİSİ ONAYI'
  wsA4Onay.getCell(`A${oRow}`).font = { name: FONT_FAMILY, size: 11, bold: true }
  wsA4Onay.getCell(`A${oRow}`).fill = softGrayFill
  wsA4Onay.getCell(`A${oRow}`).alignment = { horizontal: 'center' }
  wsA4Onay.getCell(`A${oRow}`).border = thinBorder

  oRow++
  wsA4Onay.mergeCells(`A${oRow}:C${oRow}`)
  wsA4Onay.getCell(`A${oRow}`).value =
    'Yukarıda belirtilen harcamanın 4734 Sayılı Kanun Md. 22/d uyarınca doğrudan temin usulüyle yapılması UYGUNDUR.'
  wsA4Onay.getCell(`A${oRow}`).font = { name: FONT_FAMILY, size: 10, italic: true }
  wsA4Onay.getCell(`A${oRow}`).alignment = { horizontal: 'center' }
  wsA4Onay.getCell(`A${oRow}`).border = thinBorder

  oRow++
  wsA4Onay.mergeCells(`A${oRow}:C${oRow}`)
  wsA4Onay.getCell(`A${oRow}`).value = 'Harcama Yetkilisi\nAdı Soyadı / Ünvanı\nİmza ve Mühür'
  wsA4Onay.getCell(`A${oRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Onay.getCell(`A${oRow}`).alignment = { horizontal: 'center', wrapText: true }
  wsA4Onay.getRow(oRow).height = 40
  wsA4Onay.getCell(`A${oRow}`).border = boxBorder
}

export function buildA4PiyasaSheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { kalemler = [] } = data
  const { kurumAdi, birimAdi, dosyaKonusu, dosyaNoStr, effectiveFirms, kalemlerSheetName } = ctx

  const totalColsCount = 4 + effectiveFirms.length * 2 + 2

  const wsA4Piyasa = workbook.addWorksheet('A4 - Piyasa Fiyat Tutanağı', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
      showGridLines: true
    },
    views: [{ showGridLines: true }]
  })

  wsA4Piyasa.columns = [
    { width: 6 }, // A: Sıra
    { width: 34 }, // B: Kalem
    { width: 10 }, // C: Birim
    { width: 12 }, // D: Miktar
    { width: 18 }, // E: Firma 1
    { width: 18 }, // F: Firma 2
    { width: 18 }, // G: Firma 3
    { width: 22 } // H: En Uygun Teklif
  ]

  wsA4Piyasa.mergeCells('A1:H1')
  wsA4Piyasa.getCell('A1').value = `${kurumAdi} - ${birimAdi}`
  wsA4Piyasa.getCell('A1').font = { name: FONT_FAMILY, size: 12, bold: true }
  wsA4Piyasa.getCell('A1').alignment = { horizontal: 'center' }

  wsA4Piyasa.mergeCells('A2:H2')
  wsA4Piyasa.getCell('A2').value = `PİYASA FİYAT ARAŞTIRMASI TUTANAĞI`
  wsA4Piyasa.getCell('A2').font = { name: FONT_FAMILY, size: 12, bold: true, underline: true }
  wsA4Piyasa.getCell('A2').alignment = { horizontal: 'center' }

  wsA4Piyasa.getCell('A4').value = `İşin Konusu: ${dosyaKonusu} | Dosya No: ${dosyaNoStr}`
  wsA4Piyasa.mergeCells('A4:H4')
  wsA4Piyasa.getCell('A4').font = { name: FONT_FAMILY, size: 10, italic: true }

  const pHeaders = [
    'Sıra',
    'İhtiyaç Kalemi Tanımı',
    'Birim',
    'Miktar',
    effectiveFirms[0]?.unvan || '1. Firma',
    effectiveFirms[1]?.unvan || '2. Firma',
    effectiveFirms[2]?.unvan || '3. Firma',
    'En Uygun Teklif (₺)'
  ]

  const pHeaderRow = wsA4Piyasa.getRow(6)
  pHeaderRow.height = 22
  pHeaders.forEach((ph, idx) => {
    const c = pHeaderRow.getCell(idx + 1)
    c.value = ph
    c.font = { name: FONT_FAMILY, size: 10, bold: true }
    c.fill = softGrayFill
    c.border = thinBorder
    c.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 || idx === 2 ? 'center' : idx >= 3 ? 'right' : 'left'
    }
  })

  let pRowIdx = 7
  kalemler.forEach((_, idx) => {
    const r = wsA4Piyasa.getRow(pRowIdx)
    r.height = 20

    r.getCell(1).value = idx + 1
    r.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }

    r.getCell(2).value = { formula: `'${kalemlerSheetName}'!E${idx + 5}` }
    r.getCell(3).value = { formula: `'${kalemlerSheetName}'!F${idx + 5}` }
    r.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }

    r.getCell(4).value = { formula: `'${kalemlerSheetName}'!G${idx + 5}` }
    r.getCell(4).numFmt = '#,##0.00'
    r.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }

    // Teklifler sheet formulas
    r.getCell(5).value = { formula: `'Teklifler & Piyasa'!E${idx + 5}` }
    r.getCell(5).numFmt = '#,##0.00 "₺"'

    r.getCell(6).value = { formula: `'Teklifler & Piyasa'!G${idx + 5}` }
    r.getCell(6).numFmt = '#,##0.00 "₺"'

    r.getCell(7).value = { formula: `'Teklifler & Piyasa'!I${idx + 5}` }
    r.getCell(7).numFmt = '#,##0.00 "₺"'

    const lastColLetterOfTeklif = getColumnLetter(totalColsCount - 1)
    r.getCell(8).value = { formula: `'Teklifler & Piyasa'!${lastColLetterOfTeklif}${idx + 5}` }
    r.getCell(8).numFmt = '#,##0.00 "₺"'
    r.getCell(8).font = { name: FONT_FAMILY, size: 10, bold: true }

    for (let c = 1; c <= 8; c++) {
      r.getCell(c).border = thinBorder
      r.getCell(c).font = r.getCell(c).font || { name: FONT_FAMILY, size: 10 }
    }
    pRowIdx++
  })

  // Piyasa Araştırması İmzaları
  pRowIdx += 2
  wsA4Piyasa.mergeCells(`A${pRowIdx}:D${pRowIdx}`)
  wsA4Piyasa.getCell(`A${pRowIdx}`).value = 'Piyasa Fiyat Araştırma Görevlisi'
  wsA4Piyasa.getCell(`A${pRowIdx}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Piyasa.getCell(`A${pRowIdx}`).alignment = { horizontal: 'center' }

  wsA4Piyasa.mergeCells(`E${pRowIdx}:H${pRowIdx}`)
  wsA4Piyasa.getCell(`E${pRowIdx}`).value = 'Piyasa Fiyat Araştırma Görevlisi'
  wsA4Piyasa.getCell(`E${pRowIdx}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsA4Piyasa.getCell(`E${pRowIdx}`).alignment = { horizontal: 'center' }

  pRowIdx++
  wsA4Piyasa.mergeCells(`A${pRowIdx}:D${pRowIdx}`)
  wsA4Piyasa.getCell(`A${pRowIdx}`).value = 'Adı Soyadı / İmza'
  wsA4Piyasa.getCell(`A${pRowIdx}`).font = { name: FONT_FAMILY, size: 9, italic: true }
  wsA4Piyasa.getCell(`A${pRowIdx}`).alignment = { horizontal: 'center' }

  wsA4Piyasa.mergeCells(`E${pRowIdx}:H${pRowIdx}`)
  wsA4Piyasa.getCell(`E${pRowIdx}`).value = 'Adı Soyadı / İmza'
  wsA4Piyasa.getCell(`E${pRowIdx}`).font = { name: FONT_FAMILY, size: 9, italic: true }
  wsA4Piyasa.getCell(`E${pRowIdx}`).alignment = { horizontal: 'center' }
}
