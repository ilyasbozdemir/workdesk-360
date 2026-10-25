import { buildExportFileName } from '../utils/exportFileName'
import {
  buildDogrudanTeminWorkbook,
  KIK_2026_ESIK_DEGER_TL,
  type MasterExcelExportData
} from './excelExport'

export { KIK_2026_ESIK_DEGER_TL }
export type { MasterExcelExportData }

/**
 * Generates and downloads an official, multi-sheet Doğrudan Temin Master Excel Workbook
 * formatted in official Turkish State Bureaucracy style (Times New Roman, subtle elegant grays,
 * sharp borders, live Excel formulas, and printable A4 document sheets with signature boxes).
 */
export async function exportDogrudanTeminMasterExcel(data: MasterExcelExportData): Promise<void> {
  const { dosya } = data
  const workbook = buildDogrudanTeminWorkbook(data)

  // Export buffer & trigger file download with standardized filename: butceYili-dtNo-Master_Excel_Raporu.xlsx
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url

  const downloadFileName = buildExportFileName({
    dosya,
    belgeAdi: 'Dosya_Excel_Raporu',
    extension: 'xlsx'
  })

  link.setAttribute('download', downloadFileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
