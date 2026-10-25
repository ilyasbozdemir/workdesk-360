import React from 'react'
import { Settings2, Lock } from 'lucide-react'
import { CURRENT_APP_VERSION, PrintSettings } from '../../../../store/printQueueStore'

interface TekTikYazdirSettingsPanelProps {
  printSettings: PrintSettings
  setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettings>>
  autoLockOnPrint: boolean
  setAutoLockOnPrint: (val: boolean) => void
}

export const TekTikYazdirSettingsPanel: React.FC<TekTikYazdirSettingsPanelProps> = ({
  printSettings,
  setPrintSettings,
  autoLockOnPrint,
  setAutoLockOnPrint
}) => {
  return (
    <div className="w-72 border-l border-slate-800 bg-slate-900/90 p-5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Settings2 size={13} className="text-indigo-400" />
          Yazdırma Tercihleri
        </h3>

        <div className="space-y-4 text-xs">
          {/* Page Size */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Kağıt Boyutu</label>
            <div className="grid grid-cols-2 gap-2">
              {(['A4', 'A3'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setPrintSettings((prev) => ({ ...prev, pageSize: size }))}
                  className={`py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                    printSettings.pageSize === size
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Sayfa Yönü</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'portrait', label: 'Dikey' },
                { key: 'landscape', label: 'Yatay' }
              ].map((ori) => (
                <button
                  key={ori.key}
                  onClick={() =>
                    setPrintSettings((prev) => ({
                      ...prev,
                      orientation: ori.key as 'portrait' | 'landscape'
                    }))
                  }
                  className={`py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                    printSettings.orientation === ori.key
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {ori.label}
                </button>
              ))}
            </div>
          </div>

          {/* Copies */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Kopya Sayısı</label>
            <input
              type="number"
              min={1}
              max={20}
              value={printSettings.copies || 1}
              onChange={(e) =>
                setPrintSettings((prev) => ({
                  ...prev,
                  copies: Math.max(1, parseInt(e.target.value) || 1)
                }))
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Print Background */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={printSettings.printBackground ?? true}
              onChange={(e) =>
                setPrintSettings((prev) => ({
                  ...prev,
                  printBackground: e.target.checked
                }))
              }
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-slate-300 font-medium">Arka plan ve renkleri dahil et</span>
          </label>
        </div>
      </div>

      {/* Document Locking Policy Box */}
      <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <Lock size={14} className="text-indigo-400" />
          Sürüm Kilitleme
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          Yazdırılan resmi belgeler otomatik olarak{' '}
          <strong className="text-indigo-300">{CURRENT_APP_VERSION}</strong> sürüm damgası ile
          kilitlenir.
        </p>
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={autoLockOnPrint}
            onChange={(e) => setAutoLockOnPrint(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span className="text-slate-200 font-medium text-[11px]">Yazdırınca kilitle</span>
        </label>
      </div>
    </div>
  )
}
