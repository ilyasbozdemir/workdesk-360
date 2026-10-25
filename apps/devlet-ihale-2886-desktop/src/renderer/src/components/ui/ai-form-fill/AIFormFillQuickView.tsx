import React from 'react'
import { CheckCircle2, RefreshCw, Sparkles } from 'lucide-react'
import type { AIFormContext, AIFilledValues } from './aiFormFill.types'

interface AIFormFillQuickViewProps {
  context: AIFormContext
  quickLoading: boolean
  quickResult: AIFilledValues | null
  quickError: string
  onApplyAndClose: (values: AIFilledValues) => void
  onQuickFill: () => void
  onBack: () => void
}

export function AIFormFillQuickView({
  context,
  quickLoading,
  quickResult,
  quickError,
  onApplyAndClose,
  onQuickFill,
  onBack
}: AIFormFillQuickViewProps): React.JSX.Element {
  return (
    <div className="p-5 space-y-4">
      {quickLoading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            AI formu doldururken...
          </p>
          <p className="text-xs text-slate-400">Kurum bilgileri analiz ediliyor</p>
        </div>
      )}

      {quickError && (
        <div className="p-4 bg-red-50 dark:bg-red-955/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          ⚠️ {quickError}
        </div>
      )}

      {quickResult && (
        <>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={16} /> Form değerleri hazır!
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {context.doldurulacakAlanlar.map((a) => {
              const val = quickResult[a.alan]
              if (val === undefined) return null
              return (
                <div
                  key={a.alan}
                  className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <span className="text-slate-500 dark:text-slate-400 w-32 flex-none font-medium truncate">
                    {a.etiket}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 flex-1 min-w-0">
                    {String(val)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onApplyAndClose(quickResult)}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles size={15} /> Forma Uygula
            </button>
            <button
              onClick={onQuickFill}
              title="Yeniden üret"
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </>
      )}

      {!quickLoading && !quickResult && !quickError && (
        <div className="text-center text-sm text-slate-400 py-6">Hazırlanıyor...</div>
      )}

      <button
        onClick={onBack}
        className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
      >
        ← Geri
      </button>
    </div>
  )
}
