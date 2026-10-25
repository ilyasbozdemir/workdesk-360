import React from 'react'
import { Code2, History, Plus, Sliders } from 'lucide-react'
import type { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'
import type { FormDataType, CustomField, StudyoLeftTab } from './studyoTypes'
import { StudyoFormTab } from './StudyoFormTab'
import { StudyoBuilderTab } from './StudyoBuilderTab'
import { StudyoVarsTab } from './StudyoVarsTab'
import { StudyoRevisionsTab } from './StudyoRevisionsTab'

interface StudyoLeftSidebarProps {
  leftTab: StudyoLeftTab
  onSetLeftTab: (tab: StudyoLeftTab) => void
  currentDosya: Dosya2886Item | null
  formData: FormDataType
  onSetFormData: (data: FormDataType) => void
  customFields: CustomField[]
  onCustomFieldChange: (id: string, value: string) => void
  onDeleteCustomField: (id: string) => void
  showAddField: boolean
  onToggleShowAddField: () => void
  newFieldKey: string
  onSetNewFieldKey: (val: string) => void
  newFieldLabel: string
  onSetNewFieldLabel: (val: string) => void
  newFieldTip: 'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli'
  onSetNewFieldTip: (tip: 'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli') => void
  newFieldVal: string
  onSetNewFieldVal: (val: string) => void
  onAddCustomField: () => void
  templateContext: Record<string, string | number>
  copiedVar: string | null
  onCopyVar: (key: string) => void
  onSaveRevision: () => void
  onRestoreRevision: (html: string) => void
}

export function StudyoLeftSidebar({
  leftTab,
  onSetLeftTab,
  currentDosya,
  formData,
  onSetFormData,
  customFields,
  onCustomFieldChange,
  onDeleteCustomField,
  showAddField,
  onToggleShowAddField,
  newFieldKey,
  onSetNewFieldKey,
  newFieldLabel,
  onSetNewFieldLabel,
  newFieldTip,
  onSetNewFieldTip,
  newFieldVal,
  onSetNewFieldVal,
  onAddCustomField,
  templateContext,
  copiedVar,
  onCopyVar,
  onSaveRevision,
  onRestoreRevision
}: StudyoLeftSidebarProps): React.JSX.Element {
  return (
    <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-205 overflow-hidden">
      {/* Sol Panel Sekme Başlıkları */}
      <div className="shrink-0 flex items-center border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-50/70 dark:bg-slate-850/50 gap-1 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => onSetLeftTab('form')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            leftTab === 'form'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Form Verileri</span>
        </button>

        <button
          type="button"
          onClick={() => onSetLeftTab('builder')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            leftTab === 'builder'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Form Builder ({customFields.length})</span>
        </button>

        <button
          type="button"
          onClick={() => onSetLeftTab('vars')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            leftTab === 'vars'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Yer Tutucular</span>
        </button>

        <button
          type="button"
          onClick={() => onSetLeftTab('revisions')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            leftTab === 'revisions'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Sürümler ({currentDosya?.surumler?.length || 0})</span>
        </button>
      </div>

      {/* Sol Panel İçeriği (Kaydırılabilir) */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
        {leftTab === 'form' && (
          <StudyoFormTab
            formData={formData}
            onSetFormData={onSetFormData}
            customFields={customFields}
            onCustomFieldChange={onCustomFieldChange}
          />
        )}

        {leftTab === 'builder' && (
          <StudyoBuilderTab
            customFields={customFields}
            onDeleteCustomField={onDeleteCustomField}
            showAddField={showAddField}
            onToggleShowAddField={onToggleShowAddField}
            newFieldKey={newFieldKey}
            onSetNewFieldKey={onSetNewFieldKey}
            newFieldLabel={newFieldLabel}
            onSetNewFieldLabel={onSetNewFieldLabel}
            newFieldTip={newFieldTip}
            onSetNewFieldTip={onSetNewFieldTip}
            newFieldVal={newFieldVal}
            onSetNewFieldVal={onSetNewFieldVal}
            onAddCustomField={onAddCustomField}
            onCopyVar={onCopyVar}
          />
        )}

        {leftTab === 'vars' && (
          <StudyoVarsTab
            templateContext={templateContext}
            copiedVar={copiedVar}
            onCopyVar={onCopyVar}
          />
        )}

        {leftTab === 'revisions' && (
          <StudyoRevisionsTab
            currentDosya={currentDosya}
            onSaveRevision={onSaveRevision}
            onRestoreRevision={onRestoreRevision}
          />
        )}
      </div>
    </div>
  )
}
