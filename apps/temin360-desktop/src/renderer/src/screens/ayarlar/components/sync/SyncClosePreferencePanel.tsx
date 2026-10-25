import React from 'react'
import { Check } from 'lucide-react'

interface ClosePrefProps {
  closePreferenceMode: 'ask' | 'auto'
  closePreferenceActions: string[]
  settingsData: Record<string, string>
  isSavedNotice: boolean
  handleSaveCloseSettings: (mode: 'ask' | 'auto', newActions?: string[]) => Promise<void>
}

export function SyncClosePreferencePanel(props: ClosePrefProps): React.JSX.Element {
  const {
    closePreferenceMode,
    closePreferenceActions,
    settingsData,
    isSavedNotice,
    handleSaveCloseSettings
  } = props

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <span>💾 Dosya Kapatma & Otomatik Yedekleme Davranışı</span>
            {isSavedNotice && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
                Tercih Kaydedildi ✓
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Çalışma dosyanızı her kapattığınızda veya uygulamadan çıktığınızda uygulanacak
            varsayılan davranışı belirleyin.
          </p>
        </div>
      </div>

      {/* Ana Mod Seçimi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSaveCloseSettings('ask')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
            closePreferenceMode === 'ask'
              ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">❓</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Her Kapatışta Onay Penceresi Aç
              </span>
            </div>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              ÖNERİLEN
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Dosyayı kapatırken Drive, Sunucu, PocketBase, MinIO veya Yerel yedek seçeneklerinden
            istediklerinizi seçmeniz için pencere açar.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleSaveCloseSettings('auto')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
            closePreferenceMode === 'auto'
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Otomatik Olarak Belirlenen Yedekleri Al ve Kapat
              </span>
            </div>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              OTOMATİK
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Onay sormadan, aşağıda seçtiğiniz yedekleme yöntemlerini arka planda sırayla çalıştırır
            ve kapatır.
          </p>
        </button>
      </div>

      {/* Otomatik Mod Seçenekleri (Multi-checkbox) */}
      {closePreferenceMode === 'auto' && (
        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Otomatik Kapatma Sırasında Çalıştırılacak Yedekler:
            </h4>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {closePreferenceActions.length === 0
                ? 'Yedekleme yapılmayacak'
                : `${closePreferenceActions.length} yöntem aktif`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              {
                id: 'gdrive',
                icon: '☁️',
                title: 'Google Drive Bulutuna Yedekle',
                desc: 'TEMIN_360_YEDEKLER klasörüne yükler ve son 7 sürümü saklar.',
                configured:
                  !!settingsData.gdriveAccessToken ||
                  !!settingsData.gdriveRefreshToken ||
                  (!!settingsData.gdriveClientId && !!settingsData.gdriveClientSecret)
              },
              {
                id: 'server',
                icon: '🌐',
                title: 'API Web Sunucusuna Yedekle',
                desc: 'Kurumsal sunucuya güvenli HTTPS ile dosya sürümü iletir.',
                configured: !!settingsData.sync_server_url
              },
              {
                id: 'pocketbase',
                icon: '⚡',
                title: 'PocketBase Sunucusuna Yedekle',
                desc: 'PocketBase REST koleksiyonuna doğrudan aktarır.',
                configured: !!settingsData.pocketbase_url
              },
              {
                id: 'minio',
                icon: '🪣',
                title: 'MinIO / S3 Nesne Depoya Yedekle',
                desc: 'S3 uyumlu MinIO bucket nesnesi olarak kaydeder.',
                configured: !!settingsData.minio_endpoint
              },
              {
                id: 'email',
                icon: '✉️',
                title: 'E-Posta ile Yedek Gönder',
                desc: 'Kayıtlı yedek e-posta adresine ek dosya olarak postalar.',
                configured: !!settingsData.smtp_host
              },
              {
                id: 'backup',
                icon: '💾',
                title: 'Bilgisayara Yerel Yedek Kaydet (.temin)',
                desc: 'Bilgisayarınızda seçilen yedekleme klasörüne dosya kopyası yazar.',
                configured: true
              }
            ].map((item) => {
              const isChecked = closePreferenceActions.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    const newActions = isChecked
                      ? closePreferenceActions.filter((x) => x !== item.id)
                      : [...closePreferenceActions, item.id]
                    handleSaveCloseSettings('auto', newActions)
                  }}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-blue-500/70 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{item.icon}</span>
                      <h5 className="text-xs font-bold text-slate-855 dark:text-slate-150 truncate">
                        {item.title}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
