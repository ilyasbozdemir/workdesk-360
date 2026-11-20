export type EvrakType = 'template' | 'signed_pdf' | 'uploaded_pdf' | 'attachment'

export type EvrakDurum = 'hazir' | 'imzali' | 'taslak' | 'bekliyor'

export interface EvrakItem {
  id: string
  title: string
  code: string // templateKey or file code
  stage: number // 1, 2, 3, 4, 5
  stageName: string
  type: EvrakType
  status: EvrakDurum
  badge: {
    label: string
    color: string
    textColor: string
    borderColor: string
  }
  iconType: 'file-text' | 'file-check' | 'receipt' | 'scale' | 'shield' | 'coins' | 'truck' | 'signature'
  date?: string
  signer?: string
  filePath?: string
  fileName?: string
  fileSize?: string
  snapshotExists?: boolean
  dbRecordId?: number
  description?: string
  canDelete?: boolean
}

export interface DosyaSummaryInfo {
  id: number
  teminNo: string
  konu: string
  harcamaBirimi: string
  alimTuru: string
  sozlesmeliMi: boolean
  yaklasikMaliyet: number
  netOdenen: number
  durum: string
  evrakSayisi: string
  tarih: string
  butceKodu?: string
  kazananFirma?: string
  kazananVkn?: string
}
