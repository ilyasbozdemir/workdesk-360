import React from 'react'
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react'
import { useImportScreenLogic } from './components/useImportScreenLogic'
import { ImportSourcePanel } from './components/ImportSourcePanel'
import { ImportMappingPanel } from './components/ImportMappingPanel'

export default function ImportScreen(): React.JSX.Element {
  const {
    jsonText,
    setJsonText,
    targetId,
    handleTargetIdChange,
    parsedData,
    parseError,
    mappings,
    isImporting,
    importResult,
    toast,
    targetTable,
    jsonKeys,
    handleParse,
    handleFileUpload,
    handleMappingChange,
    handleImport,
    handleViewResult
  } = useImportScreenLogic()

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-850 dark:text-slate-100">
            <Upload className="w-8 h-8 text-blue-500" />
            Toplu Veri İçe Aktarma
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Kayıtlı JSON verilerinizi sisteme hızlıca dahil edin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ImportSourcePanel
          targetId={targetId}
          onTargetIdChange={handleTargetIdChange}
          jsonText={jsonText}
          onJsonTextChange={setJsonText}
          parseError={parseError}
          onFileUpload={handleFileUpload}
          onParse={handleParse}
        />

        <ImportMappingPanel
          parsedData={parsedData}
          targetTable={targetTable}
          jsonKeys={jsonKeys}
          mappings={mappings}
          onMappingChange={handleMappingChange}
          importResult={importResult}
          isImporting={isImporting}
          onImport={handleImport}
          onViewResult={handleViewResult}
        />
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl border text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50 transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/80 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/80 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <div className="font-medium">{toast.message}</div>
        </div>
      )}
    </div>
  )
}
