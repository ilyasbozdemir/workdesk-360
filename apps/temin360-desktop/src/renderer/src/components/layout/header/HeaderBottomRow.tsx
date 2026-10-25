import React from 'react'
import { Link } from '@tanstack/react-router'
import { ClipboardList, Layers, Printer } from 'lucide-react'
import { TeminSelector } from '../TeminSelector'

interface HeaderBottomRowProps {
  isDt?: boolean
  procurementMode?: 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886'
  handleModeChange?: (mode: 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886') => void
  activeDosyaId?: number | string | null
}

export const HeaderBottomRow = React.memo(function HeaderBottomRow({
  activeDosyaId
}: HeaderBottomRowProps): React.JSX.Element {
  return (
    <div
      className="min-h-9 py-1 flex items-center justify-between gap-1 sm:gap-2.5 bg-slate-100/50 dark:bg-slate-950/20 border-t border-slate-200/30 dark:border-slate-800/30 select-none px-2 sm:px-3 relative z-20 w-full"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Sol: Doğrudan Temin Rozeti (Temin 360 - Sabit & Şık) */}
      <div className="shrink-0 flex items-center">
        <div
          title="Temin 360 - Doğrudan Temin Kapsamı (4734 Sayılı Kanun Md. 22)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40 shadow-2xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="hidden xl:inline font-semibold">Doğrudan Temin (Md. 22)</span>
          <span className="xl:hidden font-semibold">DT (Md. 22)</span>
        </div>
      </div>

      {/* Orta: Temin Seçici */}
      <div className="flex-1 min-w-0 flex justify-center px-1 sm:px-2">
        <TeminSelector />
      </div>

      {/* Sağ: Süreç & Çıktı Butonları (Temin 360 - Doğrudan Temin Odaklı) */}
      {activeDosyaId ? (
        <div className="flex items-center gap-1 shrink-0 justify-end">
          <Link
            to="/takip"
            title="Doğrudan Temin Süreç Takibi (Md. 22)"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-all shadow-2xs hover:shadow-xs border text-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border-blue-200/50 dark:border-blue-900/30"
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">Doğrudan Temin Takip</span>
            <span className="hidden xl:inline 2xl:hidden">DT Takip</span>
            <span className="hidden sm:inline xl:hidden">Takip</span>
          </Link>
          <Link
            to="/surec-akisi"
            title="Doğrudan Temin Süreç Akış Haritası"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50/80 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 border border-purple-200/50 dark:border-purple-900/30 rounded-md transition-colors shadow-2xs hover:shadow-xs"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">Süreç Akışı</span>
            <span className="hidden xl:inline 2xl:hidden">Akış</span>
          </Link>
          <Link
            to="/cikti-merkezi"
            title="Çıktı Merkezi & Yazdırma"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-100/50 dark:border-emerald-900/30 rounded-md transition-colors shadow-2xs hover:shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">Çıktı Merkezi</span>
            <span className="hidden xl:inline 2xl:hidden">Çıktı</span>
          </Link>
        </div>
      ) : null}
    </div>
  )
})
