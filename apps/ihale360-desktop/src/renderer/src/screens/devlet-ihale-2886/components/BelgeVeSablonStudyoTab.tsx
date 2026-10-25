import React from 'react'
import type { BelgeVeSablonStudyoTabProps } from './studyo/studyoTypes'
import { useBelgeVeSablonStudyo } from './studyo/useBelgeVeSablonStudyo'
import { StudyoTopToolbar } from './studyo/StudyoTopToolbar'
import { StudyoLeftSidebar } from './studyo/StudyoLeftSidebar'
import { StudyoEditorPanel } from './studyo/StudyoEditorPanel'

export type {
  BelgeVeSablonStudyoTabProps,
  CustomField,
  FormDataType,
  Standard2886Template,
  StudyoLeftTab
} from './studyo/studyoTypes'
export { STANDARD_2886_TEMPLATES } from './studyo/standard2886Templates.data'
export {
  getFormDataForDosya,
  getCustomFieldsForDosya,
  getEditorContentForDosya
} from './studyo/studyoHelpers'
export { useBelgeVeSablonStudyo } from './studyo/useBelgeVeSablonStudyo'

export function BelgeVeSablonStudyoTab({
  initialDosyaId
}: BelgeVeSablonStudyoTabProps): React.JSX.Element {
  const {
    dosyalar,
    selectedDosyaId,
    currentDosya,
    formData,
    setFormData,
    customFields,
    showAddField,
    setShowAddField,
    newFieldKey,
    setNewFieldKey,
    newFieldLabel,
    setNewFieldLabel,
    newFieldTip,
    setNewFieldTip,
    newFieldVal,
    setNewFieldVal,
    selectedTemplateKod,
    editorContent,
    setEditorContent,
    savedSuccess,
    copiedVar,
    leftTab,
    setLeftTab,
    handleSelectDosyaId,
    handleSelectTemplate,
    templateContext,
    handleInjectPlaceholders,
    handleAddCustomField,
    handleDeleteCustomField,
    handleCustomFieldChange,
    handleSaveRevision,
    handleSaveDosya,
    handleExportWord,
    handlePrint,
    handleCopyVar
  } = useBelgeVeSablonStudyo(initialDosyaId)

  return (
    <div className="w-full space-y-4">
      {/* 1. ÜST KONTROL BAR / TOOLBAR */}
      <StudyoTopToolbar
        selectedDosyaId={selectedDosyaId}
        dosyalar={dosyalar}
        onSelectDosyaId={handleSelectDosyaId}
        selectedTemplateKod={selectedTemplateKod}
        onSelectTemplate={handleSelectTemplate}
        onInjectPlaceholders={handleInjectPlaceholders}
        onExportWord={handleExportWord}
        onPrint={handlePrint}
        onSaveRevision={handleSaveRevision}
        onSaveDosya={handleSaveDosya}
        savedSuccess={savedSuccess}
      />

      {/* 2. ANA ÇALIŞMA ALANI: SOL PANEL (FORM BUILDER) & SAĞ PANEL (A4 TIPTAP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SOL PANEL (5 Kolon) - FORM BUILDER & DEĞİŞKENLER */}
        <StudyoLeftSidebar
          leftTab={leftTab}
          onSetLeftTab={setLeftTab}
          currentDosya={currentDosya}
          formData={formData}
          onSetFormData={setFormData}
          customFields={customFields}
          onCustomFieldChange={handleCustomFieldChange}
          onDeleteCustomField={handleDeleteCustomField}
          showAddField={showAddField}
          onToggleShowAddField={() => setShowAddField(!showAddField)}
          newFieldKey={newFieldKey}
          onSetNewFieldKey={setNewFieldKey}
          newFieldLabel={newFieldLabel}
          onSetNewFieldLabel={setNewFieldLabel}
          newFieldTip={newFieldTip}
          onSetNewFieldTip={setNewFieldTip}
          newFieldVal={newFieldVal}
          onSetNewFieldVal={setNewFieldVal}
          onAddCustomField={handleAddCustomField}
          templateContext={templateContext}
          copiedVar={copiedVar}
          onCopyVar={handleCopyVar}
          onSaveRevision={handleSaveRevision}
          onRestoreRevision={(html) => setEditorContent(html)}
        />

        {/* SAĞ PANEL (7 Kolon) - A4 TIPTAP RESMİ BELGE EDİTÖRÜ */}
        <StudyoEditorPanel
          editorContent={editorContent}
          onEditorContentChange={setEditorContent}
          selectedTemplateKod={selectedTemplateKod}
        />
      </div>
    </div>
  )
}
