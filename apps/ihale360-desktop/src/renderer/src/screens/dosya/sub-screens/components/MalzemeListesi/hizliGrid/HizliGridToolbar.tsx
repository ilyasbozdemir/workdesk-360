import React from 'react'
import { ArrowDownToLine, Clipboard, Info, Plus, Trash2, Zap } from 'lucide-react'
import { PRESET_PACKAGES, PresetPackage } from './presetPackages.data'

interface HizliGridToolbarProps {
  handleApplyPreset: (p: PresetPackage) => void
  handlePasteFromClipboard: () => void
  handleAddEmptyRow: (count: number) => void
  handleClearAll: () => void
}

export function HizliGridToolbar({
  handleApplyPreset,
  handlePasteFromClipboard,
  handleAddEmptyRow,
  handleClearAll
}: HizliGridToolbarProps): React.JSX.Element {
  return (
    <>
      {/* TOP TOOLBAR: Hızlı Paketler, Excel Yapıştır & İpuçları */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        {/* Sol: Hazır Paket Şablonları */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Hızlı Şablon:
          </span>
          {PRESET_PACKAGES.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-[11px] font-semibold px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer"
              title={`${p.name} (${p.items.length} Kalem)`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Sağ: Tablo Araçları */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Excel veya tablodan kopyalanan satırları tek tıkla aktarır"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Excel / Panodan Yapıştır
          </button>

          <button
            type="button"
            onClick={() => handleAddEmptyRow(5)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            +5 Satır
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
            title="Tüm Satırları Temizle"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXCEL GRID İPUCU BARI */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/30 rounded-xl text-[11px] text-blue-800 dark:text-blue-300">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Excel Sürükle-Doldur:</strong> Hücrenin sağ altındaki mavi kutucuğu aşağı
            sürükleyerek veya çift tıklayarak değeri alt satırlara çoğaltabilirsiniz. Sütun
            başlıklarındaki (
            <ArrowDownToLine className="w-3 h-3 inline text-blue-600 mx-0.5" />) butonuyla ilk
            satırı tüm sütuna kopyalayabilirsiniz. (Kısayol: <strong>Ctrl + D</strong>)
          </span>
        </div>
      </div>
    </>
  )
}
