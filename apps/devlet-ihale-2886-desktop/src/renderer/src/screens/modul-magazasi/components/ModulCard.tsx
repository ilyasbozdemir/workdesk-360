import React from 'react'
import {
  FileCheck,
  Landmark,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Download,
  Info,
  GitFork,
  Trash2,
  Loader2,
  Calculator,
  TrendingUp,
  Clock,
  Percent,
  Coins,
  Cpu,
  Puzzle,
  Archive,
  RotateCcw,
  Lock,
  Sparkles,
  Users,
  PackageSearch,
  FolderTree
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '../../../utils/cn'
import { isModulRemovable, type ModulPaketi } from '../modulMagazasi.types'
import { getSurumAsamasiMeta } from '../modulDurum'

interface ModulCardProps {
  modul: ModulPaketi
  isInstalled: boolean
  isTrashed?: boolean
  remainingTrashDays?: number
  isInstalling?: boolean
  onInstall: (id: string) => void
  onRestore?: (id: string) => void
  onPromptUninstall: (modul: ModulPaketi) => void
  onOpenDetail: (modul: ModulPaketi) => void
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FileCheck: <FileCheck className="w-6 h-6" />,
  Landmark: <Landmark className="w-6 h-6" />,
  FileSpreadsheet: <FileSpreadsheet className="w-6 h-6" />,
  FileText: <FileText className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Calculator: <Calculator className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  Percent: <Percent className="w-6 h-6" />,
  Coins: <Coins className="w-6 h-6" />,
  Cpu: <Cpu className="w-6 h-6" />,
  Puzzle: <Puzzle className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
  PackageSearch: <PackageSearch className="w-6 h-6" />,
  FolderTree: <FolderTree className="w-6 h-6" />
}

const COLOR_MAP: Record<
  string,
  {
    border: string
    badge: string
    glow: string
    iconBg: string
    text: string
  }
> = {
  blue: {
    border: 'hover:border-blue-500/50',
    badge:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
    glow: 'from-blue-500/10 dark:from-blue-600/10 to-transparent',
    iconBg:
      'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400'
  },
  emerald: {
    border: 'hover:border-emerald-500/50',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    glow: 'from-emerald-500/10 dark:from-emerald-600/10 to-transparent',
    iconBg:
      'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  purple: {
    border: 'hover:border-purple-500/50',
    badge:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
    glow: 'from-purple-500/10 dark:from-purple-600/10 to-transparent',
    iconBg:
      'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400'
  },
  amber: {
    border: 'hover:border-amber-500/50',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    glow: 'from-amber-500/10 dark:from-amber-600/10 to-transparent',
    iconBg:
      'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400'
  },
  cyan: {
    border: 'hover:border-cyan-500/50',
    badge:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30',
    glow: 'from-cyan-500/10 dark:from-cyan-600/10 to-transparent',
    iconBg:
      'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30',
    text: 'text-cyan-600 dark:text-cyan-400'
  },
  rose: {
    border: 'hover:border-rose-500/50',
    badge:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
    glow: 'from-rose-500/10 dark:from-rose-600/10 to-transparent',
    iconBg:
      'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400'
  },
  indigo: {
    border: 'hover:border-indigo-500/50',
    badge:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30',
    glow: 'from-indigo-500/10 dark:from-indigo-600/10 to-transparent',
    iconBg:
      'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400'
  }
}

export const ModulCard: React.FC<ModulCardProps> = ({
  modul,
  isInstalled,
  isTrashed = false,
  remainingTrashDays = 0,
  isInstalling,
  onInstall,
  onRestore,
  onPromptUninstall,
  onOpenDetail
}) => {
  const navigate = useNavigate()

  const handleOpenModul = (routePath?: string) => {
    if (!routePath) return
    const [pathname, searchStr] = routePath.split('?')
    if (searchStr) {
      const searchParams = Object.fromEntries(new URLSearchParams(searchStr).entries())
      navigate({ to: pathname as string, search: searchParams as never })
    } else {
      navigate({ to: pathname as string })
    }
  }

  const colorTheme = COLOR_MAP[modul.renk] || COLOR_MAP.blue
  const icon = ICON_MAP[modul.ikon] || <FileText className="w-6 h-6" />
  const surum = getSurumAsamasiMeta(modul.surumAsamasi)

  const cardBgClasses = `bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 ${colorTheme.border} shadow-xs dark:shadow-lg`

  return (
    <div
      className={`relative group flex flex-col justify-between rounded-2xl ${cardBgClasses} p-5 md:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden`}
    >
      {/* Arka plan yumuşak renk geçişi */}
      <div
        className={`absolute inset-0 rounded-2xl bg-linear-to-br ${colorTheme.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
      />

      {/* Üst Kısım: İkon, Başlık ve Durum Rozeti */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border flex items-center justify-center shadow-inner ${colorTheme.iconBg}`}
            >
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border tracking-wider uppercase ${colorTheme.badge}`}
                >
                  {modul.kod}
                </span>
                {modul.paketTipi === 'extension' ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                    🔌 EKLENTİ
                  </span>
                ) : modul.paketTipi === 'utils' ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border tracking-wider uppercase bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                    🧮 HESAP ARACI
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold border tracking-wider uppercase bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
                    🏛️ MODÜL
                  </span>
                )}
                {modul.surumAsamasi && (
                  <span
                    title={surum.aciklama}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider uppercase shadow-xs cursor-help',
                      surum.rozetClass
                    )}
                  >
                    {surum.etiket}
                  </span>
                )}
                {!isModulRemovable(modul) && (
                  <span
                    title="Bu paket Temin 360 çekirdek sistem bileşenidir ve sistem kararlılığı için kaldırılamaz."
                    className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider uppercase bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-help"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    ÇEKİRDEK
                  </span>
                )}
                <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">
                  {modul.versiyon}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                {modul.mevzuat}
              </span>
            </div>
          </div>

          {/* Kurulum / Çöp Kutusu durumu rozeti */}
          {isTrashed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-amber-750 dark:text-amber-300 shadow-2xs">
              <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Çöp Kutusunda ({remainingTrashDays} gün)
            </span>
          ) : isInstalled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Kurulu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              Kurulu Değil
            </span>
          )}
        </div>

        {/* Başlık ve Açıklama */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold transition-colors line-clamp-1 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200">
            {modul.baslik}
          </h3>

          <p className="text-xs leading-relaxed line-clamp-2 text-slate-600 dark:text-slate-300">
            {modul.kisaAciklama}
          </p>
        </div>

        {/* Metrikler: Şablon ve Aşama Sayısı */}
        <div className="flex items-center gap-4 py-2 border-y text-xs border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {modul.belgeler.length}
            </span>{' '}
            Resmi Şablon
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 font-medium">
            <GitFork className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {modul.asamalar.length}
            </span>{' '}
            Süreç Aşaması
          </div>
        </div>

        {/* Etiketler */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {modul.etiketler.slice(0, 3).map((etiket, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
            >
              #{etiket}
            </span>
          ))}
          {modul.etiketler.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-400">
              +{modul.etiketler.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Alt Aksiyon Butonları */}
      <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
        <button
          onClick={() => onOpenDetail(modul)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Detayları & Belgeleri Gör
        </button>

        {isTrashed ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRestore && onRestore(modul.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Geri Yükle
            </button>
            <button
              onClick={() => onPromptUninstall(modul)}
              title="Kalıcı Sil"
              className="flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : isInstalled ? (
          <div className="flex items-center gap-1.5">
            {modul.routePath && (
              <button
                onClick={() => handleOpenModul(modul.routePath)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
                title={`${modul.baslik} Ekranını Aç`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Aç
              </button>
            )}
            {isModulRemovable(modul) ? (
              <button
                onClick={() => onPromptUninstall(modul)}
                title="Modülü kaldır (Çöp kutusuna taşı)"
                className="flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 transition-all cursor-pointer"
              >
                <Archive className="w-4 h-4" />
              </button>
            ) : (
              <div
                title="4734 Doğrudan Temin çekirdek çalışma paketidir; sistem kararlılığı için kaldırılamaz."
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>Korumalı</span>
              </div>
            )}
          </div>
        ) : isInstalling ? (
          <button
            disabled
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/80 text-white cursor-wait animate-pulse shadow-xs"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Kuruluyor...</span>
          </button>
        ) : (
          <button
            onClick={() => onInstall(modul.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-600/30 transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Modülü Kur
          </button>
        )}
      </div>
    </div>
  )
}
