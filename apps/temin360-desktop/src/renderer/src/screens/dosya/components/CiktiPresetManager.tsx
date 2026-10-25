import React from 'react'
import { FolderHeart, Trash2, Save } from 'lucide-react'

interface DocumentPreset {
  id: string
  name: string
  docs: string[]
}

interface CiktiPresetManagerProps {
  presets: DocumentPreset[]
  activePresetId: string
  selectedIdsSize: number
  onSelectPreset: (id: string) => void
  onSavePreset: () => void
  onDeletePreset: (id: string, e: React.MouseEvent) => void
}

export function CiktiPresetManager({
  presets,
  activePresetId,
  selectedIdsSize,
  onSelectPreset,
  onSavePreset,
  onDeletePreset
}: CiktiPresetManagerProps): React.JSX.Element {
  return (
    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FolderHeart className="w-4 h-4 text-blue-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
            Belge Paketi Taslağı
          </span>
          <div className="flex items-center gap-1.5">
            <select
              value={activePresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Paket Seçin --</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.docs.length} Belge)
                </option>
              ))}
            </select>
            {activePresetId && (
              <button
                onClick={(e) => onDeletePreset(activePresetId, e)}
                className="p-1 rounded-lg hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-955/30 text-slate-400 transition-colors cursor-pointer"
                title="Paketi Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-end shrink-0 sm:mt-4">
        <button
          type="button"
          onClick={onSavePreset}
          disabled={selectedIdsSize === 0}
          className="w-full sm:w-auto py-1 px-2.5 rounded-lg text-xs font-bold transition-all border bg-white dark:bg-slate-850 text-blue-600 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 justify-center shadow-sm cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          Paket Olarak Kaydet
        </button>
      </div>
    </div>
  )
}
