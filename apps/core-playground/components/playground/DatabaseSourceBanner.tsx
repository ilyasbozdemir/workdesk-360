'use client'

import React from 'react'
import { Database, Sparkles, FolderOpen, Package, RefreshCw } from 'lucide-react'
import { usePlaygroundDatabase } from '@/components/layout/PlaygroundDatabaseContext'

interface DatabaseSourceBannerProps {
  onRefreshExtra?: () => void
  compact?: boolean
}

export const DatabaseSourceBanner: React.FC<DatabaseSourceBannerProps> = ({
  onRefreshExtra,
  compact = false,
}) => {
  const {
    activeDbInfo,
    isLoading,
    isSwitching,
    refreshDbInfo,
    switchDatabase,
    openPresetTemin,
    openDesktopTemin,
    triggerFilePicker,
  } = usePlaygroundDatabase()

  const handleRefresh = async () => {
    await refreshDbInfo()
    if (onRefreshExtra) onRefreshExtra()
  }

  const handleSwitch = async (target: 'desktop' | 'fixture') => {
    const ok = await switchDatabase(target)
    if (ok && onRefreshExtra) onRefreshExtra()
  }

  const handleOpenPreset = async () => {
    const ok = await openPresetTemin()
    if (ok && onRefreshExtra) onRefreshExtra()
  }

  const handleOpenDesktopTemin = async () => {
    const ok = await openDesktopTemin()
    if (ok && onRefreshExtra) onRefreshExtra()
  }

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Sol Taraf: Aktif Veritabanı Bilgisi */}
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              activeDbInfo?.source === 'desktop_active'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : activeDbInfo?.source === 'temin_package'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {activeDbInfo?.source === 'temin_package' ? (
              <Package className="w-5 h-5 text-purple-400" />
            ) : (
              <Database className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Aktif Veritabanı:
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  activeDbInfo?.source === 'desktop_active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : activeDbInfo?.source === 'temin_package'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : activeDbInfo?.source === 'fixture'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {activeDbInfo?.source === 'desktop_active'
                  ? '🟢 Masaüstü Uygulaması (Canlı Oturum)'
                  : activeDbInfo?.source === 'temin_package'
                  ? `📦 Açık Dosya: ${activeDbInfo.customLabel || '.temin Paketi'}`
                  : activeDbInfo?.source === 'fixture'
                  ? '📁 Statik Test Fikstürü (test-projesi.sqlite)'
                  : '⚙️ Özel Veritabanı'}
              </span>
            </div>
            <div
              className="text-xs text-slate-300 font-mono mt-0.5 truncate max-w-xl"
              title={activeDbInfo?.path}
            >
              {activeDbInfo?.path || 'Veritabanı yolu aranıyor...'}
            </div>
            {!compact && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                <span>
                  Toplam Dosya:{' '}
                  <strong className="text-white">{activeDbInfo?.fileCount ?? 0}</strong>
                </span>
                <span>•</span>
                <span>
                  Kayıtlı Kalemler:{' '}
                  <strong className="text-white">{activeDbInfo?.itemCount ?? 0}</strong>
                </span>
                <span>•</span>
                <span>
                  Kayıtlı Teklifler:{' '}
                  <strong className="text-white">{activeDbInfo?.offerCount ?? 0}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Hızlı Değiştirme ve Aksiyonlar */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            onClick={triggerFilePicker}
            disabled={isSwitching}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
            title="Bilgisayarınızdan dilediğiniz .temin veya .sqlite dosyasını seçip çalışma alanı olarak açar"
          >
            <FolderOpen className="w-4 h-4" />
            .temin Dosyası Seç & Aç
          </button>

          <button
            onClick={handleOpenDesktopTemin}
            disabled={isSwitching}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            title="Masaüstünüzde (Desktop) bulunan gerçek .temin paketini (örn. Güneyyurt Belediyesi) çalışma alanı olarak açar"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Masaüstü .temin'i Aç
          </button>

          <button
            onClick={handleOpenPreset}
            disabled={isSwitching}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
            title="Repo içindeki hazır test-projesi.temin dosyasını çalışma alanı olarak açar"
          >
            <Package className="w-3.5 h-3.5" />
            Örnek .temin
          </button>

          {activeDbInfo?.isDesktopRunning && activeDbInfo.source !== 'desktop_active' && (
            <button
              onClick={() => handleSwitch('desktop')}
              disabled={isSwitching}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
              title="Açık masaüstü uygulaması oturumuna anında bağlanır"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Masaüstüne Bağlan
            </button>
          )}

          {activeDbInfo?.source !== 'fixture' && (
            <button
              onClick={() => handleSwitch('fixture')}
              disabled={isSwitching}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition disabled:opacity-50"
              title="İzole test fikstürüne geri döner"
            >
              Fikstür
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
            title="Veritabanındaki taze kayıtları yeniden yükle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? '...' : 'Yenile'}
          </button>
        </div>
      </div>
    </div>
  )
}
