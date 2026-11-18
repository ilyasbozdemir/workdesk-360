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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row flex-1 min-h-[580px] md:h-[calc(100vh-240px)] mt-2 overflow-hidden">
        {/* SOL ALAN: BELGE LİSTESİ VEYA BELGE KANBAN PANOSU */}
        <div className="flex-1 p-5 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* ÜST BAŞLIK, GÖRÜNÜM SEÇİCİ & REFRESH (Sabit) */}
          <div className="shrink-0 mb-3">
            <CiktiMerkeziHeader
              selectedCount={selectedIds.size}
              refreshing={refreshing || kanbanLoading}
              allExpanded={isAllExpanded}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onRefresh={handleFullRefresh}
              onToggleAllCategories={toggleAllCategories}
            />
          </div>

          {viewMode === 'list' ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* DURUM FİLTRELEME SEKMELERİ (Sabit Tab Alanı) */}
              <div className="shrink-0">
                <CiktiStatusFilterTabs
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  totalCount={sablons.length}
                  readyCount={readyCount}
                  starredCount={activeStarredDocs.length}
                  printedCount={printedCount}
                />
              </div>

              {/* BELGE PAKETLERİ VE TASLAKLAR (Sabit Preset Alanı) */}
              <div className="shrink-0">
                <CiktiPresetManager
                  presets={presets}
                  activePresetId={activePresetId}
                  selectedIdsSize={selectedIds.size}
                  onSelectPreset={handleSelectPreset}
                  onSavePreset={handleSavePreset}
                  onDeletePreset={handleDeletePreset}
                />
              </div>

              {/* BELGE KARTLARI VE GRUPLAR (Kendi İçinde Düzgün Kayan Liste Alanı) */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
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
              </div>
            </div>
          ) : (
            /* BELGE KANBAN PANOSU (Kendi İçinde Düzgün Kayan Alan) */
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
              <BelgeKanbanBoard
                columnsData={columnsData}
                loading={loading || kanbanLoading}
                errorMessage={kanbanErrorMessage}
                onMoveItem={moveItem}
                onOpenPreview={handleKanbanPreview}
              />
            </div>
          )}
        </div>

        {/* SAĞ: İŞLEM MENÜSÜ (Kendi İçinde Kayan ve Butonları Asla Kesilmeyen Sidebar) */}
        <div className="w-full md:w-80 shrink-0 overflow-y-auto custom-scrollbar">
          <CiktiSidebar
            selectedCount={selectedIds.size}
            processing={processing}
            hasStarredDocs={activeStarredDocs.length > 0}
            onPrintClick={() => setIsPrintManagerOpen(true)}
            onDownloadClick={(action) => handleAction(action)}
            onAutoProcessQueue={handleAutoProcessQueue}
          />
        </div>
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
