import React from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  DosyaRow,
  SUREC_ASAMALARI,
  TEMIN_SEKILLERI,
  TEMIN_TURLERI,
  formatDateTimeLocal
} from './hizliDosyaEkle.types'

interface HizliDosyaEkleTableProps {
  rows: DosyaRow[]
  selectedKeys: Set<string>
  isAllSelected: boolean
  toggleSelectAll: () => void
  toggleSelectRow: (key: string) => void
  updateRow: (key: string, field: keyof DosyaRow, value: string) => void
  removeRow: (row: DosyaRow) => void
  addRow: () => void
  result: {
    inserted: number
    updated: number
    errors: string[]
  } | null
  tableRef: React.RefObject<HTMLDivElement | null>
}

const cell =
  'w-full h-8 px-2 text-sm bg-transparent border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 rounded-lg outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-700'
const sel =
  'w-full h-8 pl-2 pr-6 text-sm bg-transparent border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 rounded-lg outline-none transition-colors appearance-none cursor-pointer'

export const HizliDosyaEkleTable: React.FC<HizliDosyaEkleTableProps> = ({
  rows,
  selectedKeys,
  isAllSelected,
  toggleSelectAll,
  toggleSelectRow,
  updateRow,
  removeRow,
  addRow,
  result,
  tableRef
}) => {
  return (
    <>
      {/* Sonuç Bildirimi */}
      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
            result.errors.length === 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
          }`}
        >
          {result.errors.length === 0 ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              {result.inserted > 0 && `${result.inserted} yeni doğrudan temin dosyası eklendi. `}
              {result.updated > 0 && `${result.updated} dosya güncellendi.`}
              {result.errors.length > 0 && ` ${result.errors.length} hatalı kayıt.`}
            </p>
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs mt-0.5 opacity-80">
                • {e}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* İpucu */}
      <p className="text-xs text-slate-400 dark:text-slate-500 -mb-2">
        <span className="inline-block w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700 mr-1" />
        Mevcut •{' '}
        <span className="inline-block w-2.5 h-2.5 rounded bg-amber-200 dark:bg-amber-900 mr-1" />
        Değiştirilen Mevcut •{' '}
        <span className="inline-block w-2.5 h-2.5 rounded bg-green-200 dark:bg-green-900 mr-1" />
        Yeni Kayıt &nbsp;·&nbsp; Excel sütun sırası:{' '}
        <strong>
          Dosya No | DT No | Dosya Adı | Açıklama | Temin Türü | Temin Şekli | Açılış Tarihi | Son
          Teklif Tarih/Saati | Tahmini Bitiş | Süreç Aşaması
        </strong>
      </p>

      {/* Tablo */}
      <div
        ref={tableRef}
        className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <table className="w-full text-sm border-collapse min-w-[1350px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  title="Tümünü Seç"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="w-16 px-3 py-3 text-center">ID</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Dosya No</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">D.T. No</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Dosya Adı *</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Açıklama</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Temin Türü</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Temin Şekli</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Açılış Tarihi</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Son Teklif Tarih/Saati</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Tahmini Bitiş</th>
              <th className="px-3 py-3 text-left whitespace-nowrap">Süreç Aşaması</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {rows.map((row) => {
              const isSelected = selectedKeys.has(row._key)
              return (
                <tr
                  key={row._key}
                  className={`group transition-colors ${
                    isSelected
                      ? 'bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-100/80 dark:hover:bg-blue-900/40'
                      : row._dirty && row.dosya_adi.trim()
                        ? row.id !== null
                          ? 'bg-amber-100/50 dark:bg-amber-900/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/40'
                          : 'bg-green-50/60 dark:bg-green-900/20 hover:bg-green-50 dark:hover:bg-green-900/30'
                        : row.id !== null
                          ? 'bg-slate-100/80 dark:bg-slate-800/40 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                          : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <td className="px-3 py-1.5 text-center">
                    {row.dosya_adi.trim() !== '' && (
                      <input
                        type="checkbox"
                        title="Seç"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row._key)}
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    )}
                  </td>

                  <td className="px-3 py-1.5 text-center">
                    {row.id !== null ? (
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                        #{row.id}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-700">YENİ</span>
                    )}
                  </td>

                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.dosya_no}
                      onChange={(e) => updateRow(row._key, 'dosya_no', e.target.value)}
                      placeholder="2026/001"
                      className={`${cell} min-w-[90px]`}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.dt_no}
                      onChange={(e) => updateRow(row._key, 'dt_no', e.target.value)}
                      placeholder="DT-001"
                      className={`${cell} min-w-[80px]`}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.dosya_adi}
                      onChange={(e) => updateRow(row._key, 'dosya_adi', e.target.value)}
                      placeholder="Kırtasiye Alımı..."
                      className={`${cell} min-w-[200px]`}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.aciklama}
                      onChange={(e) => updateRow(row._key, 'aciklama', e.target.value)}
                      placeholder="Opsiyonel..."
                      className={`${cell} min-w-[130px]`}
                    />
                  </td>

                  {/* Temin Türü (Alım Türü) */}
                  <td className="px-2 py-1.5">
                    <div className="relative min-w-[100px]">
                      <select
                        title="Temin / Alım türü"
                        value={row.temin_turu}
                        onChange={(e) => updateRow(row._key, 'temin_turu', e.target.value)}
                        className={sel}
                      >
                        {TEMIN_TURLERI.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </td>

                  {/* Temin Şekli */}
                  <td className="px-2 py-1.5">
                    <div className="relative min-w-[85px]">
                      <select
                        title="Temin şekli / usulü"
                        value={row.temin_sekli}
                        onChange={(e) => updateRow(row._key, 'temin_sekli', e.target.value)}
                        className={sel}
                      >
                        {TEMIN_SEKILLERI.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </td>

                  {/* Dosya Açılış Tarihi */}
                  <td className="px-2 py-1.5">
                    <input
                      type="date"
                      title="Dosya Açılış Tarihi"
                      value={row.dosya_acilis_tarihi}
                      onChange={(e) => updateRow(row._key, 'dosya_acilis_tarihi', e.target.value)}
                      className={`${cell} min-w-[125px]`}
                    />
                  </td>

                  {/* Son Teklif Verme Tarih ve Saati */}
                  <td className="px-2 py-1.5">
                    <input
                      type="datetime-local"
                      title="Son Teklif Verme Tarih & Saati"
                      value={formatDateTimeLocal(row.son_teklif_verme_tarihi)}
                      onChange={(e) =>
                        updateRow(row._key, 'son_teklif_verme_tarihi', e.target.value)
                      }
                      className={`${cell} min-w-[155px] font-mono text-xs`}
                    />
                  </td>

                  {/* Tahmini Bitiş / Teslim Tarihi */}
                  <td className="px-2 py-1.5">
                    <input
                      type="date"
                      title="Tahmini Bitiş / Teslim Tarihi"
                      value={row.teslim_tarihi}
                      onChange={(e) => updateRow(row._key, 'teslim_tarihi', e.target.value)}
                      className={`${cell} min-w-[125px]`}
                    />
                  </td>

                  {/* Süreç Aşaması */}
                  <td className="px-2 py-1.5">
                    <div className="relative min-w-[130px]">
                      <select
                        title="Süreç aşaması"
                        value={row.surec_asamasi}
                        onChange={(e) => updateRow(row._key, 'surec_asamasi', e.target.value)}
                        className={sel}
                      >
                        {SUREC_ASAMALARI.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </td>

                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(row)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Yeni Satır Ekle
      </button>
    </>
  )
}
