import React, { useState, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { calculateGecikmeCezasi, formatCurrency } from '../../../utils/turkishCalculationUtils'

export function GecikmeCezasiTool(): React.JSX.Element {
  const [cezaSozlesmeBedeli, setCezaSozlesmeBedeli] = useState<string>('750000')
  const [cezaGunSayisi, setCezaGunSayisi] = useState<string>('12')
  const [cezaOraniBinde, setCezaOraniBinde] = useState<number>(0.5)

  const gecikmeSonuc = useMemo(() => {
    const sozlesme = parseFloat(cezaSozlesmeBedeli.replace(',', '.')) || 0
    const gun = parseInt(cezaGunSayisi, 10) || 0
    return calculateGecikmeCezasi(sozlesme, gun, cezaOraniBinde)
  }, [cezaSozlesmeBedeli, cezaGunSayisi, cezaOraniBinde])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Gecikme Parametreleri
          </h3>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
            Sözleşme İhlali
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Toplam Sözleşme Bedeli (KDV Hariç)
          </label>
          <input
            type="text"
            value={cezaSozlesmeBedeli}
            onChange={(e) => setCezaSozlesmeBedeli(e.target.value)}
            placeholder="Örn: 750000"
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Gecikilen Gün Sayısı (Takvim Günü)
          </label>
          <input
            type="number"
            value={cezaGunSayisi}
            onChange={(e) => setCezaGunSayisi(e.target.value)}
            placeholder="Örn: 12"
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Günlük Ceza Oranı (Sözleşme Maddesi)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 0.5, label: 'On Binde 5 (‰ 0.5)' },
              { val: 1.0, label: 'Binde 1 (‰ 1.0)' },
              { val: 2.0, label: 'Binde 2 (‰ 2.0)' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setCezaOraniBinde(item.val)}
                className={`px-2 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer text-center ${
                  cezaOraniBinde === item.val
                    ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ Ceza Dökümü */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h4 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Gecikme Cezası Hesaplama Sonucu
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                Toplam Kesilecek Gecikme Cezası
              </span>
              <span className="text-xl font-bold text-red-700 dark:text-red-300 mt-1 block">
                {formatCurrency(gecikmeSonuc.toplamCezaTutari)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Ceza Sonrası Kalan Sözleşme Tutarı
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {formatCurrency(gecikmeSonuc.kalanSozlesmeBedeli)}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-2">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                    Sözleşme Bedeli
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white text-right">
                    {formatCurrency(gecikmeSonuc.sozlesmeBedeli)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                    Gecikme Süresi
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white text-right">
                    {gecikmeSonuc.gecikmeGunSayisi} Gün
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                    Günlük Ceza Tutarı
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white text-right">
                    {formatCurrency(gecikmeSonuc.gunlukCezaTutari)}
                  </td>
                </tr>
                <tr className="bg-red-50/40 dark:bg-red-950/20 font-bold">
                  <td className="p-3 text-red-700 dark:text-red-300">
                    Hakedişten Kesilecek Ceza Toplamı
                  </td>
                  <td className="p-3 text-red-700 dark:text-red-300 text-right">
                    - {formatCurrency(gecikmeSonuc.toplamCezaTutari)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
