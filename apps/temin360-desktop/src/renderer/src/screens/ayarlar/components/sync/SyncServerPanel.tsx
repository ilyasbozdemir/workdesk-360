import React from 'react'
import { Upload, Download, RefreshCw, Save, Wifi, WifiOff } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { useSyncStore } from '../../../../store/syncStore'
import packageJson from '../../../../../../../package.json'

export function SyncServerPanel(): React.JSX.Element {
  const {
    syncUrl,
    setSyncUrl,
    syncPort,
    setSyncPort,
    syncToken,
    setSyncToken,
    isOnlineMode,
    setIsOnlineMode,
    syncStatus,
    syncMessage,
    isPushing,
    isPulling,
    dbVersionLocal,
    dbVersionCloud,
    saveSettings,
    testConnection,
    triggerPush,
    triggerPull
  } = useSyncStore()

  return (
    <>
      {/* Sunucu Durum & Güncelleme Bilgi Paneli */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          syncUrl
            ? syncStatus === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : syncStatus === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
              syncUrl
                ? syncStatus === 'ok'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : syncStatus === 'error'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}
          >
            {syncUrl ? (syncStatus === 'ok' ? '✓' : syncStatus === 'error' ? '✗' : '⏳') : '!'}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              {!syncUrl
                ? 'Bağlantı Kurulmadı'
                : syncStatus === 'ok'
                  ? 'Sunucu Aktif & Bağlı'
                  : syncStatus === 'error'
                    ? 'Bağlantı Başarısız'
                    : 'Bağlantı Test Edilmedi'}

              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                  isOnlineMode
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}
              >
                {isOnlineMode ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnlineMode ? 'Ofis (Online)' : 'Ev (Offline)'}
              </span>
            </div>
            <div className="text-[11px] opacity-90 mt-0.5">
              {!syncUrl
                ? 'Lütfen veri senkronizasyonu için geçerli bir Sunucu Adresi girin.'
                : syncStatus === 'ok'
                  ? `Uzak sunucu (${syncUrl}) ile iletişim başarıyla sağlandı. Değişiklikler otomatik senkronize edilir.`
                  : syncStatus === 'error'
                    ? 'Girdiğiniz adrese ulaşılamadı. Sunucu ayarlarınızı veya internetinizi kontrol edin.'
                    : 'Sunucu adresi tanımlandı. Lütfen aşağıdaki buton ile bağlantıyı test edin.'}
            </div>
          </div>
        </div>

        {syncUrl && (
          <Button
            onClick={() => testConnection()}
            disabled={syncStatus === 'loading'}
            className="text-[10px] font-bold py-1.5 px-3 rounded-lg bg-white/80 dark:bg-slate-955/80 hover:bg-white dark:hover:bg-slate-950 text-slate-805 dark:text-slate-100 shadow-sm border border-black/5"
          >
            {syncStatus === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null}
            {syncStatus === 'loading' ? 'Bağlantı Sınanıyor...' : 'Sına & Kaydet'}
          </Button>
        )}
      </div>

      {/* Sürüm Bilgisi */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <div>
            Yerel Sürüm:{' '}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              v{packageJson.version}
            </span>
          </div>
          <div className="text-slate-300 dark:text-slate-700">•</div>
          <div>
            Bulut Sürüm:{' '}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              v{packageJson.version}
            </span>
          </div>
        </div>
        {dbVersionLocal < dbVersionCloud && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">
            ▲ Sunucuda yeni değişiklikler var! Lütfen eşitleyin.
          </div>
        )}
      </div>

      {/* Bağlantı Ayarları */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          API Sunucu Bağlantı Ayarları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Sunucu Adresi (Domain / IP)
            </label>
            <Input
              type="text"
              placeholder="https://temin360app.demo.ilyasbozdemir.dev/"
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Port (Opsiyonel)
            </label>
            <Input
              type="text"
              placeholder="3000"
              value={syncPort}
              onChange={(e) => setSyncPort(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Güvenlik Tokenı (Auth Key)
            </label>
            <Input
              type="password"
              placeholder="dta_key_..."
              value={syncToken}
              onChange={(e) => setSyncToken(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>
        </div>

        {/* Çalışma Modu Toggle */}
        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/80 pt-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Çalışma Modu
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {isOnlineMode
                ? 'Ofis (Online) - Değişiklikler canlı olarak sunucuya aktarılır'
                : 'Ev (Offline) - Yerel SQLite veritabanı üzerinden bağımsız çalışılır'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isOnlineMode}
              onChange={(e) => setIsOnlineMode(e.target.checked)}
              className="sr-only peer cursor-pointer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => saveSettings()}
              className="text-xs py-1.5 px-4 rounded-lg bg-slate-700 hover:bg-slate-900 text-white gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Ayarları Kaydet
            </Button>
            <Button
              onClick={() => testConnection()}
              disabled={syncStatus === 'loading'}
              className="text-xs py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {syncStatus === 'loading' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Sına & Bağlan
            </Button>
          </div>

          {syncMessage && (
            <span
              className={`text-xs font-semibold ${
                syncStatus === 'ok'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {syncMessage}
            </span>
          )}
        </div>
      </div>

      {/* Aksiyon Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PUSH */}
        <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Ana Sunucuya Gönder
              </div>
              <div className="text-[10px] text-slate-500">
                Yereldeki değişiklikleri uzak sunucuya ilet (Push)
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            Yerel veritabanındaki güncel verileri uzak web sunucusuna göndererek yayınlar.
          </p>
          <Button
            onClick={() => triggerPush()}
            disabled={isPushing || !syncUrl}
            className="mt-auto w-full text-sm py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPushing ? '⏳ Gönderiliyor...' : '🚀 Sunucuya Gönder'}
          </Button>
        </div>

        {/* PULL */}
        <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Sunucudan Al
              </div>
              <div className="text-[10px] text-slate-500">
                Uzak sunucudaki güncellemeleri çek (Pull)
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            Uzak sunucudaki verileri yerel veritabanınıza indirerek günceller.
          </p>
          <Button
            onClick={() => triggerPull()}
            disabled={isPulling || !syncUrl}
            className="mt-auto w-full text-sm py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPulling ? '⏳ Alınıyor...' : '📥 Sunucudan Al'}
          </Button>
        </div>
      </div>
    </>
  )
}
