import React from 'react'
import { FolderOpen, Minus, Moon, Square, Sun, Wifi, X } from 'lucide-react'

interface LauncherTitleBarProps {
  theme: string
  onToggleTheme: () => void
  onOpenNetworkModal: () => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export function LauncherTitleBar({
  theme,
  onToggleTheme,
  onOpenNetworkModal,
  onMinimize,
  onMaximize,
  onClose
}: LauncherTitleBarProps): React.JSX.Element {
  return (
    <div
      className="absolute top-0 left-0 w-full h-12 flex justify-between items-center px-4 bg-transparent z-50 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 text-xs font-semibold">
        <FolderOpen className="w-3.5 h-3.5" />
        <span>İHALE 360 Başlatıcı</span>
      </div>

      <div
        className="flex items-center space-x-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={onOpenNetworkModal}
          className="p-1.5 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          title="Ağ Paylaşımı"
        >
          <Wifi className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-all rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 mr-2"
          title="Tema Değiştir"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={onMinimize}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-all rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          title="Simge Durumuna Küçült"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onMaximize}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-all rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          title="Ekranı Kapla"
        >
          <Square className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-all"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
