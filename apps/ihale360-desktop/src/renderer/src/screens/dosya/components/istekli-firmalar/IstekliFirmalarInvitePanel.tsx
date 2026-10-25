import React from 'react'
import { Search, UserPlus } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { TeminFirmaItem } from './useIstekliFirmalarLogic'

interface IstekliFirmalarInvitePanelProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  unassociatedFirms: TeminFirmaItem[]
  onAddFirm: (firma: TeminFirmaItem) => void
}

export function IstekliFirmalarInvitePanel({
  searchQuery,
  onSearchQueryChange,
  unassociatedFirms,
  onAddFirm
}: IstekliFirmalarInvitePanelProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 h-fit">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-blue-600" />
        Tedarikçi Davet Et
      </h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Firma ünvanı ile ara..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
        />
      </div>
      <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/50 pr-1">
        {unassociatedFirms.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400 italic">
            Eklenecek yeni firma bulunamadı.
          </div>
        ) : (
          unassociatedFirms.map((firma) => (
            <div key={firma.id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="block text-xs font-bold text-slate-800 dark:text-slate-250 truncate"
                    title={firma.unvan}
                  >
                    {firma.unvan}
                  </span>
                  {firma.kara_liste === 1 && (
                    <span className="text-[8px] font-black text-red-600 bg-red-100 dark:bg-red-950 px-1 py-0.2 rounded shrink-0">
                      🚫 KARA LİSTE
                    </span>
                  )}
                </div>
                <span className="block text-[9px] text-slate-400">
                  Vergi No: {firma.vergi_no || 'Belirtilmemiş'}{' '}
                  {firma.deneyim_skoru ? `| ⭐ ${firma.deneyim_skoru}/5` : ''}
                </span>
              </div>
              <button
                onClick={() => onAddFirm(firma)}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer transition-colors shrink-0',
                  firma.kara_liste === 1
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-955/50 dark:text-red-300'
                    : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                )}
              >
                Ekle
              </button>
            </div>
          ))
        )}
      </div>
      <p className="text-[10px] text-slate-400">
        Eksik firmaları sol menüdeki <strong>İstekli Firma Yönetimi</strong> panelinden sisteme
        kaydedebilirsiniz.
      </p>
    </div>
  )
}
