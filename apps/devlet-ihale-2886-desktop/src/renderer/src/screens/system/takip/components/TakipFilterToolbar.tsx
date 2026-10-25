import { Filter, Search, X, LayoutGrid, List } from 'lucide-react'

export type ColumnHeightMode = 'fit' | '3cards' | '5cards' | 'auto'

export interface TakipFilterToolbarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedYil: string
  setSelectedYil: (yil: string) => void
  selectedTur: string
  setSelectedTur: (tur: string) => void
  uniqueYillar: number[]
  totalCount?: number
  filteredCount?: number
  onOpenWizard?: (stageId?: number) => void
  cardMode?: 'cards' | 'compact'
  setCardMode?: (mode: 'cards' | 'compact') => void
  columnHeightMode?: ColumnHeightMode
  setColumnHeightMode?: (mode: ColumnHeightMode) => void
}

export function TakipFilterToolbar({
  searchQuery,
  setSearchQuery,
  selectedYil,
  setSelectedYil,
  selectedTur,
  setSelectedTur,
  uniqueYillar,
  totalCount,
  filteredCount,
  cardMode,
  setCardMode,
  columnHeightMode,
  setColumnHeightMode
}: TakipFilterToolbarProps): React.JSX.Element {
  const isFiltered = searchQuery.trim() !== '' || selectedYil !== 'all' || selectedTur !== 'all'

  const handleResetFilters = (): void => {
    setSearchQuery('')
    setSelectedYil('all')
    setSelectedTur('all')
  }

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl shadow-2xs shrink-0">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Konu, dosya no veya birim adına göre ara..."
          className="w-full pl-9 pr-8 py-1.5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Aramayı Temizle"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filters and Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Year Filter - Keep as 1st combobox for tests */}
        <select
          value={selectedYil}
          onChange={(e) => setSelectedYil(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          title="Bütçe Yılına Göre Filtrele"
        >
          <option value="all">Tüm Yıllar</option>
          {uniqueYillar.map((y) => (
            <option key={y} value={String(y)}>
              {y} Yılı
            </option>
          ))}
        </select>

        {/* Tur Filter - Keep as 2nd combobox for tests */}
        <select
          value={selectedTur}
          onChange={(e) => setSelectedTur(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          title="Alım Türüne Göre Filtrele"
        >
          <option value="all">Tüm Alım Türleri</option>
          <option value="mal">Mal Alımı</option>
          <option value="hizmet">Hizmet Alımı</option>
          <option value="yapim_isi">Yapım İşi</option>
          <option value="danismanlik">Danışmanlık</option>
        </select>

        {/* Reset Filters button if any filter is active */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
            title="Tüm Filtreleri Sıfırla"
          >
            <Filter size={12} />
            <span>Temizle</span>
          </button>
        )}

        {/* Dossier Count Badge */}
        {typeof filteredCount === 'number' && (
          <div className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            {filteredCount}{' '}
            {typeof totalCount === 'number' && totalCount !== filteredCount
              ? `/ ${totalCount}`
              : ''}{' '}
            dosya
          </div>
        )}

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-0.5" />

        {/* Column Height & Scroll Sınırı */}
        {columnHeightMode && setColumnHeightMode && (
          <select
            value={columnHeightMode}
            onChange={(e) => setColumnHeightMode(e.target.value as ColumnHeightMode)}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            title="Sütun Kaydırma ve Kart Yükseklik Sınırı"
          >
            <option value="fit">Ekrana Sığdır</option>
            <option value="3cards">3 Kart Kaydırma</option>
            <option value="5cards">5 Kart Kaydırma</option>
            <option value="auto">Serbest / Tümü</option>
          </select>
        )}

        {/* Kanban Card Mode: Kartlar vs Liste */}
        {cardMode && setCardMode && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setCardMode('cards')}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                cardMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid size={13} />
              <span>Kart</span>
            </button>
            <button
              type="button"
              onClick={() => setCardMode('compact')}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                cardMode === 'compact'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Kompakt Liste Görünümü"
            >
              <List size={13} />
              <span>Liste</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
