import React from 'react'
import { FileText, RotateCcw } from 'lucide-react'
import { A4Editor } from '../../../../components/editor/A4Editor'
import { STANDARD_2886_TEMPLATES } from './standard2886Templates.data'

interface StudyoEditorPanelProps {
  editorContent: string
  onEditorContentChange: (content: string) => void
  selectedTemplateKod: string
}

export function StudyoEditorPanel({
  editorContent,
  onEditorContentChange,
  selectedTemplateKod
}: StudyoEditorPanelProps): React.JSX.Element {
  const handleResetTemplate = (): void => {
    const t = STANDARD_2886_TEMPLATES.find((item) => item.kod === selectedTemplateKod)
    if (t) {
      onEditorContentChange(t.templateHtml)
    }
  }

  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-205 overflow-hidden">
      {/* Editör Üst Barı */}
      <div className="shrink-0 p-3 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            A4 Resmi İhale Belgesi Editörü
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (TipTap Standart Sayfa Düzeni)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetTemplate}
            className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
            title="Şablonu orijinal haline sıfırla"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-[11px]">Şablonu Sıfırla</span>
          </button>
        </div>
      </div>

      {/* A4 Editör Konteynırı */}
      <div className="flex-1 p-4 bg-slate-100/60 dark:bg-slate-950/60 overflow-y-auto custom-scrollbar flex justify-center">
        <div className="w-full max-w-3xl bg-white text-slate-900 shadow-xl rounded-lg p-6 min-h-175 border border-slate-200">
          <A4Editor content={editorContent} onChange={onEditorContentChange} />
        </div>
      </div>
    </div>
  )
}
