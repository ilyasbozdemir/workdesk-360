import React from 'react'
import { Calculator, Type, TrendingUp, Percent, Coins, Clock } from 'lucide-react'
import { ActiveTool } from '../types'

interface PlaygroundHeaderProps {
  activeTool: ActiveTool
  onSelectTool: (tool: ActiveTool) => void
}

export function PlaygroundHeader({
  activeTool,
  onSelectTool
}: PlaygroundHeaderProps): React.JSX.Element {
  return (
    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                İhale &amp; Harcama Hesaplama Araçları (Playground)
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                  UTILS HUB
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sayıyı metne çevirme, Yİ-ÜFE fiyat farkı eskalasyonu, KDV tevkifatı, damga vergisi
                ve gecikme cezası hesaplayıcıları.
              </p>
            </div>
          </div>
        </div>

        {/* Hızlı Butonlar / Tab Listesi */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectTool('sayi_yazi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'sayi_yazi'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            Sayıyı Yazıya Çevirici
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('yi_ufe')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'yi_ufe'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Yİ-ÜFE Fiyat Farkı
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('kdv_tevkifat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'kdv_tevkifat'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Percent className="w-4 h-4" />
            KDV &amp; Tevkifat
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('damga_vergisi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'damga_vergisi'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            Damga &amp; Karar Pulu
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('gecikme_cezasi')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'gecikme_cezasi'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Gecikme Cezası
          </button>
        </div>
      </div>
    </div>
  )
}
