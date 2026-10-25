import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../../../../../store/settingsStore'
import { useWorkspaceStore } from '../../../../../store/workspaceStore'
import { KatalogSenkronizasyonModal } from './components/KatalogSenkronizasyonModal'
import { IhtiyacRaporuBaglaModal } from './components/IhtiyacRaporuBaglaModal'
import { ihtiyacRaporuService } from '../../../../../services/ihtiyacRaporuService'
import { useMalzemeTablosuActions } from './components/malzeme-tablosu/useMalzemeTablosuActions'
import { MalzemeTablosuToolbar } from './components/malzeme-tablosu/MalzemeTablosuToolbar'
import { MalzemeTablosuRehber } from './components/malzeme-tablosu/MalzemeTablosuRehber'
import { MalzemeTablosuBody } from './components/malzeme-tablosu/MalzemeTablosuBody'

export function MalzemeTablosu({
  state,
  stageSablons = [],
  dagitimSablons = [],
  sablons = [],
  onSablonClick,
  ciktiLoading,
  activeStarredDocs = [],
  onQuickPrint,
  onExport,
  onOpenExternal,
  isSablonDisabled,
  activeDosya,
  activeDosyaId
}: {
  state: any
  stageSablons?: any[]
  dagitimSablons?: any[]
  sablons?: any[]
  onSablonClick?: (sablon: any, title: string) => void
  ciktiLoading?: boolean
  activeStarredDocs?: string[] | null
  onQuickPrint?: (sablon: any) => void
  onExport?: (sablon: any, format: 'pdf' | 'docx' | 'udf') => void
  onOpenExternal?: (sablon: any) => void
  isSablonDisabled?: (cleanName: string) => boolean
  activeDosya?: any
  activeDosyaId?: number | null
}): React.JSX.Element {
  const {
    items,
    units,
    loading,
    setIsAddModalOpen,
    editingId,
    setEditingId,
    editMiktar,
    setEditMiktar,
    editBirim,
    setEditBirim,
    editKdv,
    setEditKdv,
    handleStartEdit,
    handleSaveEdit,
    handleDeleteItem,
    handleApplyKatalogUpdates
  } = state

  const { disableDocumentGuidance } = useSettingsStore()
  const workspaceDosyaId = useWorkspaceStore((s) => s.activeDosyaId)
  const effectiveDosyaId = activeDosyaId || activeDosya?.id || workspaceDosyaId || null

  const [isIhtiyacModalOpen, setIsIhtiyacModalOpen] = useState(false)
  const [hasLinkedIhtiyacRaporu, setHasLinkedIhtiyacRaporu] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (!effectiveDosyaId) {
      return
    }
    ihtiyacRaporuService
      .getLinkedRaporForDosya(effectiveDosyaId)
      .then((rapor) => {
        if (isMounted) setHasLinkedIhtiyacRaporu(Boolean(rapor))
      })
      .catch(() => {
        if (isMounted) setHasLinkedIhtiyacRaporu(false)
      })
    return () => {
      isMounted = false
    }
  }, [effectiveDosyaId])

  const handleIhtiyacSuccess = async (): Promise<void> => {
    if (state.loadData) {
      await state.loadData()
    }
    if (activeDosyaId) {
      const rapor = await ihtiyacRaporuService.getLinkedRaporForDosya(activeDosyaId)
      setHasLinkedIhtiyacRaporu(Boolean(rapor))
    }
  }

  const {
    selectedIds,
    handleToggleSelectRow,
    handleToggleSelectAll,
    handleDeleteSelected,
    handleExcelImport,
    handleDownloadTemplate,
    handleExportToLibrary,
    handleTriggerKatalogSync,
    katalogModalOpen,
    setKatalogModalOpen,
    diffItems,
    isCheckingDiff,
    combinedSablons,
    handleOpenSablonByDosyaAdi,
    isExportingMasterExcel,
    handleExportMasterExcel
  } = useMalzemeTablosuActions({
    state,
    activeDosya,
    activeDosyaId,
    stageSablons,
    sablons,
    onSablonClick
  })

  const isYapim =
    activeDosya?.tur === 'yapim_isi' ||
    activeDosya?.tur === 'yapim' ||
    activeDosya?.ihale_tipi === 'Hakediş'
  const isHizmet = activeDosya?.tur === 'hizmet'

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col min-h-[400px]">
      <MalzemeTablosuToolbar
        items={items}
        isYapim={isYapim}
        isHizmet={isHizmet}
        isExportingMasterExcel={isExportingMasterExcel}
        handleExportMasterExcel={handleExportMasterExcel}
        handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi}
        setIsAddModalOpen={setIsAddModalOpen}
        disableDocumentGuidance={disableDocumentGuidance}
        combinedSablons={combinedSablons}
        sablons={sablons}
        activeStarredDocs={activeStarredDocs}
        ciktiLoading={ciktiLoading}
        onSablonClick={onSablonClick}
        onQuickPrint={onQuickPrint}
        onExport={onExport}
        onOpenExternal={onOpenExternal}
        isSablonDisabled={isSablonDisabled}
        selectedIdsCount={selectedIds.size}
        handleToggleSelectAll={handleToggleSelectAll}
        handleDeleteSelected={handleDeleteSelected}
        handleExcelImport={handleExcelImport}
        handleDownloadTemplate={handleDownloadTemplate}
        handleExportToLibrary={handleExportToLibrary}
        handleTriggerKatalogSync={() => handleTriggerKatalogSync()}
        onOpenIhtiyacRaporuModal={() => setIsIhtiyacModalOpen(true)}
        hasLinkedIhtiyacRaporu={hasLinkedIhtiyacRaporu}
      />

      {/* 1. Aşama Süreç & Ekler Rehberi (Mevzuat & Deneyim Notu) */}
      {!disableDocumentGuidance && (
        <MalzemeTablosuRehber handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi} />
      )}

      {/* Malzeme Tablosu Gövdesi */}
      <MalzemeTablosuBody
        loading={loading}
        items={items}
        isYapim={isYapim}
        isHizmet={isHizmet}
        selectedIds={selectedIds}
        handleToggleSelectAll={handleToggleSelectAll}
        handleToggleSelectRow={handleToggleSelectRow}
        editingId={editingId}
        setEditingId={setEditingId}
        editMiktar={editMiktar}
        setEditMiktar={setEditMiktar}
        editBirim={editBirim}
        setEditBirim={setEditBirim}
        editKdv={editKdv}
        setEditKdv={setEditKdv}
        units={units}
        handleSaveEdit={handleSaveEdit}
        handleStartEdit={handleStartEdit}
        handleDeleteItem={handleDeleteItem}
        handleTriggerKatalogSync={handleTriggerKatalogSync}
      />

      {/* Katalog Senkronizasyon Modalı */}
      <KatalogSenkronizasyonModal
        isOpen={katalogModalOpen}
        onClose={() => setKatalogModalOpen(false)}
        diffItems={diffItems}
        isLoading={isCheckingDiff}
        onApplyUpdates={async (selected) => {
          await handleApplyKatalogUpdates(selected)
          setKatalogModalOpen(false)
        }}
      />

      {/* İhtiyaç Raporunu Bağla & Kalemleri Aktar Modalı */}
      {effectiveDosyaId && (
        <IhtiyacRaporuBaglaModal
          isOpen={isIhtiyacModalOpen}
          onClose={() => {
            setIsIhtiyacModalOpen(false)
            if (effectiveDosyaId) {
              ihtiyacRaporuService
                .getLinkedRaporForDosya(effectiveDosyaId)
                .then((rapor) => setHasLinkedIhtiyacRaporu(Boolean(rapor)))
                .catch(() => {})
            }
          }}
          dosyaId={effectiveDosyaId}
          activeDosya={activeDosya}
          onSuccess={handleIhtiyacSuccess}
        />
      )}
    </div>
  )
}
