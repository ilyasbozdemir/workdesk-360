import React from 'react'
import {
  Building2,
  Edit3,
  MapPin,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Check,
  Image as ImageIcon
} from 'lucide-react'
import { KurumVerisi } from '../../kurum.hooks'

interface KurumHeroBannerProps {
  data: Partial<KurumVerisi>
  profileAvatar: string | null
  onEditClick: () => void
  effectiveLogoLeft: string | null
  effectiveLogoRight: string | null
  effectiveShowLogoLeft: boolean
  effectiveShowLogoRight: boolean
}

export const KurumHeroBanner: React.FC<KurumHeroBannerProps> = ({
  data,
  profileAvatar,
  onEditClick,
  effectiveLogoLeft,
  effectiveLogoRight,
  effectiveShowLogoLeft,
  effectiveShowLogoRight
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xl">
      {/* Cover Photo / Graphic Mesh Gradient */}
      <div className="relative h-44 sm:h-52 w-full bg-linear-to-r from-slate-950 via-blue-950 to-indigo-950 overflow-hidden">
        {/* Decorative Mesh Lights & Geometric Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.15),transparent_60%)]" />

        {/* Subtle Grid Watermark Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-size-[24px_24px]" />

        {/* Top Bar Badges in Cover */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-blue-300 border border-blue-400/30 text-[11px] font-bold backdrop-blur-md shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Resmi Kurum Profili</span>
            </span>

            {data.detsis_kodu && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>DETSİS Doğrulandı</span>
              </span>
            )}
          </div>

          {/* Quick Edit Action Button in Cover */}
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 hover:border-white/40 text-xs font-bold transition-all backdrop-blur-md shadow-md cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-300" />
            <span>Bilgileri Düzenle</span>
          </button>
        </div>
      </div>

      {/* Profile Info Bar (Overlapping Logo + Title + Quick Badges) */}
      <div className="relative px-6 pb-6 pt-0 bg-slate-900/95 dark:bg-slate-900/95 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-14 sm:-mt-16 relative z-10">
          {/* Left: Floating Avatar Logo + Title info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1 min-w-0">
            {/* Institution Logo Card */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-900 p-2.5 border-4 border-slate-900 dark:border-slate-900 shadow-2xl shrink-0 flex items-center justify-center relative group">
              {profileAvatar ? (
                <img
                  src={profileAvatar}
                  alt="Kurum Logosu"
                  className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Building2 className="w-10 h-10" />
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center"
                title="Profil Aktif"
              >
                <Check className="w-3 h-3 text-white stroke-3" />
              </div>
            </div>

            {/* Titles & Meta */}
            <div className="space-y-1.5 flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  {data.kurum_adi || 'Kurum Adı Tanımlanmamış'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300">
                {data.makam_adi && (
                  <span className="inline-flex items-center gap-1 text-blue-300 font-medium">
                    <Landmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{data.makam_adi}</span>
                  </span>
                )}

                {(data.il || data.ilce) && (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {data.ilce ? `${data.ilce} / ` : ''}
                      {data.il || ''}
                    </span>
                  </span>
                )}

                {data.detsis_kodu && (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <span className="text-slate-500">DETSİS:</span>
                    <strong className="text-amber-300 font-semibold">{data.detsis_kodu}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Logos Mini-Gallery */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-md self-start md:self-end">
            {/* Sol Logo Mini Preview */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center p-1 overflow-hidden"
                title="Resmi Belge Sol Logosu"
              >
                {effectiveLogoLeft ? (
                  <img
                    src={effectiveLogoLeft}
                    alt="Sol Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${effectiveShowLogoLeft ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 bg-slate-900'}`}
              >
                {effectiveShowLogoLeft ? 'Sol: Açık' : 'Sol: Kapalı'}
              </span>
            </div>

            <div className="w-px h-10 bg-slate-700/60" />

            {/* Sağ Logo Mini Preview */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center p-1 overflow-hidden"
                title="Resmi Belge Sağ Logosu (Bakanlık)"
              >
                {effectiveLogoRight ? (
                  <img
                    src={effectiveLogoRight}
                    alt="Sağ Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${effectiveShowLogoRight ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 bg-slate-900'}`}
              >
                {effectiveShowLogoRight ? 'Sağ: Açık' : 'Sağ: Kapalı'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
