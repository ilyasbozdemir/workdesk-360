import { Trash2 } from 'lucide-react'

export interface DosyalarBulkActionsProps {
  selectedDosyaIds: number[]
  dosyalar: any[]
  handleBulkHardDelete?: (ids: number[]) => Promise<void>
  handleBulkDelete?: (ids: number[]) => Promise<void>
  setSelectedDosyaIds: React.Dispatch<React.SetStateAction<number[]>>
}

export function DosyalarBulkActions({
  selectedDosyaIds,
  dosyalar,
  handleBulkHardDelete,
  handleBulkDelete,
  setSelectedDosyaIds
}: DosyalarBulkActionsProps) {
  if (selectedDosyaIds.length === 0) return null

  return (
    <div className="flex-none mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-3 rounded-2xl shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
          {selectedDosyaIds.length}
        </span>
        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          dosya seçildi
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            const hasDeletedFiles = selectedDosyaIds.some((id) => {
              const dosya = dosyalar.find((d) => d.id === id)
              return dosya?.is_deleted === 1
            })

            if (hasDeletedFiles) {
              if (import.meta.env.DEV) {
                if (
                  confirm(
                    `Seçili dosyalar arasında zaten "İptal Edilmiş" dosyalar var. Bu dosyaları KALICI OLARAK SİLMEK istediğinize emin misiniz? (DEV MODE)\n\n(Aktif dosyalar normal şekilde iptal edilecektir.)`
                  )
                ) {
                  if (handleBulkHardDelete && handleBulkDelete) {
                    const hardDeleteIds = selectedDosyaIds.filter(
                      (id) => dosyalar.find((d) => d.id === id)?.is_deleted === 1
                    )
                    const softDeleteIds = selectedDosyaIds.filter(
                      (id) => dosyalar.find((d) => d.id === id)?.is_deleted !== 1
                    )

                    if (hardDeleteIds.length > 0) await handleBulkHardDelete(hardDeleteIds)
                    if (softDeleteIds.length > 0) await handleBulkDelete(softDeleteIds)

                    setSelectedDosyaIds([])
                  }
                }
              } else {
                alert(
                  'Seçili dosyalar arasında zaten iptal edilmiş dosyalar bulunuyor. Paketlenmiş sürümde iptal edilmiş dosyalar kalıcı olarak silinemez. Lütfen seçiminizi güncelleyip tekrar deneyiniz.'
                )
              }
            } else {
              if (
                confirm(
                  `${selectedDosyaIds.length} dosyayı silmek/arşivlemek istediğinize emin misiniz?`
                )
              ) {
                if (handleBulkDelete) {
                  await handleBulkDelete(selectedDosyaIds)
                  setSelectedDosyaIds([])
                }
              }
            }
          }}
          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 size={14} /> Seçilenleri Sil
        </button>
        <button
          onClick={() => setSelectedDosyaIds([])}
          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  )
}
