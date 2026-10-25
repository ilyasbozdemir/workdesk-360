import React from 'react'
import {
  GripVertical,
  Printer,
  Lock,
  Scissors,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CopyPlus,
  ChevronUp,
  ChevronDown,
  Trash2
} from 'lucide-react'
import { FormFieldV2, FormFieldType, PresetController } from '../../../types/formBuilder.types'
import { getWidthClass } from '../utils'
import { CanvasFieldRenderer } from './CanvasFieldRenderer'

interface CanvasFieldItemProps {
  field: FormFieldV2
  idx: number
  globalIdx: number
  isSelected: boolean
  isDragTarget: boolean
  totalFieldsCount: number
  formData: Record<string, string>
  allPresets: PresetController[]
  onSelectField: (id: string) => void
  onDuplicateField: (id: string, e: React.MouseEvent) => void
  onMoveUp: (index: number, e: React.MouseEvent) => void
  onMoveDown: (index: number, e: React.MouseEvent) => void
  onDeleteField: (id: string, e: React.MouseEvent) => void
  onMoveField: (from: number, to: number) => void
  onAddField: (type: FormFieldType, insertAtIndex?: number) => void
  onAddPreset: (preset: PresetController, insertAtIndex?: number) => void
  draggedIndex: number | null
  setDraggedIndex: (idx: number | null) => void
  dragOverIndex: number | null
  setDragOverIndex: (idx: number | null) => void
}

export const CanvasFieldItem: React.FC<CanvasFieldItemProps> = ({
  field,
  idx,
  globalIdx,
  isSelected,
  isDragTarget,
  totalFieldsCount,
  formData,
  allPresets,
  onSelectField,
  onDuplicateField,
  onMoveUp,
  onMoveDown,
  onDeleteField,
  onMoveField,
  onAddField,
  onAddPreset,
  draggedIndex,
  setDraggedIndex,
  dragOverIndex,
  setDragOverIndex
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        setDraggedIndex(globalIdx)
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ isPaletteItem: false, index: globalIdx })
        )
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (dragOverIndex !== idx) setDragOverIndex(idx)
      }}
      onDragLeave={() => {
        if (dragOverIndex === idx) setDragOverIndex(null)
      }}
      onDragEnd={() => {
        setDraggedIndex(null)
        setDragOverIndex(null)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragOverIndex(null)
        const rawData = e.dataTransfer.getData('application/json')
        if (!rawData) return
        try {
          const parsed = JSON.parse(rawData)
          if (parsed.kind === 'preset' || parsed.isPreset) {
            const presetId = parsed.presetId
            const preset = allPresets.find((p) => p.id === presetId)
            if (preset) onAddPreset(preset, globalIdx + 1)
          } else if (parsed.kind === 'field' || (parsed.isPaletteItem && parsed.fieldType)) {
            const fieldType = parsed.fieldType
            if (fieldType) onAddField(fieldType, globalIdx + 1)
          } else if (typeof parsed.index === 'number') {
            onMoveField(parsed.index, globalIdx)
          }
        } catch {
          if (draggedIndex !== null && draggedIndex !== globalIdx) {
            onMoveField(draggedIndex, globalIdx)
          }
        }
        setDraggedIndex(null)
      }}
      onClick={() => onSelectField(field.id)}
      className={`group relative p-3 rounded-lg border transition-all cursor-pointer select-none ${getWidthClass(
        field.width
      )} ${
        isDragTarget
          ? 'border-emerald-500 bg-emerald-50/60 shadow-lg ring-2 ring-emerald-400'
          : isSelected
            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/40 shadow-lg'
            : 'border-slate-200 hover:border-slate-400 bg-slate-50/30'
      }`}
    >
      {/* Seçim Köşe Noktaları */}
      {isSelected && (
        <>
          <span className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 border border-white rounded-xs shadow-xs" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 border border-white rounded-xs shadow-xs" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-600 border border-white rounded-xs shadow-xs" />
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-600 border border-white rounded-xs shadow-xs" />
        </>
      )}

      {/* Kontrol Çubuğu */}
      <div className="flex items-center justify-between mb-2 font-sans opacity-75 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
          <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 cursor-grab active:cursor-grabbing shrink-0" />
          <span className="text-[11px] font-bold text-slate-800 truncate">{field.label}</span>
          {field.required && <span className="text-red-500 font-bold">*</span>}
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-semibold shrink-0">
            {field.tabName || 'Genel Bilgiler'}
          </span>
          {field.visibilityMode === 'print-only' && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-0.5 shrink-0"
              title="Sadece Yazdırma / PDF Çıktısında Gösterilir"
            >
              <Printer className="w-2.5 h-2.5" /> Baskı
            </span>
          )}
          {field.visibilityMode === 'edit-only' && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold shrink-0"
              title="Sadece Form Düzenleme Modunda Gösterilir (Baskıda Gizlenir)"
            >
              💻 Form
            </span>
          )}
          {field.readOnly && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold flex items-center gap-0.5 shrink-0"
              title="Salt Okunur / Kilitli Alan"
            >
              <Lock className="w-2.5 h-2.5" /> Kilitli
            </span>
          )}
          {field.pageBreak && field.pageBreak !== 'none' && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold flex items-center gap-0.5 shrink-0"
              title={`Sayfa Kesme Davranışı: ${field.pageBreak}`}
            >
              <Scissors className="w-2.5 h-2.5" /> Sayfa Kesme
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Hizalama ikonu */}
          {field.textAlign && field.textAlign !== 'left' && (
            <span className="text-slate-400 p-0.5" title={`Hizalama: ${field.textAlign}`}>
              {field.textAlign === 'center' && <AlignCenter className="w-3 h-3" />}
              {field.textAlign === 'right' && <AlignRight className="w-3 h-3" />}
              {field.textAlign === 'justify' && <AlignJustify className="w-3 h-3" />}
            </span>
          )}
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-blue-800 font-semibold">
            {`{${field.variableName}}`}
          </span>
          <button
            type="button"
            onClick={(e) => onDuplicateField(field.id, e)}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer"
            title="Bileşeni Çoğalt"
          >
            <CopyPlus className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={globalIdx === 0}
            onClick={(e) => onMoveUp(globalIdx, e)}
            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-200 rounded cursor-pointer"
            title="Yukarı Taşı"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={globalIdx === totalFieldsCount - 1}
            onClick={(e) => onMoveDown(globalIdx, e)}
            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 hover:bg-slate-200 rounded cursor-pointer"
            title="Aşağı Taşı"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => onDeleteField(field.id, e)}
            className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded cursor-pointer"
            title="Alanı Sil"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Gerçek Belge Görseli Render */}
      <CanvasFieldRenderer field={field} formData={formData} />
    </div>
  )
}
