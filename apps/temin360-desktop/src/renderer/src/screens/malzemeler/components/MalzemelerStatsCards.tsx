import React from 'react'
import { FileText, HardHat, Tag } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { Kalem } from '../malzemeler.hooks'

interface MalzemelerStatsCardsProps {
  kalemList: Kalem[]
  activeTab: string
  onSelectTab: (tab: string) => void
}

export function MalzemelerStatsCards({
  kalemList,
  activeTab,
  onSelectTab
}: MalzemelerStatsCardsProps): React.JSX.Element {
  const malCount = kalemList.filter((m) => m.tipi === 'Mal').length
  const hizmetCount = kalemList.filter((m) => m.tipi?.startsWith('Hizmet')).length
  const yapimCount = kalemList.filter((m) => m.tipi === 'Yapım').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
      <button
        type="button"
        onClick={() => onSelectTab('Mal')}
        className={cn(
          'p-5 rounded-2xl bg-white dark:bg-slate-900 border text-left shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-blue-400 cursor-pointer',
          activeTab === 'Mal'
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
            : 'border-slate-200 dark:border-slate-800'
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-450 flex items-center justify-center shrink-0">
          <Tag className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Mal Alımı (Malzeme)</span>
            <span className="text-blue-600 text-[10px] font-medium lowercase">Taşınır Kodlu</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {malCount} Kalem
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('Hizmet')}
        className={cn(
          'p-5 rounded-2xl bg-white dark:bg-slate-900 border text-left shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-emerald-400 cursor-pointer',
          activeTab === 'Hizmet'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
            : 'border-slate-200 dark:border-slate-800'
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Hizmet Alımı</span>
            <span className="text-emerald-600 text-[10px] font-medium lowercase">OKAS Kodlu</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {hizmetCount} Kalem
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('Yapım')}
        className={cn(
          'p-5 rounded-2xl bg-white dark:bg-slate-900 border text-left shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-amber-400 cursor-pointer',
          activeTab === 'Yapım'
            ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
            : 'border-slate-200 dark:border-slate-800'
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450 flex items-center justify-center shrink-0">
          <HardHat className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Yapım İşi</span>
            <span className="text-amber-600 text-[10px] font-medium lowercase">Poz / İmalat</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {yapimCount} Kalem
          </div>
        </div>
      </button>
    </div>
  )
}
