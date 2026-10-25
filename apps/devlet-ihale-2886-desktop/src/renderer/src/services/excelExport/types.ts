export interface MasterExcelExportData {
  dosya: any
  kalemler: any[]
  firmalar?: any[]
  teklifler?: any[]
  komisyon?: any[]
  kurum?: any
  sablons?: any[]
}

/**
 * 2026 Yılı KİK Doğrudan Temin (22/d) Parasal Eşik Değer Sabiti
 */
export const KIK_2026_ESIK_DEGER_TL = 1021827.0

export interface ExportContext {
  kurumAdi: string
  birimAdi: string
  dosyaNoStr: string
  dosyaKonusu: string
  ihaleSekli: string
  turLabel: string
  isYapim: boolean
  isHizmet: boolean
  tevkifatOraniText: string
  tevkifatCarpani: number
  effectiveFirms: any[]
  kalemCount: number
  kalemlerSheetName: string
  kalemEndRow: number
  kalemTotalRow: number
}
