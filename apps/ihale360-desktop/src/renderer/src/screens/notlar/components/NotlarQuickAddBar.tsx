import React from 'react'
import { CheckSquare, FileText, Plus } from 'lucide-react'
import { NotOncelik, NotTip } from '../types'

interface NotlarQuickAddBarProps {
  quickTitle: string
  onQuickTitleChange: (val: string) => void
  quickTip: NotTip
  onQuickTipChange: (tip: NotTip) => void
  quickOncelik: NotOncelik
  onQuickOncelikChange: (oncelik: NotOncelik) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function NotlarQuickAddBar({
  quickTitle,
  onQuickTitleChange,
  quickTip,
  onQuickTipChange,
  quickOncelik,
  onQuickOncelikChange,
  isSubmitting,
  onSubmit
}: NotlarQuickAddBarProps): React.JSX.Element {
  return (
    <form
      onSubmit={onSubmit}
      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-2.5"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onQuickTipChange(quickTip === 'todo' ? 'not' : 'todo')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          {quickTip === 'todo' ? (
            <>
              <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Yapılacak</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Not</span>
            </>
          )}
        </button>

        <select
          value={quickOncelik}
          onChange={(e) => onQuickOncelikChange(e.target.value as NotOncelik)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="dusuk">Düşük</option>
          <option value="orta">Orta</option>
          <option value="yuksek">Yüksek</option>
          <option value="acil">Acil</option>
        </select>
      </div>

      <div className="flex-1 w-full relative">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => onQuickTitleChange(e.target.value)}
          placeholder="Hızlıca bir görev veya not yazın ve Enter'a basın..."
          className="w-full pl-3.5 pr-10 py-2 text-sm rounded-xl border border-transparent focus:border-blue-500 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded">
          Enter ↵
        </span>
      </div>

      <button
        type="submit"
        disabled={!quickTitle.trim() || isSubmitting}
        className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-40"
      >
        <Plus className="w-4 h-4" />
        <span>Hızlı Ekle</span>
      </button>
    </form>
  )
}
