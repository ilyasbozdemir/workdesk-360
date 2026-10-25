import React, { useState, useMemo } from 'react'
import { TrendingUp, Copy, Check } from 'lucide-react'
import {
  calculateFiyatFarki,
  formatCurrency,
  SAMPLE_YIUFE_INDEXES
} from '../../../utils/turkishCalculationUtils'

interface YiUfeToolProps {
  onCopy: (text: string, key?: string) => void
  copiedKey: string | null
}

export function YiUfeTool({ onCopy, copiedKey }: YiUfeToolProps): React.JSX.Element {
  const [hakedisTutari, setHakedisTutari] = useState<string>('500000')
  const [temelEndeksIndex, setTemelEndeksIndex] = useState<number>(0) // 2024 Ocak
  const [guncelEndeksIndex, setGuncelEndeksIndex] = useState<number>(
    SAMPLE_YIUFE_INDEXES.length - 1
  ) // En güncel
  const [customTemel, setCustomTemel] = useState<string>('')
  const [customGuncel, setCustomGuncel] = useState<string>('')
  const [sabitKatsayiB, setSabitKatsayiB] = useState<number>(0.9)

  const yiUfeSonuc = useMemo(() => {
    const tutar = parseFloat(hakedisTutari.replace(',', '.')) || 0
    const temel = customTemel
      ? parseFloat(customTemel.replace(',', '.'))
      : SAMPLE_YIUFE_INDEXES[temelEndeksIndex]?.endeks || 0
    const guncel = customGuncel
      ? parseFloat(customGuncel.replace(',', '.'))
      : SAMPLE_YIUFE_INDEXES[guncelEndeksIndex]?.endeks || 0

    return calculateFiyatFarki({
      hakedisTutari: tutar,
      temelEndeks: temel,
      guncelEndeks: guncel,
      sabitKatsayiB
    })
  }, [hakedisTutari, temelEndeksIndex, guncelEndeksIndex, customTemel, customGuncel, sabitKatsayiB])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sol Ayar Paneli */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Fiyat Farkı Parametreleri
          </h3>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
            4734 Esasları
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Hakediş / Sözleşme Tutarı (Aₙ)
          </label>
          <input
            type="text"
            value={hakedisTutari}
            onChange={(e) => setHakedisTutari(e.target.value)}
            placeholder="Örn: 500000"
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Temel Endeks (Yo / Po) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Temel Endeks (İhale / Sözleşme Ayı - Y₀)
            </label>
            <span className="text-[11px] text-slate-400">TÜİK Yİ-ÜFE</span>
          </div>
          <select
            value={temelEndeksIndex}
            onChange={(e) => {
              setTemelEndeksIndex(Number(e.target.value))
              setCustomTemel('')
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {SAMPLE_YIUFE_INDEXES.map((item, idx) => (
              <option key={idx} value={idx}>
                {item.yil} {item.ay} — {item.endeks.toFixed(2)}
              </option>
            ))}
          </select>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              value={customTemel}
              onChange={(e) => setCustomTemel(e.target.value)}
              placeholder="Manuel temel endeks değeri..."
              className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Güncel Endeks (Yn / Pn) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Güncel Endeks (Uygulama / Hakediş Ayı - Yₙ)
            </label>
            <span className="text-[11px] text-slate-400">TÜİK Yİ-ÜFE</span>
          </div>
          <select
            value={guncelEndeksIndex}
            onChange={(e) => {
              setGuncelEndeksIndex(Number(e.target.value))
              setCustomGuncel('')
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {SAMPLE_YIUFE_INDEXES.map((item, idx) => (
              <option key={idx} value={idx}>
                {item.yil} {item.ay} — {item.endeks.toFixed(2)}
              </option>
            ))}
          </select>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              value={customGuncel}
              onChange={(e) => setCustomGuncel(e.target.value)}
              placeholder="Manuel güncel endeks değeri..."
              className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Sabit Katsayı B */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Sabit Katsayı (B Katsayısı - Genelde 0.90)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 0.9, label: '0.90 (Standart)' },
              { val: 1.0, label: '1.00 (Tam Oran)' },
              { val: 0.85, label: '0.85' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setSabitKatsayiB(item.val)}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                  sabitKatsayiB === item.val
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

      {/* Sağ Hesaplama Sonuç Raporu */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Fiyat Farkı Hesaplama Çıktısı
              </h4>
              <p className="text-xs text-slate-500">
                Formül:{' '}
                <code className="font-mono text-blue-600 dark:text-blue-400">
                  F = Aₙ × B × (Pₙ/P₀ - 1)
                </code>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const report = `FİYAT FARKI HESAPLAMA RAPORU\nHakediş Tutarı: ${formatCurrency(parseFloat(hakedisTutari) || 0)}\nTemel Endeks (Yo): ${customTemel || SAMPLE_YIUFE_INDEXES[temelEndeksIndex]?.endeks}\nGüncel Endeks (Yn): ${customGuncel || SAMPLE_YIUFE_INDEXES[guncelEndeksIndex]?.endeks}\nArtış Oranı: %${yiUfeSonuc.artisOrani.toFixed(2)}\nHesaplanan Fiyat Farkı: ${formatCurrency(yiUfeSonuc.fiyatFarkiTutari)}\nToplam Ödenecek: ${formatCurrency(yiUfeSonuc.guncelToplamTutar)}`
                onCopy(report, 'yi_ufe_report')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              {copiedKey === 'yi_ufe_report' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Rapor Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Raporu Kopyala
                </>
              )}
            </button>
          </div>

          {/* Büyük Vurgulu Kartlar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Hesaplanan Fiyat Farkı (F)
              </span>
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1 block">
                {formatCurrency(yiUfeSonuc.fiyatFarkiTutari)}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Toplam Ödenecek (Aₙ + F)
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {formatCurrency(yiUfeSonuc.guncelToplamTutar)}
              </span>
            </div>

            <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 rounded-xl">
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                Endeks Artış Oranı
              </span>
              <span className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1 block">
                %{yiUfeSonuc.artisOrani.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Detay Döküm Tablosu */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-2.5 font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50 w-1/2">
                    Hakediş Ana Tutarı (Aₙ)
                  </td>
                  <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(parseFloat(hakedisTutari) || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    Temel Endeks (Y₀)
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                    {customTemel || SAMPLE_YIUFE_INDEXES[temelEndeksIndex]?.endeks.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    Güncel Endeks (Yₙ)
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                    {customGuncel || SAMPLE_YIUFE_INDEXES[guncelEndeksIndex]?.endeks.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    Fiyat Endeks Katsayısı (Pₙ / P₀)
                  </td>
                  <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200">
                    {yiUfeSonuc.fiyatEndeksKatsayisi.toFixed(6)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                    Katsayı B (Fiyat Farkı Katsayısı)
                  </td>
                  <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200">
                    {sabitKatsayiB.toFixed(2)}
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
