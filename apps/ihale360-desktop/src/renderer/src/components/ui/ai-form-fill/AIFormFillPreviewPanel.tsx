import React from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'
import type { AIFormContext, AIFilledValues } from './aiFormFill.types'

interface PreviewPanelProps {
  values: AIFilledValues
  context: AIFormContext
  onApply: (values: AIFilledValues) => void
}

export function PreviewPanel({
  values,
  context,
  onApply
}: PreviewPanelProps): React.JSX.Element | null {
  if (Object.keys(values).length === 0) return null
  return (
    <div className="mt-3 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Doldurulacak Değerler
        </span>
        <button
          onClick={() => onApply(values)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles size={12} /> Forma Uygula
        </button>
      </div>

      <div className="mt-2 mb-1 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 leading-relaxed">
        <span className="text-xs mt-0.5">⚠️</span>
        <span>
          Yapay zekanın tahmin ettiği ekonomik kodlar, tarihler ve bütçe hesaplamaları hata
          içerebilir. Lütfen doğruluğunu <b>teyit edip</b> uygulayınız.
        </span>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
        {context.doldurulacakAlanlar
          .filter((a) => values[a.alan] !== undefined)
          .map((a) => (
            <div key={a.alan} className="flex gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 min-w-[120px] truncate">
                {a.etiket}:
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                {String(values[a.alan])}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
