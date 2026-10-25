import React from 'react'
import { Search, LayoutGrid, Table as TableIcon, Sparkles, FolderPlus } from 'lucide-react'

interface DosyaYonetimi2886FilterBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  filterTur: string
  setFilterTur: (val: string) => void
  totalCount: number
  viewMode: 'grid' | 'table'
  setViewMode: (val: 'grid' | 'table') => void
  onOpenStudyo?: () => void
  onOpenNewModal: () => void
}

export const DosyaYonetimi2886FilterBar: React.FC<DosyaYonetimi2886FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  filterTur,
  setFilterTur,
  totalCount,
  viewMode,
  setViewMode,
  onOpenStudyo,
  onOpenNewModal
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-70">
        {/* Arama Input */}
        <div className="relative flex-1 min-w-55">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="2886 dosya no, ada/parsel, ihale konusu veya taşınmaz ara..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Tür Filtresi */}
        <select
          value={filterTur}
          onChange={(e) => setFilterTur(e.target.value)}
          className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden font-medium cursor-pointer"
        >
          <option value="hepsi">Tüm İşlem Türleri ({totalCount})</option>
          <option value="satis">🏷️ Taşınmaz / Menkul Satış</option>
          <option value="kiralama">🏢 Kiralama İşleri</option>
          <option value="irtifak">📜 Sınırlı Ayni Hak & İrtifak</option>
          <option value="trampa">🔄 Trampa (Takas)</option>
        </select>
      </div>

      {/* Görünüm ve Yeni Dosya Butonu */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 dark:bg-slate-850 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Kart Görünümü"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Tablo Görünümü"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenStudyo}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Dinamik Belge & Form Stüdyosu</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewModal}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>+ Hızlı Dosya Ekle</span>
        </button>
      </div>
    </div>
  )
}
