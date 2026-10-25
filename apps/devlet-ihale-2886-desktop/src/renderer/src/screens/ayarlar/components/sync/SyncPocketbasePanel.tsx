import React from 'react'
import { Upload, RefreshCw, Save, Zap } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { useSyncStore } from '../../../../store/syncStore'

export function SyncPocketbasePanel(): React.JSX.Element {
  const {
    pocketbaseUrl,
    setPocketbaseUrl,
    pocketbaseEmail,
    setPocketbaseEmail,
    pocketbasePassword,
    setPocketbasePassword,
    syncStatus,
    syncMessage,
    isPushing,
    saveSettings,
    testPocketBase,
    pushPocketBase
  } = useSyncStore()

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> PocketBase Self-Hosted Backend Entegrasyonu
          </h3>
          <span className="text-[10px] font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded">
            REST & Realtime Storage
          </span>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          PocketBase açık kaynaklı, SQLite tabanlı son derece hızlı ve hafif bir backend çözümüdür.
          Çalışma alanınızı PocketBase REST API koleksiyonuna doğrudan aktarabilir ve
          saklayabilirsiniz.
        </p>
      </div>

      {/* PocketBase Ayarlar Formu */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          PocketBase Sunucu & Oturum Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              PocketBase Sunucu URL (Örn: http://localhost:8090)
            </label>
            <Input
              type="text"
              placeholder="http://localhost:8090"
              value={pocketbaseUrl}
              onChange={(e) => setPocketbaseUrl(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              E-Posta / Admin Kullanıcı
            </label>
            <Input
              type="text"
              placeholder="admin@temin360.com"
              value={pocketbaseEmail}
              onChange={(e) => setPocketbaseEmail(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Parola
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={pocketbasePassword}
              onChange={(e) => setPocketbasePassword(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => saveSettings()}
              className="text-xs py-1.5 px-4 rounded-lg bg-slate-700 hover:bg-slate-900 text-white gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Ayarları Kaydet
            </Button>
            <Button
              onClick={() => testPocketBase()}
              disabled={syncStatus === 'loading'}
              className="text-xs py-1.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {syncStatus === 'loading' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Sına & Doğrula
            </Button>
          </div>

          {syncMessage && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {syncMessage}
            </span>
          )}
        </div>
      </div>

      {/* PocketBase Aktarım Kartı */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Upload size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              PocketBase Koleksiyonuna Aktar (Workspaces Push)
            </h4>
            <p className="text-xs text-slate-500">
              Aktif çalışma dosyasını PocketBase depolama alanına yazar
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Çalışma alanınızı PocketBase REST API üzerindeki `workspaces` koleksiyonuna güvenle
          yükler.
        </p>
        <Button
          onClick={() => pushPocketBase()}
          disabled={isPushing || !pocketbaseUrl}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl"
        >
          {isPushing ? "⏳ PocketBase'e Aktarılıyor..." : "🚀 Dosyayı PocketBase'e Gönder"}
        </Button>
      </div>
    </div>
  )
}
