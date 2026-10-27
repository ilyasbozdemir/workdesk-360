import React, { useState } from 'react'
import {
  FolderPlus,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Layers,
  ChevronRight
} from 'lucide-react'

/**
 * ---------------------------------------------------------------------------
 * TEMİN 360 STANDART MODÜLER EKRAN ŞABLONU (BLANK / SCAFFOLD SCREEN)
 * ---------------------------------------------------------------------------
 * Yeni bir modül veya ekran geliştirirken bu şablonu kopyalayıp kullanabilirsiniz.
 * Temin 360 tasarım diliyle (koyu/açık mod, frameless uyum, tipografi) tam uyumludur.
 */

export interface BlankScreenItem {
  id: string | number
  baslik: string
  aciklama?: string
  durum?: 'aktif' | 'beklemede' | 'tamamlandi'
  tarih?: string
}

export const BlankScreenTemplate: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<BlankScreenItem[]>([])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 400)
  }

  const handleAddNew = () => {
    // Yeni kayıt modalını veya formunu aç
    console.log('Yeni kayıt ekleme tetiklendi')
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* ── ÜST BAŞLIK VE AKSİYON ŞERİDİ ── */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-1">
            <span>Modüller</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Modül Adı</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Modül / Ekran Başlığı</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bu ekranda ilgili süreç verilerini listeleyebilir, filtreleyebilir ve yeni işlemler başlatabilirsiniz.
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            title="Yenile"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleAddNew}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kayıt Oluştur</span>
          </button>
        </div>
      </div>

      {/* ── FİLTRE VE ARAMA ÇUBUĞU ── */}
      <div className="px-6 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Arama yapın..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtrele</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sırala</span>
          </button>
        </div>
      </div>

      {/* ── ANA İÇERİK ALANI (EMPTY STATE VEYA LİSTE) ── */}
      <div className="flex-1 p-6 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Henüz Kayıt Bulunmuyor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Bu modüle henüz herhangi bir veri eklenmedi. Geliştirmeye başlamak için bileşenlerinizi bu alana yerleştirebilir veya yeni bir kayıt ekleyebilirsiniz.
            </p>
            <button
              type="button"
              onClick={handleAddNew}
              className="mt-5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>İlk Kaydı Oluştur</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {item.baslik}
                  </h4>
                  <button type="button" className="text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                {item.aciklama && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {item.aciklama}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <span>{item.durum || 'Aktif'}</span>
                  <span>{item.tarih || 'Bugün'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
export default BlankScreenTemplate
