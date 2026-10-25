import React, { useState } from 'react'
import {
  BadgeAlert,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  FileText,
  GitFork,
  Loader2,
  Trash2,
  Wrench,
  X,
  Lock,
  Sparkles,
  ArrowRight,
  FolderOpen
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '../../../utils/cn'
import { isModulRemovable, type ModulPaketi } from '../modulMagazasi.types'
import { getSurumAsamasiMeta } from '../modulDurum'
import { APP_ROUTES } from '../../../constants/routeConstants'

interface ModulDetailModalProps {
  modul: ModulPaketi | null
  isInstalled: boolean
  isInstalling?: boolean
  onClose: () => void
  onInstall: (id: string) => void
  onPromptUninstall: (modul: ModulPaketi) => void
}

type TabType = 'belgeler' | 'asamalar' | 'mevzuat'

export const ModulDetailModal: React.FC<ModulDetailModalProps> = ({
  modul,
  isInstalled,
  isInstalling,
  onClose,
  onInstall,
  onPromptUninstall
}) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('belgeler')

  const handleOpenModul = (routePath?: string): void => {
    if (!routePath) return
    onClose()
    const [pathname, searchStr] = routePath.split('?')
    if (searchStr) {
      const searchParams = Object.fromEntries(new URLSearchParams(searchStr).entries())
      navigate({ to: pathname as string, search: searchParams as never })
    } else {
      navigate({ to: pathname as string })
    }
  }

  const handleOpenBelge = (_belge?: { ad: string; kod: string }): void => {
    void _belge
    if (!modul) return
    onClose()
    if (modul.routePath) {
      handleOpenModul(modul.routePath)
    } else {
      navigate({ to: APP_ROUTES.DOSYALAR })
    }
  }

  if (!modul) return null

  const surum = getSurumAsamasiMeta(modul.surumAsamasi)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Üst Başlık & Kapatma */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-mono">
                {modul.kod}
              </span>
              {modul.paketTipi === 'extension' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                  🔌 EKLENTİ
                </span>
              ) : modul.paketTipi === 'utils' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider uppercase bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                  🧮 HESAP ARACI
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider uppercase bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
                  🏛️ MODÜL
                </span>
              )}
              {modul.surumAsamasi && (
                <span
                  title={surum.aciklama}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider uppercase cursor-help',
                    surum.rozetClass
                  )}
                >
                  {surum.etiket}
                </span>
              )}
              {!isModulRemovable(modul) && (
                <span
                  title="Bu paket Temin 360 çekirdek sistem bileşenidir ve kaldırılamaz."
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider uppercase bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-help"
                >
                  <Lock className="w-2.5 h-2.5" />
                  ÇEKİRDEK
                </span>
              )}
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {modul.mevzuat}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                ({modul.versiyon})
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {modul.baslik}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
              {modul.kisaAciklama}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sekme Butonları */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('belgeler')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'belgeler'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Belge Şablonları ({modul.belgeler.length})
          </button>
          <button
            onClick={() => setActiveTab('asamalar')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'asamalar'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GitFork className="w-4 h-4" />
            Süreç Aşamaları ({modul.asamalar.length})
          </button>
          <button
            onClick={() => setActiveTab('mevzuat')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'mevzuat'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Mevzuat & Araçlar
          </button>
        </div>

        {/* Gövde / İçerik Alanı */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: Belgeler */}
          {activeTab === 'belgeler' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Bu modül kurulduğunda projenizde otomatik aktifleşecek resmi evrak şablonları:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modul.belgeler.map((belge, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenBelge(belge)}
                    className="group p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500 hover:shadow-md hover:bg-white dark:hover:bg-slate-850 transition-all space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
                        {belge.kod}
                      </span>
                      {belge.zorunluMu ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                          <BadgeAlert className="w-3 h-3" />
                          Zorunlu Belge
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                          Seçimlik
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {belge.ad}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {belge.aciklama}
                    </div>
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Belgeyi Canlı Aç & Düzenle
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Aşamalar */}
          {activeTab === 'asamalar' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Bu modülün standart iş akışındaki yürütme adımları ve hiyerarşisi:
              </div>
              <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-500/30 space-y-6">
                {modul.asamalar.map((asama) => (
                  <div key={asama.sira} className="relative group">
                    <div className="absolute -left-7.75 top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-500 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-black">
                      {asama.sira}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 group-hover:border-indigo-400/50 dark:group-hover:border-indigo-500/40 transition-all">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {asama.baslik}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {asama.aciklama}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Mevzuat & Araçlar */}
          {activeTab === 'mevzuat' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  Yasal Dayanak & Kapsam
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {modul.detayliAciklama}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Dahili Otomasyon & Hesaplama Araçları
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {modul.araclar.map((arac, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 text-xs text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{arac}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Kısım: Aksiyonlar */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 max-w-xl">
            {/* Kurulum durumu */}
            {isInstalled ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Bu paket çalışma alanınızda kurulu.
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Bu paket henüz kurulu değil. Kurduğunuzda şablonları ve süreç adımları çalışma
                alanınıza eklenir.
              </span>
            )}
            {/* Sürüm olgunluğu uyarısı — kurulu olsa bile Alfa/Beta resmî kullanıma hazır sayılmaz */}
            {!surum.resmiKullanimaUygun && (
              <span className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <BadgeAlert className="w-4 h-4 shrink-0 mt-px" />
                {surum.etiket}: {surum.aciklama}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Kapat
            </button>
            {isInstalled ? (
              <div className="flex items-center gap-2">
                {modul.routePath ? (
                  <button
                    onClick={() => {
                      onClose()
                      handleOpenModul(modul.routePath!)
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>
                      {modul.id === 'kik-dogrudan-temin-22d'
                        ? 'Doğrudan Temin Dosyaları'
                        : 'Modülü Aç'}
                    </span>
                  </button>
                ) : null}
                {isModulRemovable(modul) ? (
                  <button
                    onClick={() => onPromptUninstall(modul)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Modülü Kaldır
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none cursor-not-allowed"
                    title="Bu paket Temin 360 çekirdek çalışma omurgasıdır ve sistem kararlılığı için kaldırılamaz."
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>Korumalı Çekirdek Modül</span>
                  </div>
                )}
              </div>
            ) : isInstalling ? (
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-500/80 text-white cursor-wait animate-pulse shadow-md shadow-indigo-600/20"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Modül Paketi Kuruluyor...</span>
              </button>
            ) : (
              <button
                onClick={() => onInstall(modul.id)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Modülü Hemen Kur
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
