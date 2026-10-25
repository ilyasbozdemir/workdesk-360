import React from 'react'
import { Plus, Zap } from 'lucide-react'
import { ProcurementMode } from '../teminSelector.types'

interface TeminSelectorHeaderProps {
  procurementMode?: ProcurementMode
  setGlobalMode?: (mode: ProcurementMode) => void
  isDt?: boolean
  is2886?: boolean
  dtCount: number
  ihaleCount?: number
  ihale2886Count?: number
  handleCreateYeniDosya: (e: React.MouseEvent) => void
}

export const TeminSelectorHeader: React.FC<TeminSelectorHeaderProps> = ({
  dtCount,
  handleCreateYeniDosya
}) => {
  return (
    <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 mb-2.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs">
          <Zap className="w-3.5 h-3.5" />
          <span>Doğrudan Temin Dosyaları (KİK Md. 22)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-blue-700 text-white font-bold">
            {dtCount}
          </span>
        </div>
      </div>

      <button
        onClick={handleCreateYeniDosya}
        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/40"
        title="Yeni Doğrudan Temin Dosyası Oluştur"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Yeni Doğrudan Temin</span>
      </button>
    </div>
  )
}
