import React from 'react'
import { AlertCircle, FileJson, Upload } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { TARGET_TABLES } from './importTables.data'

interface ImportSourcePanelProps {
  targetId: string
  onTargetIdChange: (id: string) => void
  jsonText: string
  onJsonTextChange: (text: string) => void
  parseError: string | null
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onParse: () => void
}

export function ImportSourcePanel({
  targetId,
  onTargetIdChange,
  jsonText,
  onJsonTextChange,
  parseError,
  onFileUpload,
  onParse
}: ImportSourcePanelProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
            1
          </span>
          Kaynak ve Hedef
        </h3>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Hedef Tablo
        </label>
        <select
          className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
          value={targetId}
          onChange={(e) => onTargetIdChange(e.target.value)}
        >
          {TARGET_TABLES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex justify-between items-center">
          <span>JSON Verisi</span>
          <label className="text-blue-500 cursor-pointer hover:underline text-xs flex items-center gap-1">
            <Upload className="w-3 h-3" />
            <span>Dosya Yükle</span>
            <input type="file" accept=".json" className="hidden" onChange={onFileUpload} />
          </label>
        </div>
        <textarea
          className="w-full h-64 p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700 dark:text-slate-200"
          placeholder={'[\n  { "unvan": "Örnek Firma", "sehir": "Ankara" }\n]'}
          value={jsonText}
          onChange={(e) => onJsonTextChange(e.target.value)}
        />

        {parseError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        <Button
          onClick={onParse}
          className="w-full mt-4"
          disabled={!jsonText.trim()}
          variant="default"
        >
          <FileJson className="w-4 h-4 mr-2" />
          Veriyi Oku ve Eşleştir
        </Button>
      </div>
    </div>
  )
}
