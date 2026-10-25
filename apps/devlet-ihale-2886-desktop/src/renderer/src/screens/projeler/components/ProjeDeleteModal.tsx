import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Proje } from '../../../hooks/useProjeHooks'

interface ProjeDeleteModalProps {
  deletingProje: Proje | null
  setDeletingProje: (p: Proje | null) => void
  handleDeleteConfirm: () => void
}

export function ProjeDeleteModal({
  deletingProje,
  setDeletingProje,
  handleDeleteConfirm
}: ProjeDeleteModalProps): React.JSX.Element | null {
  if (!deletingProje) return null

  return (
    <Modal
      isOpen={Boolean(deletingProje)}
      onClose={() => setDeletingProje(null)}
      title="Projeyi Sil"
    >
      <div className="space-y-4 p-1">
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 dark:text-red-300">
            <strong>{deletingProje.proje_adi}</strong> ({deletingProje.proje_kodu}) projesini silmek
            istediğinize emin misiniz?
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Bu projeye bağlı doğrudan temin dosyaları silinmez ancak proje ilişkisi arşivlenir.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeletingProje(null)}
            className="text-xs cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            className="text-xs bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            Evet, Projeyi Sil
          </Button>
        </div>
      </div>
    </Modal>
  )
}
