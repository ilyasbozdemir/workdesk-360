import React from 'react'
import { ArrowUp, ArrowDown, Trash2, CheckSquare, Square } from 'lucide-react'
import { ImzaciSatiri, ImzaTipi } from '../types'

interface SignerRowProps {
  signer: ImzaciSatiri
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onUpdate: (updated: Partial<ImzaciSatiri>) => void
}

export const SignerRow: React.FC<SignerRowProps> = ({
  signer,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all hover:border-slate-300 dark:hover:border-slate-600">
      {/* Sıra & Temel Bilgiler */}
      <div className="flex items-center gap-2.5 flex-1 w-full sm:w-auto">
        <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
          {signer.sira}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
          <input
            type="text"
            value={signer.adSoyad}
            onChange={(e) => onUpdate({ adSoyad: e.target.value })}
            placeholder="Ad Soyad"
            className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            value={signer.unvan}
            onChange={(e) => onUpdate({ unvan: e.target.value })}
            placeholder="Unvan / Görev"
            className="text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* İmza Tipi ve Seçenekler */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <select
          value={signer.imzaTipi}
          onChange={(e) => onUpdate({ imzaTipi: e.target.value as ImzaTipi })}
          className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-100"
        >
          <option value="Hazırlayan">Hazırlayan</option>
          <option value="Kontrol">Kontrol</option>
          <option value="Onay">Onay</option>
        </select>

        {/* Checkbox Seçenekleri */}
        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onUpdate({ parafVar: !signer.parafVar })}
            className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
          >
            {signer.parafVar ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>Paraf</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdate({ imzaKutusuVar: !signer.imzaKutusuVar })}
            className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
          >
            {signer.imzaKutusuVar ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>İmza</span>
          </button>
        </div>

        {/* Eylem Butonları */}
        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            aria-label="Yukarı Taşı"
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            aria-label="Aşağı Taşı"
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="İmzacı Sil"
            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
