import React from 'react'
import { Star } from 'lucide-react'
import {
  getStatusBadgeLightClass,
  normalizeForMatch,
  parseStatusAndName,
  STAGES
} from '../../utils/statusUtils'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'

interface PresetEditorProps {
  presetName: string
  activeStage: string
  setActiveStage: (stage: string) => void
  groupedSablonlar: Record<string, Sablon[]>
  starredList: string[]
  routeMap: Record<string, string>
  toggleStar: (name: string) => void
  onAddAllStageDocs: () => void
  onRemoveAllStageDocs: () => void
  onCloseEdit: () => void
}

export const PresetEditor: React.FC<PresetEditorProps> = ({
  presetName,
  activeStage,
  setActiveStage,
  groupedSablonlar,
  starredList,
  routeMap,
  toggleStar,
  onAddAllStageDocs,
  onRemoveAllStageDocs,
  onCloseEdit
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            ✍️ Belge Seçimi: {presetName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aşağıdaki aşamalardan pakete eklenecek belgeleri seçin. Checkbox&apos;ları işaretlemek
            belgenin anında eklenmesini/çıkarılmasını sağlar.
          </p>
        </div>
        <button
          onClick={onCloseEdit}
          className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          ✓ Tamamlandı
        </button>
      </div>

      {/* Aşama Seçici (Tabs) */}
      <div className="flex flex-wrap gap-2 pb-4">
        {STAGES.map((stage) => {
          const isActive = activeStage === stage.key
          const count = (groupedSablonlar[stage.key] || []).length
          return (
            <button
              key={stage.key}
              onClick={() => setActiveStage(stage.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {stage.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Belge Listesi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            📋 {activeStage} ({(groupedSablonlar[activeStage] || []).length} belge)
          </h3>
        </div>

        <div className="space-y-2">
          {(groupedSablonlar[activeStage] || []).map((sablon) => {
            const { status, cleanName } = parseStatusAndName(sablon.ad, sablon.aciklama)
            const isStarred = starredList.some(
              (d) => d === sablon.dosya_adi || normalizeForMatch(d) === normalizeForMatch(cleanName)
            )
            return (
              <div
                key={sablon.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isStarred
                    ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-300 dark:border-blue-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <input
                    type="checkbox"
                    checked={isStarred}
                    onChange={() => toggleStar(sablon.dosya_adi)}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 cursor-pointer"
                  />

                  <div className="flex items-center gap-2 truncate text-xs font-medium text-slate-400 dark:text-slate-550 cursor-default select-none">
                    <span>{cleanName}</span>
                    {status && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px]  text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wide shrink-0 ${getStatusBadgeLightClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    )}
                  </div>

                  {/*
                      {route ? (
                    <Link
                      to={route}
                      className="flex items-center gap-2 truncate text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      <span>{cleanName}</span>
                      {status && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 ${getStatusBadgeLightClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 truncate text-xs font-medium text-slate-400 dark:text-slate-550 cursor-default select-none">
                      <span>{cleanName}</span>
                      {status && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 ${getStatusBadgeLightClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      )}
                    </div>
                  )}
                  */}
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggleStar(sablon.dosya_adi)
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded shrink-0 cursor-pointer"
                    title={isStarred ? 'Kısayoldan Kaldır' : 'Kısayol Ekle (Yıldızla)'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isStarred
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-400 hover:text-amber-500'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
          {(groupedSablonlar[activeStage] || []).length === 0 && (
            <span className="text-xs italic text-slate-400 block py-1">
              Bu aşamada bağlı şablon bulunamadı.
            </span>
          )}
        </div>

        {/* Alt Aksiyon Paneli */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-955/40 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {starredList.length}
            </span>{' '}
            belge pakete dahil.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAddAllStageDocs}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Tümünü Seç
            </button>
            <button
              onClick={onRemoveAllStageDocs}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Tümünü Kaldır
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
