import React from 'react'
import type { HizliKalemRow, HizliTopluKalemGridProps } from './types'
import { DEFAULT_UNITS } from './hizliGrid/presetPackages.data'
import { useHizliTopluKalem } from './hizliGrid/useHizliTopluKalem'
import { HizliGridToolbar } from './hizliGrid/HizliGridToolbar'
import { HizliGridTable } from './hizliGrid/HizliGridTable'
import { HizliGridFooter } from './hizliGrid/HizliGridFooter'

export type { HizliKalemRow, HizliTopluKalemGridProps }

export function HizliTopluKalemGrid({
  activeDosya,
  activeDosyaId,
  units = [],
  onSaveBatch,
  onCancel
}: HizliTopluKalemGridProps): React.JSX.Element {
  const isYapim =
    activeDosya?.tur === 'yapim_isi' ||
    activeDosya?.tur === 'yapim' ||
    activeDosya?.ihale_tipi === 'Hakediş'
  const isHizmet = activeDosya?.tur === 'hizmet'
  const defaultTipi = isYapim ? 'Yapım' : isHizmet ? 'Hizmet' : 'Mal'
  const defaultBirim = isYapim ? 'm²' : 'Adet'

  const unitOptions = units.length > 0 ? units.map((u: any) => u.ad || u.name || u) : DEFAULT_UNITS

  const {
    rows,
    hoveredCell,
    setHoveredCell,
    dragFill,
    toastNotification,
    aiLoadingIdx,
    isSaving,
    rowInputRefs,
    validRowCount,
    handleAddEmptyRow,
    handleUpdateRow,
    handleDeleteRow,
    handleDuplicateRow,
    handleClearAll,
    handleApplyPreset,
    handlePasteFromClipboard,
    handleFillColumnDown,
    handleStartDragFill,
    handleDoubleClickFill,
    handleCellKeyDown,
    handleAiSuggestOkasForRow,
    handleSave
  } = useHizliTopluKalem({ activeDosya, onSaveBatch })

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200 select-none">
      <HizliGridToolbar
        handleApplyPreset={handleApplyPreset}
        handlePasteFromClipboard={handlePasteFromClipboard}
        handleAddEmptyRow={handleAddEmptyRow}
        handleClearAll={handleClearAll}
      />

      <HizliGridTable
        rows={rows}
        defaultTipi={defaultTipi}
        defaultBirim={defaultBirim}
        isYapim={isYapim}
        unitOptions={unitOptions}
        hoveredCell={hoveredCell}
        setHoveredCell={setHoveredCell}
        dragFill={dragFill}
        rowInputRefs={rowInputRefs}
        aiLoadingIdx={aiLoadingIdx}
        handleFillColumnDown={handleFillColumnDown}
        handleStartDragFill={handleStartDragFill}
        handleDoubleClickFill={handleDoubleClickFill}
        handleCellKeyDown={handleCellKeyDown}
        handleUpdateRow={handleUpdateRow}
        handleAiSuggestOkasForRow={handleAiSuggestOkasForRow}
        handleDuplicateRow={handleDuplicateRow}
        handleDeleteRow={handleDeleteRow}
        handleAddEmptyRow={handleAddEmptyRow}
      />

      <HizliGridFooter
        toastNotification={toastNotification}
        validRowCount={validRowCount}
        isSaving={isSaving}
        activeDosyaId={activeDosyaId}
        onCancel={onCancel}
        handleSave={handleSave}
      />
    </div>
  )
}

export default HizliTopluKalemGrid
