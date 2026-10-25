import React, { useState, useMemo } from 'react'
import { Coins } from 'lucide-react'
import { calculateDamgaVergisi, formatCurrency } from '../../../utils/turkishCalculationUtils'

export function DamgaVergisiTool(): React.JSX.Element {
  const [damgaMatrahInput, setDamgaMatrahInput] = useState<string>('250000')
  const [incKararPulu, setIncKararPulu] = useState<boolean>(true)
  const [incSozlesmeDamga, setIncSozlesmeDamga] = useState<boolean>(true)
  const [incKikPayi, setIncKikPayi] = useState<boolean>(true)

  const damgaSonuc = useMemo(() => {
    const matrah = parseFloat(damgaMatrahInput.replace(',', '.')) || 0
    return calculateDamgaVergisi(matrah, {
      includeKararPulu: incKararPulu,
      includeSozlesmeDamga: incSozlesmeDamga,
      includeKikPayi: incKikPayi
    })
  }, [damgaMatrahInput, incKararPulu, incSozlesmeDamga, incKikPayi])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-600" />
            Sözleşme &amp; Karar Bedeli
          </h3>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
            Yasal Kesintiler
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            İhale / Sözleşme Bedeli (KDV Hariç Matrah)
          </label>
          <input
            type="text"
            value={damgaMatrahInput}
            onChange={(e) => setDamgaMatrahInput(e.target.value)}
            placeholder="Örn: 250000"
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Uygulanacak Kesintiler */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Hesaplanacak Yasal Kesintiler
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={incKararPulu}
              onChange={(e) => setIncKararPulu(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white block">
                İhale Karar Pulu (‰ 5,69 — Binde 5.69)
              </span>
              <span className="text-slate-500 text-[11px]">
                İhale yetkilisinin onayladığı kararlar üzerinden kesilir
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={incSozlesmeDamga}
              onChange={(e) => setIncSozlesmeDamga(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white block">
                Sözleşme Damga Vergisi (‰ 9,48 — Binde 9.48)
              </span>
              <span className="text-slate-500 text-[11px]">
                Düzenlenen sözleşmeler ve taahhütnameler üzerinden kesilir
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={incKikPayi}
              onChange={(e) => setIncKikPayi(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white block">
                Kamu İhale Kurumu (KİK) Payı (‰ 0,5 — On Binde 5)
              </span>
              <span className="text-slate-500 text-[11px]">
                Sözleşme bedelinin on binde beşi oranında tahsil edilir
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Sağ Sonuç Dökümü */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h4 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Kesinti ve Tahakkuk Dökümü
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                Toplam Yasal Kesinti
              </span>
              <span className="text-xl font-bold text-red-700 dark:text-red-300 mt-1 block">
                {formatCurrency(damgaSonuc.toplamKesinti)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Net Tahakkuk / Ödeme Tutarı
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {formatCurrency(damgaSonuc.netOdenecekTutar)}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-2">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                    İhale / Sözleşme Bedeli
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white text-right">
                    {formatCurrency(damgaSonuc.matrah)}
                  </td>
                </tr>
                {incKararPulu && (
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      İhale Karar Pulu (‰ 5,69)
                    </td>
                    <td className="p-3 font-semibold text-red-600 dark:text-red-400 text-right">
                      - {formatCurrency(damgaSonuc.ihaleKararPulu)}
                    </td>
                  </tr>
                )}
                {incSozlesmeDamga && (
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      Sözleşme Damga Vergisi (‰ 9,48)
                    </td>
                    <td className="p-3 font-semibold text-red-600 dark:text-red-400 text-right">
                      - {formatCurrency(damgaSonuc.sozlesmeDamgaVergisi)}
                    </td>
                  </tr>
                )}
                {incKikPayi && (
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="p-3 text-slate-700 dark:text-slate-300">KİK Payı (‰ 0,5)</td>
                    <td className="p-3 font-semibold text-red-600 dark:text-red-400 text-right">
                      - {formatCurrency(damgaSonuc.kikPayi)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                  <td className="p-3 text-slate-900 dark:text-white">
                    Kesintiler Sonrası Net Ödenecek
                  </td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 text-right text-sm">
                    {formatCurrency(damgaSonuc.netOdenecekTutar)}
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
