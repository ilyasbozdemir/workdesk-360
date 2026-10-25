import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardPaste,
  Copy,
  Edit3,
  FileJson,
  Tag,
  Trash2,
  X
} from 'lucide-react'
import { copyToClipboard, readFromClipboard } from '@renderer/utils/copyToClipboard'
import { ColumnInfo, EditingCell } from './types'

interface DataTableTabProps {
  filteredRows: Record<string, unknown>[]
  columns: ColumnInfo[]
  editingCell: EditingCell | null
  setEditingCell: (cell: EditingCell | null) => void
  editValue: string
  setEditValue: (val: string) => void
  handleCellClick: (
    rowIndex: number,
    colName: string,
    val: unknown,
    row: Record<string, unknown>
  ) => void
  handleSaveCell: () => Promise<void>
  setDeletingRow: (row: Record<string, unknown>) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  pageSize: number
  setPageSize: (size: number) => void
  totalRows: number
  totalPages: number
  loading?: boolean
}

interface SelectedCell {
  rIdx: number
  colName: string
}

interface ContextMenuState {
  x: number
  y: number
  rIdx: number
  colName: string
  val: unknown
}

interface FeedbackState {
  rIdx: number
  colName: string
  type: 'copy' | 'paste'
  text: string
}

export const DataTableTab = memo(function DataTableTab({
  filteredRows,
  columns,
  editingCell,
  setEditingCell,
  editValue,
  setEditValue,
  handleCellClick,
  handleSaveCell,
  setDeletingRow,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalRows,
  totalPages,
  loading
}: DataTableTabProps): React.JSX.Element {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isEditValueCopied, setIsEditValueCopied] = useState<boolean>(false)
  const inlineInputRef = useRef<HTMLInputElement>(null)

  const activeColInfo = editingCell ? columns.find((c) => c.name === editingCell.colName) : null
  const isEditingRelational =
    activeColInfo && (activeColInfo.pk > 0 || activeColInfo.name.endsWith('_id'))

  // Auto-focus and select text when cell editing opens
  useEffect(() => {
    if (editingCell) {
      setTimeout(() => {
        inlineInputRef.current?.focus()
        inlineInputRef.current?.select()
      }, 50)
    }
  }, [editingCell])

  const showFeedback = useCallback(
    (rIdx: number, colName: string, type: 'copy' | 'paste', text: string): void => {
      setFeedback({ rIdx, colName, type, text })
      setTimeout(() => {
        setFeedback(null)
      }, 1800)
    },
    []
  )

  const handleCopyCellValue = useCallback(
    async (rIdx: number, colName: string, val: unknown, e?: React.MouseEvent): Promise<void> => {
      if (e) e.stopPropagation()
      const text =
        val === null || val === undefined
          ? ''
          : typeof val === 'object'
            ? JSON.stringify(val)
            : String(val)
      await copyToClipboard(text)
      showFeedback(rIdx, colName, 'copy', 'Kopyalandı!')
    },
    [showFeedback]
  )

  const handlePasteToCell = useCallback(
    async (rIdx: number, colName: string, e?: React.MouseEvent): Promise<void> => {
      if (e) e.stopPropagation()
      try {
        const text = await readFromClipboard()
        const row = filteredRows[rIdx]
        const origVal = row ? row[colName] : null
        if (row) {
          handleCellClick(rIdx, colName, origVal, row)
          setEditValue(text)
          showFeedback(rIdx, colName, 'paste', 'Yapıştırıldı!')
        }
      } catch {
        /* clipboard read permission */
      }
    },
    [filteredRows, handleCellClick, setEditValue, showFeedback]
  )

  const handleCopyEditValue = async (): Promise<void> => {
    await copyToClipboard(editValue)
    setIsEditValueCopied(true)
    setTimeout(() => {
      setIsEditValueCopied(false)
    }, 1800)
  }

  const handlePasteFromClipboard = async (): Promise<void> => {
    try {
      const text = await readFromClipboard()
      setEditValue(text)
    } catch {
      /* clipboard read permission */
    }
  }

  const handleSetNull = (): void => {
    setEditValue('')
  }

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (): void => setContextMenu(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // Keyboard navigation & Shortcuts (Ctrl+C, Ctrl+V, Enter, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (!selectedCell || editingCell) return

      const { rIdx, colName } = selectedCell
      const row = filteredRows[rIdx]
      const val = row ? row[colName] : null

      // Copy: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        void handleCopyCellValue(rIdx, colName, val)
        return
      }

      // Paste: Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        void handlePasteToCell(rIdx, colName)
        return
      }

      // Edit: Enter or F2
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault()
        if (row) {
          handleCellClick(rIdx, colName, val, row)
        }
        return
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        setSelectedCell(null)
        setContextMenu(null)
        return
      }

      // Arrow navigation
      const colIndex = columns.findIndex((c) => c.name === colName)
      if (colIndex === -1) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (rIdx > 0) setSelectedCell({ rIdx: rIdx - 1, colName })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (rIdx < filteredRows.length - 1) setSelectedCell({ rIdx: rIdx + 1, colName })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (colIndex > 0) setSelectedCell({ rIdx, colName: columns[colIndex - 1].name })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (colIndex < columns.length - 1)
          setSelectedCell({ rIdx, colName: columns[colIndex + 1].name })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedCell,
    editingCell,
    filteredRows,
    columns,
    handleCellClick,
    handleCopyCellValue,
    handlePasteToCell
  ])

  const selectedRowData = selectedCell ? filteredRows[selectedCell.rIdx] : null
  const selectedCellValue =
    selectedCell && selectedRowData ? selectedRowData[selectedCell.colName] : null

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden relative">
      {/* 1. TOP BAR: A) EDITING MODE OR B) SELECTED CELL TOOLBAR */}
      {editingCell ? (
        <div className="mb-3 px-4 py-2 bg-linear-to-r from-blue-50 via-indigo-50/80 to-blue-50 dark:from-blue-950/80 dark:via-indigo-950/60 dark:to-blue-950/80 border-2 border-blue-500/80 dark:border-blue-400 rounded-xl flex items-center justify-between gap-3 shadow-md shadow-blue-500/10 animate-in fade-in slide-in-from-top-1 shrink-0 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs shrink-0">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Hücre Düzenleme Modu</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-200 truncate font-sans">
              <span className="text-slate-400">Satır:</span>{' '}
              <strong className="font-mono text-blue-700 dark:text-blue-300 font-bold">
                #{(page - 1) * pageSize + editingCell.rowIndex + 1}
              </strong>
              <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-400">Kolon:</span>{' '}
              <strong className="font-mono text-blue-700 dark:text-blue-300 font-bold">
                {editingCell.colName}
              </strong>
              {isEditingRelational && (
                <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-sans">
                  ⚠️ İlişkili / ID Alanı
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-2xl min-w-80">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                onFocus={(e) => e.target.select()}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveCell()
                  if (e.key === 'Escape') setEditingCell(null)
                }}
                placeholder="Yeni değer girin (Boş = NULL)..."
                className="w-full bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-400 rounded-lg pl-3 pr-20 py-1.5 text-xs font-sans font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
              />
              <div className="absolute right-1.5 top-1 flex items-center gap-1">
                {editValue !== String(editingCell.originalValue ?? '') && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1">
                    *Değişti
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSetNull}
                  className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border-0 cursor-pointer"
                  title="Değeri Boşalt / NULL Yap"
                >
                  NULL
                </button>
              </div>
            </div>

            {/* Quick Paste Button */}
            <button
              type="button"
              onClick={() => void handlePasteFromClipboard()}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
              title="Panodaki Metni Yapıştır (Ctrl+V)"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Yapıştır</span>
            </button>

            {/* Quick Copy Button */}
            <button
              type="button"
              onClick={() => void handleCopyEditValue()}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
              title="Mevcut Değeri Kopyala (Ctrl+C)"
            >
              {isEditValueCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Kopyala</span>
                </>
              )}
            </button>

            {/* Save Button */}
            <button
              onClick={() => void handleSaveCell()}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 shadow-sm shadow-emerald-600/20 shrink-0"
              title="Değişikliği Kaydet (Enter)"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Kaydet</span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => setEditingCell(null)}
              className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border-0 shrink-0"
              title="İptal (Esc)"
            >
              <X className="w-3.5 h-3.5" />
              <span>İptal</span>
            </button>
          </div>
        </div>
      ) : selectedCell ? (
        /* Selected Cell Quick Action Bar */
        <div className="mb-3 px-4 py-2 bg-linear-to-r from-blue-50/90 via-slate-50 to-indigo-50/70 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between gap-3 shadow-xs shrink-0 flex-wrap animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white shadow-xs">
              Seçili Hücre
            </span>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-sans flex items-center gap-2 truncate">
              <span className="text-slate-400">Satır:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                #{(page - 1) * pageSize + selectedCell.rIdx + 1}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-400">Sütun:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedCell.colName}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-400">Değer:</span>
              <span className="font-sans font-semibold text-slate-800 dark:text-slate-200 truncate max-w-64 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {selectedCellValue === null || selectedCellValue === undefined
                  ? 'NULL'
                  : String(selectedCellValue)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Direct Copy Button */}
            <button
              type="button"
              onClick={() =>
                void handleCopyCellValue(selectedCell.rIdx, selectedCell.colName, selectedCellValue)
              }
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Hücreyi Panoya Kopyala"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Kopyala</span>
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-400 px-1 py-0.5 rounded font-mono">
                Ctrl+C
              </kbd>
            </button>

            {/* Direct Paste Button */}
            <button
              type="button"
              onClick={() => void handlePasteToCell(selectedCell.rIdx, selectedCell.colName)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border-0 shadow-xs shadow-blue-600/20 cursor-pointer transition-all active:scale-95"
              title="Panodaki Değeri Buraya Yapıştır"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Yapıştır</span>
              <kbd className="text-[10px] bg-blue-700/80 text-blue-100 px-1 py-0.5 rounded font-mono">
                Ctrl+V
              </kbd>
            </button>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedRowData) {
                  handleCellClick(
                    selectedCell.rIdx,
                    selectedCell.colName,
                    selectedCellValue,
                    selectedRowData
                  )
                }
              }}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Hücreyi Düzenle (Enter)"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Düzenle</span>
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-400 px-1 py-0.5 rounded font-mono">
                Enter
              </kbd>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-0 bg-transparent cursor-pointer"
              title="Seçimi Kaldır (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* 2. INTERACTIVE DATA GRID */}
      <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl custom-scrollbar relative bg-white dark:bg-slate-950 focus:outline-none">
        {filteredRows.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-400 italic">
            Bu tabloda aramanızla eşleşen kayıt bulunamadı.
          </div>
        ) : (
          <table className="w-full border-collapse text-xs text-left select-text font-sans">
            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold border-b border-slate-200 dark:border-slate-800 z-20">
              <tr>
                <th className="p-2.5 w-14 text-center border-r border-slate-200 dark:border-slate-800 text-slate-400 select-none">
                  #
                </th>
                {columns.map((c) => {
                  const isPk = c.pk > 0
                  const isFk = c.name.endsWith('_id') || (c.name === 'id' && !isPk)
                  const isSystemFlag = [
                    'durum_asama_id',
                    'aktif_mi',
                    'is_deleted',
                    'status'
                  ].includes(c.name)

                  return (
                    <th
                      key={c.name}
                      className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap select-none text-[11px]"
                    >
                      {c.name}
                      {isPk && (
                        <span
                          title={
                            c.pk > 1
                              ? 'Birleşik Birincil Anahtar Parçası (Composite PK): Bu alan diğer anahtar kolonlarla birlikte tekil bir satırı tanımlar.'
                              : 'Birincil Anahtar (Kritik ID): Bu ID değiştirilirse ilişkili tüm tablolardaki bağlantılar kopabilir!'
                          }
                          className="ml-1 text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 px-1.5 py-0.5 rounded uppercase font-extrabold font-sans cursor-help"
                        >
                          {c.pk > 1 ? `PK #${c.pk} 🔑` : 'PK 🔑'}
                        </span>
                      )}
                      {!isPk && isFk && (
                        <span
                          title="İlişkili Dış Anahtar (FK): Başka bir tablonun ID değerine işaret eder (Örn: temin_dosya_id, firma_id)."
                          className="ml-1 text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 px-1.5 py-0.5 rounded uppercase font-extrabold font-sans cursor-help"
                        >
                          FK 🔗
                        </span>
                      )}
                      {isSystemFlag && (
                        <span
                          title="Süreç ve Durum Kontrol Alanı: Uygulama mantığını etkiler."
                          className="ml-1 text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase font-extrabold font-sans cursor-help"
                        >
                          SİSTEM ⚙️
                        </span>
                      )}
                    </th>
                  )
                })}
                <th className="p-2.5 w-14 text-center text-slate-400 font-sans select-none">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {filteredRows.map((row, rIdx) => {
                const isRowEditing = editingCell?.rowIndex === rIdx
                const isRowSelected = selectedCell?.rIdx === rIdx
                const globalRowNumber = (page - 1) * pageSize + rIdx + 1

                return (
                  <tr
                    key={rIdx}
                    className={`transition-colors ${
                      isRowEditing
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-300 dark:ring-blue-800'
                        : isRowSelected
                          ? 'bg-blue-50/30 dark:bg-blue-950/20'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="p-2.5 border-r border-slate-150 dark:border-slate-850 text-center text-slate-400 font-mono text-[11px] select-none">
                      {globalRowNumber}
                    </td>
                    {columns.map((c) => {
                      const val = row[c.name]
                      const isEditing =
                        editingCell?.rowIndex === rIdx && editingCell?.colName === c.name
                      const isSelected =
                        selectedCell?.rIdx === rIdx && selectedCell?.colName === c.name
                      const cellFeedback =
                        feedback?.rIdx === rIdx && feedback?.colName === c.name ? feedback : null
                      const isNumericOrId =
                        c.pk === 1 || c.name.endsWith('_id') || typeof val === 'number'

                      return (
                        <td
                          key={c.name}
                          onClick={() => setSelectedCell({ rIdx, colName: c.name })}
                          onDoubleClick={() => handleCellClick(rIdx, c.name, val, row)}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            setSelectedCell({ rIdx, colName: c.name })
                            setContextMenu({
                              x: Math.min(e.clientX, window.innerWidth - 220),
                              y: Math.min(e.clientY, window.innerHeight - 260),
                              rIdx,
                              colName: c.name,
                              val
                            })
                          }}
                          className={`p-2.5 border-r border-slate-150 dark:border-slate-850 min-w-36 max-w-80 cursor-pointer transition-all relative ${
                            isEditing
                              ? 'bg-blue-100/90 dark:bg-blue-900/70 ring-2 ring-blue-600 shadow-lg z-20 overflow-visible'
                              : isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-inset shadow-xs z-10 font-medium'
                                : cellFeedback
                                  ? cellFeedback.type === 'copy'
                                    ? 'bg-emerald-100/80 dark:bg-emerald-950/60 ring-2 ring-emerald-500 ring-inset'
                                    : 'bg-blue-100/80 dark:bg-blue-950/60 ring-2 ring-blue-500 ring-inset'
                                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                          }`}
                          title={
                            val === null || val === undefined
                              ? 'NULL'
                              : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val)
                          }
                        >
                          {/* Animated Feedback Badge (Kopyalandı / Yapıştırıldı) */}
                          {cellFeedback && (
                            <div
                              className={`absolute -top-3.5 right-1 z-30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-md animate-in fade-in zoom-in-90 duration-150 ${
                                cellFeedback.type === 'copy'
                                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-1 ring-emerald-400'
                                  : 'bg-blue-600 text-white shadow-blue-600/30 ring-1 ring-blue-400'
                              }`}
                            >
                              {cellFeedback.type === 'copy' ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <ClipboardPaste className="w-3 h-3" />
                              )}
                              <span>{cellFeedback.text}</span>
                            </div>
                          )}

                          {/* Active Cell Selection Corner Handle */}
                          {isSelected && !isEditing && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-tl-xs pointer-events-none" />
                          )}

                          {isEditing ? (
                            /* IN-PLACE CELL EDITOR: Full width input with floating actions below */
                            <div className="relative w-full min-w-44 z-30">
                              <input
                                ref={inlineInputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') void handleSaveCell()
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-400 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />

                              {/* Floating action bar below the cell */}
                              <div className="absolute top-full left-0 mt-1.5 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-1 z-40 whitespace-nowrap animate-in fade-in zoom-in-95">
                                <button
                                  type="button"
                                  onClick={() => void handleSaveCell()}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs cursor-pointer border-0 transition-transform active:scale-95"
                                  title="Değişikliği Kaydet (Enter)"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Kaydet</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handlePasteFromClipboard()}
                                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-2 py-1 rounded-md cursor-pointer border-0 transition-transform active:scale-95"
                                  title="Panodan Yapıştır (Ctrl+V)"
                                >
                                  <ClipboardPaste className="w-3.5 h-3.5" />
                                  <span>Yapıştır</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCell(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer border-0 bg-transparent"
                                  title="İptal (Esc)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Cell display value - Ultra-fast rendering: Only render action buttons on selected cell! */
                            <div className="flex items-center justify-between gap-1 w-full min-h-6">
                              <span
                                className={`truncate select-text ${
                                  isNumericOrId ? 'font-mono text-xs' : 'font-sans text-xs'
                                } text-slate-800 dark:text-slate-200`}
                              >
                                {val === null || val === undefined ? (
                                  <span className="text-slate-300 dark:text-slate-600 italic text-[11px]">
                                    NULL
                                  </span>
                                ) : typeof val === 'object' ? (
                                  JSON.stringify(val)
                                ) : (
                                  String(val)
                                )}
                              </span>

                              {/* Performance Win: Only mount buttons for the currently selected cell */}
                              {isSelected && (
                                <div className="flex items-center gap-1 shrink-0 animate-in fade-in duration-100">
                                  <button
                                    type="button"
                                    onClick={(e) => void handleCopyCellValue(rIdx, c.name, val, e)}
                                    className="p-1 rounded bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors border-0 cursor-pointer shadow-xs"
                                    title="Hücre Değerini Kopyala (Ctrl+C)"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCellClick(rIdx, c.name, val, row)
                                    }}
                                    className="p-1 rounded bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors border-0 cursor-pointer shadow-xs"
                                    title="Hücreyi Düzenle (Enter veya Çift Tık)"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className="p-2.5 text-center select-none">
                      <button
                        onClick={() => setDeletingRow(row)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border-0 bg-transparent"
                        title="Kayıt Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1.5 border-b border-slate-150 dark:border-slate-800 text-[11px] text-slate-400 font-mono font-bold flex items-center justify-between">
            <span className="truncate max-w-32">{contextMenu.colName}</span>
            <span>Satır #{(page - 1) * pageSize + contextMenu.rIdx + 1}</span>
          </div>

          <div className="py-1 flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => {
                void handleCopyCellValue(contextMenu.rIdx, contextMenu.colName, contextMenu.val)
                setContextMenu(null)
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-left cursor-pointer border-0 bg-transparent"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Değeri Kopyala</span>
              </span>
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-slate-400">
                Ctrl+C
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                void handlePasteToCell(contextMenu.rIdx, contextMenu.colName)
                setContextMenu(null)
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-left cursor-pointer border-0 bg-transparent"
            >
              <span className="flex items-center gap-2">
                <ClipboardPaste className="w-3.5 h-3.5 text-blue-500" />
                <span>Panodan Yapıştır</span>
              </span>
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-slate-400">
                Ctrl+V
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                const ctxRow = filteredRows[contextMenu.rIdx]
                if (ctxRow) {
                  handleCellClick(contextMenu.rIdx, contextMenu.colName, contextMenu.val, ctxRow)
                }
                setContextMenu(null)
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer border-0 bg-transparent"
            >
              <span className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Hücreyi Düzenle</span>
              </span>
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-slate-400">
                Enter
              </kbd>
            </button>

            <div className="h-px bg-slate-150 dark:bg-slate-800 my-1" />

            <button
              type="button"
              onClick={() => {
                void copyToClipboard(contextMenu.colName)
                showFeedback(contextMenu.rIdx, contextMenu.colName, 'copy', 'Sütun Kopyalandı!')
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer border-0 bg-transparent text-xs"
            >
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Sütun Adını Kopyala</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const row = filteredRows[contextMenu.rIdx]
                if (row) {
                  void copyToClipboard(JSON.stringify(row, null, 2))
                  showFeedback(contextMenu.rIdx, contextMenu.colName, 'copy', 'JSON Kopyalandı!')
                }
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer border-0 bg-transparent text-xs"
            >
              <FileJson className="w-3.5 h-3.5 text-slate-400" />
              <span>Tüm Satırı JSON Kopyala</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. PAGINATION CONTROLS & FOOTER */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-sans shrink-0">
        {/* Left: Keyboard Tips */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="font-bold text-blue-600 dark:text-blue-400">💡 İpuçları:</span>
          <span>
            Hücreye <strong>tek tık</strong> seçim yapar, <strong>çift tık</strong> düzenler.
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">
              Ctrl+C
            </kbd>{' '}
            /
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] ml-1">
              Ctrl+V
            </kbd>
          </span>
        </div>

        {/* Center: Interactive Page Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage(1)}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="İlk Sayfa"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Önceki Sayfa"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
            Sayfa {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Sonraki Sayfa"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(totalPages)}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Son Sayfa"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Page Size & Total Records */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Sayfa Başına:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={25}>25 satır</option>
              <option value={50}>50 satır</option>
              <option value={100}>100 satır</option>
              <option value={200}>200 satır</option>
            </select>
          </div>

          <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-blue-200 dark:border-blue-900">
            Toplam: {totalRows.toLocaleString('tr-TR')} kayıt
          </span>
        </div>
      </div>
    </div>
  )
})
