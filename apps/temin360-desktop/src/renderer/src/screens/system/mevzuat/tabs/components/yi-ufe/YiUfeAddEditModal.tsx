import React from 'react'
import { TrendingUp, X } from 'lucide-react'
import { AY_ISIMLERI } from '../../../../../../services/yiUfeService'

interface YiUfeAddEditModalProps {
  isOpen: boolean
  onClose: () => void
  modalYil: number
  setModalYil: (val: number) => void
  modalAy: number
  setModalAy: (val: number) => void
  modalEndeks: string
  setModalEndeks: (val: string) => void
  modalAciklama: string
  setModalAciklama: (val: string) => void
  onSave: (e: React.FormEvent) => void
}

export const YiUfeAddEditModal: React.FC<YiUfeAddEditModalProps> = ({
  isOpen,
  onClose,
  modalYil,
  setModalYil,
  modalAy,
  setModalAy,
  modalEndeks,
  setModalEndeks,
  modalAciklama,
  setModalAciklama,
  onSave
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Yİ-ÜFE Endeksi Ekle / Güncelle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                TÜİK tarafından açıklanan yeni endeksi giriniz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Yıl
              </label>
              <input
                type="number"
                value={modalYil}
                onChange={(e) => setModalYil(parseInt(e.target.value, 10))}
                min={1990}
                max={2035}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1.5 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ay
              </label>
              <select
                value={modalAy}
                onChange={(e) => setModalAy(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1.5 focus:ring-blue-500"
              >
                {AY_ISIMLERI.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name} ({idx + 1}. Ay)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Yİ-ÜFE Endeks Değeri
            </label>
            <input
              type="text"
              placeholder="Örn: 5850,25"
              value={modalEndeks}
              onChange={(e) => setModalEndeks(e.target.value)}
              autoFocus
              required
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black font-mono text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              hakedis.org veya TÜİK bülteninde açıklanan virgüllü endeks rakamını giriniz.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Açıklama / Kaynak Notu (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder="Örn: TÜİK Ağustos 2026 Bülteni"
              value={modalAciklama}
              onChange={(e) => setModalAciklama(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 cursor-pointer"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
