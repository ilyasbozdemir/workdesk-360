import React from 'react'
import {
  AppManifest,
  AppCategory
} from '@worksuite-360/contracts'
import {
  Scale,
  Files,
  GitPullRequest,
  MapPin,
  Users,
  FileText,
  Archive,
  LayoutGrid,
  Play,
  Clock,
  Info,
  ExternalLink,
  Download,
  CheckCircle2,
  Cpu
} from 'lucide-react'
import { RealAppStatus, canLaunch } from '../detection.js'

interface AppCardProps {
  manifest: AppManifest
  realStatus?: RealAppStatus
  onInspect: (manifest: AppManifest) => void
  onLaunch: (manifest: AppManifest) => void
}

function getCategoryIcon(cat: AppCategory) {
  switch (cat) {
    case 'procurement':
      return <Scale size={24} className="text-amber-500" />
    case 'file-management':
      return <Files size={24} className="text-sky-500" />
    case 'workflow':
      return <GitPullRequest size={24} className="text-purple-500" />
    case 'gis':
      return <MapPin size={24} className="text-emerald-500" />
    case 'hr':
      return <Users size={24} className="text-rose-500" />
    case 'document':
      return <FileText size={24} className="text-blue-500" />
    case 'archive':
      return <Archive size={24} className="text-teal-500" />
    case 'system':
    default:
      return <LayoutGrid size={24} className="text-indigo-500" />
  }
}

export const AppCard: React.FC<AppCardProps> = ({ manifest, realStatus, onInspect, onLaunch }) => {
  const isInstalled = realStatus ? canLaunch(realStatus) : manifest.installState === 'installed'
  const isDevSource = realStatus
    ? !!realStatus.isDevSource || (!realStatus.installed && canLaunch(realStatus))
    : false

  const handleDownloadInstall = () => {
    if (manifest.websiteUrl || manifest.repositoryUrl) {
      const url = manifest.websiteUrl || `${manifest.repositoryUrl}/releases`
      window.open(url, '_blank')
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderColor: 'var(--theme-card-border)'
      }}
      className="p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between backdrop-blur-md relative overflow-hidden group"
    >
      <div>
        {/* Top Header: Icon + Name + Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: 'var(--theme-bg-200)',
                borderColor: 'var(--theme-border-100)'
              }}
              className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
            >
              {getCategoryIcon(manifest.category)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base" style={{ color: 'var(--theme-text-100)' }}>
                  {manifest.name}
                </h3>
                <span
                  style={{
                    backgroundColor: 'var(--theme-bg-300)',
                    color: 'var(--theme-text-200)'
                  }}
                  className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                >
                  v{manifest.version}
                </span>
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--theme-text-200)' }}>
                {manifest.summary}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {isInstalled ? (
            <span
              style={{
                backgroundColor: 'var(--theme-badge-installed-bg)',
                color: 'var(--theme-badge-installed-text)',
                borderColor: 'var(--theme-badge-installed-border)'
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isDevSource ? 'Geliştirici Modu (Dev)' : 'Yüklü / Hazır'}
            </span>
          ) : manifest.installState === 'planned' ? (
            <span
              style={{
                backgroundColor: 'var(--theme-badge-planned-bg)',
                color: 'var(--theme-badge-planned-text)',
                borderColor: 'var(--theme-badge-planned-border)'
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5"
            >
              <Clock size={12} />
              Planlandı
            </span>
          ) : (
            <span
              style={{
                backgroundColor: 'var(--theme-badge-planned-bg)',
                color: 'var(--theme-badge-planned-text)',
                borderColor: 'var(--theme-badge-planned-border)'
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5"
            >
              <Download size={12} className="text-sky-500" />
              İndirilebilir
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--theme-text-200)' }}>
          {manifest.description}
        </p>

        {/* Modules Section */}
        {manifest.modules.length > 0 && (
          <div className="mb-4">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5"
              style={{ color: 'var(--theme-text-200)' }}
            >
              Öne Çıkan Modüller
            </span>
            <div className="flex flex-wrap gap-1.5">
              {manifest.modules.map((m, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: 'var(--theme-bg-200)',
                    color: 'var(--theme-text-100)',
                    borderColor: 'var(--theme-border-100)'
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md border font-normal"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div
        style={{
          borderTop: '1px solid var(--theme-border-100)'
        }}
        className="pt-3 mt-2 flex items-center justify-between gap-2"
      >
        <button
          onClick={() => onInspect(manifest)}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--theme-text-200)'
          }}
          className="text-xs flex items-center gap-1 py-1 px-2 rounded hover:text-sky-500 transition-colors"
        >
          <Info size={14} />
          <span>Manifesto</span>
        </button>

        <div className="flex items-center gap-2">
          {manifest.websiteUrl && (
            <a
              href={manifest.websiteUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                borderColor: 'var(--theme-border-100)',
                color: 'var(--theme-text-200)'
              }}
              className="p-1.5 rounded-lg border hover:text-sky-500 transition-colors"
              title="Resmi Web Sitesi / Rehber"
            >
              <ExternalLink size={14} />
            </a>
          )}

          {isInstalled ? (
            <button
              onClick={() => onLaunch(manifest)}
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: '#ffffff'
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 shadow-sm transition-opacity"
            >
              <Play size={14} fill="currentColor" />
              <span>Başlat</span>
            </button>
          ) : manifest.installState === 'planned' ? (
            <button
              disabled
              style={{
                backgroundColor: 'var(--theme-bg-300)',
                color: 'var(--theme-text-200)'
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed opacity-80"
              title="Bu uygulama henüz bağımsız kurulabilir durumda değildir."
            >
              Kuruluma Hazır Değil
            </button>
          ) : (
            <button
              onClick={handleDownloadInstall}
              style={{
                backgroundColor: 'var(--theme-bg-200)',
                color: 'var(--theme-text-100)',
                borderColor: 'var(--theme-border-100)'
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-xs"
              title="Uygulama indirme veya kurulum sayfasına git"
            >
              <Download size={13} />
              <span>İndir &amp; Kur</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
