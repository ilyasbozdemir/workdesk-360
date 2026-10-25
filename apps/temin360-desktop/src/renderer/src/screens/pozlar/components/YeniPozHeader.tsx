import React from 'react'
import { ArrowLeft, RotateCcw, Save } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

interface YeniPozHeaderProps {
  editId: number | null
  isDirty: boolean
  isSaving: boolean
  handleTryClose: () => void
  handleSubmit: (e: React.FormEvent) => void
}

export function YeniPozHeader({
  editId,
  isDirty,
  isSaving,
  handleTryClose,
  handleSubmit
}: YeniPozHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleTryClose}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Poz Listesine Geri Dön"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
              {editId ? 'DÜZENLEME MODU' : 'YENİ POZ TANIMI'}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              Birim Fiyat Kitapları & Fasiküller
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            {editId ? 'Birim Fiyat Pozunu Düzenle' : 'Yeni Birim Fiyat Pozu Tanımla'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fasikül, kitap, eski/yeni poz numarası eşleşmesi, analiz/rayiç tipi ve dönemsel birim
            fiyatları yönetin.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <Button type="button" variant="outline" onClick={handleTryClose} className="gap-2 text-xs">
          <RotateCcw size={14} />
          {isDirty ? (
            <span className="text-amber-600 dark:text-amber-400">Değişiklikleri Geri Al</span>
          ) : (
            <span>Kapat</span>
          )}
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2 text-xs shadow-xs px-5"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={15} />
          )}
          <span>{editId ? 'Değişiklikleri Kaydet' : 'Pozu Kaydet'}</span>
        </Button>
      </div>
    </div>
  )
}
