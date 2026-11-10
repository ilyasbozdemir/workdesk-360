import { DocumentEngine } from '@worksuite-360/document-engine'
import { LoadPreviewDataParams, LoadPreviewDataResult } from './types'
import { applyRolePolicy } from './previewData'

export { applyRolePolicy }

/**
 * Belge önizleme verisi yükleyici (DocumentEngine adaptörü)
 * - Tüm çözümleme, üst veri bağlama ve snapshot koordinasyonu DocumentEngine tarafından yürütülür.
 * - UI katmanı SQL veya doğrudan şablon çözümleme mantığı barındırmaz.
 */
export async function loadDocumentPreviewData({
  activeDosyaId,
  resolvedId,
  selectedDocId,
  propInvitedFirms,
  showLogoLeft,
  showLogoRight,
  logoLeft,
  logoRight,
  institutionLogo
}: LoadPreviewDataParams): Promise<LoadPreviewDataResult> {
  const targetKey = resolvedId || selectedDocId || ''
  const docRecord = await DocumentEngine.loadOrCreateDocument({
    dosyaId: activeDosyaId || 0,
    templateKey: targetKey,
    context: { invitedFirms: propInvitedFirms }
  })

  const headerObj = (docRecord.headerData || {}) as Record<string, unknown>
  const dataObj: Record<string, any> = {
    ...headerObj,
    ...((docRecord.data || {}) as Record<string, unknown>)
  }

  if (showLogoLeft !== undefined) dataObj.showLogoLeft = showLogoLeft
  if (showLogoRight !== undefined) dataObj.showLogoRight = showLogoRight
  if (logoLeft) dataObj.solLogo = logoLeft
  if (logoRight) dataObj.sagLogo = logoRight
  if (institutionLogo && !dataObj.solLogo) dataObj.solLogo = institutionLogo

  return {
    finalData: dataObj,
    personelListesi: (docRecord.personelListesi as any[]) || [],
    firmaListesi: (docRecord.firmaListesi as any[]) || [],
    birimListesi: (docRecord.birimListesi as any[]) || [],
    dosyaRecord: docRecord.dosyaRecord || null,
    activeLogoLeft:
      dataObj.showLogoLeft !== undefined
        ? Boolean(dataObj.showLogoLeft)
        : Boolean(docRecord.headerData?.solLogo),
    activeLogoRight:
      dataObj.showLogoRight !== undefined
        ? Boolean(dataObj.showLogoRight)
        : Boolean(docRecord.headerData?.sagLogo),
    activeOrientation: dataObj.orientation === 'landscape' ? 'landscape' : 'portrait',
    initialSnapshotJson: JSON.stringify(dataObj)
  }
}
