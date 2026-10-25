import React from 'react'
import { Archive, Boxes, Layers, FileText, Search } from 'lucide-react'
import { Input } from '../../../components/ui/Input'
import { Ambar } from '../ambar.hooks'

export type AmbarTabType = 'ambarlar' | 'stoklar' | 'hareketler' | 'tifler'

interface AmbarTabsHeaderProps {
  activeTab: AmbarTabType
  setActiveTab: (tab: AmbarTabType) => void
  ambarlar: Ambar[]
  stoklarCount: number
  hareketlerCount: number
  tiflerCount: number
  selectedAmbarFilter: number | ''
  setSelectedAmbarFilter: (val: number | '') => void
  searchTerm: string
  setSearchTerm: (val: string) => void
}

export const AmbarTabsHeader: React.FC<AmbarTabsHeaderProps> = ({
  activeTab,
  setActiveTab,
  ambarlar,
  stoklarCount,
  hareketlerCount,
  tiflerCount,
  selectedAmbarFilter,
  setSelectedAmbarFilter,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ambarlar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'ambarlar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Archive className="w-4 h-4" />
          Ambar Depoları ({ambarlar.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stoklar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stoklar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Stok Durum Cetveli ({stoklarCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hareketler')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'hareketler'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Stok Hareketleri &amp; Zimmet ({hareketlerCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tifler')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'tifler'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Taşınır İşlem Fişleri (TİF) ({tiflerCount})
        </button>
      </div>

      {/* SEARCH & WAREHOUSE FILTER */}
      <div className="flex items-center gap-2.5">
        {activeTab !== 'ambarlar' && (
          <select
            value={selectedAmbarFilter}
            onChange={(e) => setSelectedAmbarFilter(Number(e.target.value) || '')}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-9 max-w-[180px]"
          >
            <option value="">Tüm Depolar</option>
            {ambarlar.map((amb) => (
              <option key={amb.id} value={amb.id}>
                {amb.ambar_adi}
              </option>
            ))}
          </select>
        )}

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ara (Kalem, Fiş No, Personel)..."
            className="pl-8 text-xs h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>
    </div>
  )
}
