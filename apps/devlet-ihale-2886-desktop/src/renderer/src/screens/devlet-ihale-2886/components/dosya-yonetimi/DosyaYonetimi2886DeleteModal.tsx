import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'

interface DosyaYonetimi2886DeleteModalProps {
  deleteModalDosya: Dosya2886Item | null
  onClose: () => void
  onConfirmDelete: () => void
}

export const DosyaYonetimi2886DeleteModal: React.FC<DosyaYonetimi2886DeleteModalProps> = ({
  deleteModalDosya,
  onClose,
  onConfirmDelete
}) => {
  if (!deleteModalDosya) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              2886 İhale Dosyasını Sil
            </h4>
            <p className="text-xs text-slate-500 font-mono">{deleteModalDosya.ihaleKayitNo}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="font-bold text-slate-800 dark:text-slate-100 block mb-1">
            {deleteModalDosya.ihaleAdi}
          </span>
          Bu 2886 ihale dosyasını sistemden ve tüm ilişkili verilerinden tamamen silmek istediğinize
          emin misiniz?
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            İptal / Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Evet, Dosyayı Sil</span>
          </button>
        </div>
      </div>
    </div>
  )
}
