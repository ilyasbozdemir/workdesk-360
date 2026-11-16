import React from 'react'
import { Database, CheckCircle2, Clock, AlertCircle, Table2 } from 'lucide-react'
import type { KurulumTakipItem } from '../kurulumTakipService'

interface TabloTakipPaneliProps {
  items: KurulumTakipItem[]
  className?: string
  compact?: boolean
}

export const TabloTakipPaneli: React.FC<TabloTakipPaneliProps> = ({
  items,
  className = '',
  compact = false
}) => {
  if (!items || items.length === 0) return null

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden ${className}`}
    >
      {/* Başlık Çubuğu */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Veritabanı Tablo Takip & Kurulum Çizelgesi
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {items.filter((i) => i.durum === 'tamamlandi').length} / {items.length} Adım Tamamlandı
        </span>
      </div>

      {/* Tablo Çizelgesi */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {items.map((item) => {
          const isDone = item.durum === 'tamamlandi'
          const isSkipped = item.durum === 'atlandi'

          return (
            <div
              key={item.adim_kodu}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                isDone
                  ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isSkipped ? (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.adim_adi}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      <Table2 className="w-2.5 h-2.5" />
                      {item.tablo_adi}
                    </span>
                  </div>
                  {!compact && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                      {item.ozet_bilgi}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.kayit_sayisi > 0 && (
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {item.kayit_sayisi} Kayıt
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isDone
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : isSkipped
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isDone ? 'Eklendi / Hazır' : isSkipped ? 'Ertelendi' : 'Bekliyor'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
