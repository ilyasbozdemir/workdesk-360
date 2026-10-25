import React from 'react'

interface PresetModalsProps {
  showAddModal: boolean
  newPresetName: string
  setNewPresetName: (name: string) => void
  onAddCancel: () => void
  onAddSubmit: () => void
  showDeleteModal: boolean
  onDeleteCancel: () => void
  onDeleteSubmit: () => void
}

export const PresetModals: React.FC<PresetModalsProps> = ({
  showAddModal,
  newPresetName,
  setNewPresetName,
  onAddCancel,
  onAddSubmit,
  showDeleteModal,
  onDeleteCancel,
  onDeleteSubmit
}) => {
  return (
    <>
      {/* Yeni Paket Ekleme Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-9999 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Yeni Belge Paketi Oluştur
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Belge paketinize kolayca tanıyabileceğiniz bir isim verin. Oluşturduktan sonra içine
              istediğiniz şablonları ekleyebilirsiniz.
            </p>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Paket Adı..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAddSubmit()
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onAddCancel}
                className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={onAddSubmit}
                disabled={!newPresetName.trim()}
                className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paket Silme Onay Modalı */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-9999 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Paketi Sil</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bu belge paketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onDeleteCancel}
                className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={onDeleteSubmit}
                className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
