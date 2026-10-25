import React from 'react'
import { AlertTriangle, Save } from 'lucide-react'

interface YeniPozModalsProps {
  toastMessage: string | null
  showUnsavedModal: boolean
  setShowUnsavedModal: (show: boolean) => void
  handleNavigateBack: () => void
  handleSubmit: (e: React.FormEvent) => void
}

export function YeniPozModals({
  toastMessage,
  showUnsavedModal,
  setShowUnsavedModal,
  handleNavigateBack,
  handleSubmit
}: YeniPozModalsProps): React.JSX.Element {
  return (
    <>
      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Kaydedilmemiş Değişiklikler Uyarı Modalı */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full mx-4 animate-in zoom-in-95">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Kaydedilmemiş Değişiklikler
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Formda kaydedilmemiş değişiklikler var. Çıkarsanız yaptığınız değişiklikler
                  kaybolacak.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Geri Dön
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false)
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={13} />
                Kaydet ve Çık
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false)
                  handleNavigateBack()
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors cursor-pointer"
              >
                Kaydetme, Çık
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
