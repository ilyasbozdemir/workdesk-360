import React, { useMemo, useState, useCallback } from 'react'
import { DocumentPreviewModalV3Props } from '../components/DocumentPreviewModalV3/types'
import { useDocumentPreviewData } from '../components/DocumentPreviewModalV3/hooks/useDocumentPreviewData'
import { useSettingsStore } from '../../../store/settingsStore'
import {
  getAdjacentStageTemplate,
  getStageById,
  getStageForTemplate,
  IHTIYAC_RAPORU_STAGE
} from '../components/DocumentPreviewModalV3/stages'

export function useDocumentPreviewModal(props: DocumentPreviewModalV3Props) {
  const {
    isOpen,
    documentId,
    dosyaId: propDosyaId,
    source,
    initialTemplateId,
    invitedFirms: propInvitedFirms,
    onClose,
    currentStage: propCurrentStage,
    stage: propStage,
    isBalloon: propIsBalloon,
    onToggleBalloon: propOnToggleBalloon
  } = props

  const [internalBalloon, setInternalBalloon] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugSearch, setDebugSearch] = useState('')

  const isBalloon = propIsBalloon !== undefined ? propIsBalloon : internalBalloon

  const setIsBalloon = useCallback(
    (val: boolean) => {
      if (propOnToggleBalloon) {
        propOnToggleBalloon()
      } else {
        setInternalBalloon(val)
      }
    },
    [propOnToggleBalloon]
  )

  const currentDocKey =
    initialTemplateId ||
    documentId ||
    (source?.kind === 'ihtiyacRaporu' ? `rapor_${source.raporId}` : null)

  const [prevDocKey, setPrevDocKey] = useState<string | null>(currentDocKey)
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)

  const previewData = useDocumentPreviewData({
    isOpen,
    documentId,
    dosyaId: propDosyaId,
    source,
    initialTemplateId,
    invitedFirms: propInvitedFirms
  })

  // Belge değiştiğinde veya modal yeniden açıldığında yüzen balon durumunu sıfırla
  if (currentDocKey !== prevDocKey || (!prevIsOpen && isOpen)) {
    setPrevDocKey(currentDocKey)
    setPrevIsOpen(isOpen)
    if (isBalloon) {
      setIsBalloon(false)
    }
  } else if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
  }

  const rawStage = propCurrentStage ?? propStage
  const { disableDocumentGuidance } = useSettingsStore()

  const stageInfo = useMemo(() => {
    if (source?.kind === 'ihtiyacRaporu') return IHTIYAC_RAPORU_STAGE
    if (rawStage !== undefined && rawStage !== null) {
      const found = getStageById(rawStage)
      if (found) return found
    }
    return getStageForTemplate(
      previewData.selectedDocId,
      previewData.activeTemplateConf?.category,
      source?.kind
    )
  }, [source?.kind, rawStage, previewData.selectedDocId, previewData.activeTemplateConf?.category])

  const nextTemplate = useMemo(() => {
    return getAdjacentStageTemplate(
      previewData.selectedDocId,
      stageInfo.id,
      previewData.templateOptions,
      'next'
    )
  }, [previewData.selectedDocId, stageInfo.id, previewData.templateOptions])

  const prevTemplate = useMemo(() => {
    return getAdjacentStageTemplate(
      previewData.selectedDocId,
      stageInfo.id,
      previewData.templateOptions,
      'prev'
    )
  }, [previewData.selectedDocId, stageInfo.id, previewData.templateOptions])

  const handleClose = useCallback(() => {
    if (previewData.isDirty) {
      const confirmClose = window.confirm(
        'Belgede kaydedilmemiş değişiklikler var. Kaydetmeden çıkmak istediğinizden emin misiniz?'
      )
      if (!confirmClose) {
        return
      }
    }
    setIsBalloon(false)
    onClose()
  }, [onClose, previewData.isDirty, setIsBalloon])

  const docTitle = previewData.activeTemplateConf?.name.replace(/([A-Z])/g, ' $1').trim()

  const debugData = useMemo(
    () => ({
      isLoading: previewData.isLoading,
      previewScale: previewData.previewScale,
      orientation: previewData.orientation,
      selectedDocId: previewData.selectedDocId,
      isEditingMode: previewData.isEditingMode,
      formData: previewData.formData,
      personelListesi: previewData.personelListesi,
      firmaListesi: previewData.firmaListesi,
      birimListesi: previewData.birimListesi,
      localShowLogoLeft: previewData.localShowLogoLeft,
      localShowLogoRight: previewData.localShowLogoRight,
      templateOptions: previewData.templateOptions,
      previewContainerRef: '[React Ref]',
      ActiveComponent:
        previewData.ActiveComponent?.displayName || previewData.ActiveComponent?.name || null,
      setFormData: typeof previewData.setFormData,
      onSelectTemplate: typeof previewData.setSelectedDocId
    }),
    [previewData]
  )

  const debugJson = useMemo(
    () =>
      JSON.stringify(
        debugData,
        (_key, value) => {
          if (value === undefined) return '[undefined]'
          if (typeof value === 'function') {
            return `[Function: ${value.name || 'anonymous'}]`
          }
          if (typeof value === 'bigint') return value.toString()
          return value
        },
        2
      ),
    [debugData]
  )

  return {
    isBalloon,
    setIsBalloon,
    docTitle,
    stageInfo,
    disableDocumentGuidance,
    nextTemplate,
    prevTemplate,
    handleClose,
    showDebugPanel,
    setShowDebugPanel,
    debugSearch,
    setDebugSearch,
    debugJson,
    ...previewData
  }
}
