import React, { useState } from 'react'
import { Database, RefreshCw } from 'lucide-react'

export const SystemLogsCard: React.FC = () => {
  const [liveLogs, setLiveLogs] = useState<string>('')

  const handleOpenLogFolder = async () => {
    if ((window as any).api?.openLogFolder) {
      await (window as any).api.openLogFolder()
    } else if ((window as any).electron?.ipcRenderer) {
      await (window as any).electron.ipcRenderer.invoke('logs:open-dir')
    }
  }

  const handleOpenLogFile = async () => {
    if ((window as any).api?.openLogFile) {
      await (window as any).api.openLogFile()
    } else if ((window as any).electron?.ipcRenderer) {
      await (window as any).electron.ipcRenderer.invoke('logs:open-file')
    }
  }

  const handleRefreshLiveLogs = async () => {
    try {
      let logs = ''
      if ((window as any).api?.readRecentLogs) {
        logs = await (window as any).api.readRecentLogs(150)
      } else if ((window as any).electron?.ipcRenderer) {
        logs = await (window as any).electron.ipcRenderer.invoke('logs:read-recent', 150)
      }
      setLiveLogs(logs || 'Kayıtlı günlük bulunamadı.')
    } catch (err: any) {
      setLiveLogs(`Hata: ${err?.message || err}`)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100">
              Sistem & Olay Günlükleri (Log Dosyaları)
            </h2>
            <p className="text-xs text-slate-500">
              Geliştirici ve canlı ortamda oluşan tüm SQLite, Google Drive, ağ ve sistem olaylarını
              dosyadan inceleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenLogFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            📁 Klasörü Aç
          </button>

          <button
            onClick={handleOpenLogFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-sm"
          >
            📄 Log Dosyasını Aç
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={handleRefreshLiveLogs}
          className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Son Günlükleri Canlı Yenile
        </button>
        <span className="text-[11px] text-slate-400">
          Otomatik dosya yolu: userData/logs/app-YYYY-MM-DD.log
        </span>
      </div>

      {liveLogs && (
        <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 p-4 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 select-text leading-relaxed whitespace-pre-wrap">
          {liveLogs}
        </div>
      )}
    </div>
  )
}
