import { TemplateResolver } from '@temin360/document-templates'
import { getDefaultMappingForProcess } from '../../../../../../constants/mappings'
import { useSettingsStore } from '../../../../../../store/settingsStore'
import { LoadPreviewDataParams, LoadPreviewDataResult } from './types'
import {
  applyRolePolicy,
  resolveAntetAndBirim,
  resolvePersonnelAndCommissions,
  resolveFirmsAndItems,
  resolveSnapshotOverlay
} from './previewData'

export { applyRolePolicy }

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
  const queryExecutor = async (sql: string, params: any[]): Promise<any[]> => {
    if (!window.electron?.ipcRenderer) return []
    const res = await window.electron.ipcRenderer.invoke('db:query', sql, params)
    if (res && res.success) {
      return res.data
    }
    return []
  }

  // Fetch complete pre-computed document payload via single native Electron IPC handler
  let payloadData: any = {}
  let resolved: any = {}

  if (window.electron?.ipcRenderer) {
    try {
      const payloadRes = await window.electron.ipcRenderer.invoke('belge:get-document-payload', {
        dosyaId: activeDosyaId,
        documentId: resolvedId
      })
      if (payloadRes?.success && payloadRes.data) {
        payloadData = payloadRes.data
      }
    } catch (err) {
      console.warn('[previewDataLoader] belge:get-document-payload IPC error:', err)
    }
  }

  // Sadece merkezi backend yanıt vermediyse renderer tarafındaki resolver'ı çalıştır
  if (!payloadData || Object.keys(payloadData).length === 0) {
    const mapping = getDefaultMappingForProcess(resolvedId)
    const resolver = new TemplateResolver(queryExecutor)
    resolved = await resolver.resolve(mapping, activeDosyaId || 0, resolvedId)
  }
  let dosyaRecord = payloadData.dosya || null
  if (!dosyaRecord && activeDosyaId) {
    const res = await queryExecutor('SELECT * FROM DATA_TeminDosyasi WHERE id = ?', [activeDosyaId])
    if (res && res[0]) dosyaRecord = res[0]
  }

  let personelList = payloadData.personelListesi || []
  if (!personelList || personelList.length === 0) {
    try {
      personelList = await queryExecutor(
        "SELECT id, ad_soyad, unvan, telefon, eposta, birim, sicil_no FROM TANIM_Personel WHERE COALESCE(aktif_mi, 1) = 1 OR aktif_mi = '1' OR aktif_mi = 'true' OR aktif_mi IS NULL ORDER BY ad_soyad ASC",
        []
      )
    } catch (e) {
      console.error('Direct personel query error:', e)
    }
  }

  let birimList = payloadData.birimListesi || []
  if (!birimList || birimList.length === 0) {
    try {
      birimList = await queryExecutor(
        'SELECT id, ad, birim_adi, kisa_ad, sunum_makami, antet_ek_satir, harcama_yetkilisi_id, harcama_yetkilisi_unvan FROM TANIM_Birim WHERE COALESCE(aktif_mi, 1) = 1 ORDER BY birim_adi ASC',
        []
      )
    } catch (e) {
      console.error('Direct birim query error:', e)
    }
  }

  let fileFirms = payloadData.fileFirms || []
  let combinedFirms = payloadData.firmaListesi || []
  let items = payloadData.items || []
  let bids = payloadData.bids || []

  if (activeDosyaId) {
    if (!fileFirms || fileFirms.length === 0) {
      try {
        const dbFirms = await queryExecutor(
          `SELECT tf.*, f.unvan, f.vergi_no, f.adres, f.telefon, f.email 
           FROM DATA_TeminFirma tf 
           LEFT JOIN TANIM_Firma f ON tf.firma_id = f.id 
           WHERE tf.temin_dosya_id = ? 
           ORDER BY tf.id ASC`,
          [activeDosyaId]
        )
        if (dbFirms && dbFirms.length > 0) {
          fileFirms = dbFirms.map((f: any) => ({
            ...f,
            id: f.id,
            temin_firma_id: f.id,
            firma_id: f.firma_id,
            unvan: f.unvan || f.firmaUnvan || `Firma ${f.id}`,
            firma_adi: f.unvan || '',
            vergi_no: f.vergi_no || '',
            adres: f.adres || '',
            telefon: f.telefon || '',
            email: f.email || ''
          }))
        }
      } catch (e) {
        console.error('Direct fileFirms query error:', e)
      }
    }

    if (!items || items.length === 0) {
      try {
        const dbKalemler = await queryExecutor(
          `SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC`,
          [activeDosyaId]
        )
        if (dbKalemler && dbKalemler.length > 0) {
          items = dbKalemler
        }
      } catch (e) {
        console.error('Direct items query error:', e)
      }
    }

    if (!bids || bids.length === 0) {
      try {
        const dbTeklifler = await queryExecutor(
          `SELECT * FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?`,
          [activeDosyaId]
        )
        if (dbTeklifler && dbTeklifler.length > 0) {
          bids = dbTeklifler
        }
      } catch (e) {
        console.error('Direct bids query error:', e)
      }
    }
  }

  if ((!fileFirms || fileFirms.length === 0) && propInvitedFirms && propInvitedFirms.length > 0) {
    fileFirms = propInvitedFirms
  }

  if (!combinedFirms || combinedFirms.length === 0) {
    try {
      combinedFirms = await queryExecutor(
        `SELECT id, unvan, vergi_no, adres, telefon, email FROM TANIM_Firma ORDER BY unvan ASC LIMIT 100`,
        []
      )
    } catch (e) {
      console.error('Direct TANIM_Firma query error:', e)
    }
  }

  const ctx = payloadData.resolvedContext || {}
  const baseData: any = { ...ctx, ...resolved }

  // 1. Resolve Antet and Unit
  await resolveAntetAndBirim(baseData, resolved, payloadData, dosyaRecord, birimList, queryExecutor)

  const dosyaObj = payloadData.dosya || dosyaRecord || {}
  const targetDocTemplateId = String(resolvedId || selectedDocId || '')
  const targetDocIds = [String(resolvedId || ''), String(selectedDocId || '')].filter(Boolean)

  // 2. Resolve Logos
  const storeSettings = useSettingsStore.getState()
  const resolvedSolLogo =
    (payloadData.solLogo && String(payloadData.solLogo).trim() !== ''
      ? payloadData.solLogo
      : null) ||
    (resolved.solLogo && String(resolved.solLogo).trim() !== '' ? resolved.solLogo : null) ||
    logoLeft ||
    institutionLogo ||
    storeSettings.logoLeft ||
    storeSettings.institutionLogo ||
    null
  const resolvedSagLogo =
    (payloadData.sagLogo && String(payloadData.sagLogo).trim() !== ''
      ? payloadData.sagLogo
      : null) ||
    (resolved.sagLogo && String(resolved.sagLogo).trim() !== '' ? resolved.sagLogo : null) ||
    logoRight ||
    storeSettings.logoRight ||
    null

  if (resolvedSolLogo) {
    baseData.solLogo = resolvedSolLogo
  }
  if (resolvedSagLogo) {
    baseData.sagLogo = resolvedSagLogo
  }

  // 3. Resolve Personnel and Commission roles
  await resolvePersonnelAndCommissions(
    baseData,
    dosyaObj,
    ctx,
    targetDocTemplateId,
    targetDocIds,
    personelList,
    activeDosyaId,
    resolvedId,
    selectedDocId,
    queryExecutor
  )

  // 4. Resolve Firms and Items
  resolveFirmsAndItems(
    baseData,
    dosyaObj,
    dosyaRecord,
    payloadData,
    fileFirms,
    propInvitedFirms,
    combinedFirms,
    items,
    bids
  )

  // 5. Resolve Snapshot and final data assembly
  return resolveSnapshotOverlay(
    baseData,
    payloadData,
    dosyaRecord,
    activeDosyaId,
    resolvedId,
    targetDocTemplateId,
    showLogoLeft,
    showLogoRight,
    resolvedSolLogo,
    resolvedSagLogo,
    personelList,
    combinedFirms,
    birimList,
    queryExecutor
  )
}
