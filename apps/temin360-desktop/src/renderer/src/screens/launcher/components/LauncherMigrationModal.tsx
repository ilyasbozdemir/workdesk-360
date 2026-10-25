import React from 'react'
import { ShieldAlert } from 'lucide-react'

interface LauncherMigrationModalProps {
  isOpen: boolean
  migrationData: {
    filePath: string
    pendingUpdates: any[]
  } | null
  creating: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LauncherMigrationModal({
  isOpen,
  migrationData,
  creating,
  onClose,
  onConfirm
}: LauncherMigrationModalProps): React.JSX.Element | null {
  if (!isOpen || !migrationData) return null

  return (
    <div
      className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-3xl p-6 shadow-2xl flex flex-col text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Veritabanı Güncellemesi Gerekli
            </h3>
          </div>
        </div>

        <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Bu dosya eski bir sürümde oluşturulmuş. Açılabilmesi için{' '}
          <strong>{migrationData.pendingUpdates.length}</strong> güncelleme uygulanacak:
        </div>

        <div className="max-h-48 overflow-y-auto mb-6 space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          {migrationData.pendingUpdates.map((update, idx) => (
            <div key={idx} className="flex gap-2 text-slate-600 dark:text-slate-400">
              <span className="text-blue-500">•</span>
              <span>
                <strong>Schema {update.schema}:</strong> {update.description}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-205 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-semibold transition-colors"
          >
            İptal Et
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={creating}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {creating ? 'Güncelleniyor...' : 'Devam Edilsin mi?'}
          </button>
        </div>
      </div>
    </div>
  )
}
