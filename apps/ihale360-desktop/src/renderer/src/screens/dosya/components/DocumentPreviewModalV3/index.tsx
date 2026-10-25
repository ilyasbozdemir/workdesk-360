import React, { useState, useMemo } from 'react'
import { DocumentPreviewModalV3Props } from './types'
import { useDocumentPreviewData } from './hooks/useDocumentPreviewData'
import { DocumentPreviewHeader } from './components/DocumentPreviewHeader'
import { DocumentPreviewTabBar } from './components/DocumentPreviewTabBar'
import { DocumentPreviewSidebar } from './components/DocumentPreviewSidebar'
import { DocumentPreviewCanvas } from './components/DocumentPreviewCanvas'
import { FloatingDocumentBubble } from './components/FloatingDocumentBubble'
import { useSettingsStore } from '../../../../store/settingsStore'
import {
  getStageById,
  getStageForTemplate,
  getAdjacentStageTemplate,
  IHTIYAC_RAPORU_STAGE
} from './stages'

export function DocumentPreviewModalV3({
  isOpen,
  documentId,
  dosyaId: propDosyaId,
  source,
  initialTemplateId,
  invitedFirms: propInvitedFirms,
  onClose,
  isModal = false,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onAddTab,
  currentStage: propCurrentStage,
  stage: propStage,
  isBalloon: propIsBalloon,
  onToggleBalloon: propOnToggleBalloon
}: DocumentPreviewModalV3Props): React.JSX.Element | null {
  const [internalBalloon, setInternalBalloon] = useState(false)
  const isBalloon = propIsBalloon !== undefined ? propIsBalloon : internalBalloon
  const setIsBalloon = React.useCallback(
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

  const {
    isLoading,
    selectedDocId,
    setSelectedDocId,
    templateOptions,
    activeTemplateConf,
    ActiveComponent,
    formData,
    setFormData,
    personelListesi,
    firmaListesi,
    birimListesi,
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
  } = useDocumentPreviewData({
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
    return getStageForTemplate(selectedDocId, activeTemplateConf?.category, source?.kind)
  }, [source?.kind, rawStage, selectedDocId, activeTemplateConf?.category])

  const nextTemplate = useMemo(() => {
    return getAdjacentStageTemplate(selectedDocId, stageInfo.id, templateOptions, 'next')
  }, [selectedDocId, stageInfo.id, templateOptions])

  const prevTemplate = useMemo(() => {
    return getAdjacentStageTemplate(selectedDocId, stageInfo.id, templateOptions, 'prev')
  }, [selectedDocId, stageInfo.id, templateOptions])

  const handleClose = React.useCallback(() => {
    if (isDirty) {
      const confirmClose = window.confirm(
        'Belgede kaydedilmemiş değişiklikler var. Kaydetmeden çıkmak istediğinizden emin misiniz?'
      )
      if (!confirmClose) {
        return
      }
    }
    setIsBalloon(false)
    onClose()
  }, [onClose, isDirty, setIsBalloon])

  if (!isOpen) return null

  const docTitle = activeTemplateConf?.name.replace(/([A-Z])/g, ' $1').trim()

  // If in floating balloon mode, render only the floating bubble
  if (isBalloon) {
    return (
      <FloatingDocumentBubble
        documentTitle={docTitle}
        onExpand={() => setIsBalloon(false)}
        onClose={handleClose}
        onPrint={handlePrint}
        onPdf={handlePdf}
        isPrinting={isPrinting}
      />
    )
  }

  const mainContent = (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 z-[200] w-screen h-screen max-w-none max-h-none rounded-none border-none shadow-none flex flex-col bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in duration-150'
          : isModal
            ? 'bg-white dark:bg-slate-900 w-full max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden'
            : 'absolute inset-0 z-40 w-full h-full max-w-none max-h-none rounded-none border-none shadow-none flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-150'
      }
      onClick={(e) => (isModal || isFullScreen) && e.stopPropagation()}
    >
      {/* 1. Belge Sekmeleri Çubuğu (En Üstte) */}
      {tabs && tabs.length > 0 && onSwitchTab && onCloseTab && (
        <DocumentPreviewTabBar
          tabs={tabs}
          activeTabId={activeTabId || null}
          onSwitchTab={onSwitchTab}
          onCloseTab={onCloseTab}
          onAddTab={onAddTab}
          templateOptions={templateOptions}
          currentDosyaId={propDosyaId}
          onToggleBalloon={() => setIsBalloon(true)}
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
          onClose={handleClose}
          stageInfo={stageInfo}
          disableDocumentGuidance={disableDocumentGuidance}
          sourceKind={source?.kind}
        />
      )}

      {/* 2. Aktif Belge Araç Çubuğu */}
      <DocumentPreviewHeader
        onClose={handleClose}
        documentTitle={docTitle}
        zoomMode={zoomMode}
        manualZoom={manualZoom}
        previewScale={previewScale}
        setZoomMode={setZoomMode}
        setManualZoom={setManualZoom}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        saveError={saveError}
        isDirty={isDirty}
        handleSaveToDb={handleSaveToDb}
        isPrinting={isPrinting}
        handlePrint={handlePrint}
        downloadOpen={downloadOpen}
        setDownloadOpen={setDownloadOpen}
        dropdownRef={dropdownRef}
        handleRefreshFromDb={handleRefreshFromDb}
        handlePdf={handlePdf}
        handleDocx={handleDocx}
        handleOpenPdfInNewTab={handleOpenPdfInNewTab}
        onToggleBalloon={() => setIsBalloon(true)}
        dosyaId={propDosyaId}
        docKey={selectedDocId}
        orientation={orientation}
        stageInfo={stageInfo}
        disableDocumentGuidance={disableDocumentGuidance}
        nextTemplate={nextTemplate}
        onSelectTemplate={setSelectedDocId}
      />

      {/* Main Area: Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <DocumentPreviewSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          selectedDocId={selectedDocId}
          supportsOlur={activeTemplateConf?.capabilities?.supportsOlur}
          supportsLogos={activeTemplateConf?.category !== '5-klasor-ve-kapaklar'}
          templateCapabilities={activeTemplateConf?.capabilities}
          onSelectTemplate={setSelectedDocId}
          templateOptions={templateOptions}
          isEditingMode={isEditingMode}
          setIsEditingMode={setIsEditingMode}
          orientation={orientation}
          setOrientation={setOrientation}
          formData={formData}
          setFormData={setFormData}
          localShowLogoLeft={localShowLogoLeft}
          setLocalShowLogoLeft={setLocalShowLogoLeft}
          localShowLogoRight={localShowLogoRight}
          setLocalShowLogoRight={setLocalShowLogoRight}
          stageInfo={stageInfo}
          disableDocumentGuidance={disableDocumentGuidance}
          sourceKind={source?.kind}
          nextTemplate={nextTemplate}
          prevTemplate={prevTemplate}
        />

        <DocumentPreviewCanvas
          isLoading={isLoading}
          previewContainerRef={previewContainerRef}
          previewScale={previewScale}
          orientation={orientation}
          ActiveComponent={ActiveComponent}
          selectedDocId={selectedDocId}
          isEditingMode={isEditingMode}
          formData={formData}
          setFormData={setFormData}
          personelListesi={personelListesi}
          firmaListesi={firmaListesi}
          birimListesi={birimListesi}
          localShowLogoLeft={localShowLogoLeft}
          localShowLogoRight={localShowLogoRight}
          onSelectTemplate={setSelectedDocId}
          templateOptions={templateOptions}
        />
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {mainContent}
      </div>
    )
  }

  return mainContent
}

export default DocumentPreviewModalV3
