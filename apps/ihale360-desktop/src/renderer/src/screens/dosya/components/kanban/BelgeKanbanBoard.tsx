import React, { useState } from 'react'
import {
  AlertCircle,
  FileCheck,
  FileText,
  Layers,
  Loader2,
  Clock,
  CheckCircle2,
  ListFilter
} from 'lucide-react'
import { BelgeKanbanCard } from './BelgeKanbanCard'
import { BelgeDetayDialog } from './BelgeDetayDialog'
import { BelgeKanbanItem, BelgeKanbanStatus, BELGE_KANBAN_COLUMNS } from './belgeKanbanTypes'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'

export interface BelgeKanbanBoardProps {
  columnsData: Record<BelgeKanbanStatus, BelgeKanbanItem[]>
  loading: boolean
  errorMessage?: string
  onMoveItem: (
    itemId: string,
    targetStatus: BelgeKanbanStatus,
    beklemeNedeni?: string | null
  ) => Promise<void>
  onOpenPreview: (sablon: Sablon) => void
  onUpdateBeklemeNedeni?: (itemId: string, reason: string) => Promise<void>
}

export function BelgeKanbanBoard({
  columnsData,
  loading,
  errorMessage,
  onMoveItem,
  onOpenPreview
}: BelgeKanbanBoardProps): React.JSX.Element {
  const [activeDropStatus, setActiveDropStatus] = useState<BelgeKanbanStatus | null>(null)
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<BelgeKanbanItem | null>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: BelgeKanbanStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropStatus !== status) {
      setActiveDropStatus(status)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, status: BelgeKanbanStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (activeDropStatus === status) {
      setActiveDropStatus(null)
    }
  }

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetStatus: BelgeKanbanStatus
  ) => {
    e.preventDefault()
    setActiveDropStatus(null)

    const rawItemId = e.dataTransfer.getData('text/plain')
    if (!rawItemId) return

    await onMoveItem(rawItemId, targetStatus)
  }

  const handlePreviewItem = (item: BelgeKanbanItem) => {
    if (item.sablon) {
      onOpenPreview(item.sablon)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-semibold">Belgeler yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* HATA BANNER'I */}
      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SÜTUNLAR KANBAN TABLOSU */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar select-none min-h-[460px]">
        {BELGE_KANBAN_COLUMNS.map((col) => {
          const items = columnsData[col.status] || []
          const isDropActive = activeDropStatus === col.status

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex-1 min-w-[270px] max-w-[340px] rounded-2xl border p-3 flex flex-col transition-all duration-200 ${
                isDropActive
                  ? 'border-dashed border-2 ring-2 ring-blue-500/50 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
              }`}
            >
              {/* SÜTUN BAŞLIĞI */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      col.status === 'hazirlanacak'
                        ? 'bg-amber-500'
                        : col.status === 'hazirlaniyor'
                          ? 'bg-blue-500'
                          : col.status === 'beklemede'
                            ? 'bg-purple-500'
                            : 'bg-emerald-500'
                    }`}
                  />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {col.title}
                  </h3>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${col.badgeColor}`}
                >
                  {items.length}
                </span>
              </div>

              {/* KARTLAR LİSTESİ */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-[200px]">
                {items.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl text-slate-400 dark:text-slate-500 p-4 text-center">
                    <FileText className="w-5 h-5 mb-1.5 opacity-40" />
                    <p className="text-[11px] font-medium">Bu sütunda belge yok</p>
                    <p className="text-[9px] opacity-60 mt-0.5">
                      Sürükleyip buraya bırakabilirsiniz
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <BelgeKanbanCard
                      key={item.id}
                      item={item}
                      onOpenDetail={(i) => setSelectedItemForDetail(i)}
                      onPreview={handlePreviewItem}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* BELGE DETAY & DURUM DİALOGU */}
      <BelgeDetayDialog
        item={selectedItemForDetail}
        isOpen={!!selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onSaveStatus={onMoveItem}
        onPreview={handlePreviewItem}
      />
    </div>
  )
}
