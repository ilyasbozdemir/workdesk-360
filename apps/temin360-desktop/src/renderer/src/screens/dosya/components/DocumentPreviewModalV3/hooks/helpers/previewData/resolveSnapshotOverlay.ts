import { resolveTemplateKey } from '@temin360/document-templates'
import { useGlobalDocumentPreviewStore } from '../../../../../../../store/globalDocumentPreviewStore'
import { applyRolePolicy } from './previewDataUtils'
import type { LoadPreviewDataResult } from '../types'

export async function resolveSnapshotOverlay(
  baseData: any,
  payloadData: any,
  dosyaRecord: any,
  activeDosyaId: number,
  resolvedId: string,
  targetDocTemplateId: string,
  showLogoLeft: boolean | undefined,
  showLogoRight: boolean | undefined,
  resolvedSolLogo: string | null,
  resolvedSagLogo: string | null,
  personelList: any[],
  combinedFirms: any[],
  birimList: any[],
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>
): Promise<LoadPreviewDataResult> {
  const dosyaObj = payloadData.dosya || dosyaRecord || {}
  const activeTab = useGlobalDocumentPreviewStore.getState().getActiveTab()

  // Fetch direct JSON Snapshot from DB if available
  let snapshotData = payloadData.savedSnapshot
  if (activeDosyaId) {
    try {
      const cleanDocId = String(resolvedId).replace(/\.html$/i, '').trim()
      const canonicalKey = resolveTemplateKey(cleanDocId) || cleanDocId
      const hyphenKey = canonicalKey.replace(/_/g, '-')
      const underscoreKey = canonicalKey.replace(/-/g, '_')
      const candidateKeys = Array.from(
        new Set([
          cleanDocId,
          canonicalKey,
          hyphenKey,
          underscoreKey,
          `${cleanDocId}.html`,
          `${canonicalKey}.html`,
          `${hyphenKey}.html`,
          `${underscoreKey}.html`
        ])
      )
      const placeholders = candidateKeys.map(() => '?').join(', ')
      const dbSnap = await queryExecutor(
        `SELECT veri_json FROM DATA_TeminBelgeSnapshot 
         WHERE dosya_id = ? AND is_deleted = 0 AND (
           sablon_kodu IN (${placeholders})
           OR sablon_id IN (SELECT id FROM TANIM_Sablon WHERE dosya_adi IN (${placeholders}))
         )
         ORDER BY updated_at DESC, id DESC LIMIT 1`,
        [activeDosyaId, ...candidateKeys, ...candidateKeys]
      )
      if (dbSnap && dbSnap.length > 0 && dbSnap[0]?.veri_json) {
        snapshotData = JSON.parse(dbSnap[0].veri_json)
      }
    } catch (e) {
      console.error('Direct snapshot query error:', e)
    }
  }

  // First apply initialData overrides on top of baseData as starting defaults
  const finalData: Record<string, any> = { ...baseData }
  if (activeTab?.initialData && typeof activeTab.initialData === 'object') {
    for (const [k, v] of Object.entries(activeTab.initialData)) {
      if (v !== undefined && v !== null) {
        finalData[k] = v
      }
    }
  }

  let activeLogoLeft = showLogoLeft
  let activeLogoRight = showLogoRight
  let activeOrientation: 'portrait' | 'landscape' = 'portrait'

  // DB Snapshot Data represents user-saved state and takes highest precedence
  if (snapshotData && typeof snapshotData === 'object') {
    try {
      for (const [key, val] of Object.entries(snapshotData)) {
        if (val !== undefined && val !== null) {
          if (key === 'solLogo' && (!val || String(val).trim() === '')) {
            continue
          }
          if (key === 'sagLogo' && (!val || String(val).trim() === '')) {
            continue
          }
          if (
            (key === 'mutemetAdi' ||
              key === 'muhasebeYetkilisiAdi' ||
              key === 'muhasebeYetkilisi') &&
            (!val ||
              val === '......' ||
              val === 'Mutemet / Muhasebe Yetkilisi' ||
              String(val).trim() === '') &&
            baseData.mutemetAdi
          ) {
            continue
          }
          if (
            (key === 'onaylayanPersonelAdi' || key === 'harcamaYetkilisiAdi') &&
            (!val || val === '......' || String(val).trim() === '') &&
            baseData.onaylayanPersonelAdi
          ) {
            continue
          }
          if (
            (key === 'hazirlayanPersonelAdi' || key === 'gerceklestirmeGorevlisiAdi') &&
            (!val || val === '......' || String(val).trim() === '') &&
            baseData.hazirlayanPersonelAdi
          ) {
            continue
          }
          finalData[key] = val
        }
      }
      const explicitMakam = snapshotData.sunulacakMakamAdi || snapshotData.sunulacakMakam
      if (explicitMakam) {
        finalData.sunulacakMakamAdi = explicitMakam
        finalData.sunulacakMakam = explicitMakam
      }
      const explicitTarih =
        snapshotData.tarih || snapshotData.onayaSunulanTarih || snapshotData.belgeTarihi
      if (explicitTarih) {
        if (!finalData.tarih) finalData.tarih = explicitTarih
        if (!finalData.onayaSunulanTarih) finalData.onayaSunulanTarih = explicitTarih
        if (!finalData.belgeTarihi) finalData.belgeTarihi = explicitTarih
      }
      const explicitOnayTarih = snapshotData.onayTarihi || snapshotData.olurTarihi
      if (explicitOnayTarih) {
        finalData.onayTarihi = explicitOnayTarih
        finalData.olurTarihi = explicitOnayTarih
      }
      if (snapshotData.showLogoLeft !== undefined) {
        activeLogoLeft = Boolean(snapshotData.showLogoLeft)
      }
      if (snapshotData.showLogoRight !== undefined) {
        activeLogoRight = Boolean(snapshotData.showLogoRight)
      }
      if (snapshotData.orientation) {
        activeOrientation = snapshotData.orientation
      }
      if (snapshotData.kurumIci !== undefined) {
        finalData.kurumIci = Boolean(snapshotData.kurumIci)
      }
    } catch (e) {
      console.error('Failed to merge saved snapshot JSON', e)
    }
  }

  // Ensure sunulacakMakamAdi and sunulacakMakam are in sync
  if (!finalData.sunulacakMakamAdi && (finalData.sunulacakMakam || baseData.sunulacakMakamAdi)) {
    finalData.sunulacakMakamAdi = finalData.sunulacakMakam || baseData.sunulacakMakamAdi
  }
  if (!finalData.sunulacakMakam && finalData.sunulacakMakamAdi) {
    finalData.sunulacakMakam = finalData.sunulacakMakamAdi
  }

  // Always sync live dossier delivery days if not overridden
  if (
    dosyaObj.teslim_gun !== undefined &&
    dosyaObj.teslim_gun !== null &&
    String(dosyaObj.teslim_gun).trim() !== ''
  ) {
    const liveGun = String(dosyaObj.teslim_gun)
    const tabInit = activeTab?.initialData as Record<string, any> | undefined
    if (!tabInit?.teslimGun && !tabInit?.teslimGunu) {
      finalData.teslimGun = liveGun
      finalData.teslimGunu = liveGun
      finalData.teslimSuresi = liveGun
    }
  }

  const tabInit = activeTab?.initialData as Record<string, any> | undefined
  if (dosyaObj.teslim_tarihi && !tabInit?.teslimTarihi) {
    finalData.teslimTarihi = dosyaObj.teslim_tarihi
  }

  if (!finalData.solLogo && resolvedSolLogo) {
    finalData.solLogo = resolvedSolLogo
  }
  if (!finalData.sagLogo && resolvedSagLogo) {
    finalData.sagLogo = resolvedSagLogo
  }

  // Ensure role policy is applied at the very end
  applyRolePolicy(finalData, targetDocTemplateId)

  const initialSnapshotJson = JSON.stringify({
    ...finalData,
    showLogoLeft: activeLogoLeft,
    showLogoRight: activeLogoRight,
    olurYazisi: finalData.olurYazisi !== false,
    kurumIci: Boolean(finalData.kurumIci),
    orientation: activeOrientation
  })

  return {
    finalData,
    personelListesi: personelList || [],
    firmaListesi: combinedFirms,
    birimListesi: birimList || [],
    dosyaRecord,
    activeLogoLeft: activeLogoLeft ?? false,
    activeLogoRight: activeLogoRight ?? false,
    activeOrientation,
    initialSnapshotJson
  }
}
