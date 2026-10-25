import React, { useState, useMemo } from 'react'
import { Percent } from 'lucide-react'
import {
  calculateKdvTevkifat,
  formatCurrency,
  TEVKIFAT_ORANLARI
} from '../../../utils/turkishCalculationUtils'

export function KdvTevkifatTool(): React.JSX.Element {
  const [kdvTutarInput, setKdvTutarInput] = useState<string>('100000')
  const [kdvOrani, setKdvOrani] = useState<number>(20)
  const [selectedTevkifatKod, setSelectedTevkifatKod] = useState<string>('5/10')
  const [tutarTuru, setTutarTuru] = useState<'HARIC' | 'DAHIL'>('HARIC')

  const kdvTevkifatSonuc = useMemo(() => {
    const tutar = parseFloat(kdvTutarInput.replace(',', '.')) || 0
    const secilenTevkifat =
      TEVKIFAT_ORANLARI.find((t) => t.kod === selectedTevkifatKod) || TEVKIFAT_ORANLARI[0]

    return calculateKdvTevkifat({
      tutar,
      kdvOrani,
      tevkifatPay: secilenTevkifat.pay,
      tevkifatPayda: secilenTevkifat.payda,
      tutarTuru
    })
  }, [kdvTutarInput, kdvOrani, selectedTevkifatKod, tutarTuru])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sol Ayar Paneli */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-600" />
            KDV &amp; Tevkifat Girişi
          </h3>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setTutarTuru('HARIC')}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                tutarTuru === 'HARIC'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              KDV Hariç
            </button>
            <button
              type="button"
              onClick={() => setTutarTuru('DAHIL')}
              className={`px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                tutarTuru === 'DAHIL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              KDV Dahil
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            İşlem Tutarı ({tutarTuru === 'HARIC' ? 'KDV Hariç Matrah' : 'KDV Dahil Toplam'})
          </label>
          <input
            type="text"
            value={kdvTutarInput}
            onChange={(e) => setKdvTutarInput(e.target.value)}
            placeholder="Örn: 100000"
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* KDV Oranı */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            KDV Oranı
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 20, label: '%20 (Genel)' },
              { val: 10, label: '%10 (Gıda / Temel)' },
              { val: 1, label: '%1 (Özel)' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setKdvOrani(item.val)}
                className={`px-2.5 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer text-center ${
                  kdvOrani === item.val
                    ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tevkifat Oranları */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Kamu İhale Tevkifat Türü ve Oranı
          </label>
          <select
            value={selectedTevkifatKod}
            onChange={(e) => setSelectedTevkifatKod(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {TEVKIFAT_ORANLARI.map((item) => (
              <option key={item.kod} value={item.kod}>
                {item.ad} — ({item.aciklama})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sağ Sonuç Döküm Tablosu */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              KDV &amp; Tevkifat Dağılım Tablosu
            </h4>
            <span className="text-xs font-medium text-slate-500">
              Oran: %{kdvOrani} KDV | {selectedTevkifatKod} Tevkifat
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                KDV Hariç Matrah
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                {formatCurrency(kdvTevkifatSonuc.matrah)}
              </span>
            </div>

            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                İdarece Kesilen KDV (2 No&apos;lu)
              </span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1 block">
                {formatCurrency(kdvTevkifatSonuc.tevkifEdilenKdv)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Yükleniciye Ödenecek Tutar
              </span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {formatCurrency(kdvTevkifatSonuc.saticiyaOdenecekToplam)}
              </span>
            </div>
          </div>

          {/* Kalem Kalem Döküm */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-2">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">
                    Hesap Kalemi
                  </th>
                  <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300 text-right">
                    Tutar (₺)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">
                    1. Mal/Hizmet Bedeli (Matrah)
                  </td>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white text-right">
                    {formatCurrency(kdvTevkifatSonuc.matrah)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">
                    2. Toplam Hesaplanan KDV (%{kdvOrani})
                  </td>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white text-right">
                    {formatCurrency(kdvTevkifatSonuc.hesaplananKdv)}
                  </td>
                </tr>
                <tr className="bg-amber-50/30 dark:bg-amber-950/10">
                  <td className="p-2.5 font-medium text-amber-700 dark:text-amber-300">
                    3. Tevkif Edilen KDV ({selectedTevkifatKod} - İdarece Vergi Dairesine Ödenir)
                  </td>
                  <td className="p-2.5 font-bold text-amber-700 dark:text-amber-300 text-right">
                    - {formatCurrency(kdvTevkifatSonuc.tevkifEdilenKdv)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">
                    4. Yükleniciye Ödenecek KDV Payı
                  </td>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white text-right">
                    {formatCurrency(kdvTevkifatSonuc.saticiyaOdenecekKdv)}
                  </td>
                </tr>
                <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 font-bold">
                  <td className="p-3 text-emerald-800 dark:text-emerald-200">
                    5. Yükleniciye Ödenecek Net Tutar (Matrah + Kalan KDV)
                  </td>
                  <td className="p-3 text-emerald-800 dark:text-emerald-200 text-right">
                    {formatCurrency(kdvTevkifatSonuc.saticiyaOdenecekToplam)}
                  </td>
                </tr>
                <tr className="bg-slate-100 dark:bg-slate-800/80 font-semibold">
                  <td className="p-3 text-slate-900 dark:text-white">
                    Genel İşlem Toplamı (Matrah + Toplam KDV)
                  </td>
                  <td className="p-3 text-slate-900 dark:text-white text-right">
                    {formatCurrency(kdvTevkifatSonuc.genelToplam)}
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
