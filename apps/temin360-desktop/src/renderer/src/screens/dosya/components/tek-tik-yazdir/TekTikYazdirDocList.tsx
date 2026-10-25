import React from 'react'
import { CheckSquare, Square, Lock, Unlock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'
import { usePrintQueueStore, CURRENT_APP_VERSION } from '../../../../store/printQueueStore'

interface TekTikYazdirDocListProps {
  sablons: Sablon[]
  filteredSablons: Sablon[]
  selectedIds: Set<number>
  searchQuery: string
  setSearchQuery: (val: string) => void
  currentPreviewSablon: Sablon | null
  activeDosyaId: number | null
  getMissingRequirement?: (sablon: Sablon) => string | null
  onToggleSelect: (id: number) => void
  onSelectAll: () => void
  onSelectReadyOnly: () => void
  onSelectNone: () => void
  onUnlock: (sablon: Sablon, e: React.MouseEvent) => void
  onSelectPreview: (sablon: Sablon) => void
}

export const TekTikYazdirDocList: React.FC<TekTikYazdirDocListProps> = ({
  sablons,
  filteredSablons,
  selectedIds,
  searchQuery,
  setSearchQuery,
  currentPreviewSablon,
  activeDosyaId,
  getMissingRequirement,
  onToggleSelect,
  onSelectAll,
  onSelectReadyOnly,
  onSelectNone,
  onUnlock,
  onSelectPreview
}) => {
  const { isDocumentLocked, getDocumentLockInfo, getDocumentStatus } = usePrintQueueStore()

  return (
    <div className="w-80 md:w-96 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
      {/* Action toolbar */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Seçilen Belgeler ({selectedIds.size}/{sablons.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
            >
              Tümü
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={onSelectReadyOnly}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
            >
              Hazırlar
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={onSelectNone}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-300 hover:underline cursor-pointer"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Belge veya şablon adı ara..."
          className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredSablons.map((sablon) => {
          const isSelected = selectedIds.has(sablon.id)
          const missingReq = getMissingRequirement ? getMissingRequirement(sablon) : null
          const docKey = (sablon.dosya_adi || '').replace(/\.html$/, '')
          const isLocked = activeDosyaId ? isDocumentLocked(activeDosyaId, docKey) : false
          const lockInfo = activeDosyaId ? getDocumentLockInfo(activeDosyaId, docKey) : null
          const docStatus = activeDosyaId ? getDocumentStatus(activeDosyaId, docKey) : 'draft'
          const isCurrentPreview = currentPreviewSablon && currentPreviewSablon.id === sablon.id

          return (
            <div
              key={`${sablon.id}_${docKey}`}
              onClick={() => {
                if (!missingReq) {
                  onToggleSelect(sablon.id)
                  onSelectPreview(sablon)
                }
              }}
              className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                missingReq
                  ? 'opacity-50 bg-slate-900/40 border-slate-800 cursor-not-allowed'
                  : isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-850/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              } ${isCurrentPreview ? 'ring-1 ring-indigo-400/80' : ''}`}
            >
              {/* Checkbox */}
              <div className="pt-0.5">
                {isSelected ? (
                  <CheckSquare size={16} className="text-indigo-400" />
                ) : (
                  <Square size={16} className="text-slate-600 group-hover:text-slate-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {sablon.ad}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Lock / Printed Badge */}
                  {isLocked ? (
                    <span
                      title={`Bu belge ${lockInfo?.lockedAtVersion || CURRENT_APP_VERSION} sürümünde yazdırıldı ve kilitlendi.`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-md border border-amber-700/60"
                    >
                      <Lock size={10} className="text-amber-400" />
                      {lockInfo?.lockedAtVersion || CURRENT_APP_VERSION} Kilitli
                    </span>
                  ) : docStatus === 'ready_to_print' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-700/60">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                      Hazır
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">Taslak</span>
                  )}

                  {sablon.kategori && (
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-30">
                      {sablon.kategori}
                    </span>
                  )}
                </div>

                {missingReq && (
                  <p className="text-[11px] text-rose-400/90 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} className="shrink-0" />
                    {missingReq}
                  </p>
                )}
              </div>

              {/* Unlock action button if locked */}
              {isLocked && (
                <button
                  onClick={(e) => onUnlock(sablon, e)}
                  title="Yazdırma Kilidini Aç"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-950/50 transition-colors shrink-0 cursor-pointer"
                >
                  <Unlock size={13} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
