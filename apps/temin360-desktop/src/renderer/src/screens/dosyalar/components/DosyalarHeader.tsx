import React from 'react'
import { Calendar } from 'lucide-react'

export interface DosyalarHeaderProps {
  filterYil: string
  filteredDosyalar: any[]
  selectedDosyaIds: number[]
  setSelectedDosyaIds: React.Dispatch<React.SetStateAction<number[]>>
  filterTur: string
}

export function DosyalarHeader({
  filterYil,
  filteredDosyalar,
  selectedDosyaIds,
  setSelectedDosyaIds,
  filterTur
}: DosyalarHeaderProps): React.JSX.Element {
  return (
    <div className="flex-none mb-4 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
      <div>
        <h2 className="text-sm md:text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="text-blue-500" size={18} />
          {filterYil === 'hepsi' ? 'Tüm Yıllara Ait Dosyalar' : `${filterYil} Yılı Dosyaları`}
        </h2>
        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-3">
          <span>Toplam {filteredDosyalar.length} kayıt listeleniyor.</span>
          {filteredDosyalar.length > 0 && (
            <button
              onClick={() => {
                if (selectedDosyaIds.length === filteredDosyalar.length) {
                  setSelectedDosyaIds([])
                } else {
                  setSelectedDosyaIds(filteredDosyalar.map((d) => d.id))
                }
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
            >
              <input
                type="checkbox"
                checked={
                  selectedDosyaIds.length === filteredDosyalar.length && filteredDosyalar.length > 0
                }
                readOnly
                className="w-3 h-3 rounded border-slate-300 text-blue-600 cursor-pointer"
              />
              {selectedDosyaIds.length === filteredDosyalar.length
                ? 'Tüm Seçimi Kaldır'
                : 'Tümünü Seç'}
            </button>
          )}
        </div>
      </div>
      {filterTur !== 'hepsi' && (
        <span className="bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide">
          {filterTur === 'mal'
            ? 'Mal Alımı'
            : filterTur === 'hizmet'
              ? 'Hizmet Alımı'
              : filterTur === 'yapim_isi'
                ? 'Yapım İşi'
                : 'Danışmanlık'}
        </span>
      )}
    </div>
  )
}
