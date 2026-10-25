import React from 'react'
import { Upload, RefreshCw, Save, HardDrive } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { useSyncStore } from '../../../../store/syncStore'

export function SyncMinioPanel(): React.JSX.Element {
  const {
    minioEndpoint,
    setMinioEndpoint,
    minioAccessKey,
    setMinioAccessKey,
    minioSecretKey,
    setMinioSecretKey,
    minioBucket,
    setMinioBucket,
    minioRegion,
    setMinioRegion,
    minioUseSSL,
    setMinioUseSSL,
    syncStatus,
    syncMessage,
    isPushing,
    saveSettings,
    testMinIO,
    pushMinIO
  } = useSyncStore()

  return (
    <div className="space-y-4">
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-rose-500" /> MinIO / AWS S3 Uyumlu Nesne Depolama
            (Object Storage)
          </h3>
          <span className="text-[10px] font-mono font-bold bg-rose-500/20 px-2 py-0.5 rounded">
            S3 API Compatible
          </span>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
          MinIO, Amazon S3 mimarisiyle tam uyumlu yüksek performanslı nesne depolama sunucusudur.
          Kurumsal ortamlarda kendi MinIO kümeniz veya S3 servisi üzerine (.temin) yedeklerinizi
          aktarabilirsiniz.
        </p>
      </div>

      {/* MinIO Ayarlar Formu */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          MinIO / S3 Depo Erişim Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              MinIO / S3 Endpoint URL (Örn: http://localhost:9000 veya https://minio.kurum.gov.tr)
            </label>
            <Input
              type="text"
              placeholder="http://localhost:9000"
              value={minioEndpoint}
              onChange={(e) => setMinioEndpoint(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Access Key ID
            </label>
            <Input
              type="text"
              placeholder="minioadmin"
              value={minioAccessKey}
              onChange={(e) => setMinioAccessKey(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Secret Access Key
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={minioSecretKey}
              onChange={(e) => setMinioSecretKey(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Bucket Adı (Kova)
            </label>
            <Input
              type="text"
              placeholder="temin-360-yedekler"
              value={minioBucket}
              onChange={(e) => setMinioBucket(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Bölge (Region - Opsiyonel)
            </label>
            <Input
              type="text"
              placeholder="us-east-1"
              value={minioRegion}
              onChange={(e) => setMinioRegion(e.target.value)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono text-xs"
            />
          </div>
        </div>

        {/* SSL Switch */}
        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/80 pt-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Güvenli SSL / HTTPS Bağlantısı
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {minioUseSSL
                ? 'HTTPS aktif (Güvenli Sertifikalı İletişim)'
                : 'HTTP aktif (Yerel / Test Ortamı)'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={minioUseSSL}
              onChange={(e) => setMinioUseSSL(e.target.checked)}
              className="sr-only peer cursor-pointer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-rose-600"></div>
          </label>
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
              onClick={() => testMinIO()}
              disabled={syncStatus === 'loading'}
              className="text-xs py-1.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              {syncStatus === 'loading' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Sına & Bağlan
            </Button>
          </div>

          {syncMessage && (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {syncMessage}
            </span>
          )}
        </div>
      </div>

      {/* MinIO Aktarım Kartı */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <Upload size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              MinIO / S3 Kovasına Gönder (Bucket Push)
            </h4>
            <p className="text-xs text-slate-500">
              Çalışma dosyanızı doğrudan S3 bucket nesnesi olarak yükler
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Yedeklerinizi nesne depolama altyapısına otomatik tarih sürümüyle kaydeder.
        </p>
        <Button
          onClick={() => pushMinIO()}
          disabled={isPushing || !minioEndpoint}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl"
        >
          {isPushing ? '⏳ MinIO Kovasına Aktarılıyor...' : '🚀 Dosyayı MinIO Kovasına Yükle'}
        </Button>
      </div>
    </div>
  )
}
