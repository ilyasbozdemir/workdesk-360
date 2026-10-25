import React from 'react'
import { BookOpen, PlusCircle, Zap } from 'lucide-react'
import { cn } from '@renderer/utils/cn'

interface MalzemeEkleTabsProps {
  activeTab: 'library' | 'batch' | 'new'
  setActiveTab: (tab: 'library' | 'batch' | 'new') => void
  isYapim: boolean
  isHizmet: boolean
  libraryCount: number
  onSwitchToNewTab: (defaultName?: string) => void
}

export const MalzemeEkleTabs: React.FC<MalzemeEkleTabsProps> = ({
  activeTab,
  setActiveTab,
  isYapim,
  isHizmet,
  libraryCount,
  onSwitchToNewTab
}) => {
  return (
    <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5 border border-slate-200/60 dark:border-slate-700/60">
      <button
        type="button"
        onClick={() => setActiveTab('library')}
        className={cn(
          'flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
          activeTab === 'library'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        )}
      >
        <BookOpen className="w-3.5 h-3.5" />
        {isYapim
          ? `Poz Kütüphanesi (${libraryCount})`
          : isHizmet
            ? `Hizmet Havuzu (${libraryCount})`
            : `Kütüphaneden Seç (${libraryCount})`}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('batch')}
        className={cn(
          'flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
          activeTab === 'batch'
            ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        )}
      >
        <Zap className="w-3.5 h-3.5 text-amber-500" />⚡ Hızlı / Excel Toplu Ekle
      </button>

      <button
        type="button"
        onClick={() => onSwitchToNewTab()}
        className={cn(
          'flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
          activeTab === 'new'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        )}
      >
        <PlusCircle className="w-3.5 h-3.5" />
        {isYapim ? 'Tekil Poz Tanımla' : isHizmet ? 'Tekil Hizmet Tanımla' : 'Tekil Kalem Oluştur'}
      </button>
    </div>
  )
}
