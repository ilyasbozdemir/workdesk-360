import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { cn } from '../../../../utils/cn'
import { TopluPozRow } from './toplu.types'

interface TopluGridTabProps {
  rows: TopluPozRow[]
  validRowCount: number
  handleAddRow: () => void
  handleAddMultipleRows: (count: number) => void
  handleClearAll: () => void
  handleUpdateRow: (id: string, field: keyof TopluPozRow, value: any) => void
  handleDeleteRow: (id: string) => void
}

export function TopluGridTab({
  rows,
  validRowCount,
  handleAddRow,
  handleAddMultipleRows,
  handleClearAll,
  handleUpdateRow,
  handleDeleteRow
}: TopluGridTabProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Üst Araç Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={handleAddRow}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs py-1.5 px-3 cursor-pointer"
          >
            <Plus size={14} />
            <span>+1 Satır Ekle</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddMultipleRows(5)}
            className="gap-1.5 text-xs py-1.5 px-3 cursor-pointer"
          >
            <Plus size={14} />
            <span>+5 Satır Ekle</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddMultipleRows(10)}
            className="gap-1.5 text-xs py-1.5 px-3 cursor-pointer"
          >
            <Plus size={14} />
            <span>+10 Satır Ekle</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleClearAll}
            className="gap-1.5 text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 border-red-200 dark:border-red-900 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Tümünü Temizle</span>
          </Button>
        </div>

        <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>
            Toplam <strong>{rows.length}</strong> satırdan{' '}
            <strong className="text-emerald-600">{validRowCount}</strong> tanesi geçerli veri
            içeriyor.
          </span>
        </div>
      </div>

      {/* Tablo Alanı (Spreadsheet) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="p-3 pl-4 w-12 text-center">#</th>
                <th className="p-3 min-w-[140px]">Poz No *</th>
                <th className="p-3 min-w-[130px]">Eski Poz No</th>
                <th className="p-3 min-w-[280px]">İmalat / Poz Tanımı *</th>
                <th className="p-3 min-w-[100px]">Birim *</th>
                <th className="p-3 min-w-[120px]">Poz Tipi</th>
                <th className="p-3 min-w-[110px]">Kurum</th>
                <th className="p-3 min-w-[200px]">Bulunduğu Fasikül</th>
                <th className="p-3 min-w-[130px] text-right">Birim Fiyat (TL)</th>
                <th className="p-3 min-w-[100px]">Dönem</th>
                <th className="p-3 min-w-[110px]">OKAS Kodu</th>
                <th className="p-3 min-w-[80px]">KDV %</th>
                <th className="p-3 pr-4 w-12 text-center">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
              {rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors',
                    (row.poz_no || row.kalem_adi) && 'bg-emerald-50/10 dark:bg-emerald-950/5'
                  )}
                >
                  {/* Sıra No */}
                  <td className="p-2 pl-4 text-center font-bold text-slate-400 font-sans">
                    {idx + 1}
                  </td>

                  {/* Poz No */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.poz_no}
                      onChange={(e) => handleUpdateRow(row.id, 'poz_no', e.target.value)}
                      placeholder="Örn: 15.110.1001"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Eski Poz No */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.eski_poz_no}
                      onChange={(e) => handleUpdateRow(row.id, 'eski_poz_no', e.target.value)}
                      placeholder="Örn: 14.040/1"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-blue-700 dark:text-blue-300 font-semibold focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* İmalat / Poz Tanımı */}
                  <td className="p-2 font-sans">
                    <input
                      type="text"
                      value={row.kalem_adi}
                      onChange={(e) => handleUpdateRow(row.id, 'kalem_adi', e.target.value)}
                      placeholder="İmalat / Poz Tanımı giriniz..."
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Birim */}
                  <td className="p-2">
                    <select
                      value={row.birim}
                      onChange={(e) => handleUpdateRow(row.id, 'birim', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                    >
                      <option value="m³">m³</option>
                      <option value="m²">m²</option>
                      <option value="mt">mt</option>
                      <option value="Adet">Adet</option>
                      <option value="ton">ton</option>
                      <option value="kg">kg</option>
                      <option value="Set">Set</option>
                      <option value="Götürü">Götürü</option>
                      <option value="saat">saat</option>
                      <option value="km">km</option>
                    </select>
                  </td>

                  {/* Poz Tipi */}
                  <td className="p-2">
                    <select
                      value={row.poz_tipi}
                      onChange={(e) => handleUpdateRow(row.id, 'poz_tipi', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      <option value="Analiz">Analiz</option>
                      <option value="Rayiç">Rayiç</option>
                      <option value="İmalat">İmalat</option>
                      <option value="Montaj">Montaj</option>
                      <option value="Özel">Özel Poz</option>
                    </select>
                  </td>

                  {/* Kurum */}
                  <td className="p-2">
                    <select
                      value={row.poz_kurumu}
                      onChange={(e) => handleUpdateRow(row.id, 'poz_kurumu', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs"
                    >
                      <option value="ÇŞB">ÇŞB</option>
                      <option value="KGM">KGM</option>
                      <option value="DSİ">DSİ</option>
                      <option value="İLBANK">İLBANK</option>
                      <option value="VAKIF">VAKIF</option>
                      <option value="ÖZEL">ÖZEL</option>
                    </select>
                  </td>

                  {/* Fasikül */}
                  <td className="p-2 font-sans">
                    <input
                      type="text"
                      value={row.fasikul}
                      onChange={(e) => handleUpdateRow(row.id, 'fasikul', e.target.value)}
                      placeholder="Fasikül / Kitap Adı"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </td>

                  {/* Birim Fiyat (TL) */}
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={row.birim_fiyat}
                      onChange={(e) => handleUpdateRow(row.id, 'birim_fiyat', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-emerald-600 dark:text-emerald-400 text-right"
                    />
                  </td>

                  {/* Dönem */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.fiyat_donemi}
                      onChange={(e) => handleUpdateRow(row.id, 'fiyat_donemi', e.target.value)}
                      placeholder="2026/1"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold"
                    />
                  </td>

                  {/* OKAS Kodu */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.okas_kodu}
                      onChange={(e) => handleUpdateRow(row.id, 'okas_kodu', e.target.value)}
                      placeholder="45000000"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-purple-700 dark:text-purple-300"
                    />
                  </td>

                  {/* KDV */}
                  <td className="p-2">
                    <select
                      value={row.kdv_orani}
                      onChange={(e) => handleUpdateRow(row.id, 'kdv_orani', Number(e.target.value))}
                      className="w-full px-1.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-center"
                    >
                      <option value={20}>%20</option>
                      <option value={10}>%10</option>
                      <option value={1}>%1</option>
                      <option value={0}>%0</option>
                    </select>
                  </td>

                  {/* Sil Butonu */}
                  <td className="p-2 pr-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Satırı Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
