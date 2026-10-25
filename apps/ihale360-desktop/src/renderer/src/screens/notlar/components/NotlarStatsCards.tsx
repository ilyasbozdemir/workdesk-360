import React from 'react'
import { AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react'

interface NotlarStatsCardsProps {
  stats: {
    total: number
    pending: number
    completed: number
    urgent: number
    todayOrOverdue: number
    completionRate: number
  }
}

export function NotlarStatsCards({ stats }: NotlarStatsCardsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {/* Toplam Not & Görev */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Toplam Kayıt
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.total}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* Bekleyen Görevler */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Bekleyen Görevler
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.pending}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Tamamlananlar & İlerleme */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Tamamlananlar
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {stats.completed}{' '}
              <span className="text-xs font-normal text-slate-400">(%{stats.completionRate})</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        {/* Küçük İlerleme Çubuğu */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      {/* Acil / Geciken Görevler */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Acil & Vadesi Dolan
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.urgent}{' '}
            {stats.todayOrOverdue > 0 && (
              <span className="text-xs text-rose-500 font-semibold">
                ({stats.todayOrOverdue} Vadesi Yakın)
              </span>
            )}
          </h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
