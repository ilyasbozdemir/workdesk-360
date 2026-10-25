import React from 'react'
import { Calculator, RotateCcw, Info } from 'lucide-react'
import { AY_ISIMLERI } from '../../../../../../services/yiUfeService'

interface YiUfeSimulatorCardProps {
  simTutar: string
  setSimTutar: (val: string) => void
  simBaseYil: number
  setUserBaseYil: (val: number | null) => void
  simBaseAy: number
  setUserBaseAy: (val: number | null) => void
  defaultBaseYear: number
  activeDosya: any
  simTargetYil: number
  setSimTargetYil: (val: number) => void
  simTargetAy: number
  setSimTargetAy: (val: number) => void
  allYearOptions: number[]
  simResult: any
  formatNumber: (val: number | null | undefined, digits?: number) => string
}

export const YiUfeSimulatorCard: React.FC<YiUfeSimulatorCardProps> = ({
  simTutar,
  setSimTutar,
  simBaseYil,
  setUserBaseYil,
  simBaseAy,
  setUserBaseAy,
  defaultBaseYear,
  activeDosya,
  simTargetYil,
  setSimTargetYil,
  simTargetAy,
  setSimTargetAy,
  allYearOptions,
  simResult,
  formatNumber
}) => {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Yİ-ÜFE Fiyat Güncelleme / Esleme Hesaplayıcı
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Geçmiş tarihli bir alım fiyatının bugünkü Yİ-ÜFE karşılığını ve fiyat farkı
              katsayısını hesaplar.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Formül: Pn = Yn / Y0 & Fiyat_Guncel = Fiyat_Eski × Pn
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
        {/* Sol Girdiler */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Eski / Baz Fiyat (₺)
            </label>
            <input
              type="text"
              value={simTutar}
              onChange={(e) => setSimTutar(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Örn: 100000"
            />
          </div>

          {/* Baz Tarih (Yıl & Ay) */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Baz Dönem (Alım/İhale Tarihi - Y0)
              </label>
              {simBaseYil !== defaultBaseYear && (
                <button
                  type="button"
                  onClick={() => {
                    setUserBaseYil(null)
                    setUserBaseAy(null)
                  }}
                  className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  title="Varsayılan yıla geri dön"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Varsayılana Dön ({defaultBaseYear})</span>
                </button>
              )}
            </div>

            {/* Varsayılan Değer Uyarı & Bilgi Rozeti */}
            <div
              className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border transition-all ${
                activeDosya
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
              }`}
            >
              <Info
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  activeDosya
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              />
              <div className="space-y-0.5 leading-snug">
                <span className="font-bold block text-[11px]">
                  {activeDosya
                    ? '⚡ Varsayılan Seçim: Aktif Dosya Bütçe Yılı'
                    : '⚡ Varsayılan Seçim: Cari Takvim Yılı'}
                </span>
                <p className="text-[11px] opacity-90">
                  {activeDosya ? (
                    <>
                      Açık olan{' '}
                      <strong>
                        {activeDosya.temin_no ? `[${activeDosya.temin_no}]` : ''}{' '}
                        {activeDosya.konu || 'çalışma dosyanızın'}
                      </strong>{' '}
                      bütçe yılı (<strong>{defaultBaseYear}</strong>) otomatik varsayılan baz dönem
                      olarak seçilmiştir.
                    </>
                  ) : (
                    <>
                      Şu anda açık bir çalışma dosyası bulunmadığı için cari yıl (
                      <strong>{defaultBaseYear}</strong>) varsayılan baz dönem olarak ayarlanmıştır.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <select
                value={simBaseYil}
                onChange={(e) => setUserBaseYil(parseInt(e.target.value, 10))}
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {allYearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y} {y === defaultBaseYear ? ' (Varsayılan)' : ''}
                  </option>
                ))}
              </select>
              <select
                value={simBaseAy}
                onChange={(e) => setUserBaseAy(parseInt(e.target.value, 10))}
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {AY_ISIMLERI.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              Baz Endeks (Y0): {formatNumber(simResult.baseIndex)}
            </div>
          </div>

          {/* Hedef Tarih (Güncelleme Tarihi - Yn) */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Hedef Dönem (Güncel Tarih - Yn)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={simTargetYil}
                onChange={(e) => setSimTargetYil(parseInt(e.target.value, 10))}
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {allYearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={simTargetAy}
                onChange={(e) => setSimTargetAy(parseInt(e.target.value, 10))}
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {AY_ISIMLERI.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              Hedef Endeks (Yn): {formatNumber(simResult.targetIndex)}
            </div>
          </div>
        </div>

        {/* Sağ Sonuç Kartı */}
        <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950/40 border border-blue-200/80 dark:border-indigo-900/50">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Bugünkü Güncel Yİ-ÜFE Karşılığı
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
                Pn: {formatNumber(simResult.factor, 4)}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
              ₺{formatNumber(simResult.adjustedPrice)}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-blue-200 dark:border-indigo-900/60 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Enflasyon Farkı:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                +₺{formatNumber(simResult.fark)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Artış Oranı:
              </span>
              <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono">
                +%{formatNumber(simResult.percentChange)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
