import React from 'react'
import { Search, AlertCircle, Copy, Check, Edit2, Trash2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { ButceKod } from '../butcekod.hooks'
import { ButceDuzeyRozeti, ButceTuruRozeti } from './ButceKodBadges'

export type TabType = 'all' | 'level4' | 'upper' | 'mal' | 'hizmet' | 'yapim' | 'danismanlik'

interface ButceKodTableProps {
  filteredList: ButceKod[]
  isLoading: boolean
  search: string
  onSearchChange: (val: string) => void
  selectedTab: TabType
  onSelectTab: (tab: TabType) => void
  stats: {
    total: number
    level4Count: number
  }
  copiedKod: string | null
  onCopy: (kod: string) => void
  onEdit: (item: ButceKod) => void
  onDelete: (item: ButceKod) => void
}

export const ButceKodTable: React.FC<ButceKodTableProps> = ({
  filteredList,
  isLoading,
  search,
  onSearchChange,
  selectedTab,
  onSelectTab,
  stats,
  copiedKod,
  onCopy,
  onEdit,
  onDelete
}) => {
  return (
    <div className="space-y-4">
      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all' as const, label: `Tümü (${stats.total})` },
            { key: 'level4' as const, label: `IV. Düzey (${stats.level4Count})` },
            { key: 'upper' as const, label: `I - III. Düzey` },
            { key: 'mal' as const, label: `📦 Mal Alımı` },
            { key: 'hizmet' as const, label: `🛠️ Hizmet Alımı` },
            { key: 'yapim' as const, label: `🏗️ Yapım İşi` },
            { key: 'danismanlik' as const, label: `📑 Danışmanlık` }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                selectedTab === tab.key
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-70">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tertip Kodu, Hesap Adı veya Açıklama ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Bütçe Kodu</th>
                <th className="py-3 px-4">Düzey</th>
                <th className="py-3 px-4">Hesap / Kalem Adı</th>
                <th className="py-3 px-4">Hesap Kodu</th>
                <th className="py-3 px-4">Bütçe Türü</th>
                <th className="py-3 px-4">Açıklama / Kapsam</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Bütçe kodları yükleniyor...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-sm">Eşleşen bütçe kodu bulunamadı.</p>
                      <p className="text-xs text-slate-400">
                        Arama kriterlerinizi değiştirebilir veya yeni bir bütçe kodu
                        ekleyebilirsiniz.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Bütçe Kodu */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 dark:text-amber-400">{item.kod}</span>
                        <button
                          type="button"
                          onClick={() => onCopy(item.kod)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                          title="Kodu Kopyala"
                        >
                          {copiedKod === item.kod ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Düzey */}
                    <td className="py-3 px-4">
                      <ButceDuzeyRozeti duzey={item.duzey} />
                    </td>

                    {/* Hesap / Kalem Adı */}
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {item.hesap_adi}
                    </td>

                    {/* Hesap Kodu */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {item.hesap_kodu || '-'}
                    </td>

                    {/* Bütçe Türü */}
                    <td className="py-3 px-4">
                      <ButceTuruRozeti tur={item.butce_turu} />
                    </td>

                    {/* Açıklama */}
                    <td
                      className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate"
                      title={item.aciklama || ''}
                    >
                      {item.aciklama || '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
