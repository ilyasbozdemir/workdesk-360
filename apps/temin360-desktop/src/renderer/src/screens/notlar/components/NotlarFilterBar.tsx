import React from 'react'
import { Folder, Search } from 'lucide-react'
import { NOT_KATEGORILERI, NotOncelik } from '../types'

interface NotlarFilterBarProps {
  tab: 'all' | 'todo' | 'not' | 'completed'
  onTabChange: (tab: 'all' | 'todo' | 'not' | 'completed') => void
  stats: {
    total: number
    pending: number
    completed: number
  }
  search: string
  onSearchChange: (val: string) => void
  activeDosyaId: number | null
  selectedDosya: number | 'all' | 'general'
  onSelectedDosyaChange: (val: number | 'all' | 'general') => void
  dosyalar: Array<{ id: number; dosya_no?: string }>
  selectedOncelik: 'all' | NotOncelik
  onSelectedOncelikChange: (val: 'all' | NotOncelik) => void
  selectedKategori: string
  onSelectedKategoriChange: (val: string) => void
}

export function NotlarFilterBar({
  tab,
  onTabChange,
  stats,
  search,
  onSearchChange,
  activeDosyaId,
  selectedDosya,
  onSelectedDosyaChange,
  dosyalar,
  selectedOncelik,
  onSelectedOncelikChange,
  selectedKategori,
  onSelectedKategoriChange
}: NotlarFilterBarProps): React.JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800">
      {/* Sekmeler */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            tab === 'all'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tümü ({stats.total})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('todo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            tab === 'todo'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          📌 Yapılacaklar ({stats.pending})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('not')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            tab === 'not'
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          📝 Notlar
        </button>
        <button
          type="button"
          onClick={() => onTabChange('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            tab === 'completed'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          ✅ Tamamlananlar ({stats.completed})
        </button>
      </div>

      {/* Açılır Filtreler ve Arama */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Arama Input */}
        <div className="relative flex-1 md:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ara..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Aktif Dosya Hızlı Filtre Butonu */}
        {activeDosyaId && (
          <button
            type="button"
            onClick={() => {
              onSelectedDosyaChange(selectedDosya === activeDosyaId ? 'all' : activeDosyaId)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedDosya === activeDosyaId
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40'
            }`}
            title="Şu an seçili olan aktif dosyanın not ve görevlerini filtrele"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Aktif Dosya Notları</span>
          </button>
        )}

        {/* Dosya Filtresi */}
        <select
          value={selectedDosya}
          onChange={(e) => {
            const val = e.target.value
            if (val === 'all') onSelectedDosyaChange('all')
            else if (val === 'general') onSelectedDosyaChange('general')
            else onSelectedDosyaChange(Number(val))
          }}
          className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-42.5 truncate"
        >
          <option value="all">📁 Tüm Dosyalar</option>
          <option value="general">Genel Notlar</option>
          {dosyalar.map((d) => (
            <option key={d.id} value={d.id}>
              {d.id === activeDosyaId ? '⭐ ' : ''}
              {d.dosya_no ? `Dosya No: ${d.dosya_no}` : `Dosya #${d.id}`}
              {d.id === activeDosyaId ? ' (Aktif Dosya)' : ''}
            </option>
          ))}
        </select>

        {/* Öncelik Filtresi */}
        <select
          value={selectedOncelik}
          onChange={(e) => onSelectedOncelikChange(e.target.value as any)}
          className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">Öncelik: Tümü</option>
          <option value="acil">Acil</option>
          <option value="yuksek">Yüksek</option>
          <option value="orta">Orta</option>
          <option value="dusuk">Düşük</option>
        </select>

        {/* Kategori Filtresi */}
        <select
          value={selectedKategori}
          onChange={(e) => onSelectedKategoriChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[140px] truncate"
        >
          <option value="all">Kategori: Tümü</option>
          {NOT_KATEGORILERI.map((kat) => (
            <option key={kat} value={kat}>
              {kat}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
