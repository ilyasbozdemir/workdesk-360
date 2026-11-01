import React from 'react'
import { renderToString } from 'react-dom/server'
import { TemplateKey, resolveTemplateKey } from '@temin360/document-templates'
import { DocumentRenderer, DocumentEngine } from '@worksuite-360/document-engine'
import { useSettingsStore } from '../../../../../../store/settingsStore'
import { buildExportFileName } from '../../../../../../utils/exportFileName'
import { Personel } from '../../types'

interface CompileHtmlParams {
  ActiveComponent?: any
  activeTemplateConf: any
  formData: Record<string, any>
  personelListesi: Personel[]
  firmaListesi: any[]
  localShowLogoLeft: boolean
  localShowLogoRight: boolean
  logoLeft: string | null
  logoRight: string | null
  institutionLogo: string | null
  orientation: 'portrait' | 'landscape'
}

export function compileDocumentHtml({
  activeTemplateConf,
  formData,
  personelListesi,
  firmaListesi,
  localShowLogoLeft,
  localShowLogoRight,
  logoLeft,
  logoRight,
  institutionLogo,
  orientation
}: CompileHtmlParams): string {
  const rawId = activeTemplateConf?.id
  if (!rawId) {
    throw new Error('Dışa aktarılacak aktif şablon yapılandırması bulunamadı.')
  }

  const resolved = resolveTemplateKey(rawId)
  if (!resolved) {
    throw new Error(
      `Geçersiz şablon kimliği: "${rawId}". Şablon çözümlenemediği için yanlış belge dışa aktarımı engellendi.`
    )
  }

  const templateKey: TemplateKey = resolved
  const storeSettings = useSettingsStore.getState()
  const activeSolLogo =
    formData.solLogo ||
    logoLeft ||
    institutionLogo ||
    storeSettings.logoLeft ||
    storeSettings.institutionLogo ||
    null
  const activeSagLogo = formData.sagLogo || logoRight || storeSettings.logoRight || null

  const mergedData = {
    ...formData,
    personelListesi,
    firmaListesi,
    tarih: formData.tarih || formData.onayaSunulanTarih || '',
    onayTarihi: formData.onayTarihi || formData.dosyaTarihi || '',
    solLogo: localShowLogoLeft ? activeSolLogo : null,
    sagLogo: localShowLogoRight ? activeSagLogo : null,
    olurYazisi: formData.olurYazisi !== false,
    orientation
  }

  const bodyHtml = renderToString(
    React.createElement(DocumentRenderer, {
      templateKey,
      data: mergedData,
      orientation,
      chrome: 'bare',
      isEditing: false,
      personelListesi,
      firmaListesi,
      birimListesi: [],
      firstPageLimit: formData.firstPageLimit
    })
  )

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${activeTemplateConf?.name || 'Belge Önizleme'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 ${orientation};
            margin: 10mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            margin: 0;
            padding: 0;
            background-color: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body {
              background: white !important;
              padding: 0 !important;
            }
            [data-document-page] {
              box-shadow: none !important;
              margin: 0 !important;
              width: 100% !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="a4-document-root ${orientation}" data-document-root="true">
          ${bodyHtml}
        </div>
      </body>
    </html>
  `
}

interface SaveToDbParams {
  activeDosyaId: number
  resolvedId: string
  selectedDocId: string
  activeTemplateConf: any
  formData: Record<string, any>
  localShowLogoLeft: boolean
  localShowLogoRight: boolean
  logoLeft: string | null
  logoRight: string | null
  institutionLogo: string | null
  orientation: 'portrait' | 'landscape'
}

export async function saveDocumentToDb({
  activeDosyaId,
  resolvedId,
  selectedDocId,
  activeTemplateConf,
  formData,
  localShowLogoLeft,
  localShowLogoRight,
  logoLeft,
  logoRight,
  institutionLogo,
  orientation
}: SaveToDbParams): Promise<string | null> {
  if (!activeDosyaId || !resolvedId) return null
  const storeSettings = useSettingsStore.getState()
  const activeSolLogo =
    formData.solLogo ||
    logoLeft ||
    institutionLogo ||
    storeSettings.logoLeft ||
    storeSettings.institutionLogo ||
    null
  const activeSagLogo = formData.sagLogo || logoRight || storeSettings.logoRight || null

  const explicitMakam = formData.sunulacakMakamAdi || formData.sunulacakMakam || null

  const dataToSave = {
    ...formData,
    ...(explicitMakam ? { sunulacakMakamAdi: explicitMakam, sunulacakMakam: explicitMakam } : {}),
    solLogo: localShowLogoLeft ? activeSolLogo : null,
    sagLogo: localShowLogoRight ? activeSagLogo : null,
    showLogoLeft: localShowLogoLeft,
    showLogoRight: localShowLogoRight,
    olurYazisi: formData.olurYazisi !== false,
    orientation
  }
  const jsonStr = JSON.stringify(dataToSave)

  // Merkezi DocumentEngine üzerinden transactional ve UNIQUE kısıtına uygun kaydet
  await DocumentEngine.saveDocument({
    dosyaId: activeDosyaId,
    templateKey: resolvedId,
    data: dataToSave
  })

  // Dosya genelinde de sunulacak makamı senkronize et
  if (activeDosyaId && explicitMakam && window.electron?.ipcRenderer) {
    try {
      await window.electron.ipcRenderer.invoke(
        'db:query',
        'UPDATE DATA_TeminDosyasi SET sunulacak_makam = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [explicitMakam, activeDosyaId]
      )
    } catch (e) {
      console.warn('[saveDocumentToDb] Dosya sunulacak_makam güncelleme hatası:', e)
    }
  }

  return jsonStr
}

interface ExportPdfParams {
  htmlContent: string
  orientation: 'portrait' | 'landscape'
  dosyaRecord: any
  formData: Record<string, any>
  activeTemplateConf: any
}

export async function exportDocumentPdf({
  htmlContent,
  orientation,
  dosyaRecord,
  formData,
  activeTemplateConf
}: ExportPdfParams): Promise<void> {
  const defaultFilename = buildExportFileName({
    dosya: dosyaRecord,
    butceYili:
      (formData as any)?.butceYili || (formData as any)?.butce_yili || dosyaRecord?.butce_yili,
    teminNo: (formData as any)?.teminNo || (formData as any)?.temin_no || dosyaRecord?.temin_no,
    belgeAdi: activeTemplateConf?.name || 'Belge',
    extension: 'pdf'
  })

  try {
    const res = await window.electron.ipcRenderer.invoke('app:save-pdf-as', {
      html: htmlContent,
      orientation,
      defaultFilename
    })
    if (res && res.success) {
      alert('PDF başarıyla kaydedildi.')
      return
    }
  } catch {
    await window.electron.ipcRenderer.invoke('belge:open-pdf-external', htmlContent)
  }
}

interface ExportDocxParams {
  htmlContent: string
  dosyaRecord: any
  formData: Record<string, any>
  activeTemplateConf: any
}

export async function exportDocumentDocx({
  htmlContent,
  dosyaRecord,
  formData,
  activeTemplateConf
}: ExportDocxParams): Promise<void> {
  const defaultFilename = buildExportFileName({
    dosya: dosyaRecord,
    butceYili:
      (formData as any)?.butceYili || (formData as any)?.butce_yili || dosyaRecord?.butce_yili,
    teminNo: (formData as any)?.teminNo || (formData as any)?.temin_no || dosyaRecord?.temin_no,
    belgeAdi: activeTemplateConf?.name || 'Belge',
    extension: 'docx'
  })

  const res = await window.electron.ipcRenderer.invoke('belge:export-docx', {
    html: htmlContent,
    defaultFilename
  })
  if (res && res.success) {
    alert('Word (DOCX) belgesi başarıyla kaydedildi.')
  }
}

interface OpenPdfPreviewParams {
  htmlContent: string
  orientation: 'portrait' | 'landscape'
}

export async function openPdfPreview({
  htmlContent,
  orientation
}: OpenPdfPreviewParams): Promise<void> {
  try {
    await window.electron.ipcRenderer.invoke('app:open-pdf-preview', {
      html: htmlContent,
      orientation
    })
  } catch {
    await window.electron.ipcRenderer.invoke('belge:open-pdf-external', htmlContent)
  }
}

interface RefreshFromDbParams {
  activeDosyaId: number
  resolvedId: string
  selectedDocId?: string
}

export async function refreshDocumentFromDb({
  activeDosyaId,
  resolvedId
}: RefreshFromDbParams): Promise<Record<string, any> | null> {
  if (!activeDosyaId || !resolvedId) return null

  // Merkezi DocumentEngine üzerinden güvenli sıfırlama (mevcut veriyi revizyona arşivler ve taze default oluşturur)
  const docRecord = await DocumentEngine.resetToDefault({
    dosyaId: activeDosyaId,
    templateKey: resolvedId
  })

  return (docRecord?.data as Record<string, any>) || null
}
