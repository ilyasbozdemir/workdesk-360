import React from 'react'
import { CheckCircle2, ChevronRight, Pencil, Plus } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { subPagesMapping } from '../../../constants/surecler'

interface SurecSatiriProps {
  process: (typeof subPagesMapping)[0]
  boundSablonAd?: string
  onEdit: () => void
}

export function SurecSatiri({
  process,
  boundSablonAd,
  onEdit
}: SurecSatiriProps): React.JSX.Element {
  const stageColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    2: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    4: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
      <span
        className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
          stageColors[process.stage] || 'bg-slate-100 text-slate-600'
        )}
      >
        Aşama {process.stage}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
          {process.name}
        </p>
        <p className="text-[10px] text-slate-400 font-mono truncate">{process.path}</p>
      </div>

      {boundSablonAd ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-semibold truncate max-w-40">{boundSablonAd}</span>
        </div>
      ) : (
        <span className="text-[10px] text-slate-450 italic shrink-0 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          Bağlı değil
        </span>
      )}

      <button
        onClick={onEdit}
        className="ml-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300"
      >
        {boundSablonAd ? (
          <>
            <Pencil className="w-3 h-3" /> Düzenle
          </>
        ) : (
          <>
            <Plus className="w-3 h-3" /> Bağla
          </>
        )}
        <ChevronRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  )
}
