import React, { useState } from 'react'
import {
  FormFieldV2,
  FormFieldType,
  PresetController,
  DocumentSettings
} from '../../types/formBuilder.types'
import { getPageDimensions, getPagePadding } from './utils'
import { CanvasTabStrip } from './canvas/CanvasTabStrip'
import { CanvasFieldItem } from './canvas/CanvasFieldItem'

interface FormBuilderCanvasProps {
  fields: FormFieldV2[]
  activeFieldId: string | null
  onSelectField: (id: string) => void
  selectedTab: string
  onSelectTab: (tab: string) => void
  availableTabs: string[]
  isAddingNewTab: boolean
  onSetIsAddingNewTab: (val: boolean) => void
  newTabNameInput: string
  onNewTabNameInputChange: (val: string) => void
  onCreateNewTab: () => void
  docSettings: DocumentSettings
  formData: Record<string, string>
  onDuplicateField: (id: string, e: React.MouseEvent) => void
  onMoveUp: (index: number, e: React.MouseEvent) => void
  onMoveDown: (index: number, e: React.MouseEvent) => void
  onDeleteField: (id: string, e: React.MouseEvent) => void
  onMoveField: (from: number, to: number) => void
  onAddField: (type: FormFieldType, insertAtIndex?: number) => void
  onAddPreset: (preset: PresetController, insertAtIndex?: number) => void
  allPresets: PresetController[]
}

export const FormBuilderCanvas: React.FC<FormBuilderCanvasProps> = ({
  fields,
  activeFieldId,
  onSelectField,
  selectedTab,
  onSelectTab,
  availableTabs,
  isAddingNewTab,
  onSetIsAddingNewTab,
  newTabNameInput,
  onNewTabNameInputChange,
  onCreateNewTab,
  docSettings,
  formData,
  onDuplicateField,
  onMoveUp,
  onMoveDown,
  onDeleteField,
  onMoveField,
  onAddField,
  onAddPreset,
  allPresets
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const filteredFields =
    selectedTab === 'Tümü'
      ? fields
      : fields.filter((f) => (f.tabName || 'Genel Bilgiler') === selectedTab)

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden relative transition-colors">
      {/* Sekmeler Şeridi */}
      <CanvasTabStrip
        selectedTab={selectedTab}
        onSelectTab={onSelectTab}
        totalFieldCount={fields.length}
        availableTabs={availableTabs}
        fields={fields}
        isAddingNewTab={isAddingNewTab}
        onSetIsAddingNewTab={onSetIsAddingNewTab}
        newTabNameInput={newTabNameInput}
        onNewTabNameInputChange={onNewTabNameInputChange}
        onCreateNewTab={onCreateNewTab}
      />

      {/* GERÇEK BELGE KAĞIDI TUVALİ */}
      <div
        className={`flex-1 p-8 overflow-y-auto flex justify-center items-start ${
          docSettings.showGrid
            ? 'bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] bg-size-[16px_16px] bg-slate-200/60 dark:bg-slate-950'
            : 'bg-slate-200/60 dark:bg-slate-950'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
          const rawData = e.dataTransfer.getData('application/json')
          if (!rawData) return
          try {
            const parsed = JSON.parse(rawData)
            if (parsed.kind === 'preset' || parsed.isPreset) {
              const presetId = parsed.presetId
              const preset = allPresets.find((p) => p.id === presetId)
              if (preset) onAddPreset(preset)
            } else if (parsed.kind === 'field' || (parsed.isPaletteItem && parsed.fieldType)) {
              const fieldType = parsed.fieldType
              if (fieldType) onAddField(fieldType)
            }
          } catch {
            // ignore
          }
        }}
      >
        {/* A4 / A3 FORM KAĞIDI */}
        <div
          style={{
            ...getPageDimensions(docSettings),
            padding: getPagePadding(docSettings),
            transform: `scale(${docSettings.zoom / 100})`,
            transformOrigin: 'top center'
          }}
          className="bg-white text-slate-900 shadow-2xl border border-slate-300 dark:border-slate-700 rounded-xs transition-all relative font-serif text-[10pt] leading-normal min-h-[297mm]"
        >
          {/* Kağıt Üst Başlığı */}
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200 text-[10px] font-sans text-slate-400 select-none">
            <span className="font-bold uppercase tracking-wider text-slate-600 font-mono">
              {docSettings.pageSize} Sayfa Tuvali (
              {docSettings.orientation === 'portrait' ? 'Dikey' : 'Yatay'}) —{' '}
              {selectedTab === 'Tümü'
                ? `Tüm Bloklar (${fields.length})`
                : `Sekme: "${selectedTab}" (${filteredFields.length})`}
            </span>
            <span className="text-slate-400 font-mono text-[9px]">
              Temin360 Resmi Belge Sistemi
            </span>
          </div>

          {/* BELGE BİLEŞEN BLOKLARI (Flex Wrap Layout) */}
          <div className="flex flex-wrap gap-2.5 items-start">
            {filteredFields.map((field, idx) => {
              const isSelected = field.id === activeFieldId
              const isDragTarget = dragOverIndex === idx
              const globalIdx = fields.findIndex((f) => f.id === field.id)

              return (
                <CanvasFieldItem
                  key={field.id}
                  field={field}
                  idx={idx}
                  globalIdx={globalIdx}
                  isSelected={isSelected}
                  isDragTarget={isDragTarget}
                  totalFieldsCount={fields.length}
                  formData={formData}
                  allPresets={allPresets}
                  onSelectField={onSelectField}
                  onDuplicateField={onDuplicateField}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onDeleteField={onDeleteField}
                  onMoveField={onMoveField}
                  onAddField={onAddField}
                  onAddPreset={onAddPreset}
                  draggedIndex={draggedIndex}
                  setDraggedIndex={setDraggedIndex}
                  dragOverIndex={dragOverIndex}
                  setDragOverIndex={setDragOverIndex}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
