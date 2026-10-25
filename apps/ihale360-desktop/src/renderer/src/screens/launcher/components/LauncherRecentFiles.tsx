import React from 'react'
import { ChevronRight, Clock, FolderOpen, X } from 'lucide-react'

interface LauncherRecentFilesProps {
  recentFiles: { name: string; path: string; lastOpened: number }[]
  onOpenRecent: (filePath: string) => void
  onRemoveRecent: (filePath: string, e: React.MouseEvent) => void
}

export function LauncherRecentFiles({
  recentFiles,
  onOpenRecent,
  onRemoveRecent
}: LauncherRecentFilesProps): React.JSX.Element {
  return (
    <div className="w-80 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 flex flex-col">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
        <Clock className="w-4 h-4" />
        <span>Son Açılanlar</span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {recentFiles.map((file) => (
          <div
            key={file.path}
            onClick={() => onOpenRecent(file.path)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate" dir="rtl">
                  {file.path}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => onRemoveRecent(file.path, e)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Listeden Kaldır"
              >
                <X className="w-4 h-4" />
              </button>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </div>
          </div>
        ))}
        {recentFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Henüz son açılan bir dosya yok.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
