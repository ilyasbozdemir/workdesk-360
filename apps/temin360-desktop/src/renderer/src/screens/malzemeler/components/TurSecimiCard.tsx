import React from 'react'
import { Briefcase, Building2, PackageSearch } from 'lucide-react'
import { cn } from '../../../utils/cn'
import type { Kalem } from '../malzemeler.hooks'

interface TurSecimiCardProps {
  formData: Partial<Kalem>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Kalem>>>
  selectedType: 'Mal' | 'Hizmet' | 'Yapım'
}

export const TurSecimiCard: React.FC<TurSecimiCardProps> = ({ setFormData, selectedType }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        Kalem Türü (Alım Türü)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, tipi: 'Mal', is_personel: 0 }))}
          className={cn(
            'flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all text-left cursor-pointer',
            selectedType === 'Mal'
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0',
              selectedType === 'Mal'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">Mal Alımı</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              Kırtasiye, Sarf, Cihaz, Taşınır Kodlu Ürünler
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, tipi: 'Hizmet' }))}
          className={cn(
            'flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all text-left cursor-pointer',
            selectedType === 'Hizmet'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0',
              selectedType === 'Hizmet'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">Hizmet Alımı</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              Temizlik, Güvenlik, Danışmanlık, Bakım & Personel
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, tipi: 'Yapım', is_personel: 0 }))}
          className={cn(
            'flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all text-left cursor-pointer',
            selectedType === 'Yapım'
              ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 shadow-sm ring-1 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0',
              selectedType === 'Yapım'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">Yapım İşi</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              Bakanlık Poz No, Onarım, Tadilat, Tesisat & İnşaat
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
