import React from 'react'
import { Layers } from 'lucide-react'
import { SubFilterType } from '../teminSelector.types'

interface TeminSelectorFilterTagsProps {
  is2886?: boolean
  isDt?: boolean
  subFilter: SubFilterType
  setSubFilter: (filter: SubFilterType) => void
  dosyalar2886Length?: number
  dtCount: number
  ihaleCount?: number
}

export const TeminSelectorFilterTags: React.FC<TeminSelectorFilterTagsProps> = ({
  subFilter,
  setSubFilter,
  dtCount
}) => {
  return (
    <div className="flex items-center gap-1 px-1 mb-2 text-[11px] font-semibold overflow-x-auto custom-scrollbar pb-1">
      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
        <Layers className="w-3 h-3" /> Filtre:
      </span>

      <button
        onClick={() => setSubFilter('mode_default')}
        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          subFilter === 'mode_default'
            ? 'bg-blue-600 text-white font-bold'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        Tüm Doğrudan Teminler ({dtCount})
      </button>
      <button
        onClick={() => setSubFilter('dt_mal')}
        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          subFilter === 'dt_mal'
            ? 'bg-blue-600 text-white font-bold'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        Mal Alımları (22/d)
      </button>
      <button
        onClick={() => setSubFilter('dt_hizmet')}
        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          subFilter === 'dt_hizmet'
            ? 'bg-blue-600 text-white font-bold'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        Hizmet & Onarım İşleri
      </button>
      <button
        onClick={() => setSubFilter('all')}
        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          subFilter === 'all'
            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        Tüm Arşiv (Hepsi)
      </button>
    </div>
  )
}
