import React from 'react'
import { FolderHeart, Trash2 } from 'lucide-react'

export interface DocumentPreset {
  id: string
  name: string
  docs: string[]
}

interface PresetSelectorProps {
  selectedPresetId: string
  setSelectedPresetId: (id: string) => void
  presets: DocumentPreset[]
  onAddPreset: () => void
  onDeletePreset: (id: string) => void
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  setSelectedPresetId,
  presets,
  onAddPreset,
  onDeletePreset
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FolderHeart className="w-4 h-4 text-blue-500" />
          Belge Paketleri
        </h3>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Belgeleri gruplandırarak özel paketler oluşturabilirsiniz. Seçtiğiniz pakete sağ taraftan
        yıldız ekleyip çıkararak düzenleyebilirsiniz.
      </p>

      <div className="space-y-2">
        <select
          value={selectedPresetId}
          onChange={(e) => setSelectedPresetId(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              📦 {p.name} ({p.docs.length} Belge)
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={onAddPreset}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 justify-center shadow-sm cursor-pointer"
          >
            + Paket Ekle
          </button>
          {selectedPresetId && (
            <button
              onClick={() => onDeletePreset(selectedPresetId)}
              className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-rose-200 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/30 text-rose-500 flex items-center justify-center cursor-pointer"
              title="Paketi Sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
