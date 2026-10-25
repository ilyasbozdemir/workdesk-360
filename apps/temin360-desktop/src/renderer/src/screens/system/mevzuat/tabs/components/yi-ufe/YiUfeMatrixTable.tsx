import React from 'react'
import { Calendar, Search } from 'lucide-react'
import { AY_ISIMLERI, YearEndeksGroup } from '../../../../../../services/yiUfeService'

interface YiUfeMatrixTableProps {
  filteredGroups: YearEndeksGroup[]
  selectedDecade: 'ALL' | '2020s' | '2010s' | '2000s' | '1990s'
  setSelectedDecade: (dec: 'ALL' | '2020s' | '2010s' | '2000s' | '1990s') => void
  searchYear: string
  setSearchYear: (val: string) => void
  onOpenAddForMonth: (yil: number, ay: number, currentVal?: number | null) => void
  formatNumber: (val: number | null | undefined, digits?: number) => string
}

export const YiUfeMatrixTable: React.FC<YiUfeMatrixTableProps> = ({
  filteredGroups,
  selectedDecade,
  setSelectedDecade,
  searchYear,
  setSearchYear,
  onOpenAddForMonth,
  formatNumber
}) => {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Tablo Üst Araç Çubuğu */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            TÜİK Yurt İçi Üretici Fiyat Endeksi Aylık Tablosu
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {filteredGroups.length} Yıl
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* On Yıl Filtresi */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            {(['ALL', '2020s', '2010s', '2000s', '1990s'] as const).map((dec) => (
              <button
                key={dec}
                onClick={() => setSelectedDecade(dec)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDecade === dec
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {dec === 'ALL'
                  ? 'Tümü'
                  : dec === '2020s'
                    ? '2020+'
                    : dec === '2010s'
                      ? '2010-19'
                      : dec === '2000s'
                        ? '2000-09'
                        : '1990-99'}
              </button>
            ))}
          </div>

          {/* Yıl Arama */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Yıl ara..."
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl w-28 focus:outline-none focus:ring-1.5 focus:ring-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-955/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 border-r border-slate-200 dark:border-slate-800">
                YIL
              </th>
              {AY_ISIMLERI.map((ay) => (
                <th key={ay} className="py-2.5 px-2 text-center font-bold tracking-tight">
                  {ay.toUpperCase()}
                </th>
              ))}
              <th className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-l border-slate-200 dark:border-slate-800">
                YIL ORT.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredGroups.map((row) => (
              <tr
                key={row.yil}
                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Yıl Sütunu */}
                <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span>{row.yil}</span>
                    {row.yil === 2026 && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-white">
                        Güncel
                      </span>
                    )}
                  </div>
                </td>

                {/* 12 Ay Hücreleri */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((ayNo) => {
                  const val = row.aylar[ayNo]
                  const hasVal = val !== null && val !== undefined
                  return (
                    <td
                      key={ayNo}
                      onClick={() => onOpenAddForMonth(row.yil, ayNo, val)}
                      className="py-2 px-1.5 text-center font-mono cursor-pointer hover:bg-indigo-100/60 dark:hover:bg-indigo-950/50 transition-colors group relative"
                      title={`${row.yil} ${AY_ISIMLERI[ayNo - 1]}: ${hasVal ? formatNumber(val) : 'Henüz açıklanmadı (Ekle)'}`}
                    >
                      {hasVal ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {formatNumber(val)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-600 hover:text-blue-500 hover:font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5">
                          + Ekle
                        </span>
                      )}
                    </td>
                  )
                })}

                {/* Yıl Ortalaması */}
                <td className="py-2.5 px-3 text-right font-black font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/10 border-l border-slate-200 dark:border-slate-800">
                  {formatNumber(row.ortalama)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
