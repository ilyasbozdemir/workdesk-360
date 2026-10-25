import React from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Lock,
  Sparkles
} from 'lucide-react'
import { BelgeKanbanItem } from './belgeKanbanTypes'

interface BelgeKanbanCardProps {
  item: BelgeKanbanItem
  onOpenDetail: (item: BelgeKanbanItem) => void
  onPreview: (item: BelgeKanbanItem) => void
}

export function BelgeKanbanCard({
  item,
  onOpenDetail,
  onPreview
}: BelgeKanbanCardProps): React.JSX.Element {
  const isDraggable = !item.isLocked && !item.missingMsg

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onClick={() => onOpenDetail(item)}
      className={`group relative rounded-2xl border p-3.5 transition-all duration-200 select-none ${
        item.missingMsg
          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed dark:bg-slate-900/40 dark:border-slate-800'
          : item.isLocked
            ? 'bg-amber-50/40 border-amber-200/80 cursor-pointer hover:border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/40'
            : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      {/* ÜST ETİKETLER */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
          {item.kategori}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {item.isSigned && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40"
              title="Resmi olarak imzalanmış evrak"
            >
              <FileCheck className="w-2.5 h-2.5" /> İmzalı
            </span>
          )}

          {item.isLocked && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40"
              title="Yazdırma kilidi aktif"
            >
              <Lock className="w-2.5 h-2.5" /> Kilitli
            </span>
          )}

          {item.isProduced ? (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50"
              title="Veritabanında kayıtlı oluşturulmuş belge"
            >
              Kayıtlı
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              title="Henüz üretilmemiş taslak şablon"
            >
              Şablon
            </span>
          )}
        </div>
      </div>

      {/* BELGE BAŞLIĞI */}
      <h4
        className={`text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
          item.missingMsg ? 'line-through text-slate-400' : ''
        }`}
        title={item.belgeAdi}
      >
        {item.belgeAdi}
      </h4>

      {/* EKSİK GEREKSİNİM UYARISI */}
      {item.missingMsg && (
        <div
          className="flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 rounded-lg p-1.5 mb-2"
          title={item.missingMsg}
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="truncate">{item.missingMsg}</span>
        </div>
      )}

      {/* BEKLEMEDE NEDENİ ROZETİ */}
      {item.durum === 'beklemede' && item.beklemeNedeni && (
        <div
          className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200/80 dark:border-purple-900/50 rounded-lg p-1.5 mb-2"
          title={`Bekleme Nedeni: ${item.beklemeNedeni}`}
        >
          <Clock className="w-3 h-3 shrink-0 text-purple-500" />
          <span className="truncate">{item.beklemeNedeni}</span>
        </div>
      )}

      {/* ALT ÇUBUK: TARİH & HIZLI ÖNİZLEME */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
        <span className="truncate max-w-[140px]" title={item.dosyaAdi}>
          {item.updatedAt ? String(item.updatedAt).slice(0, 16) : item.dosyaAdi}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPreview(item)
          }}
          disabled={!!item.missingMsg}
          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Belgeyi Önizle / Düzenle"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
