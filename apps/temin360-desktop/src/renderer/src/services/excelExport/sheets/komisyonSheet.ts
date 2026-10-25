import type ExcelJS from 'exceljs'
import type { ExportContext, MasterExcelExportData } from '../types'
import {
  FONT_FAMILY,
  headerFillOfficial,
  subHeaderFillOfficial,
  thinBorder,
  zebraFill
} from '../styles'

export function buildKomisyonSheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { komisyon = [] } = data
  const { dosyaNoStr } = ctx

  const wsKom = workbook.addWorksheet('Komisyon ve Görevliler', {
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

  wsKom.columns = [
    { width: 6 },
    { width: 28 },
    { width: 24 },
    { width: 28 },
    { width: 24 },
    { width: 30 }
  ]

  wsKom.mergeCells('A1:F1')
  const komTitle = wsKom.getCell('A1')
  komTitle.value = `${dosyaNoStr} - DOĞRUDAN TEMİN GÖREVLENDİRME VE KOMİSYON LİSTESİ`
  komTitle.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } }
  komTitle.fill = headerFillOfficial
  komTitle.alignment = { vertical: 'middle', horizontal: 'center' }
  wsKom.getRow(1).height = 26

  const komHeaders = [
    'Sıra',
    'Adı Soyadı',
    'Ünvanı / Mesleği',
    'Komisyon Türü',
    'Görevi / Rolü',
    'İmza ve Görev Durumu'
  ]
  const komHeaderRow = wsKom.getRow(3)
  komHeaderRow.height = 24
  komHeaders.forEach((kh, idx) => {
    const c = komHeaderRow.getCell(idx + 1)
    c.value = kh
    c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF000000' } }
    c.fill = subHeaderFillOfficial
    c.border = thinBorder
    c.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'center' : 'left' }
  })

  let komRowIdx = 4
  const memberList =
    komisyon.length > 0
      ? komisyon
      : [
          {
            ad_soyad: 'Piyasa Araştırma Görevlisi 1',
            unvan: 'Mühendis / Uzman',
            komisyon_turu: 'Piyasa Fiyat Araştırma',
            rol: 'Başkan'
          },
          {
            ad_soyad: 'Piyasa Araştırma Görevlisi 2',
            unvan: 'Tekniker / Memur',
            komisyon_turu: 'Piyasa Fiyat Araştırma',
            rol: 'Üye'
          },
          {
            ad_soyad: 'Muayene Kabul Yetkilisi',
            unvan: 'Şube Müdürü',
            komisyon_turu: 'Muayene ve Kabul',
            rol: 'Başkan'
          },
          {
            ad_soyad: 'Harcama Yetkilisi',
            unvan: 'Daire Başkanı / Harcama Yetkilisi',
            komisyon_turu: 'Harcama ve Onay',
            rol: 'Harcama Yetkilisi'
          }
        ]

  memberList.forEach((m, idx) => {
    const row = wsKom.getRow(komRowIdx)
    row.height = 22
    row.getCell(1).value = idx + 1
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(2).value = m.ad_soyad || m.personel_adi || ''
    row.getCell(2).font = { name: FONT_FAMILY, size: 10, bold: true }
    row.getCell(3).value = m.unvan || '-'
    row.getCell(4).value = m.komisyon_turu || 'Doğrudan Temin Görevlendirmesi'
    row.getCell(5).value = m.rol || m.gorev || 'Üye'
    row.getCell(6).value = 'Görevlendirme Onaylandı'

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c)
      cell.font = cell.font || { name: FONT_FAMILY, size: 10 }
      cell.border = thinBorder
      if (idx % 2 === 1) cell.fill = zebraFill
    }
    komRowIdx++
  })
}
