import React, { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { useSyncStore } from '../../../store/syncStore'
import { SyncServerPanel } from './sync/SyncServerPanel'
import { SyncPocketbasePanel } from './sync/SyncPocketbasePanel'
import { SyncMinioPanel } from './sync/SyncMinioPanel'
import { SyncGdrivePanel } from './sync/SyncGdrivePanel'
import { SyncClosePreferencePanel } from './sync/SyncClosePreferencePanel'

export const SyncTab: React.FC = () => {
  const [closePreferenceMode, setClosePreferenceMode] = useState<'ask' | 'auto'>('ask')
  const [closePreferenceActions, setClosePreferenceActions] = useState<string[]>([
    'gdrive',
    'backup'
  ])
  const [settingsData, setSettingsData] = useState<Record<string, string>>({})
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false)

  const { activeProvider, setActiveProvider, loadSettings } = useSyncStore()

  useEffect(() => {
    loadSettings()
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer
        .invoke('db:get-settings')
        .then((s) => {
          if (s) {
            setSettingsData(s)
            if (
              s.closeActionRemember === 'true' &&
              s.closeActionPreference &&
              s.closeActionPreference !== 'ask'
            ) {
              setClosePreferenceMode('auto')
              try {
                const parsed = JSON.parse(s.closeActionPreference)
                if (Array.isArray(parsed)) {
                  setClosePreferenceActions(parsed)
                } else if (typeof parsed === 'string') {
                  setClosePreferenceActions([parsed])
                }
              } catch {
                if (typeof s.closeActionPreference === 'string') {
                  setClosePreferenceActions(
                    s.closeActionPreference.includes(',')
                      ? s.closeActionPreference.split(',').map((x: string) => x.trim())
                      : [s.closeActionPreference]
                  )
                }
              }
            } else {
              setClosePreferenceMode('ask')
            }
          }
        })
        .catch(console.error)
    }
  }, [loadSettings])

  const handleSaveCloseSettings = async (mode: 'ask' | 'auto', newActions?: string[]) => {
    setClosePreferenceMode(mode)
    const actions = newActions !== undefined ? newActions : closePreferenceActions
    if (newActions !== undefined) {
      setClosePreferenceActions(newActions)
    }

    try {
      if (window.electron?.ipcRenderer) {
        if (mode === 'ask') {
          await window.electron.ipcRenderer.invoke('db:save-settings', {
            closeActionPreference: 'ask',
            closeActionRemember: 'false'
          })
        } else {
          await window.electron.ipcRenderer.invoke('db:save-settings', {
            closeActionPreference: JSON.stringify(actions.length > 0 ? actions : ['none']),
            closeActionRemember: 'true'
          })
        }
        setIsSavedNotice(true)
        setTimeout(() => setIsSavedNotice(false), 2000)
      }
    } catch (err) {
      console.error('Save close preference error:', err)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-855 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Bulut Entegrasyonu ve Depolama Yönetimi
          </h2>
          <p className="text-xs text-slate-500">
            Yerel verilerinizi Web Sunucusu, PocketBase, MinIO / S3 veya Google Drive ile senkronize
            edin.
          </p>
        </div>

        {/* Bulut Sağlayıcı Seçim Sekmeleri */}
        <div className="flex bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-800 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveProvider('server')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeProvider === 'server'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            🌐 API Web Sunucu
          </button>

          <button
            onClick={() => setActiveProvider('pocketbase')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeProvider === 'pocketbase'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            ⚡ PocketBase
          </button>

          <button
            onClick={() => setActiveProvider('minio')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeProvider === 'minio'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            🪣 MinIO / S3
          </button>

          <button
            onClick={() => setActiveProvider('gdrive')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeProvider === 'gdrive'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            ☁️ Google Drive
          </button>
        </div>
      </div>

      {activeProvider === 'server' && <SyncServerPanel />}
      {activeProvider === 'pocketbase' && <SyncPocketbasePanel />}
      {activeProvider === 'minio' && <SyncMinioPanel />}
      {activeProvider === 'gdrive' && <SyncGdrivePanel />}

      <SyncClosePreferencePanel
        closePreferenceMode={closePreferenceMode}
        closePreferenceActions={closePreferenceActions}
        settingsData={settingsData}
        isSavedNotice={isSavedNotice}
        handleSaveCloseSettings={handleSaveCloseSettings}
      />
    </div>
  )
}
