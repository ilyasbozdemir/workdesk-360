import React from 'react'
import { Columns3, LayoutList, Layers, RefreshCw } from 'lucide-react'

export type BelgeViewMode = 'list' | 'kanban'

interface CiktiMerkeziHeaderProps {
  selectedCount: number
  refreshing: boolean
  allExpanded: boolean
  viewMode?: BelgeViewMode
  onViewModeChange?: (mode: BelgeViewMode) => void
  onRefresh: () => void
  onToggleAllCategories: () => void
}

export function CiktiMerkeziHeader({
  selectedCount,
  refreshing,
  allExpanded,
  viewMode = 'list',
  onViewModeChange,
  onRefresh,
  onToggleAllCategories
}: CiktiMerkeziHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          Dosya Belgeleri
        </h3>

        {/* GÖRÜNÜM SEÇİCİ (LİSTE / KANBAN) */}
        {onViewModeChange && (
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Liste Görünümü"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Kanban Süreç Panosu"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400 font-semibold">
          {selectedCount} Seçili
        </span>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer"
          title="Listeyi ve durumları yenile"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        {viewMode === 'list' && (
          <button
            onClick={onToggleAllCategories}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Tüm Grupları Aç / Kapat"
          >
            {allExpanded ? 'Hepsini Kapat' : 'Hepsini Aç'}
          </button>
        )}
      </div>
    </div>
  )
}
