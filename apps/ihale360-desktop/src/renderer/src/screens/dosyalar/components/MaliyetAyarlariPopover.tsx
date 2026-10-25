import React from 'react'
import { Sliders } from 'lucide-react'

interface MaliyetAyarlariPopoverProps {
  selectedDosya: any | null
  setSelectedDosya: (dosya: any | null) => void
  onSave: () => Promise<void>
}

export const MaliyetAyarlariPopover: React.FC<MaliyetAyarlariPopoverProps> = ({
  selectedDosya,
  setSelectedDosya,
  onSave
}) => {
  if (!selectedDosya) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/25 dark:bg-black/50 z-[9998]"
        onClick={() => setSelectedDosya(null)}
      />
      <div className="fixed right-4 top-[52px] w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[9999] p-4 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Sliders size={14} className="text-blue-500" />
            Yaklaşık Maliyet Ayarları
          </h3>
          <button
            type="button"
            onClick={() => setSelectedDosya(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            Kapat
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Yaklaşık Maliyet Hesabı
            </label>
            <select
              value={selectedDosya.yaklasik_maliyet_hesaplamasi || 'burada'}
              onChange={(e) => {
                const val = e.target.value
                setSelectedDosya({
                  ...selectedDosya,
                  yaklasik_maliyet_hesaplamasi: val,
                  yaklasik_maliyet: val !== 'onceden' ? 0 : selectedDosya.yaklasik_maliyet
                })
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer"
            >
              <option value="burada">Burada Hesaplanacak (Teklifler ile)</option>
              <option value="onceden">Önceden Hesaplandı (Tutar Girilecek)</option>
              <option value="hesaplanmayacak">Hesaplanmayacak</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Yaklaşık Maliyet KDV Durumu
            </label>
            <select
              value={selectedDosya.yaklasik_maliyet_kdv_dahil_mi ?? 0}
              onChange={(e) => {
                const newKdvDahilMi = Number(e.target.value)
                const oldKdvDahilMi = selectedDosya.yaklasik_maliyet_kdv_dahil_mi ?? 0
                const kdvRate = Number(selectedDosya.kdv) || 20
                let currentVal = selectedDosya.yaklasik_maliyet || 0

                if (newKdvDahilMi !== oldKdvDahilMi) {
                  if (newKdvDahilMi === 1) {
                    currentVal = currentVal * (1 + kdvRate / 100)
                  } else {
                    currentVal = currentVal / (1 + kdvRate / 100)
                  }
                }

                setSelectedDosya({
                  ...selectedDosya,
                  yaklasik_maliyet_kdv_dahil_mi: newKdvDahilMi,
                  yaklasik_maliyet: Number(currentVal.toFixed(2))
                })
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer"
            >
              <option value={0}>KDV Hariç</option>
              <option value={1}>KDV Dahil</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Yaklaşık Maliyet (₺)
            </label>
            <input
              type="number"
              disabled={selectedDosya.yaklasik_maliyet_hesaplamasi !== 'onceden'}
              value={selectedDosya.yaklasik_maliyet ?? ''}
              onChange={(e) =>
                setSelectedDosya({
                  ...selectedDosya,
                  yaklasik_maliyet: e.target.value === '' ? 0 : Number(e.target.value)
                })
              }
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold ${
                selectedDosya.yaklasik_maliyet_hesaplamasi !== 'onceden'
                  ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            />
            {selectedDosya.yaklasik_maliyet_hesaplamasi === 'burada' && (
              <p className="text-[10px] text-blue-500 mt-1 font-medium">
                💡 Bu tutar, teklifler girildiğinde otomatik olarak hesaplanacaktır.
              </p>
            )}
            {selectedDosya.yaklasik_maliyet_hesaplamasi === 'hesaplanmayacak' && (
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                💡 Bu dosya için yaklaşık maliyet hesaplanmayacaktır.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              KDV Durumu
            </label>
            <select
              value={selectedDosya.yaklasik_maliyet_kdv_dahil_mi ?? 0}
              onChange={(e) =>
                setSelectedDosya({
                  ...selectedDosya,
                  yaklasik_maliyet_kdv_dahil_mi: parseInt(e.target.value, 10)
                })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value={0}>KDV Hariç</option>
              <option value={1}>KDV Dahil</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDosya(null)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
