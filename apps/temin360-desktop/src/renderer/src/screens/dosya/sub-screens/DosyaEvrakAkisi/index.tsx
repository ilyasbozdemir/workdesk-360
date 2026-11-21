import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTabStore } from '@renderer/store/tabStore'
import { useDosyaEvrakAkisi, getStageRoute } from './useDosyaEvrakAkisi'
import { DosyaEvrakAkisiHeader } from './components/DosyaEvrakAkisiHeader'
import { DosyaEvrakListesiSidebar } from './components/DosyaEvrakListesiSidebar'
import { DosyaEvrakGoruntuleyici } from './components/DosyaEvrakGoruntuleyici'
import { ImzaliBelgeYukleModal } from './components/ImzaliBelgeYukleModal'
import { DocumentPreviewModalV3 } from '../../components/DocumentPreviewModalV3'
import { ExcelStylePrintModal } from '@renderer/components/ui/ExcelStylePrintModal'
import { Loader2 } from 'lucide-react'

export function DosyaEvrakAkisiScreen(): React.JSX.Element {
  const {
    loading,
    docLoading,
    pdfGenerating,
    activeDosyaId,
    setActiveDosyaId,
    dosyalarList,
    dosyaInfo,
    evraklar,
    filteredEvraklar,
    selectedEvrak,
    selectedEvrakId,
    setSelectedEvrakId,
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    viewMode,
    setViewMode,
    previewScale,
    setPreviewScale,
    currentPage,
    setCurrentPage,
    totalPages,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isFullscreen,
    setIsFullscreen,
    activeTemplateData,
    personelListesi,
    firmaListesi,
    birimListesi,
    activePdfBlobUrl,
    isModalOpen,
    setIsModalOpen,
    isPrintModalOpen,
    setIsPrintModalOpen,
    isPrinting,
    handlePrintWithSettings,
    refreshSelectedDocument,
    currentIndex,
    hasPrev,
    hasNext,
    selectPrevEvrak,
    selectNextEvrak,
    generatePdfPreviewForTemplate,
    handleUploadSignedPdf,
    handleDeleteSignedDoc,
    handleOpenExternal,
    handlePrint,
    handleExportPdf,
    copyCount,
    setCopyCount,
    activeViewVariant,
    setActiveViewVariant,
    isUploadModalOpen,
    setIsUploadModalOpen,
    selectedUploadFiles,
    specificTargetCode,
    targetTemplateOptions,
    handleSaveBatchUpload,
    refreshAll
  } = useDosyaEvrakAkisi()

  const navigate = useNavigate()
  const addTab = useTabStore((s) => s.addTab)

  const handleNavigateToStage = (doc: any) => {
    if (!doc?.stage) return
    const route = getStageRoute(doc.stage)
    addTab(route)
    navigate({ to: route as any })
  }

  if (loading && !dosyaInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-950 text-slate-500 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Dosya Evrak Akışı Hazırlanıyor...
        </span>
        <span className="text-[11px] text-slate-400">
          Belgeler ve imzalı evrak arşivi taranıyor
        </span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden min-h-0 select-none">
      {/* 1. ÜST BAŞLIK & DOSYA SEÇİCİ BARI */}
      <DosyaEvrakAkisiHeader
        dosyaInfo={dosyaInfo}
        dosyalarList={dosyalarList}
        activeDosyaId={activeDosyaId}
        onSelectDosya={setActiveDosyaId}
        onRefresh={refreshAll}
        loading={loading}
        evraklar={evraklar}
      />

      {/* 2. ANA ÇALIŞMA ALANI (SOL LİSTE + SAĞ/ORTA GÖRÜNTÜLEYİCİ) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* SOL PANEL: EVRAK LİSTESİ */}
        <DosyaEvrakListesiSidebar
          evraklar={filteredEvraklar}
          selectedEvrakId={selectedEvrakId}
          onSelectEvrak={setSelectedEvrakId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
          onUploadSignedPdf={() => handleUploadSignedPdf()}
          onUploadSignedDocForSelected={(targetCode) => handleUploadSignedPdf(targetCode)}
          onDeleteSignedDoc={handleDeleteSignedDoc}
          onNavigateToStage={handleNavigateToStage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        />

        {/* ORTA / SAĞ PANEL: BELGE GÖRÜNTÜLEYİCİ */}
        <DosyaEvrakGoruntuleyici
          selectedEvrak={selectedEvrak}
          currentIndex={currentIndex}
          totalCount={filteredEvraklar.length}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrevDoc={selectPrevEvrak}
          onNextDoc={selectNextEvrak}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          previewScale={previewScale}
          onScaleChange={setPreviewScale}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          docLoading={docLoading}
          pdfGenerating={pdfGenerating}
          activeTemplateData={activeTemplateData}
          personelListesi={personelListesi}
          firmaListesi={firmaListesi}
          birimListesi={birimListesi}
          activePdfBlobUrl={activePdfBlobUrl}
          onGeneratePdf={generatePdfPreviewForTemplate}
          onPrint={handlePrint}
          onExportPdf={handleExportPdf}
          onOpenExternal={handleOpenExternal}
          onOpenModalPreview={() => setIsModalOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((f) => !f)}
          copyCount={copyCount}
          onCopyCountChange={setCopyCount}
          activeViewVariant={activeViewVariant}
          onVariantChange={setActiveViewVariant}
          onUploadSignedDocForSelected={(targetCode) => handleUploadSignedPdf(targetCode)}
          onNavigateToStage={handleNavigateToStage}
        />
      </div>

      {/* 3. İMZALI BELGE ÇOKLU YÜKLEME & EŞLEŞTİRME MODALI */}
      <ImzaliBelgeYukleModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        files={selectedUploadFiles}
        templateOptions={targetTemplateOptions}
        initialTargetCode={specificTargetCode}
        onSave={handleSaveBatchUpload}
      />

      {/* 4. ŞABLON DÜZENLEME & DETAYLI ÖNİZLEME MODALI (DocumentPreviewModalV3) */}
      {isModalOpen && selectedEvrak && selectedEvrak.type === 'template' && (
        <DocumentPreviewModalV3
          isOpen={isModalOpen}
          dosyaId={activeDosyaId || undefined}
          initialTemplateId={selectedEvrak.code}
          onClose={() => {
            setIsModalOpen(false)
            refreshSelectedDocument()
          }}
          isModal={true}
        />
      )}

      {/* 5. SİSTEMSEL BASKI VE YAZICI TERCİHLERİ MASASI (ExcelStylePrintModal) */}
      <ExcelStylePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onPrint={handlePrintWithSettings}
        documentTitle={selectedEvrak?.title}
        dosyaNo={dosyaInfo?.teminNo}
        defaultOrientation={activeTemplateData?.orientation || 'portrait'}
        isPrinting={isPrinting}
      />
    </div>
  )
}

export default DosyaEvrakAkisiScreen
