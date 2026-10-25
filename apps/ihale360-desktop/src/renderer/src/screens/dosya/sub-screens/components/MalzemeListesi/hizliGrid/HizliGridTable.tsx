import React from 'react'
import { ArrowDownToLine, Copy, Loader2, PlusCircle, Sparkles, X } from 'lucide-react'
import { cn } from '../../../../../../utils/cn'
import type { HizliKalemRow } from '../types'

interface HizliGridTableProps {
  rows: HizliKalemRow[]
  defaultTipi: string
  defaultBirim: string
  isYapim: boolean
  unitOptions: string[]
  hoveredCell: { rowIdx: number; field: keyof HizliKalemRow } | null
  setHoveredCell: (cell: { rowIdx: number; field: keyof HizliKalemRow } | null) => void
  dragFill: {
    isDragging: boolean
    sourceRowIdx: number
    sourceField: keyof HizliKalemRow
    sourceValue: any
    targetRowIdx: number
  } | null
  rowInputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>
  aiLoadingIdx: number | null
  handleFillColumnDown: (field: keyof HizliKalemRow, fromRowIdx?: number) => void
  handleStartDragFill: (e: React.MouseEvent, rowIdx: number, field: keyof HizliKalemRow) => void
  handleDoubleClickFill: (rowIdx: number, field: keyof HizliKalemRow) => void
  handleCellKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIdx: number,
    field: keyof HizliKalemRow
  ) => void
  handleUpdateRow: (id: string, field: keyof HizliKalemRow, value: any) => void
  handleAiSuggestOkasForRow: (rowIdx: number) => void
  handleDuplicateRow: (idx: number) => void
  handleDeleteRow: (id: string) => void
  handleAddEmptyRow: (count?: number) => void
}

