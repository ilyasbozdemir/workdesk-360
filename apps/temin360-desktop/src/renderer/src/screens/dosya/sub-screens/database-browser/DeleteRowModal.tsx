import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Modal } from '../../../../components/ui/Modal'

interface DeleteRowModalProps {
  deletingRow: Record<string, unknown> | null
  onClose: () => void
  handleDeleteRowConfirm: () => Promise<void>
}

export function DeleteRowModal({
  deletingRow,
  onClose,
  handleDeleteRowConfirm
}: DeleteRowModalProps): React.JSX.Element {
  return (
    <Modal
      isOpen={deletingRow !== null}
      onClose={onClose}
      title="Kayıt Silinecek"
      description="Bu kaydı veritabanından kalıcı olarak silmek istediğinize emin misiniz?"
    >
      <div className="space-y-4">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Dikkat:</strong> Bu kaydın silinmesi, diğer tablolarda bu ID&apos;ye bağlı
            verilerin yetim kalmasına (ilişkili veri kaybına) yol açabilir.
          </span>
        </div>

        {deletingRow && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono max-h-40 overflow-y-auto space-y-1">
            {Object.keys(deletingRow).map((k) => (
              <div
                key={k}
                className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1"
              >
                <span className="text-slate-400">{k}:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {String(deletingRow[k] ?? 'NULL')}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteRowConfirm()}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer border-0"
          >
            <Trash2 className="w-4 h-4" />
            Evet, Kalıcı Olarak Sil
          </button>
        </div>
      </div>
    </Modal>
  )
}
