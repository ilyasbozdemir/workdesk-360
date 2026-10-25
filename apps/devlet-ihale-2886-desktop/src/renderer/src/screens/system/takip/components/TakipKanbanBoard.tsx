import React, { useState, useMemo } from 'react'
import { Layers, Plus, AlertCircle } from 'lucide-react'
import { TakipKanbanCard } from './TakipKanbanCard'
import { TakipFilterToolbar, type ColumnHeightMode } from './TakipFilterToolbar'
import { logActivity } from '../../../../utils/logger'
import { emitAppEvent } from '../../../../utils/appEvents'
import { useQueryClient } from '@tanstack/react-query'
import type { TeminDosyasi } from '../../../dosyalar/dosyalar.hooks'

export interface TakipKanbanBoardProps {
  dosyalar: TeminDosyasi[]
  activeDosyaId: number | null
  setActiveDosyaId: (id: number) => void
  formatCurrency: (val: number) => string
  onOpenWizard: (targetStage?: number) => void
  onOpenSurec: (dosya: TeminDosyasi) => void
  onEdit: (dosyaId: number) => void
  onOpenDetail?: (dosya: TeminDosyasi) => void
  searchQuery?: string
  setSearchQuery?: (q: string) => void
  selectedYil?: string
  setSelectedYil?: (y: string) => void
  selectedTur?: string
  setSelectedTur?: (t: string) => void
}

interface StageColumnDef {
  stageId: number
  title: string
  subtitle: string
  badgeColor: string
  borderColor: string
  headerBg: string
  accentColor: string
}

const KANBAN_STAGES: StageColumnDef[] = [
  {
    stageId: 1,
    title: 'Hazırlıkta',
    subtitle: 'İhtiyaç Tespiti & Başlangıç',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-900/40',
    headerBg: 'bg-amber-50/50 dark:bg-amber-950/20',
    accentColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    stageId: 2,
    title: 'Teklif Toplanıyor',
    subtitle: 'Piyasa Fiyat Araştırması',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-900/40',
    headerBg: 'bg-blue-50/50 dark:bg-blue-950/20',
    accentColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    stageId: 3,
    title: 'Onayda',
    subtitle: 'Sipariş & Sözleşme',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-900/40',
    headerBg: 'bg-purple-50/50 dark:bg-purple-950/20',
    accentColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    stageId: 4,
    title: 'Tamamlandı',
    subtitle: 'Kabul & Ödeme İşlemleri',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-900/40',
    headerBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    accentColor: 'text-emerald-600 dark:text-emerald-400'
  }
]

