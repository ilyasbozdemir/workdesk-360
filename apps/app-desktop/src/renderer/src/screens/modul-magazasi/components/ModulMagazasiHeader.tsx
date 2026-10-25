import React from 'react'
import {
  Archive,
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileCheck2,
  Layers,
  Puzzle,
  Store
} from 'lucide-react'
import type { ModulKategoriFiltresi } from '../modulMagazasi.types'

interface ModulMagazasiHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeKategori: ModulKategoriFiltresi
  onSelectKategori: (kategori: ModulKategoriFiltresi) => void
  stats: {
    total: number
    installed: number
    trashed?: number
    available: number
    totalTemplates: number
  }
}

export const ModulMagazasiHeader: React.FC<ModulMagazasiHeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeKategori,
  onSelectKategori,
  stats
}) => {
  const KATEGORI_SEKMELERI: {
    id: ModulKategoriFiltresi
    label: string
    icon: React.ReactNode
    badge?: number
  }[] = [
    {
      id: 'tum',
      label: 'Tüm Paketler',
      icon: <Layers className="w-3.5 h-3.5" />
    },
    {
      id: 'alim_ihale',
      label: 'Doğrudan Temin & İhale',
      icon: <FileCheck2 className="w-3.5 h-3.5" />
    },
    {
      id: 'satis_kiralama',
      label: 'Satış & Kiralama (2886)',
      icon: <Store className="w-3.5 h-3.5" />
    },
    {
      id: 'finans_hesap',
      label: 'Finans & Hesaplama',
      icon: <Calculator className="w-3.5 h-3.5" />
    },
    {
      id: 'entegrasyon',
      label: 'EBYS, Personel & Takip',
      icon: <Puzzle className="w-3.5 h-3.5" />
    },
    {
      id: 'kurulu',
      label: 'Kurulu Paketler',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    ...(stats.trashed && stats.trashed > 0
      ? [
          {
            id: 'cop_kutusu' as ModulKategoriFiltresi,
            label: 'Çöp Kutusu',
            icon: <Archive className="w-3.5 h-3.5 text-amber-500" />,
            badge: stats.trashed
          }
        ]
      : [])
  ]

  return (
    <div className="space-y-6">
      {/* Üst Breadcrumb & Modül Mağazası Başlığı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">workdesk-360</span>
            <span>/</span>
            <span>Modül Mağazası</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Modül Mağazası
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kamu ihale, doğrudan temin, personel, EBYS ve süreç paketleri mağazası
              </p>
            </div>
          </div>
        </div>

        {/* İstatistik Özet Rozetleri */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {stats.installed}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Kurulu</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <div className="text-lg font-black text-sky-600 dark:text-sky-400">{stats.total}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Katalog</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalTemplates}+
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Şablon</div>
          </div>
        </div>
      </div>

      {/* Büyük Oval Arama Çubuğu (Görsel 1 Tasarımı: Ara: nöbet, kefalet, dilekçe, tutanak...) */}
      <div className="relative max-w-2xl w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Ara: doğrudan temin, lüzum kağıdı, onay belgesi, tutanak, tif, hakediş..."
          className="w-full pl-6 pr-24 py-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-sm shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kategori Sekmeleri */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {KATEGORI_SEKMELERI.map((sekme) => {
          const isActive = activeKategori === sekme.id
          return (
            <button
              key={sekme.id}
              onClick={() => onSelectKategori(sekme.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800'
              }`}
            >
              {sekme.icon}
              <span>{sekme.label}</span>
              {sekme.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold ml-0.5">
                  {sekme.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
