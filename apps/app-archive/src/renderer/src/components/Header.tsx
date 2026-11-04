import React from 'react'
import {
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Sun,
  Moon,
  AlertTriangle,
  HardDrive
} from 'lucide-react'
import { AppStatus } from '../../../shared/types'

interface HeaderProps {
  status: AppStatus | null
  searchQuery: string
  onSearchChange: (q: string) => void
  viewMode: 'table' | 'grid'
  onViewModeChange: (mode: 'table' | 'grid') => void
  sortBy: 'name' | 'size' | 'mtime' | 'ext'
  sortDirection: 'asc' | 'desc'
  onSortChange: (sort: 'name' | 'size' | 'mtime' | 'ext') => void
  isScanning: boolean
  onScanNow: () => void
  isDark: boolean
  onToggleTheme: () => void
}

export function Header({
  status,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  sortDirection,
  onSortChange,
  isScanning,
  onScanNow,
  isDark,
  onToggleTheme
}: HeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 select-none">
      {/* AppData Fallback Uyarı Bandı */}
      {status?.isFallbackAppData && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Taşınabilir dizinde yazma izni bulunamadı. Veriler geçici olarak %AppData%\Arsiv360 dizinine kaydediliyor.
            </span>
          </div>
          <span className="text-[11px] opacity-90">{status.dbPath}</span>
        </div>
      )}

      {/* Ana Başlık ve Araç Çubuğu */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Sol: Logo ve Durum Rozeti */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100">
                Arşiv 360
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                PORTABLE
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate max-w-xs" title={status?.documentsDir}>
              📁 {status?.documentsDir || 'Belgeler'}
            </span>
          </div>
        </div>

        {/* Orta: Arama Çubuğu */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Dosya adı, yol veya etiketle anlık ara..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sağ: Aksiyonlar ve Görünüm Seçici */}
        <div className="flex items-center gap-2">
          {/* Sıralama */}
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onSortChange('name')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Ad {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSortChange('size')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                sortBy === 'size'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Boyut {sortBy === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSortChange('mtime')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                sortBy === 'mtime'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tarih {sortBy === 'mtime' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {/* Görünüm Modu: Tablo / Grid */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Tablo Görünümü"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Izgara Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Şimdi Tara Butonu */}
          <button
            onClick={onScanNow}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Belgeler klasörünü şimdi yeniden tara"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isScanning ? 'Taranıyor...' : 'Tara'}</span>
          </button>

          {/* Tema Değiştirici */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
