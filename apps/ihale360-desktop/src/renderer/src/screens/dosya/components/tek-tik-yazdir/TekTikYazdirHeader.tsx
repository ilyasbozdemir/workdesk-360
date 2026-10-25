import React from 'react'
import { Printer, Settings2, X } from 'lucide-react'
import { CURRENT_APP_VERSION } from '../../../../store/printQueueStore'

interface TekTikYazdirHeaderProps {
  activeDosya?: Record<string, unknown> | null
  showSettings: boolean
  setShowSettings: (val: boolean) => void
  onClose: () => void
}

export const TekTikYazdirHeader: React.FC<TekTikYazdirHeaderProps> = ({
  activeDosya,
  showSettings,
  setShowSettings,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <Printer size={22} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-white">
              Tek Tıkla Yazdırma & Çıktı Önizleme Merkezi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              {CURRENT_APP_VERSION}
            </span>
            {Boolean(activeDosya?.dosya_no) && (
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
                Dosya No: {String(activeDosya?.dosya_no)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Resmi evraklarınızı canlı sayfa düzeninde önizleyin, yazdırma ayarlarını yapılandırın ve
            tek seferde yazdırın.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            showSettings
              ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings2 size={14} />
          Yazdırma Ayarları
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
