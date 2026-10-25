import React from 'react'
import { Calculator, CheckSquare, DownloadCloud, Moon, Store, Sun } from 'lucide-react'
import { SyncPopover } from './SyncPopover'
import { NotificationPopover } from './NotificationPopover'
import { APP_ROUTES } from '../../../constants/routeConstants'

interface HeaderActionsProps {
  theme: string
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  navigate: (opts: { to: string }) => void
  updateStatus: { status: string; version?: string } | null
  setShowUpdateModal: (show: boolean) => void
}

export const HeaderActions = React.memo(function HeaderActions({
  theme,
  setTheme,
  navigate,
  updateStatus,
  setShowUpdateModal
}: HeaderActionsProps): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Hızlı Servis & Araç Kümesi (Mağaza & Hesap) */}
      <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
        <button
          onClick={(): void => navigate({ to: APP_ROUTES.MODUL_MAGAZASI })}
          className="h-6 px-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-650 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-white dark:hover:bg-slate-700/90 rounded-md transition-all cursor-pointer"
          title="Modül & Eklenti Mağazası"
        >
          <Store className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
          <span className="hidden xl:inline">Mağaza</span>
        </button>

        <div className="w-px h-3 bg-slate-200/90 dark:bg-slate-700 shrink-0 mx-0.5" />

        <button
          onClick={(): void => navigate({ to: APP_ROUTES.HESAPLAMA_ARACLARI })}
          className="h-6 px-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-650 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700/90 rounded-md transition-all cursor-pointer"
          title="Hesap & Yüzde Araçları Süiti (KDV, İndirim, Kâr Marjı, Tarih Farkı)"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
          <span className="hidden xl:inline">Hesap</span>
        </button>
      </div>

      {/* İnce Ayırıcı */}
      <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

      {/* Hızlı Araçlar & Göstergeler */}
      <div className="flex items-center gap-1">
        {/* Notlar & Yapılacaklar (To-Do) */}
        <button
          onClick={(): void => navigate({ to: APP_ROUTES.NOTLAR })}
          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Notlar & Yapılacaklar Listesi (To-Do)"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        {/* Tema Değiştir */}
        <button
          onClick={(): void => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Tema Değiştir"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Güncelleme Durumu */}
        {updateStatus &&
          (updateStatus.status === 'available' || updateStatus.status === 'downloaded') && (
            <button
              type="button"
              onClick={(): void => setShowUpdateModal(true)}
              className={`h-7 relative flex items-center gap-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all border shadow-2xs cursor-pointer ${
                updateStatus.status === 'downloaded'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
              }`}
              title={
                updateStatus.status === 'downloaded'
                  ? `Yeni sürüm hazır: ${updateStatus.version} (Kurmak için tıkla)`
                  : `Yeni sürüm indiriliyor: ${updateStatus.version}...`
              }
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {updateStatus.status === 'downloaded' ? `Güncelleme` : `İndiriliyor...`}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  updateStatus.status === 'downloaded'
                    ? 'bg-emerald-500 animate-ping'
                    : 'bg-blue-500 animate-pulse'
                }`}
              />
            </button>
          )}

        {/* Senkronizasyon & Bulut Popover */}
        <SyncPopover />

        {/* Bildirim Popover */}
        <NotificationPopover />
      </div>
    </div>
  )
})
