import React from 'react'
import { CheckCircle2, Clock, FileCheck, Send, AlertTriangle } from 'lucide-react'
import { SurecAsamasi, IslakImzaDurum } from '../types'

interface StatusTimelineProps {
  asamalar: SurecAsamasi[]
  onAsamaGuncelle: (durum: IslakImzaDurum, tamamlandi: boolean, not?: string) => void
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ asamalar, onAsamaGuncelle }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Islak İmza Takip &amp; Durum Zinciri
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {asamalar.map((asama, index) => {
          return (
            <div
              key={asama.durum}
              className={`p-3.5 rounded-xl border transition-all ${
                asama.tamamlandi
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Adım {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onAsamaGuncelle(asama.durum, !asama.tamamlandi)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                    asama.tamamlandi
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {asama.tamamlandi ? 'Tamamlandı' : 'Bekliyor'}
                </button>
              </div>

              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                {asama.etiket}
              </div>

              {asama.tarih && (
                <div className="text-[10px] text-slate-500 font-mono mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {asama.tarih}
                </div>
              )}

              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                {asama.not || 'Açıklama girilmedi.'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
