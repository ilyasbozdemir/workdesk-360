import React from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '../../../../components/ui/Modal'
import { ColumnInfo } from './types'

interface AddRowModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTable: string
  columns: ColumnInfo[]
  newRowData: Record<string, string>
  setNewRowData: React.Dispatch<React.SetStateAction<Record<string, string>>>
  handleInsertRow: (e: React.FormEvent) => Promise<void>
}

export function AddRowModal({
  isOpen,
  onClose,
  selectedTable,
  columns,
  newRowData,
  setNewRowData,
  handleInsertRow
}: AddRowModalProps): React.JSX.Element {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Yeni Kayıt Ekle: ${selectedTable}`}
      description="Aşağıdaki alanları doldurarak tabloya doğrudan veritabanı kaydı ekleyebilirsiniz."
    >
      <form onSubmit={(e) => void handleInsertRow(e)} className="space-y-4">
        <div className="max-h-96 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {columns.map((c) => {
            const isRelational = c.pk === 1 || c.name.endsWith('_id')
            return (
              <div key={c.name}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  {c.name}
                  {c.pk === 1 && (
                    <span className="ml-1 text-[9px] text-amber-600 font-sans uppercase font-bold">
                      (Primary Key - Otomatik)
                    </span>
                  )}
                  {c.name.endsWith('_id') && (
                    <span className="ml-1 text-[9px] text-purple-600 dark:text-purple-400 font-sans uppercase font-bold">
                      (Foreign Key - İlişkili ID)
                    </span>
                  )}
                  {c.notnull === 1 && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={c.dflt_value ? `Varsayılan: ${c.dflt_value}` : 'Değer girin...'}
                  value={newRowData[c.name] || ''}
                  onChange={(e) =>
                    setNewRowData((prev) => ({
                      ...prev,
                      [c.name]: e.target.value
                    }))
                  }
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-3 py-2 text-xs focus:outline-none font-mono text-slate-800 dark:text-slate-100 ${
                    isRelational
                      ? 'border-amber-300 dark:border-amber-900/60'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
          >
            İptal
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            Kaydı Ekle
          </button>
        </div>
      </form>
    </Modal>
  )
}
