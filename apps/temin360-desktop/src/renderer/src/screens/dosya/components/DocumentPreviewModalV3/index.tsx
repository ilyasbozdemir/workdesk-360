import React, { useRef, useState } from 'react'
import { DocumentPreviewModalV3Props } from './types'
import { useDocumentPreviewModal } from '../../hooks/useDocumentPreviewModal'
import { DocumentPreviewHeader } from './components/DocumentPreviewHeader'
import { DocumentPreviewTabBar } from './components/DocumentPreviewTabBar'
import { DocumentPreviewSidebar } from './components/DocumentPreviewSidebar'
import { DocumentPreviewCanvas } from './components/DocumentPreviewCanvas'
import { FloatingDocumentBubble } from './components/FloatingDocumentBubble'
import { DocumentPreviewDebugModal } from './components/DocumentPreviewDebugModal'

export function DocumentPreviewModalV3(props: DocumentPreviewModalV3Props): React.JSX.Element | null {
  const {
    isOpen,
    dosyaId: propDosyaId,
    source,
    onClose,
    isModal = false,
    tabs,
    activeTabId,
    onSwitchTab,
    onCloseTab,
    onAddTab
  } = props

  const {
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
  } = useDocumentPreviewModal(props)

  const [sidebarPercent, setSidebarPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('temin360_preview_sidebar_percent')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (parsed >= 20 && parsed <= 60) return parsed
      }
    } catch {
      // ignore
    }
    return 33
  })

  const bodyContainerRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current || !bodyContainerRef.current) return
      const rect = bodyContainerRef.current.getBoundingClientRect()
      const newPercent = Math.max(
        20,
        Math.min(60, ((moveEvent.clientX - rect.left) / rect.width) * 100)
      )
      const rounded = Math.round(newPercent)
      setSidebarPercent(rounded)
      try {
        localStorage.setItem('temin360_preview_sidebar_percent', String(rounded))
      } catch {
        // ignore
      }
    }

    const handleMouseUp = () => {
      isResizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  if (!isOpen) return null

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
        isEditingMode={isEditingMode}
        setIsEditingMode={setIsEditingMode}
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

      {/* 3. Ana Gövde: Sidebar + Boyutlandırma Ayırıcı + Belge Tuvali */}
      <div ref={bodyContainerRef} className="flex-1 flex overflow-hidden min-h-0 relative z-0">
        <DocumentPreviewSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarPercent={sidebarPercent}
          setSidebarPercent={setSidebarPercent}
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
          personelListesi={personelListesi}
          birimListesi={birimListesi}
        />

        {/* Resizable Divider Handle (Sürüklenebilir Boyutlandırıcı) */}
        {sidebarOpen && (
          <div
            onMouseDown={handleMouseDownResize}
            className="w-1.5 hover:w-2 bg-slate-200/90 dark:bg-slate-800/90 hover:bg-blue-500/80 dark:hover:bg-blue-500 cursor-col-resize transition-all shrink-0 z-10 flex items-center justify-center group select-none"
            title="Paneli genişletmek/daraltmak için sürükleyin"
          >
            <div className="w-0.5 h-8 bg-slate-400/80 dark:bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
          </div>
        )}

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

        {/* JSON Debug Butonu */}
        <button
          type="button"
          className="absolute bottom-4 right-4 z-[60] flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xl hover:bg-indigo-500"
          onClick={() => setShowDebugPanel(true)}
        >
          <span aria-hidden="true">{`{ }`}</span>
          JSON Debug
        </button>

        {/* JSON Debug Modalı */}
        <DocumentPreviewDebugModal
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
          debugJson={debugJson}
          debugSearch={debugSearch}
          setDebugSearch={setDebugSearch}
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
