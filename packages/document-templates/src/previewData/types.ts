export interface LoadPreviewDataResult {
  finalData: Record<string, any>
  personelListesi: any[]
  firmaListesi: any[]
  birimListesi?: any[]
  dosyaRecord: any
  activeLogoLeft: boolean
  activeLogoRight: boolean
  activeOrientation: 'portrait' | 'landscape'
  initialSnapshotJson: string
}