export function HizliGridTable({
  rows,
  defaultTipi,
  defaultBirim,
  isYapim,
  unitOptions,
  hoveredCell,
  setHoveredCell,
  dragFill,
  rowInputRefs,
  aiLoadingIdx,
  handleFillColumnDown,
  handleStartDragFill,
  handleDoubleClickFill,
  handleCellKeyDown,
  handleUpdateRow,
  handleAiSuggestOkasForRow,
  handleDuplicateRow,
  handleDeleteRow,
  handleAddEmptyRow
}: HizliGridTableProps): React.JSX.Element {
  const renderCellWithFillHandle = (
    rowIdx: number,
    field: keyof HizliKalemRow,
    children: React.ReactNode
  ) => {
    const isHovered = hoveredCell?.rowIdx === rowIdx && hoveredCell?.field === field
    const isDragSource = dragFill?.sourceRowIdx === rowIdx && dragFill?.sourceField === field
    const isDragTarget =
      dragFill &&
      dragFill.sourceField === field &&
      rowIdx >= Math.min(dragFill.sourceRowIdx, dragFill.targetRowIdx) &&
      rowIdx <= Math.max(dragFill.sourceRowIdx, dragFill.targetRowIdx)

    return (
      <div
        className={cn(
          'relative group/cell w-full h-full flex items-center transition-all',
          isDragTarget && 'bg-blue-100/60 dark:bg-blue-900/40 outline-1 outline-blue-500'
        )}
        onMouseEnter={() => setHoveredCell({ rowIdx, field })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {children}

        {/* Excel Fill Handle (Sağ Alt Sürükleme Noktası) */}
        {(isHovered || isDragSource) && !dragFill?.isDragging && (
          <div
            onMouseDown={(e) => handleStartDragFill(e, rowIdx, field)}
            onDoubleClick={() => handleDoubleClickFill(rowIdx, field)}
            title="Aşağı sürükleyerek alt satırlara çoğaltın veya tümüne uygulamak için çift tıklayın (Ctrl+D)"
            className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white dark:border-slate-900 rounded-2xs cursor-crosshair z-20 shadow-xs hover:scale-125 transition-transform"
          />
        )}
      </div>
    )
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
      <div className="max-h-[440px] overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          <thead className="bg-slate-100 dark:bg-slate-800/90 sticky top-0 z-10 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              {/* # */}
              <th className="w-10 px-2 py-2.5 text-center text-slate-400">#</th>

              {/* Tür */}
              <th className="w-28 px-2 py-2.5">
                <div className="flex items-center justify-between">
                  <span>Tür</span>
                  <button
                    type="button"
                    onClick={() => handleFillColumnDown('tipi', 0)}
                    title="1. Satırdaki Türü Tüm Satırlara Doldur"
                    className="p-0.5 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>

              {/* Kalem Adı */}
              <th className="w-72 sm:w-80 px-3 py-2.5">
                <span>
                  Kalem / İmalat Adı <span className="text-red-500">*</span>
                </span>
              </th>

              {/* Miktar */}
              <th className="w-20 px-2 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span>Miktar</span>
                </div>
              </th>

              {/* Birim */}
              <th className="w-28 px-2 py-2.5">
                <div className="flex items-center justify-between">
                  <span>Birim</span>
                  <button
                    type="button"
                    onClick={() => handleFillColumnDown('birim', 0)}
                    title="1. Satırdaki Birimi Tüm Satırlara Doldur"
                    className="p-0.5 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>

              {/* OKAS Kodu */}
              <th className="w-36 px-2 py-2.5">
                <div className="flex items-center justify-between">
                  <span>OKAS Kodu</span>
                  <button
                    type="button"
                    onClick={() => handleFillColumnDown('okas_kodu', 0)}
                    title="1. Satırdaki OKAS Kodunu Tüm Satırlara Doldur"
                    className="p-0.5 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>

              {/* Taşınır / Poz */}
              <th className="w-32 px-2 py-2.5">
                <div className="flex items-center justify-between">
                  <span>{isYapim ? 'Poz No' : 'Taşınır No'}</span>
                  <button
                    type="button"
                    onClick={() => handleFillColumnDown('tasinir_kodu', 0)}
                    title="1. Satırdaki Kodu Tüm Satırlara Doldur"
                    className="p-0.5 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>

              {/* KDV % */}
              <th className="w-24 px-2 py-2.5">
                <div className="flex items-center justify-between">
                  <span>KDV</span>
                  <button
                    type="button"
                    onClick={() => handleFillColumnDown('kdv_orani', 0)}
                    title="1. Satırdaki KDV Oranını Tüm Satırlara Doldur"
                    className="p-0.5 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>

              {/* Açıklama */}
              <th className="min-w-[140px] px-2.5 py-2.5">Açıklama / Not</th>

              {/* Aksiyon */}
              <th className="w-14 px-2 py-2.5 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                data-grid-row-idx={idx}
                className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors group"
              >
                {/* # Sıra No */}
                <td className="px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 font-bold">
                  {idx + 1}
                </td>

                {/* 1. TÜRU (Mal / Hizmet / Yapım) */}
                <td className="px-1.5 py-1">
                  {renderCellWithFillHandle(
                    idx,
                    'tipi',
                    <select
                      value={row.tipi || defaultTipi}
                      onChange={(e) => handleUpdateRow(row.id, 'tipi', e.target.value)}
                      onKeyDown={(e) => handleCellKeyDown(e, idx, 'tipi')}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Mal">Mal</option>
                      <option value="Hizmet">Hizmet</option>
                      <option value="Yapım">Yapım</option>
                      <option value="Danışmanlık">Danışmanlık</option>
                    </select>
                  )}
                </td>

                {/* 2. KALEM ADI */}
                <td className="px-1.5 py-1">
                  <input
                    ref={(el) => {
                      rowInputRefs.current[row.id] = el
                    }}
                    type="text"
                    value={row.kalem_adi}
                    onChange={(e) => handleUpdateRow(row.id, 'kalem_adi', e.target.value)}
                    onKeyDown={(e) => handleCellKeyDown(e, idx, 'kalem_adi')}
                    placeholder={`Örn: ${
                      idx === 0
                        ? isYapim
                          ? 'İç Cephe Boyası Yapılması'
                          : 'A4 Fotokopi Kağıdı 80gr'
                        : idx === 1
                          ? isYapim
                            ? 'Tavan Boyası Tamiratı'
                            : 'Plastik Telli Dosya'
                          : 'Kalem / İmalat Adı giriniz...'
                    }`}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </td>

                {/* 3. MİKTAR */}
                <td className="px-1.5 py-1">
                  {renderCellWithFillHandle(
                    idx,
                    'miktar',
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.miktar}
                      onChange={(e) =>
                        handleUpdateRow(row.id, 'miktar', parseFloat(e.target.value) || 1)
                      }
                      onKeyDown={(e) => handleCellKeyDown(e, idx, 'miktar')}
                      className="w-full text-center px-1.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>

                {/* 4. BİRİM */}
                <td className="px-1.5 py-1">
                  {renderCellWithFillHandle(
                    idx,
                    'birim',
                    <div className="relative w-full">
                      <input
                        type="text"
                        list={`units-list-${idx}`}
                        value={row.birim || defaultBirim}
                        onChange={(e) => handleUpdateRow(row.id, 'birim', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, idx, 'birim')}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <datalist id={`units-list-${idx}`}>
                        {unitOptions.map((u: string, uIdx: number) => (
                          <option key={uIdx} value={u} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </td>

                {/* 5. OKAS KODU */}
                <td className="px-1.5 py-1">
                  {renderCellWithFillHandle(
                    idx,
                    'okas_kodu',
                    <div className="relative w-full flex items-center">
                      <input
                        type="text"
                        value={row.okas_kodu || ''}
                        onChange={(e) => handleUpdateRow(row.id, 'okas_kodu', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, idx, 'okas_kodu')}
                        placeholder="Örn: 30192700-6"
                        className="w-full pl-2 pr-6 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAiSuggestOkasForRow(idx)}
                        disabled={aiLoadingIdx === idx}
                        title="Bu kalem için AI ile OKAS Kodu Bul"
                        className="absolute right-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 p-0.5 rounded cursor-pointer disabled:opacity-50"
                      >
                        {aiLoadingIdx === idx ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </td>

                {/* 6. TAŞINIR / POZ KODU */}
                <td className="px-1.5 py-1">
                  {renderCellWithFillHandle(
                    idx,
                    'tasinir_kodu',
                    <input
                      type="text"
                      value={row.tasinir_kodu || ''}
                      onChange={(e) => handleUpdateRow(row.id, 'tasinir_kodu', e.target.value)}
                      onKeyDown={(e) => handleCellKeyDown(e, idx, 'tasinir_kodu')}
                      placeholder={isYapim ? 'Örn: 15.120' : '150.01.01'}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>

                {/* 7. KDV ORANI */}
                <td className="px-1.5 py-1">
                  {renderCellWithFillHandle(
                    idx,
                    'kdv_orani',
                    <select
                      value={row.kdv_orani ?? 20}
                      onChange={(e) =>
                        handleUpdateRow(row.id, 'kdv_orani', parseInt(e.target.value, 10))
                      }
                      onKeyDown={(e) => handleCellKeyDown(e, idx, 'kdv_orani')}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-center"
                    >
                      <option value={20}>%20</option>
                      <option value={10}>%10</option>
                      <option value={1}>%1</option>
                      <option value={0}>%0</option>
                    </select>
                  )}
                </td>

                {/* 8. AÇIKLAMA */}
                <td className="px-1.5 py-1">
                  <input
                    type="text"
                    value={row.aciklama || ''}
                    onChange={(e) => handleUpdateRow(row.id, 'aciklama', e.target.value)}
                    onKeyDown={(e) => handleCellKeyDown(e, idx, 'aciklama')}
                    placeholder="Özellik, standart, marka..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>

                {/* 9. AKSİYONLAR */}
                <td className="px-1.5 py-1 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateRow(idx)}
                      title="Bu Satırı Çoğalt"
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      title="Satırı Sil"
                      className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablo Alt Çubuğu (Yeni Satır & İpuçları) */}
      <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => handleAddEmptyRow(1)}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer px-2 py-1"
        >
          <PlusCircle className="w-4 h-4" />
          Yeni Boş Satır Ekle (veya Enter tuşuna basın)
        </button>
        <div className="text-[11px] text-slate-400 flex items-center gap-3">
          <span>
            ✨ <strong>Ctrl+D:</strong> Üst satırı kopyalar
          </span>
          <span>
            🖱️ <strong>Çift Tık:</strong> Sütunu aşağı doldurur
          </span>
        </div>
      </div>
    </div>
  )
}
