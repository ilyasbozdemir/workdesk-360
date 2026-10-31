import { useEffect, useRef, useState } from 'react'
import { IhtiyacListesiType } from '@temin360/document-templates'
import { useWorkspaceStore } from '../../../../../store/workspaceStore'
import { useSettingsStore } from '../../../../../store/settingsStore'
import { useClickOutside } from '../../../../../hooks/useClickOutside'
import { Personel, DocumentSource } from '../types'
import { resolveTemplateConfig, TEMPLATE_OPTIONS, TemplateOptionItem } from '../templateResolver'
import { documentPreloadService } from '../../../../../services/documentPreloadService'
import {
  compileDocumentHtml,
  exportDocumentDocx,
  exportDocumentPdf,
  openPdfPreview,
  refreshDocumentFromDb,
  saveDocumentToDb,
  useDocumentPreviewScale,
  UseDocumentPreviewDataParams,
  sourceResolvers as resolvers
} from './helpers'

export function useDocumentPreviewData({
  isOpen,
  documentId,
  dosyaId: propDosyaId,
  source: propSource,
  initialTemplateId,
  invitedFirms: propInvitedFirms
}: UseDocumentPreviewDataParams) {
  const { activeDosyaId: storeDosyaId } = useWorkspaceStore()
  const activeDosyaId =
    (propSource?.kind === 'dosya' ? propSource.dosyaId : null) ||
    propDosyaId ||
    storeDosyaId ||
    Number(sessionStorage.getItem('workspace_dosya_id') || 0) ||
    Number(localStorage.getItem('active_dosya_id') || 0)

  const resolvedSource: DocumentSource =
    propSource ||
    ({
      kind: 'dosya',
      dosyaId: activeDosyaId,
      documentId: documentId || undefined
    } as DocumentSource)

  const initialDocId =
    initialTemplateId ||
    documentId ||
    (resolvedSource.kind === 'ihtiyacRaporu' ? 'luzum_muzekkeresi' : 'ihtiyac-listesi')

  const [selectedDocId, setSelectedDocId] = useState<string>(() => initialDocId)
  const [prevPropDocId, setPrevPropDocId] = useState<string | null>(
    documentId || initialTemplateId || null
  )

  const currentIncomingDocId = initialTemplateId || documentId
  if (currentIncomingDocId && currentIncomingDocId !== prevPropDocId) {
    setPrevPropDocId(currentIncomingDocId)
    setSelectedDocId(currentIncomingDocId)
  }

  const [templateOptions, setTemplateOptions] = useState<TemplateOptionItem[]>(TEMPLATE_OPTIONS)

  useEffect(() => {
    let isMounted = true
    const resolver = resolvers[resolvedSource.kind]
    if (resolver) {
      resolver.templates(resolvedSource).then((opts) => {
        if (isMounted && opts && opts.length > 0) {
          setTemplateOptions(opts)
        }
      })
    }
    return () => {
      isMounted = false
    }
  }, [
    resolvedSource.kind,
    resolvedSource.kind === 'dosya' ? resolvedSource.dosyaId : resolvedSource.raporId
  ])

  const { logoLeft, logoRight, institutionLogo, showLogoLeft, showLogoRight } = useSettingsStore()

  const {
    config: activeTemplateConf,
    component: ActiveComponent,
    resolvedId
  } = resolveTemplateConfig(selectedDocId)

  const initialPreloaded = documentPreloadService.getCachedDocument(resolvedId, activeDosyaId)
  const hasInitialPreloadData = Boolean(
    (initialPreloaded?.resolvedData && Object.keys(initialPreloaded.resolvedData).length > 0) ||
      initialPreloaded?.payloadData?.savedSnapshot
  )

  const [formData, setFormData] = useState<Partial<IhtiyacListesiType>>(() => {
    if (initialPreloaded?.resolvedData && Object.keys(initialPreloaded.resolvedData).length > 0) {
      return initialPreloaded.resolvedData
    }
    if (initialPreloaded?.payloadData?.savedSnapshot) {
      return initialPreloaded.payloadData.savedSnapshot
    }
    if (propInvitedFirms && propInvitedFirms.length > 0) {
      return {
        firmalar: propInvitedFirms.map((f: any) => ({
          unvan: f.unvan || f.firma_adi || 'İstekli Firma',
          yetkili_ad_soyad: f.yetkili_ad_soyad || ''
        }))
      }
    }
    return {}
  })

  const [personelListesi, setPersonelListesi] = useState<Personel[]>(() => {
    return initialPreloaded?.payloadData?.personelListesi || []
  })
  const [birimListesi, setBirimListesi] = useState<any[]>(() => {
    return initialPreloaded?.payloadData?.birimListesi || []
  })
  const [firmaListesi, setFirmaListesi] = useState<any[]>(() => {
    if (initialPreloaded?.payloadData?.firmaListesi) {
      return initialPreloaded.payloadData.firmaListesi
    }
    if (propInvitedFirms && propInvitedFirms.length > 0) {
      return propInvitedFirms.map((f: any) => ({
        temin_firma_id: f.temin_firma_id || f.id,
        id: f.id || f.firma_id || f.temin_firma_id,
        unvan: f.unvan || f.firma_adi || 'İstekli Firma',
        yetkili_ad_soyad: f.yetkili_ad_soyad || '',
        telefon: f.telefon || '',
        eposta: f.eposta || f.email || ''
      }))
    }
    return []
  })

  const [localShowLogoLeft, setLocalShowLogoLeft] = useState(showLogoLeft)
  const [localShowLogoRight, setLocalShowLogoRight] = useState(showLogoRight)
  const [dosyaRecord, setDosyaRecord] = useState<any>(
    () => initialPreloaded?.payloadData?.dosya || null
  )
  const [isLoading, setIsLoading] = useState(!hasInitialPreloadData)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isEditingMode, setIsEditingMode] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [zoomMode, setZoomMode] = useState<'auto' | 'manual'>('auto')
  const [manualZoom, setManualZoom] = useState(1.0)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const initialDataForSnapshot =
    initialPreloaded?.resolvedData && Object.keys(initialPreloaded.resolvedData).length > 0
      ? initialPreloaded.resolvedData
      : initialPreloaded?.payloadData?.savedSnapshot || null

  const initialSnapshotRef = useRef<string>(
    initialDataForSnapshot
      ? JSON.stringify({
          ...initialDataForSnapshot,
          showLogoLeft,
          showLogoRight,
          olurYazisi: initialDataForSnapshot.olurYazisi !== false,
          kurumIci: Boolean(initialDataForSnapshot.kurumIci),
          orientation: 'portrait'
        })
      : ''
  )

  const currentSnapshot = JSON.stringify({
    ...formData,
    showLogoLeft: localShowLogoLeft,
    showLogoRight: localShowLogoRight,
    olurYazisi: formData.olurYazisi !== false,
    kurumIci: Boolean(formData.kurumIci),
    orientation
  })

  const isDirty = Boolean(
    initialSnapshotRef.current && currentSnapshot !== initialSnapshotRef.current && !isLoading
  )

  // Auto-scale calculation using custom hook
  const previewScale = useDocumentPreviewScale({
    isOpen,
    orientation,
    zoomMode,
    manualZoom,
    previewContainerRef
  })

  // Load preview data via Resolver
  const sourceDependencyKey =
    resolvedSource.kind === 'dosya'
      ? `dosya_${resolvedSource.dosyaId}`
      : `ihtiyac_${resolvedSource.raporId}`

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const preloaded =
      resolvedSource.kind === 'dosya'
        ? documentPreloadService.getCachedDocument(resolvedId, activeDosyaId)
        : null
    const hasCachedData = Boolean(
      (preloaded?.resolvedData && Object.keys(preloaded.resolvedData).length > 0) ||
        preloaded?.payloadData?.savedSnapshot
    )

    if (!hasCachedData) {
      setIsLoading(true)
    }

    const loadInitialData = async (): Promise<void> => {
      try {
        const resolver = resolvers[resolvedSource.kind]
        if (!resolver) {
          throw new Error(`Bilinmeyen belge kaynağı: ${resolvedSource.kind}`)
        }

        const result = await resolver.resolve(resolvedSource, resolvedId, {
          invitedFirms: propInvitedFirms
        })

        if (!isMounted) return

        if (result.dosyaRecord !== undefined) setDosyaRecord(result.dosyaRecord)
        if (result.personelListesi) setPersonelListesi(result.personelListesi as Personel[])
        if (result.firmaListesi) setFirmaListesi(result.firmaListesi)
        if (result.birimListesi) setBirimListesi(result.birimListesi)
        if (result.activeLogoLeft !== undefined) setLocalShowLogoLeft(result.activeLogoLeft)
        if (result.activeLogoRight !== undefined) setLocalShowLogoRight(result.activeLogoRight)
        if (result.activeOrientation) setOrientation(result.activeOrientation)
        setFormData(result.formData || result.resolvedData || {})
        initialSnapshotRef.current =
          result.initialSnapshotJson || JSON.stringify(result.formData || result.resolvedData || {})
      } catch (err) {
        console.error('Error loading template preview data via resolver:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()
  }, [isOpen, sourceDependencyKey, selectedDocId, resolvedId, propInvitedFirms])

  // Dropdown outside click handler
  useClickOutside(dropdownRef, () => setDownloadOpen(false))

  // Save handler
  const handleSaveToDb = async (): Promise<void> => {
    setSaveError(null)
    if (resolvedSource.kind === 'dosya') {
      if (!activeDosyaId || !resolvedId) return
      setIsSaving(true)
      try {
        const jsonStr = await saveDocumentToDb({
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
        })

        if (jsonStr) {
          initialSnapshotRef.current = jsonStr
        }

        setSaveSuccess(true)
        setSaveError(null)
        setTimeout(() => setSaveSuccess(false), 2000)
      } catch (e: unknown) {
        console.error('Belge kaydetme hatası:', e)
        const errorMsg = e instanceof Error ? e.message : 'Belge kaydedilirken bir hata oluştu.'
        setSaveError(errorMsg)
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsSaving(true)
      try {
        initialSnapshotRef.current = JSON.stringify({
          ...formData,
          showLogoLeft: localShowLogoLeft,
          showLogoRight: localShowLogoRight,
          orientation
        })
        setSaveSuccess(true)
        setSaveError(null)
        setTimeout(() => setSaveSuccess(false), 2000)
      } catch (e: unknown) {
        console.error('Belge kaydetme hatası:', e)
        const errorMsg = e instanceof Error ? e.message : 'Belge kaydedilirken bir hata oluştu.'
        setSaveError(errorMsg)
      } finally {
        setIsSaving(false)
      }
    }
  }

  // HTML compiler helper
  const getCompiledHtml = (): string => {
    return compileDocumentHtml({
      ActiveComponent,
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
    })
  }

  // Print handler
  const handlePrint = async (): Promise<void> => {
    setIsPrinting(true)
    try {
      const htmlContent = getCompiledHtml()
      await window.electron.ipcRenderer.invoke('app:print-html', {
        html: htmlContent,
        orientation
      })
    } catch (e) {
      console.error('Yazdırma hatası:', e)
    } finally {
      setIsPrinting(false)
    }
  }

  // PDF Export
  const handlePdf = async (): Promise<void> => {
    setIsPrinting(true)
    try {
      const htmlContent = getCompiledHtml()
      await exportDocumentPdf({
        htmlContent,
        orientation,
        dosyaRecord,
        formData,
        activeTemplateConf
      })
    } catch (e) {
      console.error('PDF kaydetme hatası:', e)
    } finally {
      setIsPrinting(false)
      setDownloadOpen(false)
    }
  }

  // Word (DOCX) Export
  const handleDocx = async (): Promise<void> => {
    setIsPrinting(true)
    try {
      const htmlContent = getCompiledHtml()
      await exportDocumentDocx({
        htmlContent,
        dosyaRecord,
        formData,
        activeTemplateConf
      })
    } catch (e) {
      console.error('Word (DOCX) kaydetme hatası:', e)
    } finally {
      setIsPrinting(false)
      setDownloadOpen(false)
    }
  }

  // Open PDF in New Tab / External Viewer
  const handleOpenPdfInNewTab = async (): Promise<void> => {
    setIsPrinting(true)
    try {
      const htmlContent = getCompiledHtml()
      await openPdfPreview({
        htmlContent,
        orientation
      })
    } catch (e) {
      console.error('PDF önizleme penceresi açılırken hata:', e)
    } finally {
      setIsPrinting(false)
      setDownloadOpen(false)
    }
  }

  // Reset and refresh data from database or resolver
  const handleRefreshFromDb = async (): Promise<void> => {
    const isConfirmed = confirm(
      'Belge üzerindeki tüm verileri veritabanındaki güncel değerlerle sıfırlamak istiyor musunuz? Canlı düzenlemeleriniz kaybolabilir.'
    )
    if (!isConfirmed) return

    if (resolvedSource.kind === 'dosya') {
      if (!activeDosyaId || !resolvedId) return

      try {
        setIsLoading(true)
        const baseData = await refreshDocumentFromDb({
          activeDosyaId,
          resolvedId
        })

        if (baseData) {
          setFormData(baseData)
          initialSnapshotRef.current = JSON.stringify({
            ...baseData,
            showLogoLeft: localShowLogoLeft,
            showLogoRight: localShowLogoRight,
            olurYazisi: baseData.olurYazisi !== false,
            orientation
          })
        }
      } catch (e) {
        console.error('Failed to refresh template resolution:', e)
      } finally {
        setIsLoading(false)
      }
    } else {
      try {
        setIsLoading(true)
        const resolver = resolvers[resolvedSource.kind]
        if (resolver) {
          const result = await resolver.resolve(resolvedSource, resolvedId)
          if (result) {
            setFormData(result.formData || result.resolvedData || {})
            initialSnapshotRef.current =
              result.initialSnapshotJson ||
              JSON.stringify(result.formData || result.resolvedData || {})
          }
        }
      } catch (e) {
        console.error('Failed to reload document data:', e)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return {
    isLoading,
    activeDosyaId,
    dosyaRecord,
    selectedDocId,
    setSelectedDocId,
    resolvedId,
    templateOptions,
    activeTemplateConf,
    ActiveComponent,
    formData,
    setFormData,
    personelListesi,
    firmaListesi,
    birimListesi,
    setBirimListesi,
    localShowLogoLeft,
    setLocalShowLogoLeft,
    localShowLogoRight,
    setLocalShowLogoRight,
    orientation,
    setOrientation,
    isEditingMode,
    setIsEditingMode,
    previewScale,
    isPrinting,
    isSaving,
    saveSuccess,
    saveError,
    setSaveError,
    isDirty,
    downloadOpen,
    setDownloadOpen,
    sidebarOpen,
    setSidebarOpen,
    zoomMode,
    setZoomMode,
    manualZoom,
    setManualZoom,
    isFullScreen,
    setIsFullScreen,
    previewContainerRef,
    dropdownRef,
    handleSaveToDb,
    handlePrint,
    handlePdf,
    handleDocx,
    handleOpenPdfInNewTab,
    handleRefreshFromDb
  }
}
