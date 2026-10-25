import React, { useState } from 'react'
import { SubScreen } from './SubScreens.screen'
import { Printer } from 'lucide-react'
import { useCiktiMerkeziScreen, normalizeForMatch } from './hooks/useCiktiMerkeziScreen'
import { TekTikYazdirModal } from './components/TekTikYazdirModal'
import { CiktiPresetManager } from './components/CiktiPresetManager'
import { CiktiSidebar } from './components/CiktiSidebar'
import { CiktiStatusFilterTabs } from './components/CiktiStatusFilterTabs'
import { CiktiBelgeList } from './components/CiktiBelgeList'
import { CiktiMerkeziHeader, BelgeViewMode } from './components/CiktiMerkeziHeader'
import { CiktiToast } from './components/CiktiToast'
import { BelgeKanbanBoard } from './components/kanban/BelgeKanbanBoard'
import { useBelgeKanbanData } from './components/kanban/useBelgeKanbanData'
import { Sablon } from '../sablonlar/sablonlar.hooks'

export function CiktiMerkeziScreen(): React.JSX.Element {
  const {
    sablons,
    loading,
    dosyaContext,
    contextsByPath,
    activeDosya,
    activeDosyaId,
    activeStarredDocs,
    selectedIds,
    processing,
    refreshing,
    expandedCategories,
    isPrintManagerOpen,
    setIsPrintManagerOpen,
    statusFilter,
    setStatusFilter,
    readyCount,
    printedCount,
    toast,
    presets,
    activePresetId,
    isAllExpanded,
    groupedSablons,
    handleSelectPreset,
    handleSavePreset,
    handleDeletePreset,
    handleRefresh,
    toggleCategory,
    toggleAllCategories,
    toggleGroup,
    toggleSelect,
    getMissingRequirement,
    getDocumentStatus,
    isDocumentLocked,
    getDocumentLockInfo,
    unlockDocument,
    toggleReadyToPrint,
    openDocument,
    renderHtml,
    handleAutoProcessQueue,
    handleAction,
    handleOpenExternal
  } = useCiktiMerkeziScreen()

  // Görünüm Modu: Liste veya Kanban (localStorage ile kalıcı)
  const [viewMode, setViewMode] = useState<BelgeViewMode>(() => {
    try {
      const saved = localStorage.getItem('cikti_view_mode')
      return saved === 'kanban' || saved === 'list' ? saved : 'list'
    } catch {
      return 'list'
    }
  })

  const handleViewModeChange = (mode: BelgeViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('cikti_view_mode', mode)
    } catch {}
  }

  // Belge Kanban Veri Katmanı
  const {
    columnsData,
    loading: kanbanLoading,
    errorMessage: kanbanErrorMessage,
    moveItem,
    refresh: refreshKanban
  } = useBelgeKanbanData({
    activeDosyaId,
    sablons,
    getMissingRequirement
  })

  // Ortak Yenileme
  const handleFullRefresh = async () => {
    await Promise.all([handleRefresh(), refreshKanban()])
  }

  const handleKanbanPreview = (sablon: Sablon) => {
    const docKey = (sablon.dosya_adi || '').replace(/\.html$/, '')
    openDocument({
      documentId: docKey,
      dosyaId: activeDosyaId,
      documentTitle: sablon.ad
    })
  }

  return (
    <SubScreen
      title="Çıktı & Yazdırma Merkezi"
      icon={Printer}
      description="Dosya gereksinimlerine uygun resmi evrakların tek merkezden toplu üretimi, süreç takibi ve yazdırılması."
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row min-h-[500px] mt-4 overflow-hidden">
        {/* SOL ALAN: BELGE LİSTESİ VEYA BELGE KANBAN PANOSU */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col min-w-0">
          {/* ÜST BAŞLIK, GÖRÜNÜM SEÇİCİ & REFRESH */}
          <CiktiMerkeziHeader
            selectedCount={selectedIds.size}
            refreshing={refreshing || kanbanLoading}
            allExpanded={isAllExpanded}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onRefresh={handleFullRefresh}
            onToggleAllCategories={toggleAllCategories}
          />

          {viewMode === 'list' ? (
            <>
              {/* DURUM FİLTRELEME SEKMELERİ */}
              <CiktiStatusFilterTabs
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                totalCount={sablons.length}
                readyCount={readyCount}
                starredCount={activeStarredDocs.length}
                printedCount={printedCount}
              />

              {/* BELGE PAKETLERİ VE TASLAKLAR */}
              <CiktiPresetManager
                presets={presets}
                activePresetId={activePresetId}
                selectedIdsSize={selectedIds.size}
                onSelectPreset={handleSelectPreset}
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
              />

              {/* BELGE KARTLARI VE GRUPLAR (LİSTE GÖRÜNÜMÜ) */}
              <CiktiBelgeList
                loading={loading}
                groupedSablons={groupedSablons}
                expandedCategories={expandedCategories}
                selectedIds={selectedIds}
                statusFilter={statusFilter}
                activeDosyaId={activeDosyaId}
                dosyaContext={dosyaContext}
                contextsByPath={contextsByPath}
                getMissingRequirement={getMissingRequirement}
                getDocumentStatus={getDocumentStatus}
                isDocumentLocked={isDocumentLocked}
                getDocumentLockInfo={getDocumentLockInfo}
                toggleCategory={toggleCategory}
                toggleGroup={toggleGroup}
                toggleSelect={toggleSelect}
                unlockDocument={unlockDocument}
                toggleReadyToPrint={toggleReadyToPrint}
                openDocument={openDocument}
                handleAction={handleAction}
                handleOpenExternal={handleOpenExternal}
              />
            </>
          ) : (
            /* BELGE KANBAN PANOSU */
            <BelgeKanbanBoard
              columnsData={columnsData}
              loading={loading || kanbanLoading}
              errorMessage={kanbanErrorMessage}
              onMoveItem={moveItem}
              onOpenPreview={handleKanbanPreview}
            />
          )}
        </div>

        {/* SAĞ: İŞLEM MENÜSÜ */}
        <CiktiSidebar
          selectedCount={selectedIds.size}
          processing={processing}
          hasStarredDocs={activeStarredDocs.length > 0}
          onPrintClick={() => setIsPrintManagerOpen(true)}
          onDownloadClick={(action) => handleAction(action)}
          onAutoProcessQueue={handleAutoProcessQueue}
        />
      </div>

      <TekTikYazdirModal
        isOpen={isPrintManagerOpen}
        onClose={() => setIsPrintManagerOpen(false)}
        sablons={sablons}
        activeDosya={activeDosya}
        activeStarredDocs={activeStarredDocs}
        initialSelectedIds={Array.from(selectedIds)}
        renderHtml={renderHtml}
        onExecutePrint={async (selected, action) => {
          await handleAction(
            action,
            selected.map((s) => s.id)
          )
        }}
        getMissingRequirement={getMissingRequirement}
        normalizeForMatch={normalizeForMatch}
      />

      <CiktiToast toast={toast} />
    </SubScreen>
  )
}
