import React from 'react'
import { CheckCircle2, FileEdit, FileText, Layers, Printer, Star } from 'lucide-react'

export type StatusFilterType = 'all' | 'starred' | 'has_data' | 'no_data' | 'ready' | 'printed'

interface CiktiStatusFilterTabsProps {
  statusFilter: StatusFilterType
  setStatusFilter: (filter: StatusFilterType) => void
  totalCount: number
  readyCount: number
  starredCount: number
  printedCount: number
  hasDataCount?: number
  noDataCount?: number
}

export function CiktiStatusFilterTabs({
  statusFilter,
  setStatusFilter,
  totalCount,
  readyCount,
  starredCount,
  printedCount,
  hasDataCount = 0,
  noDataCount = 0
}: CiktiStatusFilterTabsProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/60 rounded-2xl mb-3 text-xs font-semibold overflow-x-auto custom-scrollbar border border-slate-200/60 dark:border-slate-800 select-none">
      <button
        type="button"
        onClick={() => setStatusFilter('all')}
        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
          statusFilter === 'all'
            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Layers className="w-3.5 h-3.5 text-blue-500" />
        Tüm Belgeler
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
          {totalCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter('starred')}
        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
          statusFilter === 'starred'
            ? 'bg-amber-500 text-white shadow-xs font-bold'
            : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
        }`}
      >
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
        Hızlı Erişim
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            statusFilter === 'starred'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
          }`}
        >
          {starredCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter('has_data')}
        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
          statusFilter === 'has_data'
            ? 'bg-emerald-600 text-white shadow-xs font-bold'
            : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        Veri Girildi
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            statusFilter === 'has_data'
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {hasDataCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter('no_data')}
        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
          statusFilter === 'no_data'
            ? 'bg-slate-700 text-white shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/40'
        }`}
      >
        <FileEdit className="w-3.5 h-3.5 text-slate-400" />
        Veri Girilmedi
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            statusFilter === 'no_data'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {noDataCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter('printed')}
        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
          statusFilter === 'printed'
            ? 'bg-blue-600 text-white shadow-xs font-bold'
            : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
        }`}
      >
        <Printer className="w-3.5 h-3.5" />
        Yazdırılanlar
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            statusFilter === 'printed'
              ? 'bg-blue-700 text-white'
              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
          }`}
        >
          {printedCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter('ready')}
        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
          statusFilter === 'ready'
            ? 'bg-teal-600 text-white shadow-xs font-bold'
            : 'text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Yazdırmaya Hazır
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            statusFilter === 'ready'
              ? 'bg-teal-700 text-white'
              : 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300'
          }`}
        >
          {readyCount}
        </span>
      </button>
    </div>
  )
}
