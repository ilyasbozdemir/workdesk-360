import React from 'react'

interface ButceKodStatsProps {
  stats: {
    total: number
    level4Count: number
    malCount: number
    hizmetCount: number
    yapimCount: number
  }
}

export const ButceKodStats: React.FC<ButceKodStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1 shadow-2xs">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          Toplam Bütçe Kodu
        </span>
        <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">
          {stats.total}
        </span>
      </div>
      <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col gap-1 shadow-2xs">
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
          IV. Düzey (Nihai Tertip)
        </span>
        <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
          {stats.level4Count}
        </span>
      </div>
      <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/50 flex flex-col gap-1 shadow-2xs">
        <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400">
          Mal Alımı Kodları
        </span>
        <span className="text-2xl font-extrabold text-sky-800 dark:text-sky-300">
          {stats.malCount}
        </span>
      </div>
      <div className="p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/50 flex flex-col gap-1 shadow-2xs">
        <span className="text-[11px] font-bold text-violet-700 dark:text-violet-400">
          Hizmet Alımı Kodları
        </span>
        <span className="text-2xl font-extrabold text-violet-800 dark:text-violet-300">
          {stats.hizmetCount}
        </span>
      </div>
      <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 flex flex-col gap-1 shadow-2xs">
        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
          Yapım & Yatırım
        </span>
        <span className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">
          {stats.yapimCount}
        </span>
      </div>
    </div>
  )
}
