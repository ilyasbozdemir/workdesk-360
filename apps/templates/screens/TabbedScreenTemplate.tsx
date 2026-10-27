import React, { useState, useMemo } from 'react'
import {
  Layers,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderOpen
} from 'lucide-react'

/**
 * ---------------------------------------------------------------------------
 * TEMİN 360 STANDART SEKMELİ & METRİKLİ EKRAN ŞABLONU (TABBED SCREEN TEMPLATE)
 * ---------------------------------------------------------------------------
 * KPI sayaç kartları, sekmeler, arama ve filtreleme içeren gelişmiş ekran şablonu.
 */

export interface TabbedItem {
  id: string | number
  kod: string
  baslik: string
  kategori: string
  tutar?: number
  durum: 'beklemede' | 'devam_ediyor' | 'tamamlandi' | 'iptal'
  tarih: string
}

export const TabbedScreenTemplate: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'devam_ediyor' | 'tamamlandi' | 'beklemede'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<TabbedItem[]>([])

  // KPI Hesaplamaları
  const stats = useMemo(() => {
    const total = items.length
    const devam = items.filter((i) => i.durum === 'devam_ediyor').length
    const tamam = items.filter((i) => i.durum === 'tamamlandi').length
    const bekleyen = items.filter((i) => i.durum === 'beklemede').length
    return { total, devam, tamam, bekleyen }
  }, [items])

  // Filtrelenmiş liste
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchTab = activeTab === 'all' || item.durum === activeTab
      const matchSearch =
        !searchQuery ||
        item.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kod.toLowerCase().includes(searchQuery.toLowerCase())
      return matchTab && matchSearch
    })
  }, [items, activeTab, searchQuery])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 400)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* ── ÜST BAŞLIK VE AKSİYON ŞERİDİ ── */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-1">
            <span>Süreçler</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Genel Yönetim</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Sekmeli Süreç Yönetim Paneli</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            İş akışı ve operasyonel verilerinizi sekmelere göre gruplayarak yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ekle</span>
          </button>
        </div>
      </div>

      {/* ── KPI / SAYAÇ METRİK BLOKLARI ── */}
      <div className="p-6 pb-2 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Toplam Kayıt</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Devam Edenler</span>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.devam}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Tamamlanan</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.tamam}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Bekleyenler</span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.bekleyen}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── SEKME SEÇİCİ VE ARAMA BARI ── */}
      <div className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-850 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tümü ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devam_ediyor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'devam_ediyor'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Devam Edenler ({stats.devam})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tamamlandi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tamamlandi'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tamamlananlar ({stats.tamam})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('beklemede')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'beklemede'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Bekleyenler ({stats.bekleyen})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kayıtlarda ara..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* ── İÇERİK ALANI ── */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Bu Görünümde Veri Bulunmuyor
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              Seçili sekmede listelenecek bir kayıt bulunmamaktadır. Yeni bir kayıt ekleyerek başlayabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                    {item.kod}
                  </span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {item.baslik}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{item.tarih}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.durum}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
export default TabbedScreenTemplate
