import React from 'react'
import { Check, Loader2, Zap } from 'lucide-react'

interface HizliGridFooterProps {
  toastNotification: string | null
  validRowCount: number
  isSaving: boolean
  activeDosyaId?: number | null
  onCancel?: () => void
  handleSave: () => void
}

export function HizliGridFooter({
  toastNotification,
  validRowCount,
  isSaving,
  activeDosyaId,
  onCancel,
  handleSave
}: HizliGridFooterProps): React.JSX.Element {
  return (
    <>
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* ALT AKSİYON BUTONLARI */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              İptal
            </button>
          )}
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {validRowCount > 0
              ? `Toplam ${validRowCount} geçerli kalem kaydedilecek`
              : 'Henüz kalem adı girilmedi'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={validRowCount === 0 || isSaving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 text-amber-300" />
          )}
          {activeDosyaId
            ? `${validRowCount} Kalemi Dosyaya Ekle`
            : `${validRowCount} Kalemi Kütüphaneye Kaydet`}
        </button>
      </div>
    </>
  )
}
