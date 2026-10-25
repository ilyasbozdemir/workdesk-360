import React from 'react'
import { Cpu, Check, RefreshCw, AlertTriangle } from 'lucide-react'

interface UpdaterWidgetProps {
  activeMeta: any
  updaterStatus: string
  updaterError: string
  handleCheckUpdates: () => void
  handleQuitAndInstall: () => void
}

export const UpdaterWidget: React.FC<UpdaterWidgetProps> = ({
  activeMeta,
  updaterStatus,
  updaterError,
  handleCheckUpdates,
  handleQuitAndInstall
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 uppercase tracking-wider font-sans">
        <Cpu className="w-4 h-4 text-blue-600" />
        Uygulama Güncelleme Yönetimi (Auto-Updater)
      </h3>

      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
            Mevcut Sürüm:
            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 font-bold">
              {activeMeta?.app_version ? `v${activeMeta?.app_version}` : 'Bilinmiyor'}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal max-w-2xl font-medium font-sans">
            Kurumsal bilgisayarlardaki internet kotaları düşünülerek, güncellemeler GitHub üzerinden{' '}
            <strong>.blockmap</strong> teknolojisiyle sadece değişen paketleri (delta) indirerek
            kota tasarrufu sağlar.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {updaterStatus === 'downloaded' ? (
            <button
              onClick={handleQuitAndInstall}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 text-xs rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              Kapat ve Yükle (Hazır)
            </button>
          ) : (
            <button
              onClick={handleCheckUpdates}
              disabled={updaterStatus === 'checking'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-2 px-4 text-xs rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${updaterStatus === 'checking' ? 'animate-spin' : ''}`}
              />
              {updaterStatus === 'checking' ? 'Denetleniyor...' : 'Güncellemeleri Denetle'}
            </button>
          )}
        </div>
      </div>

      {/* Güncelleme Durum Bildirimleri */}
      {updaterStatus !== 'idle' && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {updaterStatus === 'checking' && (
            <div className="p-3.5 bg-blue-50/40 border border-blue-200/40 rounded-2xl text-[11px] text-blue-700 font-bold dark:bg-blue-900/10">
              Yeni güncellemeler sorgulanıyor, lütfen bekleyin...
            </div>
          )}
          {updaterStatus === 'available' && (
            <div className="p-3.5 bg-indigo-50/40 border border-indigo-200/40 rounded-2xl text-[11px] text-indigo-700 font-bold dark:bg-indigo-900/10 animate-pulse">
              Yeni bir güncelleme bulundu! Arka planda indirme işlemi başlatıldı...
            </div>
          )}
          {updaterStatus === 'not-available' && (
            <div className="p-3.5 bg-emerald-50/40 border border-emerald-250/30 rounded-2xl text-[11px] text-emerald-700 font-bold dark:bg-emerald-955/15">
              Tebrikler, en güncel sürümü kullanıyorsunuz.
            </div>
          )}
          {updaterStatus === 'downloaded' && (
            <div className="p-3.5 bg-emerald-50/40 border border-emerald-250/30 rounded-2xl text-[11px] text-emerald-700 font-bold dark:bg-emerald-955/15">
              Güncelleme başarıyla indirildi. Yüklemek için yukarıdaki{' '}
              <strong>Kapat ve Yükle</strong> butonuna basın.
            </div>
          )}
          {updaterStatus === 'error' && (
            <div className="p-3.5 bg-rose-50/40 border border-rose-200/40 rounded-2xl text-[11px] text-rose-600 font-bold dark:bg-rose-955/15 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Güncelleme hatası: {updaterError || 'Bilinmeyen güncelleme hatası.'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