export function TakipKanbanBoard({
  dosyalar,
  activeDosyaId,
  setActiveDosyaId,
  formatCurrency,
  onOpenWizard,
  onOpenSurec,
  onEdit,
  onOpenDetail,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  selectedYil: externalSelectedYil,
  setSelectedYil: externalSetSelectedYil,
  selectedTur: externalSelectedTur,
  setSelectedTur: externalSetSelectedTur
}: TakipKanbanBoardProps): React.JSX.Element {
  const queryClient = useQueryClient()

  // Optimistic overrides for smooth drag & drop without cascading renders
  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Record<number, { durum_asama_id: number; status: string }>
  >({})
  const [activeDropStage, setActiveDropStage] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Search & Filter state (controlled or uncontrolled fallback)
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('')
  const [internalSelectedYil, setInternalSelectedYil] = useState<string>('all')
  const [internalSelectedTur, setInternalSelectedTur] = useState<string>('all')

  // Kanban View Density: 'cards' | 'compact'
  const [cardMode, setCardModeState] = useState<'cards' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('temin_kanban_card_mode')
      if (saved === 'cards' || saved === 'compact') return saved
    } catch {
      // ignore
    }
    return 'cards'
  })

  const setCardMode = (mode: 'cards' | 'compact'): void => {
    setCardModeState(mode)
    try {
      localStorage.setItem('temin_kanban_card_mode', mode)
    } catch {
      // ignore
    }
  }

  // Column Height / Scroll Sınırı: 'fit' | '3cards' | '5cards' | 'auto'
  const [columnHeightMode, setColumnHeightModeState] = useState<ColumnHeightMode>(() => {
    try {
      const saved = localStorage.getItem('temin_kanban_height_mode')
      if (saved === 'fit' || saved === '3cards' || saved === '5cards' || saved === 'auto')
        return saved
    } catch {
      // ignore
    }
    return 'fit'
  })

  const setColumnHeightMode = (mode: ColumnHeightMode): void => {
    setColumnHeightModeState(mode)
    try {
      localStorage.setItem('temin_kanban_height_mode', mode)
    } catch {
      // ignore
    }
  }

  // Infinite Scroll / Kademeli Yükleme
  const INITIAL_BATCH = columnHeightMode === 'fit' ? 40 : columnHeightMode === '3cards' ? 5 : 8
  const [visibleCounts, setVisibleCounts] = useState<Record<number, number>>({
    1: INITIAL_BATCH,
    2: INITIAL_BATCH,
    3: INITIAL_BATCH,
    4: INITIAL_BATCH
  })

  const handleLoadMore = (stageId: number, step = 5): void => {
    setVisibleCounts((prev) => ({
      ...prev,
      [stageId]: (prev[stageId] || INITIAL_BATCH) + step
    }))
  }

  const handleColumnScroll = (
    e: React.UIEvent<HTMLDivElement>,
    stageId: number,
    totalCount: number
  ): void => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 60) {
      const current = visibleCounts[stageId] || INITIAL_BATCH
      if (current < totalCount) {
        handleLoadMore(stageId, 5)
      }
    }
  }

  const effectiveSearchQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
  const setEffectiveSearchQuery = externalSetSearchQuery || setInternalSearchQuery

  const effectiveSelectedYil =
    externalSelectedYil !== undefined ? externalSelectedYil : internalSelectedYil
  const setEffectiveSelectedYil = externalSetSelectedYil || setInternalSelectedYil

  const effectiveSelectedTur =
    externalSelectedTur !== undefined ? externalSelectedTur : internalSelectedTur
  const setEffectiveSelectedTur = externalSetSelectedTur || setInternalSelectedTur

  // Apply optimistic overrides on top of incoming dosyalar
  const activeDosyalar = useMemo(() => {
    return dosyalar.map((d) => {
      const override = optimisticOverrides[d.id]
      return override ? { ...d, ...override } : d
    })
  }, [dosyalar, optimisticOverrides])

  // Extract unique years for filter
  const uniqueYillar = useMemo(() => {
    const years = new Set<number>()
    dosyalar.forEach((d) => {
      const y =
        d.butce_yili ||
        (d.dosya_acilis_tarihi ? new Date(d.dosya_acilis_tarihi).getFullYear() : null)
      if (y) years.add(y)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [dosyalar])

  // Filtered Dossiers
  const filteredDosyalar = useMemo(() => {
    return activeDosyalar.filter((d) => {
      // Exclude soft deleted files
      if (d.is_deleted === 1) return false

      // Search Query
      if (effectiveSearchQuery.trim()) {
        const q = effectiveSearchQuery.toLowerCase().trim()
        const matchKonu = (d.konu || '').toLowerCase().includes(q)
        const matchNo = (d.temin_no || '').toLowerCase().includes(q)
        const matchBirim = (
          (d as { birim_adi?: string; birim?: string }).birim_adi ||
          (d as { birim?: string }).birim ||
          ''
        )
          .toLowerCase()
          .includes(q)
        if (!matchKonu && !matchNo && !matchBirim) return false
      }

      // Year Filter
      if (effectiveSelectedYil !== 'all') {
        const dYear =
          d.butce_yili ||
          (d.dosya_acilis_tarihi ? new Date(d.dosya_acilis_tarihi).getFullYear() : null)
        if (String(dYear) !== effectiveSelectedYil) return false
      }

      // Type Filter
      if (effectiveSelectedTur !== 'all') {
        if (d.tur !== effectiveSelectedTur) return false
      }

      return true
    })
  }, [activeDosyalar, effectiveSearchQuery, effectiveSelectedYil, effectiveSelectedTur])

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: number): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropStage !== stageId) {
      setActiveDropStage(stageId)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, stageId: number): void => {
    // Only clear if actually leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (activeDropStage === stageId) {
      setActiveDropStage(null)
    }
  }

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetStageId: number
  ): Promise<void> => {
    e.preventDefault()
    setActiveDropStage(null)

    const rawId = e.dataTransfer.getData('text/plain')
    const dosyaId = parseInt(rawId, 10)
    if (!dosyaId || isNaN(dosyaId)) return

    const targetDosya = activeDosyalar.find((d) => d.id === dosyaId)
    if (!targetDosya) return

    // Normalizing current stage
    const rawCurrentStage = Number(targetDosya.durum_asama_id) || 1
    const currentStage = targetDosya.status === 'tamamlandi' ? 4 : rawCurrentStage

    if (currentStage === targetStageId) return

    const newStatus = targetStageId === 4 ? 'tamamlandi' : 'devam_ediyor'

    // 1. Optimistic Update via overrides map
    setOptimisticOverrides((prev) => ({
      ...prev,
      [dosyaId]: { durum_asama_id: targetStageId, status: newStatus }
    }))

    // 2. Persist to SQLite via IPC
    try {
      if (window.electron?.ipcRenderer) {
        const res = await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET durum_asama_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [targetStageId, newStatus, dosyaId]
        )

        if (!res?.success) {
          throw new Error(res?.error || 'Veritabanı güncelleme hatası')
        }

        // Emit synchronization events
        emitAppEvent('status:changed', { dosyaId, payload: { status: newStatus } })
        emitAppEvent('dossier:updated', { dosyaId })

        await logActivity(
          'Dosya Aşaması Değiştirildi',
          `#${targetDosya.temin_no || dosyaId} dosyası ${KANBAN_STAGES.find((s) => s.stageId === targetStageId)?.title} aşamasına taşındı.`,
          'info'
        )

        // Invalidate react-query cache
        queryClient.invalidateQueries({ queryKey: ['temin_dosyalari'] })
      }
    } catch (err: unknown) {
      console.error('Kanban aşama güncelleme hatası:', err)
      // Rollback optimistic override on error
      setOptimisticOverrides((prev) => {
        const updated = { ...prev }
        delete updated[dosyaId]
        return updated
      })
      const message = err instanceof Error ? err.message : 'Lütfen tekrar deneyiniz.'
      setErrorMessage(`Aşama güncellenirken hata oluştu: ${message}`)
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full flex-1 min-h-0">
      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="shrink-0 flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TOOLBAR: SEARCH, FILTERS & WIZARD ACTION */}
      <div className="shrink-0">
        <TakipFilterToolbar
          searchQuery={effectiveSearchQuery}
          setSearchQuery={setEffectiveSearchQuery}
          selectedYil={effectiveSelectedYil}
          setSelectedYil={setEffectiveSelectedYil}
          selectedTur={effectiveSelectedTur}
          setSelectedTur={setEffectiveSelectedTur}
          uniqueYillar={uniqueYillar}
          totalCount={dosyalar.length}
          filteredCount={filteredDosyalar.length}
          onOpenWizard={onOpenWizard}
          cardMode={cardMode}
          setCardMode={setCardMode}
          columnHeightMode={columnHeightMode}
          setColumnHeightMode={setColumnHeightMode}
        />
      </div>

      {/* 4-COLUMN KANBAN BOARD */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 select-none ${
          columnHeightMode === 'fit' ? 'flex-1 min-h-0 xl:grid-rows-1 items-stretch' : 'items-start'
        }`}
      >
        {KANBAN_STAGES.map((col) => {
          // Filter dossiers for this column
          const columnDosyalar = filteredDosyalar.filter((d) => {
            const rawStage = Number(d.durum_asama_id) || 1
            const stage = d.status === 'tamamlandi' ? 4 : rawStage
            return stage === col.stageId
          })

          const totalMaliyet = columnDosyalar.reduce((sum, d) => sum + (d.yaklasik_maliyet || 0), 0)
          const isHovered = activeDropStage === col.stageId

          return (
            <div
              key={col.stageId}
              onDragOver={(e) => handleDragOver(e, col.stageId)}
              onDragLeave={(e) => handleDragLeave(e, col.stageId)}
              onDrop={(e) => handleDrop(e, col.stageId)}
              className={`flex flex-col rounded-3xl border transition-all duration-200 min-h-140 xl:min-h-0 ${
                columnHeightMode === 'fit' ? 'xl:h-full xl:overflow-hidden' : ''
              } bg-slate-50/60 dark:bg-slate-900/40 p-3.5 ${col.borderColor} ${
                isHovered
                  ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20 scale-[1.01]'
                  : ''
              }`}
            >
              {/* Column Header */}
              <div
                className={`shrink-0 p-3.5 rounded-2xl border ${col.borderColor} ${col.headerBg} mb-3 shadow-2xs`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${col.badgeColor}`}
                    >
                      {col.stageId}
                    </span>
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      {col.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${col.badgeColor}`}
                    >
                      {columnDosyalar.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => onOpenWizard(col.stageId)}
                      className="p-1 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title={`${col.title} aşamasında yeni dosya oluştur`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                  <span className="truncate">{col.subtitle}</span>
                  <span className="font-mono font-bold shrink-0 ml-1">
                    {formatCurrency(totalMaliyet)}
                  </span>
                </div>
              </div>

              {/* Dossier Cards List with Infinite Scroll */}
              {(() => {
                const limit = visibleCounts[col.stageId] || INITIAL_BATCH
                const renderedDosyalar = columnDosyalar.slice(0, limit)
                const hasMore = renderedDosyalar.length < columnDosyalar.length
                const heightClass =
                  columnHeightMode === 'fit'
                    ? 'max-h-[490px] xl:max-h-none'
                    : columnHeightMode === 'auto'
                      ? 'max-h-none'
                      : columnHeightMode === '5cards'
                        ? 'max-h-[760px]'
                        : cardMode === 'compact'
                          ? 'max-h-[390px]'
                          : 'max-h-[490px]'

                return (
                  <div
                    onScroll={(e) => handleColumnScroll(e, col.stageId, columnDosyalar.length)}
                    className={`flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto ${heightClass} custom-scrollbar pr-0.5`}
                  >
                    {columnDosyalar.length > 0 ? (
                      <>
                        {renderedDosyalar.map((dosya) => (
                          <TakipKanbanCard
                            key={dosya.id}
                            dosya={dosya}
                            formatCurrency={formatCurrency}
                            onSelect={setActiveDosyaId}
                            onOpenSurec={onOpenSurec}
                            onEdit={onEdit}
                            isActive={activeDosyaId === dosya.id}
                            onOpenDetail={onOpenDetail}
                            mode={cardMode}
                          />
                        ))}

                        {/* Infinite Scroll / Daha Fazla Yükle Alanı */}
                        {hasMore && (
                          <div className="py-2 px-3 my-1 flex flex-col items-center justify-center gap-1.5 bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in">
                            <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                              {renderedDosyalar.length} / {columnDosyalar.length} dosya gösteriliyor
                            </span>
                            <button
                              type="button"
                              onClick={() => handleLoadMore(col.stageId, 5)}
                              className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 px-3 py-1 rounded-xl shadow-2xs hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
                            >
                              +5 Daha Yükle (veya aşağı kaydırın)
                            </button>
                          </div>
                        )}

                        {!hasMore && columnDosyalar.length > 5 && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center py-1">
                            Tüm dosyalar yüklendi ({columnDosyalar.length})
                          </div>
                        )}
                      </>
                    ) : (
                      /* Empty Column State */
                      <div
                        className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed text-center min-h-55 transition-colors ${
                          isHovered
                            ? 'border-blue-400 bg-blue-50/30 text-blue-600'
                            : 'border-slate-200/80 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                          <Layers className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Bu Aşamada Dosya Yok
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-37.5 mt-1">
                          Dosyaları bu sütuna sürükleyip bırakabilirsiniz.
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenWizard(col.stageId)}
                          className="mt-3 text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          Dosya Ekle
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
