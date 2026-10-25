import React from 'react'
import { TrendingUp, Sparkles, Plus, FileSearch, Trash2 } from 'lucide-react'
import { EmsalArastirma } from '../../types/devletIhale2886.types'

interface EmsalArastirmalariCardProps {
  emsaller: EmsalArastirma[]
  setEmsaller: React.Dispatch<React.SetStateAction<EmsalArastirma[]>>
  emsalOrtalama: number
  onApplyEmsalOrtalama: () => void
  onAddEmsal: () => void
  onRemoveEmsal: (id: string) => void
  formatMoney: (n: number) => string
}

export const EmsalArastirmalariCard: React.FC<EmsalArastirmalariCardProps> = ({
  emsaller,
  setEmsaller,
  emsalOrtalama,
  onApplyEmsalOrtalama,
  onAddEmsal,
  onRemoveEmsal,
  formatMoney
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Emsal Rayiç ve Piyasa Araştırmaları
        </h3>
        <div className="flex items-center gap-1.5">
          {emsalOrtalama > 0 && (
            <button
              type="button"
              onClick={onApplyEmsalOrtalama}
              className="px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Ortalamayı Birim m² Fiyatına Aktar"
            >
              <Sparkles className="w-3 h-3" /> Ortalamayı Aktar (₺{formatMoney(emsalOrtalama)})
            </button>
          )}
          <button
            type="button"
            onClick={onAddEmsal}
            className="px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Emsal Ekle
          </button>
        </div>
      </div>

      {emsaller.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
          <FileSearch className="w-7 h-7 mb-2 opacity-50" />
          <p className="text-xs font-medium">Henüz emsal rayiç araştırması eklenmedi.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Bölgedeki emsal satış, kira ve bilirkişi araştırmalarını girmek için butonu
            kullanabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-55 overflow-y-auto custom-scrollbar pr-1">
          {emsaller.map((e, idx) => (
            <div
              key={e.id}
              className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-lg text-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <input
                  type="text"
                  placeholder="Kaynak / Kurum adı..."
                  value={e.kaynak}
                  onChange={(evt) => {
                    const updated = [...emsaller]
                    updated[idx].kaynak = evt.target.value
                    setEmsaller(updated)
                  }}
                  className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold"
                />
                <div className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                  <span>₺</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={e.metrekareFiyati || ''}
                    onChange={(evt) => {
                      const updated = [...emsaller]
                      updated[idx].metrekareFiyati = Number(evt.target.value) || 0
                      setEmsaller(updated)
                    }}
                    className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold text-right"
                  />
                  <span className="text-[11px]">/ m²</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveEmsal(e.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                  title="Emsali Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Açıklama / tespit detayı..."
                value={e.aciklama}
                onChange={(evt) => {
                  const updated = [...emsaller]
                  updated[idx].aciklama = evt.target.value
                  setEmsaller(updated)
                }}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[11px] text-slate-600 dark:text-slate-300"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
