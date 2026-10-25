import type ExcelJS from 'exceljs'
import type { ExportContext, MasterExcelExportData } from '../types'
import { KIK_2026_ESIK_DEGER_TL } from '../types'
import {
  FONT_FAMILY,
  headerFillOfficial,
  softGrayFill,
  softHighlightFill,
  subHeaderFillOfficial,
  thinBorder
} from '../styles'

export function buildDashboardSheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { dosya, kalemler = [] } = data
  const {
    kurumAdi,
    birimAdi,
    dosyaNoStr,
    dosyaKonusu,
    ihaleSekli,
    turLabel,
    tevkifatOraniText,
    tevkifatCarpani,
    kalemlerSheetName,
    kalemTotalRow
  } = ctx

  const wsDash = workbook.addWorksheet('Süreç Takibi & Özet', {
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

  wsDash.columns = [
    { width: 4 }, // A
    { width: 30 }, // B
    { width: 38 }, // C
    { width: 24 }, // D
    { width: 28 }, // E
    { width: 24 }, // F
    { width: 4 } // G
  ]

  // Header Banner
  wsDash.mergeCells('B2:F2')
  const titleCell = wsDash.getCell('B2')
  titleCell.value = `${kurumAdi} - ${birimAdi}`
  titleCell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: 'FF000000' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  titleCell.fill = headerFillOfficial

  wsDash.mergeCells('B3:F3')
  const subTitleCell = wsDash.getCell('B3')
  subTitleCell.value = `4734 SAYILI KAMU İHALE KANUNU DOĞRUDAN TEMİN DOSYA EXCEL RAPORU`
  subTitleCell.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF374151' } }
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  subTitleCell.fill = subHeaderFillOfficial

  wsDash.getRow(2).height = 26
  wsDash.getRow(3).height = 20

  // 1. Dosya Kimlik Kartı
  wsDash.mergeCells('B5:F5')
  const infoHeader = wsDash.getCell('B5')
  infoHeader.value = '1. DOSYA VE DOĞRUDAN TEMİN GENEL BİLGİLERİ'
  infoHeader.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF000000' } }
  infoHeader.fill = subHeaderFillOfficial
  infoHeader.alignment = { vertical: 'middle', indent: 1 }
  wsDash.getRow(5).height = 24

  const infoRows = [
    ['Temin / Dosya No:', dosyaNoStr, 'Alım / İhale Türü:', turLabel],
    [
      'Yasal Dayanak / Madde:',
      ihaleSekli,
      'Bütçe Yılı & Kod:',
      `${dosya?.butce_yili || '2026'} / ${dosya?.butce_kodu || dosya?.ekonomik_kod || '03.2'}`
    ],
    [
      'Dosya / İşin Konusu:',
      dosyaKonusu,
      'Sözleşme / Teklif Türü:',
      dosya?.teklif_sozlesme_turu || 'Birim Fiyat Teklif Cetveli'
    ],
    [
      'Talep Eden Birim:',
      birimAdi,
      'Dosya Açılış Tarihi:',
      dosya?.tarih || dosya?.dosya_acilis_tarihi || new Date().toLocaleDateString('tr-TR')
    ],
    [
      'Süreç / Aşama Durumu:',
      dosya?.status || 'Aktif / İşlemde',
      'Toplam Kalem Sayısı:',
      `${kalemler.length} Kalem`
    ]
  ]

  let curRow = 6
  for (const r of infoRows) {
    wsDash.getRow(curRow).height = 21
    wsDash.getCell(`B${curRow}`).value = r[0]
    wsDash.getCell(`B${curRow}`).font = {
      name: FONT_FAMILY,
      size: 10,
      bold: true,
      color: { argb: 'FF1F2937' }
    }
    wsDash.getCell(`B${curRow}`).fill = softGrayFill
    wsDash.getCell(`B${curRow}`).border = thinBorder

    wsDash.getCell(`C${curRow}`).value = r[1]
    wsDash.getCell(`C${curRow}`).font = {
      name: FONT_FAMILY,
      size: 10,
      bold: r[0].includes('No') || r[0].includes('Konu')
    }
    wsDash.getCell(`C${curRow}`).border = thinBorder

    wsDash.getCell(`D${curRow}`).value = r[2]
    wsDash.getCell(`D${curRow}`).font = {
      name: FONT_FAMILY,
      size: 10,
      bold: true,
      color: { argb: 'FF1F2937' }
    }
    wsDash.getCell(`D${curRow}`).fill = softGrayFill
    wsDash.getCell(`D${curRow}`).border = thinBorder

    wsDash.mergeCells(`E${curRow}:F${curRow}`)
    wsDash.getCell(`E${curRow}`).value = r[3]
    wsDash.getCell(`E${curRow}`).font = {
      name: FONT_FAMILY,
      size: 10,
      bold: r[2].includes('Kalem') || r[2].includes('Türü')
    }
    wsDash.getCell(`E${curRow}`).border = thinBorder
    wsDash.getCell(`F${curRow}`).border = thinBorder
    curRow++
  }

  // 2. 2026 Yılı KİK Eşik Değer & Bütçe Limit Kontrolü
  curRow += 1
  wsDash.mergeCells(`B${curRow}:F${curRow}`)
  const esikHeader = wsDash.getCell(`B${curRow}`)
  esikHeader.value = '2. 2026 YILI KİK BÜTÇE LİMİTİ VE EŞİK DEĞER KONTROLÜ (Md. 22/d)'
  esikHeader.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF000000' } }
  esikHeader.fill = subHeaderFillOfficial
  esikHeader.alignment = { vertical: 'middle', indent: 1 }
  wsDash.getRow(curRow).height = 24

  curRow++
  const esikValRow = curRow
  wsDash.getRow(curRow).height = 22
  wsDash.getCell(`B${curRow}`).value = '2026 Yılı KİK Md. 22/d Parasal Sınırı:'
  wsDash.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`B${curRow}`).fill = softGrayFill
  wsDash.getCell(`B${curRow}`).border = thinBorder

  wsDash.getCell(`C${curRow}`).value = KIK_2026_ESIK_DEGER_TL
  wsDash.getCell(`C${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`C${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`C${curRow}`).border = thinBorder

  wsDash.getCell(`D${curRow}`).value = 'Dosya Yaklaşık Maliyet Toplamı:'
  wsDash.getCell(`D${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`D${curRow}`).fill = softGrayFill
  wsDash.getCell(`D${curRow}`).border = thinBorder

  wsDash.mergeCells(`E${curRow}:F${curRow}`)
  wsDash.getCell(`E${curRow}`).value = { formula: `'${kalemlerSheetName}'!J${kalemTotalRow}` }
  wsDash.getCell(`E${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`E${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`E${curRow}`).border = thinBorder
  wsDash.getCell(`F${curRow}`).border = thinBorder
  curRow++

  // Kalan Limit & Kullanım Oranı
  wsDash.getRow(curRow).height = 22
  wsDash.getCell(`B${curRow}`).value = 'Kalan Eşik Değer Limiti:'
  wsDash.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`B${curRow}`).fill = softGrayFill
  wsDash.getCell(`B${curRow}`).border = thinBorder

  wsDash.getCell(`C${curRow}`).value = { formula: `MAX(0, C${esikValRow} - E${esikValRow})` }
  wsDash.getCell(`C${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`C${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`C${curRow}`).border = thinBorder

  wsDash.getCell(`D${curRow}`).value = 'Eşik Değer Kullanım Oranı (%):'
  wsDash.getCell(`D${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`D${curRow}`).fill = softGrayFill
  wsDash.getCell(`D${curRow}`).border = thinBorder

  wsDash.mergeCells(`E${curRow}:F${curRow}`)
  wsDash.getCell(`E${curRow}`).value = { formula: `E${esikValRow}/C${esikValRow}` }
  wsDash.getCell(`E${curRow}`).numFmt = '0.00%'
  wsDash.getCell(`E${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`E${curRow}`).border = thinBorder
  wsDash.getCell(`F${curRow}`).border = thinBorder
  curRow++

  // Mevzuat Uygunluk Durumu
  wsDash.getRow(curRow).height = 22
  wsDash.getCell(`B${curRow}`).value = 'Mevzuat Uygunluk Durumu:'
  wsDash.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`B${curRow}`).fill = softGrayFill
  wsDash.getCell(`B${curRow}`).border = thinBorder

  wsDash.getCell(`C${curRow}`).value = {
    formula: `IF(E${esikValRow}<=C${esikValRow}, "Eşik Değer Altında (Doğrudan Temin Usulü Uygundur)", "Eşik Değer Aşımı (İhale Usulü Gereklidir)")`
  }
  wsDash.getCell(`C${curRow}`).font = { name: FONT_FAMILY, size: 9, bold: true }
  wsDash.getCell(`C${curRow}`).border = thinBorder

  wsDash.getCell(`D${curRow}`).value = 'Tevkifat Uygulama Durumu:'
  wsDash.getCell(`D${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`D${curRow}`).fill = softGrayFill
  wsDash.getCell(`D${curRow}`).border = thinBorder

  wsDash.mergeCells(`E${curRow}:F${curRow}`)
  wsDash.getCell(`E${curRow}`).value = `KDV Tevkifatı: ${tevkifatOraniText}`
  wsDash.getCell(`E${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`E${curRow}`).border = thinBorder
  wsDash.getCell(`F${curRow}`).border = thinBorder
  curRow++

  // 3. Finansal Göstergeler & KDV Tevkifat Matrisi
  curRow += 1
  wsDash.mergeCells(`B${curRow}:F${curRow}`)
  const finHeader = wsDash.getCell(`B${curRow}`)
  finHeader.value = '3. FİNANSAL GÖSTERGELER VE KDV TEVKİFAT MATRİSİ (CANLI FORMÜLLÜ)'
  finHeader.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF000000' } }
  finHeader.fill = subHeaderFillOfficial
  finHeader.alignment = { vertical: 'middle', indent: 1 }
  wsDash.getRow(curRow).height = 24

  curRow++
  const finStartRow = curRow

  wsDash.getRow(curRow).height = 22
  wsDash.getCell(`B${curRow}`).value = 'Yaklaşık Maliyet (KDV Hariç):'
  wsDash.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`B${curRow}`).fill = softGrayFill
  wsDash.getCell(`B${curRow}`).border = thinBorder

  wsDash.getCell(`C${curRow}`).value = { formula: `'${kalemlerSheetName}'!J${kalemTotalRow}` }
  wsDash.getCell(`C${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`C${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`C${curRow}`).border = thinBorder

  wsDash.getCell(`D${curRow}`).value = 'Hesaplanan KDV Tutarı (%20):'
  wsDash.getCell(`D${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`D${curRow}`).fill = softGrayFill
  wsDash.getCell(`D${curRow}`).border = thinBorder

  wsDash.mergeCells(`E${curRow}:F${curRow}`)
  wsDash.getCell(`E${curRow}`).value = { formula: `C${finStartRow} * 0.20` }
  wsDash.getCell(`E${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`E${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`E${curRow}`).border = thinBorder
  wsDash.getCell(`F${curRow}`).border = thinBorder
  curRow++

  // Tevkifat Oranı & Kesilecek Tevkifat
  wsDash.getRow(curRow).height = 22
  wsDash.getCell(`B${curRow}`).value = 'Tevkifat Oranı:'
  wsDash.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`B${curRow}`).fill = softGrayFill
  wsDash.getCell(`B${curRow}`).border = thinBorder

  wsDash.getCell(`C${curRow}`).value = tevkifatOraniText
  wsDash.getCell(`C${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`C${curRow}`).border = thinBorder

  wsDash.getCell(`D${curRow}`).value = 'Kesilecek Tevkifat Tutarı:'
  wsDash.getCell(`D${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`D${curRow}`).fill = softGrayFill
  wsDash.getCell(`D${curRow}`).border = thinBorder

  wsDash.mergeCells(`E${curRow}:F${curRow}`)
  wsDash.getCell(`E${curRow}`).value = { formula: `E${finStartRow} * ${tevkifatCarpani}` }
  wsDash.getCell(`E${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`E${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`E${curRow}`).border = thinBorder
  wsDash.getCell(`F${curRow}`).border = thinBorder
  curRow++

  // KDV Dahil Toplam & Net Ödenecek
  wsDash.getRow(curRow).height = 22
  wsDash.getCell(`B${curRow}`).value = 'KDV Dahil Toplam Tutar:'
  wsDash.getCell(`B${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`B${curRow}`).fill = softGrayFill
  wsDash.getCell(`B${curRow}`).border = thinBorder

  wsDash.getCell(`C${curRow}`).value = { formula: `C${finStartRow} + E${finStartRow}` }
  wsDash.getCell(`C${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`C${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`C${curRow}`).border = thinBorder

  wsDash.getCell(`D${curRow}`).value = 'Yükleniciye Ödenecek Net Tutar:'
  wsDash.getCell(`D${curRow}`).font = { name: FONT_FAMILY, size: 10, bold: true }
  wsDash.getCell(`D${curRow}`).fill = softGrayFill
  wsDash.getCell(`D${curRow}`).border = thinBorder

  wsDash.mergeCells(`E${curRow}:F${curRow}`)
  wsDash.getCell(`E${curRow}`).value = { formula: `C${curRow} - E${curRow - 1}` }
  wsDash.getCell(`E${curRow}`).numFmt = '#,##0.00 "₺"'
  wsDash.getCell(`E${curRow}`).font = { name: FONT_FAMILY, size: 11, bold: true }
  wsDash.getCell(`E${curRow}`).border = thinBorder
  wsDash.getCell(`F${curRow}`).border = thinBorder
  curRow++

  // 4. Doğrudan Temin Süreç Adımları
  curRow += 1
  wsDash.mergeCells(`B${curRow}:F${curRow}`)
  const stHeader = wsDash.getCell(`B${curRow}`)
  stHeader.value = '4. DOĞRUDAN TEMİN MEVZUAT SÜREÇ ADIMLARI VE İLERLEME DURUMU'
  stHeader.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF000000' } }
  stHeader.fill = subHeaderFillOfficial
  stHeader.alignment = { vertical: 'middle', indent: 1 }
  wsDash.getRow(curRow).height = 24

  curRow++
  const procCols = [
    'Adım',
    'Süreç Aşaması',
    'Mevzuat Dayanağı',
    'Üretilen Belgeler / Çıktılar',
    'Durum'
  ]
  const procColCells = ['B', 'C', 'D', 'E', 'F']
  wsDash.getRow(curRow).height = 22
  procCols.forEach((pc, i) => {
    const c = wsDash.getCell(`${procColCells[i]}${curRow}`)
    c.value = pc
    c.font = { name: FONT_FAMILY, size: 10, bold: true }
    c.fill = softHighlightFill
    c.border = thinBorder
    c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left' }
  })

  const processSteps = [
    [
      '1',
      'İhtiyaç Tespiti & Lüzum',
      '4734 Sayılı KİK Md. 22',
      'İhtiyaç Listesi, Lüzum Müzekkeresi, Talep Formu',
      'Tamamlandı'
    ],
    [
      '2',
      'Harcama Yetkilisi Onayı',
      'KİK Md. 22 & Tebliğ',
      'Doğrudan Temin Onay Belgesi, Harcama Talimatı',
      'Tamamlandı'
    ],
    [
      '3',
      'Piyasa Fiyat Araştırması',
      'KİK Md. 22/d',
      'Görevlendirme Oluru, Teklif İsteme Mektubu',
      'Tamamlandı'
    ],
    [
      '4',
      'Yaklaşık Maliyet & Fiyat Tespiti',
      'KİK Tebliği Md. 22',
      'Piyasa Fiyat Araştırma Tutanağı, Fiyat Karşılaştırma',
      'Tamamlandı'
    ],
    [
      '5',
      'Sipariş / Sözleşme İşlemleri',
      '4734 / Borçlar Kanunu',
      'Sözleşme Tasarısı, Sipariş Mektubu, Taahhütname',
      'Tamamlandı'
    ],
    [
      '6',
      'Muayene Kabul & Ödeme',
      'Muayene ve Kabul Yön.',
      'Muayene ve Kabul Tutanağı, Taşınır İşlem Fişi',
      'İşlemde / Hazır'
    ]
  ]

  for (const step of processSteps) {
    curRow++
    wsDash.getRow(curRow).height = 22
    step.forEach((val, i) => {
      const c = wsDash.getCell(`${procColCells[i]}${curRow}`)
      c.value = val
      c.font = { name: FONT_FAMILY, size: 10, bold: i === 0 || i === 4 }
      c.border = thinBorder
      c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left' }
    })
  }
}
