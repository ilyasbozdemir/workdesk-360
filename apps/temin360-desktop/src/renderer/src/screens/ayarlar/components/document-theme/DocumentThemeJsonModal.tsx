import React from 'react'
import { Download, Sliders, Upload } from 'lucide-react'
import { useDocumentTheme } from './useDocumentTheme'

type ModalProps = ReturnType<typeof useDocumentTheme>

export function DocumentThemeJsonModal(props: ModalProps): React.JSX.Element | null {
  const {
    jsonModalOpen,
    setJsonModalOpen,
    jsonText,
    setJsonText,
    handleExportJson,
    handleImportJson
  } = props

  if (!jsonModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>Tema JSON Yapılandırması</span>
          </h3>
          <button
            type="button"
            onClick={() => setJsonModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON İndir</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setJsonModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleImportJson}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>JSON'dan Yükle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
