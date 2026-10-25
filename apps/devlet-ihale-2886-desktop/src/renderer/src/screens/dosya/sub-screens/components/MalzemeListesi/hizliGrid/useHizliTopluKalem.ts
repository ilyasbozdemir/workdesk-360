import React, { useState, useRef, useEffect } from 'react'
import type { HizliKalemRow, HizliTopluKalemGridProps } from '../types'
import { PRESET_PACKAGES, PresetPackage } from './presetPackages.data'

export function useHizliTopluKalem({
  activeDosya,
  onSaveBatch
}: Pick<HizliTopluKalemGridProps, 'activeDosya' | 'onSaveBatch'>) {
  const defaultTipi = (activeDosya?.tur as string) || 'Mal'
  const defaultBirim = defaultTipi === 'Hizmet' ? 'Ay' : defaultTipi === 'Yapım' ? 'm²' : 'Adet'

  const [rows, setRows] = useState<HizliKalemRow[]>([
    {
      id: 'row-1',
      tipi: defaultTipi,
      kalem_adi: '',
      miktar: 1,
      birim: defaultBirim,
      tasinir_kodu: '',
      okas_kodu: '',
      kdv_orani: 20,
      aciklama: ''
    },
    {
      id: 'row-2',
      tipi: defaultTipi,
      kalem_adi: '',
      miktar: 1,
      birim: defaultBirim,
      tasinir_kodu: '',
      okas_kodu: '',
      kdv_orani: 20,
      aciklama: ''
    },
    {
      id: 'row-3',
      tipi: defaultTipi,
      kalem_adi: '',
      miktar: 1,
      birim: defaultBirim,
      tasinir_kodu: '',
      okas_kodu: '',
      kdv_orani: 20,
      aciklama: ''
    },
    {
      id: 'row-4',
      tipi: defaultTipi,
      kalem_adi: '',
      miktar: 1,
      birim: defaultBirim,
      tasinir_kodu: '',
      okas_kodu: '',
      kdv_orani: 20,
      aciklama: ''
    },
    {
      id: 'row-5',
      tipi: defaultTipi,
      kalem_adi: '',
      miktar: 1,
      birim: defaultBirim,
      tasinir_kodu: '',
      okas_kodu: '',
      kdv_orani: 20,
      aciklama: ''
    }
  ])

  const [hoveredCell, setHoveredCell] = useState<{
    rowIdx: number
    field: keyof HizliKalemRow
  } | null>(null)

  // Drag-to-Fill State (Excel Fill Handle)
  const [dragFill, setDragFill] = useState<{
    isDragging: boolean
    sourceRowIdx: number
    sourceField: keyof HizliKalemRow
    sourceValue: any
    targetRowIdx: number
  } | null>(null)

  const [toastNotification, setToastNotification] = useState<string | null>(null)
  const [aiLoadingIdx, setAiLoadingIdx] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const rowInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const showToast = (msg: string) => {
    setToastNotification(msg)
    setTimeout(() => setToastNotification(null), 3000)
  }

  // Add empty row
  const handleAddEmptyRow = (count: number = 1) => {
    const lastRow = rows[rows.length - 1]
    const newRows: HizliKalemRow[] = []
    for (let i = 0; i < count; i++) {
      newRows.push({
        id: `row-${Date.now()}-${Math.random()}`,
        tipi: lastRow?.tipi || defaultTipi,
        kalem_adi: '',
        miktar: 1,
        birim: lastRow?.birim || defaultBirim,
        tasinir_kodu: lastRow?.tasinir_kodu || '',
        okas_kodu: lastRow?.okas_kodu || '',
        kdv_orani: lastRow?.kdv_orani ?? 20,
        aciklama: ''
      })
    }
    setRows((prev) => [...prev, ...newRows])
  }

  // Update a specific cell
  const handleUpdateRow = (id: string, field: keyof HizliKalemRow, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  // Delete row
  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([
        {
          id: `row-${Date.now()}`,
          tipi: defaultTipi,
          kalem_adi: '',
          miktar: 1,
          birim: defaultBirim,
          tasinir_kodu: '',
          okas_kodu: '',
          kdv_orani: 20,
          aciklama: ''
        }
      ])
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  // Duplicate a row
  const handleDuplicateRow = (idx: number) => {
    const target = rows[idx]
    if (!target) return
    const newRow: HizliKalemRow = {
      ...target,
      id: `row-dup-${Date.now()}-${Math.random()}`
    }
    const updated = [...rows]
    updated.splice(idx + 1, 0, newRow)
    setRows(updated)
    showToast(`Satır #${idx + 1} kopyalandı.`)
  }

  // Clear all
  const handleClearAll = () => {
    if (confirm('Tablodaki tüm satırları temizlemek istediğinize emin misiniz?')) {
      setRows([
        {
          id: 'row-1',
          tipi: defaultTipi,
          kalem_adi: '',
          miktar: 1,
          birim: defaultBirim,
          tasinir_kodu: '',
          okas_kodu: '',
          kdv_orani: 20,
          aciklama: ''
        },
        {
          id: 'row-2',
          tipi: defaultTipi,
          kalem_adi: '',
          miktar: 1,
          birim: defaultBirim,
          tasinir_kodu: '',
          okas_kodu: '',
          kdv_orani: 20,
          aciklama: ''
        },
        {
          id: 'row-3',
          tipi: defaultTipi,
          kalem_adi: '',
          miktar: 1,
          birim: defaultBirim,
          tasinir_kodu: '',
          okas_kodu: '',
          kdv_orani: 20,
          aciklama: ''
        }
      ])
      showToast('Tablo temizlendi.')
    }
  }

  // Apply Preset Package
  const handleApplyPreset = (preset: PresetPackage) => {
    const generatedRows: HizliKalemRow[] = preset.items.map((item, idx) => ({
      id: `preset-${Date.now()}-${idx}`,
      tipi: preset.tipi,
      kalem_adi: item.kalem_adi,
      miktar: item.miktar,
      birim: item.birim || preset.birim,
      tasinir_kodu: preset.tasinir_kodu,
      okas_kodu: preset.okas_kodu,
      kdv_orani: preset.kdv,
      aciklama: item.aciklama
    }))

    setRows(generatedRows)
    showToast(`"${preset.name}" şablonu tabloya yüklendi.`)
  }

  // Excel Paste
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text || !text.trim()) {
        alert('Panoda kopyalanmış herhangi bir metin veya Excel verisi bulunamadı.')
        return
      }

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      if (lines.length === 0) return

      const parsedRows: HizliKalemRow[] = lines.map((line, idx) => {
        const cols = line.includes('\t')
          ? line.split('\t')
          : line.includes(';')
            ? line.split(';')
            : [line]

        const name = cols[0]?.trim() || ''
        const mkt = parseFloat(cols[1]?.replace(',', '.') || '1') || 1
        const brm = cols[2]?.trim() || defaultBirim
        const poz = cols[3]?.trim() || ''
        const okas = cols[4]?.trim() || ''
        const kdv = parseFloat(cols[5]?.replace(',', '.') || '20') || 20
        const note = cols[6]?.trim() || ''

        return {
          id: `pasted-${Date.now()}-${idx}`,
          tipi: defaultTipi,
          kalem_adi: name,
          miktar: mkt,
          birim: brm,
          tasinir_kodu: poz,
          okas_kodu: okas,
          kdv_orani: kdv,
          aciklama: note
        }
      })

      const nonEmptyExisting = rows.filter((r) => r.kalem_adi.trim().length > 0)
      setRows([...nonEmptyExisting, ...parsedRows])
      showToast(`✅ Excel / Panodan ${parsedRows.length} satır aktarıldı!`)
    } catch (err: any) {
      alert('Panodan okuma başarısız oldu: ' + err.message)
    }
  }

  // Column-level fill down
  const handleFillColumnDown = (field: keyof HizliKalemRow, fromRowIdx: number = 0) => {
    const sourceValue = rows[fromRowIdx]?.[field]
    if (sourceValue === undefined) return

    setRows((prev) =>
      prev.map((r, idx) => (idx >= fromRowIdx ? { ...r, [field]: sourceValue } : r))
    )

    const fieldLabels: Record<string, string> = {
      tipi: 'Tür',
      birim: 'Birim',
      okas_kodu: 'OKAS Kodu',
      tasinir_kodu: 'Taşınır / Poz No',
      kdv_orani: 'KDV Oranı',
      miktar: 'Miktar'
    }
    showToast(
      `"${fieldLabels[field] || field}" değeri (${sourceValue}) tüm alt satırlara uygulandı.`
    )
  }

  // Start dragging the fill handle from a cell
  const handleStartDragFill = (e: React.MouseEvent, rowIdx: number, field: keyof HizliKalemRow) => {
    e.preventDefault()
    e.stopPropagation()

    const sourceValue = rows[rowIdx][field]
    setDragFill({
      isDragging: true,
      sourceRowIdx: rowIdx,
      sourceField: field,
      sourceValue,
      targetRowIdx: rowIdx
    })
  }

  // Double-click fill handle
  const handleDoubleClickFill = (rowIdx: number, field: keyof HizliKalemRow) => {
    handleFillColumnDown(field, rowIdx)
  }

  // Mouse move and mouse up listeners for drag-fill
  useEffect(() => {
    if (!dragFill?.isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const rowEl = el?.closest('[data-grid-row-idx]')
      if (rowEl) {
        const targetIdx = parseInt(rowEl.getAttribute('data-grid-row-idx') || '-1', 10)
        if (targetIdx >= 0 && targetIdx !== dragFill.targetRowIdx) {
          setDragFill((prev) => (prev ? { ...prev, targetRowIdx: targetIdx } : null))
        }
      }
    }

    const handleMouseUp = () => {
      if (dragFill && dragFill.isDragging) {
        const start = Math.min(dragFill.sourceRowIdx, dragFill.targetRowIdx)
        const end = Math.max(dragFill.sourceRowIdx, dragFill.targetRowIdx)
        const field = dragFill.sourceField
        const val = dragFill.sourceValue

        setRows((prev) =>
          prev.map((r, idx) => (idx >= start && idx <= end ? { ...r, [field]: val } : r))
        )

        showToast(`Excel Doldurma: Satır ${start + 1} - ${end + 1} arası güncellendi.`)
      }
      setDragFill(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragFill])

  // Keyboard handler
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIdx: number,
    field: keyof HizliKalemRow
  ) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault()
      if (rowIdx > 0) {
        const aboveVal = rows[rowIdx - 1][field]
        if (aboveVal !== undefined) {
          handleUpdateRow(rows[rowIdx].id, field, aboveVal)
          showToast(`Üst satırdaki değer kopyalandı (Ctrl+D)`)
        }
      }
      return
    }

    if (e.key === 'Enter' && field === 'kalem_adi') {
      e.preventDefault()
      if (rowIdx === rows.length - 1) {
        handleAddEmptyRow(1)
        setTimeout(() => {
          const nextIdx = rowIdx + 1
          const nextRow = rows[nextIdx]
          if (nextRow && rowInputRefs.current[nextRow.id]) {
            rowInputRefs.current[nextRow.id]?.focus()
          }
        }, 50)
      } else {
        const nextId = rows[rowIdx + 1]?.id
        if (nextId && rowInputRefs.current[nextId]) {
          rowInputRefs.current[nextId]?.focus()
        }
      }
    }
  }

  // AI Suggest OKAS for specific row
  const handleAiSuggestOkasForRow = async (rowIdx: number) => {
    const item = rows[rowIdx]
    const query = item?.kalem_adi?.trim() || activeDosya?.konu
    if (!query) {
      alert('Lütfen önce kalem adını girin.')
      return
    }

    setAiLoadingIdx(rowIdx)
    try {
      const prompt = `Aşağıdaki kamu alımı kalemi için Kamu İhale Kurumu OKAS (CPV) kodunu ver. Sadece "KOD: AÇIKLAMA" formatında yanıt ver. Örn: "30192700-6: Kırtasiye". Kalem: ${query}`
      const res = await (window as any).electron.ipcRenderer.invoke('ai:generate', { prompt })
      if (res.success && res.data) {
        const text = res.data.trim()
        const match = text.match(/^([\d-]+)/)
        const finalCode = match && match[1] ? match[1] : text
        handleUpdateRow(item.id, 'okas_kodu', finalCode)
        showToast(`OKAS Kodu belirlendi: ${finalCode}`)
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setAiLoadingIdx(null)
    }
  }

  const validRows = rows.filter((r) => r.kalem_adi.trim().length > 0)
  const validRowCount = validRows.length

  const handleSave = async () => {
    if (validRowCount === 0) {
      alert('Lütfen en az bir adet geçerli kalem adı giriniz.')
      return
    }

    setIsSaving(true)
    try {
      const firstRow = validRows[0] || rows[0]
      const success = await onSaveBatch(
        {
          tipi: firstRow?.tipi || defaultTipi,
          okas_kodu: firstRow?.okas_kodu?.trim() || undefined,
          tasinir_kodu_prefix: firstRow?.tasinir_kodu?.trim() || undefined,
          kdv_orani: firstRow?.kdv_orani ?? 20,
          birim: firstRow?.birim || defaultBirim
        },
        rows
      )

      if (success) {
        setRows([
          {
            id: 'row-1',
            tipi: defaultTipi,
            kalem_adi: '',
            miktar: 1,
            birim: defaultBirim,
            tasinir_kodu: '',
            okas_kodu: '',
            kdv_orani: 20,
            aciklama: ''
          },
          {
            id: 'row-2',
            tipi: defaultTipi,
            kalem_adi: '',
            miktar: 1,
            birim: defaultBirim,
            tasinir_kodu: '',
            okas_kodu: '',
            kdv_orani: 20,
            aciklama: ''
          },
          {
            id: 'row-3',
            tipi: defaultTipi,
            kalem_adi: '',
            miktar: 1,
            birim: defaultBirim,
            tasinir_kodu: '',
            okas_kodu: '',
            kdv_orani: 20,
            aciklama: ''
          }
        ])
      }
    } finally {
      setIsSaving(false)
    }
  }

  return {
    rows,
    setRows,
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
  }
}
