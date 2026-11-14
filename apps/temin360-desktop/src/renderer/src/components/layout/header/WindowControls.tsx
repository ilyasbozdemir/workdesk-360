import React from 'react'
import { Minus, Square, X } from 'lucide-react'
import { useWindowControls } from '../../../hooks/useWindowControls'

export const WindowControls = React.memo(function WindowControls(): React.JSX.Element {
  const { minimize, maximize, close } = useWindowControls()

  return (
    <div
      className="flex items-center mr-0 h-9 shrink-0"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        onClick={minimize}
        aria-label="Simge Durumuna Küçült"
        className="w-9 h-9 sm:w-10 sm:h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Simge Durumuna Küçült"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={maximize}
        aria-label="Ekranı Kapla / Geri Getir"
        className="w-9 h-9 sm:w-10 sm:h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Ekranı Kapla / Geri Getir"
      >
        <Square className="w-3 h-3" />
      </button>

      <button
        onClick={close}
        aria-label="Pencereyi Kapat"
        className="w-9 h-9 sm:w-10 sm:h-9 flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
        title="Kapat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
})
