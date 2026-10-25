import React from 'react'
import { CheckSquare, LayoutGrid, LayoutList, Plus, RotateCw } from 'lucide-react'

interface NotlarHeaderProps {
  pendingCount: number
  viewMode: 'list' | 'sticky'
  onViewModeChange: (mode: 'list' | 'sticky') => void
  onRefresh: () => void
  onAddNew: () => void
}

export function NotlarHeader({
  pendingCount,
  viewMode,
  onViewModeChange,
  onRefresh,
  onAddNew
}: NotlarHeaderProps): React.JSX.Element {
  return (
    <div className="p-6 pb-4 border-b border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Notlar & Yapılacaklar Listesi
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                {pendingCount} Bekleyen
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Doğrudan temin ve ihale dosyalarına özel görevler, hatırlatıcılar ve yapışkan notlar
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
            title="Yenile"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Görünüm Değiştirici */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="Liste Görünümü"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('sticky')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'sticky'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
              title="Yapışkan Notlar Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Not / Görev Ekle</span>
          </button>
        </div>
      </div>
    </div>
  )
}
