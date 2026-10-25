import React from 'react'
import { cn } from '../../../utils/cn'
import { FileText, Grid, List, Sparkles, Plus, ClipboardList, FileDown } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../../constants/routeConstants'

export function DosyalarPageHeader({
  viewMode,
  setViewMode,
  onOpenAI
}: {
  viewMode: 'grid' | 'list' | 'table'
  setViewMode: (mode: 'grid' | 'list' | 'table') => void
  onOpenAI: () => void
  onOpenWizard?: () => void
}): React.JSX.Element {
  const navigate = useNavigate()

  const modes = [
    { id: 'grid', label: 'Kart', icon: Grid },
    { id: 'list', label: 'Liste', icon: List },
    { id: 'table', label: 'Tablo', icon: FileText }
  ] as const

  return (
    <div className="flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-855 dark:text-white flex items-center gap-2">
          <FileText className="text-blue-600" size={24} />
          Doğrudan Temin Dosyaları
        </h1>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
          Dosya süreçlerinizi başlatın, tekliflerinizi ve yaklaşık maliyetlerinizi takip edin.
        </p>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
        {/* VIEW SWITCHER */}
        <div className="flex bg-slate-100/80 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-850 p-1 rounded-2xl h-10 items-center relative select-none">
          {/* Active indicator sliding background */}
          <div
            className="absolute h-8 rounded-xl bg-white dark:bg-slate-900 shadow-3xs border border-slate-200/20 dark:border-slate-800/20 transition-all duration-300 ease-out"
            style={{
              width: '74px',
              transform: `translateX(${
                viewMode === 'grid' ? '0px' : viewMode === 'list' ? '78px' : '156px'
              })`
            }}
          />

          {modes.map((m) => {
            const Icon = m.icon
            const isActive = viewMode === m.id
            return (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={cn(
                  'relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 w-[74px] h-8 rounded-xl text-xs font-bold transition-all duration-300 border-0 bg-transparent cursor-pointer',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
                )}
                title={m.label}
              >
                <Icon size={14} />
                <span className="text-[10px]">{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* GENEL YAPAY ZEKA BUTONU */}
        <button
          onClick={onOpenAI}
          className="px-4 py-2 bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer shrink-0 h-10 border-0"
          title="Mevzuat ve Genel Süreçler Hakkında AI'a Danışın"
        >
          <Sparkles size={16} />
          <span className="hidden md:inline">Yapay Zeka Asistanı</span>
          <span className="md:hidden">AI</span>
        </button>

        {/* EXCEL HIZLI EKLEME */}
        <button
          onClick={() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            navigate({ to: APP_ROUTES.HIZLI_DOSYA_EKLE as any })
          }
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0 h-10"
          title="Excel benzeri tablo ile toplu dosya ekleme veya güncelleme"
        >
          <ClipboardList size={16} />
          <span>Toplu Hızlı Ekle</span>
        </button>

        {/* HARİCİ JSON AKTAR */}
        <button
          onClick={() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            navigate({ to: APP_ROUTES.HARICI_DOSYA_AKTAR as any })
          }
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer shrink-0 h-10"
          title="Harici doğrudan temin JSON dosyasını içeri aktar ve mevcut dosyalarla eşleştir"
        >
          <FileDown size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span>JSON İçe Aktar</span>
        </button>

        {/* YENİ EKLE */}
        <button
          onClick={() => navigate({ to: APP_ROUTES.YENI_DOSYA })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer shrink-0 h-10 border-0"
        >
          <Plus size={16} />
          Yeni Dosya
        </button>
      </div>
    </div>
  )
}
