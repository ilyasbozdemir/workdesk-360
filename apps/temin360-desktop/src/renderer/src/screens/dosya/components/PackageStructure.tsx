import React from 'react'
import { Layers, FileJson, Database, FolderOpen, Info } from 'lucide-react'

type PackageFile = 'meta.json' | 'database.sqlite' | 'attachments/'

interface PackageStructureProps {
  fileName: string
  selectedFile: PackageFile
  setSelectedFile: (file: PackageFile) => void
}

export const PackageStructure: React.FC<PackageStructureProps> = ({
  fileName,
  selectedFile,
  setSelectedFile
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Layers className="w-4 h-4 text-blue-600" />
        Paket Arşiv Yapısı (ZIP)
      </h2>

      <div className="space-y-3 font-mono text-xs select-none">
        {/* Root zip file node */}
        <div className="flex items-center gap-2 font-bold text-slate-850 dark:text-slate-100 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850">
          <span className="text-base">📦</span>
          <span className="truncate max-w-[280px]" title={fileName}>
            {fileName}
          </span>
        </div>

        {/* Files inside zip */}
        <div className="pl-4 border-l-2 border-dashed border-slate-200 dark:border-slate-800 ml-4 space-y-2 py-1">
          {/* meta.json */}
          <button
            onClick={() => setSelectedFile('meta.json')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFile === 'meta.json'
                ? 'bg-blue-50/70 border-blue-200 text-blue-700 dark:bg-blue-955/20 dark:border-blue-900/40 dark:text-blue-400 font-bold shadow-sm'
                : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400">├──</span>
              <FileJson
                className={`w-4 h-4 ${
                  selectedFile === 'meta.json' ? 'text-blue-600' : 'text-slate-500'
                }`}
              />
              <span>meta.json</span>
            </div>
            <span className="text-[9px] bg-blue-100/60 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded font-bold font-sans">
              JSON Meta
            </span>
          </button>

          {/* database.sqlite */}
          <button
            onClick={() => setSelectedFile('database.sqlite')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFile === 'database.sqlite'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700 dark:bg-emerald-955/20 dark:border-emerald-900/40 dark:text-emerald-450 font-bold shadow-sm'
                : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400">├──</span>
              <Database
                className={`w-4 h-4 ${
                  selectedFile === 'database.sqlite' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              />
              <span>database.sqlite</span>
            </div>
            <span className="text-[9px] bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-600 px-1.5 py-0.5 rounded font-bold font-sans">
              SQLite DB
            </span>
          </button>

          {/* attachments/ */}
          <button
            onClick={() => setSelectedFile('attachments/')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedFile === 'attachments/'
                ? 'bg-amber-50/70 border-amber-200 text-amber-700 dark:bg-amber-955/20 dark:border-amber-900/45 dark:text-amber-450 font-bold shadow-sm'
                : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400">└──</span>
              <FolderOpen
                className={`w-4 h-4 ${
                  selectedFile === 'attachments/' ? 'text-amber-500' : 'text-slate-500'
                }`}
              />
              <span>attachments/</span>
            </div>
            <span className="text-[9px] bg-amber-100/60 dark:bg-amber-900/30 text-amber-600 px-1.5 py-0.5 rounded font-bold font-sans">
              Klasör
            </span>
          </button>
        </div>
      </div>

      <div className="mt-5 p-3.5 bg-blue-50/45 dark:bg-blue-955/10 border border-blue-100/30 dark:border-blue-900/20 rounded-2xl flex gap-2">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-450 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
          Sol taraftaki dosya yapısından bir dosyaya tıklayarak içeriğini ve o dosyanın format
          ayrıntılarını sağ taraftaki panele yükleyebilirsiniz.
        </p>
      </div>
    </div>
  )
}
