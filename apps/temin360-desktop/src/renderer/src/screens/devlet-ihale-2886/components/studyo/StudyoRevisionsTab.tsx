import React from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import type { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'

interface StudyoRevisionsTabProps {
  currentDosya: Dosya2886Item | null
  onSaveRevision: () => void
  onRestoreRevision: (html: string) => void
}

export function StudyoRevisionsTab({
  currentDosya,
  onSaveRevision,
  onRestoreRevision
}: StudyoRevisionsTabProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Kayıtlı Belge Sürümleri
        </span>
        <button
          type="button"
          onClick={onSaveRevision}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Yeni Sürüm Al</span>
        </button>
      </div>

      {currentDosya?.surumler && currentDosya.surumler.length > 0 ? (
        <div className="space-y-2">
          {currentDosya.surumler.map((rev) => (
            <div
              key={rev.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {rev.baslik}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{rev.tarih}</div>
              </div>

              <button
                type="button"
                onClick={() => onRestoreRevision(rev.html)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Geri Yükle</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-slate-400">
          Henüz kayıtlı bir sürüm bulunmuyor. &quot;Yeni Sürüm Al&quot; ile belge anlık halini
          dondurabilirsiniz.
        </div>
      )}
    </div>
  )
}
