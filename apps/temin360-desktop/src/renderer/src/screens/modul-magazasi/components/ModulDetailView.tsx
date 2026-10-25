import React, { useState } from 'react'
import {
  ArrowLeft,
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
  Lock,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Copy,
  FileEdit,
  AlertTriangle,
  Lightbulb,
  Search,
  Filter
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '../../../utils/cn'
import { isModulRemovable, type ModulPaketi, type HazirMetinKalibi } from '../modulMagazasi.types'
import { getSurumAsamasiMeta } from '../modulDurum'
import { APP_ROUTES } from '../../../constants/routeConstants'
import { HAZIR_METINLER_DATA } from '../constants/hazirMetinler.constants'
import { REHBERLER_DATA } from '../constants/mevzuatRehberi.constants'
import { useEbysStudioStore } from '../../ebys/store/ebysStudioStore'

interface ModulDetailViewProps {
  modul: ModulPaketi
  isInstalled: boolean
  isInstalling?: boolean
  onBack: () => void
  onInstall: (id: string) => void
  onPromptUninstall: (modul: ModulPaketi) => void
}

type TabType = 'belgeler' | 'hazir_metinler' | 'asamalar' | 'mevzuat'

export const ModulDetailView: React.FC<ModulDetailViewProps> = ({
  modul,
  isInstalled,
  isInstalling,
  onBack,
  onInstall,
  onPromptUninstall
}) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('belgeler')
  const [selectedFormType, setSelectedFormType] = useState<string>('all')
  const [hazirMetinSearch, setHazirMetinSearch] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const hazirMetinler: HazirMetinKalibi[] = HAZIR_METINLER_DATA[modul.id] || []
  const rehberMaddeleri = REHBERLER_DATA[modul.id] || []

  const handleOpenModul = (routePath?: string): void => {
    if (!routePath) return
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
    if (modul.routePath) {
      handleOpenModul(modul.routePath)
    } else {
      navigate({ to: APP_ROUTES.DOSYALAR })
    }
  }

  const handleCopyText = (id: string, text: string): void => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr))
    }, 2000)
  }

  const handleOpenInEbys = (item: HazirMetinKalibi): void => {
    const store = useEbysStudioStore.getState()
    store.setCurrentTitle(item.baslik)
    const formattedHtml = `<div class="ebys-a4-page" style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.45; color: #000; padding: 25px;">
  <div style="text-align: center; font-weight: bold; margin-bottom: 25px;">
    <div style="font-size: 12pt; letter-spacing: 1px;">T.C.</div>
    <div style="font-size: 12pt; text-transform: uppercase; margin-top: 4px;">{{kurumAdi}}</div>
    <div style="font-size: 11pt; font-weight: normal; margin-top: 3px;">{{birimAdi}}</div>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
    <tr>
      <td style="text-align: left; vertical-align: top; width: 65%;"><strong>Sayı :</strong> {{sayi}}</td>
      <td style="text-align: right; vertical-align: top; width: 35%;"><strong>Tarih:</strong> {{tarih}}</td>
    </tr>
    <tr>
      <td style="text-align: left; vertical-align: top;" colspan="2"><strong>Konu:</strong> ${item.varsayilanKonu || item.baslik}</td>
    </tr>
  </table>
  ${item.varsayilanHitap ? `<div style="text-align: center; font-weight: bold; margin: 25px 0 20px 0; font-size: 11.5pt;">${item.varsayilanHitap}</div>` : ''}
  <div style="text-align: justify; text-indent: 1.25cm; margin-bottom: 20px;">
    ${item.tamMetin}
  </div>
  <div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 35px;">
    <div style="width: 55mm; text-align: center;">
      <div style="font-weight: bold; text-transform: uppercase;">{{imzaAdi}}</div>
      <div style="font-size: 11pt; margin-top: 3px;">{{imzaUnvani}}</div>
    </div>
  </div>
</div>`
    store.setCurrentHtml(formattedHtml)
    navigate({ to: APP_ROUTES.EBYS })
  }

  const surum = getSurumAsamasiMeta(modul.surumAsamasi)

  const filteredHazirMetinler = hazirMetinler.filter((item) => {
    const matchesType = selectedFormType === 'all' ? true : item.formTipi === selectedFormType
    const q = hazirMetinSearch.trim().toLowerCase()
    if (!q) return matchesType
    return (
      matchesType &&
      (item.baslik.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.kisaAciklama.toLowerCase().includes(q) ||
        item.tamMetin.toLowerCase().includes(q))
    )
  })

  const getFormTipiLabel = (type: string): { label: string; color: string } => {
    switch (type) {
      case 'dilekce':
        return {
          label: 'Dilekçe',
          color:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
        }
      case 'tutanak':
        return {
          label: 'Tutanak',
          color:
            'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
        }
      case 'onay_belgesi':
        return {
          label: 'Makam Oluru',
          color:
            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200'
        }
      case 'ust_yazi':
        return {
          label: 'Resmî Yazı',
          color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200'
        }
      default:
        return {
          label: 'Kalıp Metin',
          color:
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
        }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Üst Geri Dönüş ve Kırıntı (Breadcrumb) Çubuğu */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Modüllere Dön</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>Modül Mağazası</span>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{modul.kod}</span>
        </div>
      </div>

      {/* Hero Başlık ve Aksiyon Kartı */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-mono">
              {modul.kod}
            </span>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border tracking-wider uppercase bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
              🏛️ MODÜL
            </span>

            {modul.surumAsamasi && (
              <span
                title={surum.aciklama}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-extrabold border tracking-wider uppercase cursor-help',
                  surum.rozetClass
                )}
              >
                {surum.etiket}
              </span>
            )}

            {!isModulRemovable(modul) && (
              <span
                title="Bu paket Temin 360 çekirdek sistem bileşenidir ve kaldırılamaz."
                className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border tracking-wider uppercase bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-help"
              >
                <Lock className="w-2.5 h-2.5" />
                ÇEKİRDEK
              </span>
            )}

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {modul.mevzuat}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              ({modul.versiyon})
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {modul.baslik}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {modul.detayliAciklama || modul.kisaAciklama}
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {modul.etiketler.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Sağ Taraf: Aksiyon Butonları */}
        <div className="shrink-0 flex flex-col gap-2.5 self-start md:self-auto min-w-[200px]">
          {isInstalled ? (
            <>
              {modul.routePath ? (
                <button
                  onClick={() => handleOpenModul(modul.routePath)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>
                    {modul.id === 'kik-dogrudan-temin-22d'
                      ? 'Doğrudan Temin Dosyaları'
                      : 'Modülü Başlat / Aç'}
                  </span>
                </button>
              ) : null}

              {isModulRemovable(modul) ? (
                <button
                  onClick={() => onPromptUninstall(modul)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Modülü Kaldır</span>
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Korumalı Çekirdek</span>
                </div>
              )}
            </>
          ) : isInstalling ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-indigo-500/80 text-white cursor-wait animate-pulse"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Kuruluyor...</span>
            </button>
          ) : (
            <button
              onClick={() => onInstall(modul.id)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Modülü Hemen Kur</span>
            </button>
          )}

          <div className="text-[11px] text-center text-slate-400">
            {isInstalled ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Çalışma alanınızda aktif
              </span>
            ) : (
              'Tek tıkla çalışma alanınıza eklenir.'
            )}
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-2xl px-6 pt-4 flex-wrap">
        <button
          onClick={() => setActiveTab('belgeler')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'belgeler'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Belge & Standart Form Kataloğu ({modul.belgeler.length})
        </button>

        <button
          onClick={() => setActiveTab('hazir_metinler')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'hazir_metinler'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          Hazır Metinler, Dilekçe & Tutanaklar ({hazirMetinler.length})
        </button>

        <button
          onClick={() => setActiveTab('asamalar')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'asamalar'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GitFork className="w-4 h-4" />
          Süreç Aşamaları & Hiyerarşi ({modul.asamalar.length})
        </button>

        <button
          onClick={() => setActiveTab('mevzuat')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'mevzuat'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Mevzuat Dayanağı & Rehber ({rehberMaddeleri.length + modul.araclar.length})
        </button>
      </div>

      {/* Sekme İçerikleri */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-2xl p-6 md:p-8 shadow-xs">
        {/* TAB 1: BELGELER */}
        {activeTab === 'belgeler' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Resmî Belge ve Standart Şablon Kataloğu
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bu modül tarafından yönetilen standart formlar, onay belgeleri ve tutanaklar:
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {modul.belgeler.length} Standart Form
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {modul.belgeler.map((belge, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenBelge(belge)}
                  className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md hover:bg-white dark:hover:bg-slate-850 transition-all space-y-2.5 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
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
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {belge.ad}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {belge.aciklama}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Belgeyi Aç & Üret
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: HAZIR METİNLER & DİLEKÇELER */}
        {activeTab === 'hazir_metinler' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {modul.baslik} Hazır Metin ve Resmî Şablon Kalıpları
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Doğrudan temin, ihale, izin ve yazışma işlemlerinde kullanılan onay, dilekçe,
                  tutanak ve ihtarname kalıpları:
                </p>
              </div>

              {/* Arama Kutusu */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kalıp veya konu ara..."
                  value={hazirMetinSearch}
                  onChange={(e) => setHazirMetinSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Tür Filtre Butonları */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Tür:
              </span>
              {[
                { key: 'all', label: `Tümü (${hazirMetinler.length})` },
                { key: 'dilekce', label: 'Dilekçeler' },
                { key: 'tutanak', label: 'Tutanaklar' },
                { key: 'onay_belgesi', label: 'Makam Olurları' },
                { key: 'ust_yazi', label: 'Resmî Yazılar & İhtarlar' }
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSelectedFormType(f.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedFormType === f.key
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Kalıplar Listesi */}
            {filteredHazirMetinler.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredHazirMetinler.map((item) => {
                  const badge = getFormTipiLabel(item.formTipi)
                  const isCopied = copiedId === item.id
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {item.kategori}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.baslik}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.kisaAciklama}
                          </p>
                        </div>

                        {/* Hitap & Konu Kutucukları */}
                        {(item.varsayilanHitap || item.varsayilanKonu) && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                            {item.varsayilanHitap && (
                              <div className="text-slate-700 dark:text-slate-300 font-bold">
                                <span className="text-slate-400 font-normal">Makam / Hitap: </span>
                                {item.varsayilanHitap}
                              </div>
                            )}
                            {item.varsayilanKonu && (
                              <div className="text-slate-600 dark:text-slate-400">
                                <span className="text-slate-400 font-normal">Konu: </span>
                                {item.varsayilanKonu}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Kalıp Metin Önizlemesi */}
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
                          {item.tamMetin}
                        </div>

                        {/* Rehber & Sayıştay Notu */}
                        {item.rehberNotu && (
                          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong>Uygulama Notu:</strong> {item.rehberNotu}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.id, item.tamMetin)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isCopied
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Kopyalandı!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Metni Kopyala</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenInEbys(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>EBYS Editöründe Aç</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-850/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aramanıza veya seçilen türe uygun hazır metin kalıbı bulunamadı.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AŞAMALAR */}
        {activeTab === 'asamalar' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Standart Süreç ve Hiyerarşik İş Akışı
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bu modülün kamu ihale ve harcama mevzuatı doğrultusundaki adım adım yürütme sırası:
              </p>
            </div>

            <div className="relative pl-8 border-l-2 border-indigo-200 dark:border-indigo-500/30 space-y-6">
              {modul.asamalar.map((asama) => (
                <div key={asama.sira} className="relative group">
                  <div className="absolute -left-10.75 top-0 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-500 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-black shadow-xs">
                    {asama.sira}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 group-hover:border-indigo-400/50 dark:group-hover:border-indigo-500/40 transition-all space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {asama.baslik}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {asama.aciklama}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MEVZUAT & REHBER */}
        {activeTab === 'mevzuat' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Mevzuat Standartları & Yasal Dayanak
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {modul.detayliAciklama || modul.kisaAciklama}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono">
                İlgili Kanun & Yönetmelik:{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {modul.mevzuat}
                </span>
              </div>
            </div>

            {/* Mevzuat Rehber Notları */}
            {rehberMaddeleri.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Sayıştay Denetimi & Mevzuat Rehber Maddeleri
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rehberMaddeleri.map((rehber, idx) => {
                    const isImportant = rehber.tip === 'onemli'
                    const isTip = rehber.tip === 'ipucu'
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border space-y-1.5 ${
                          isImportant
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                            : isTip
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {rehber.baslik}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              isImportant
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                                : isTip
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                            }`}
                          >
                            {isImportant ? 'DİKKAT / DENETİM' : isTip ? 'PRATİK İPUCU' : 'MEVZUAT'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {rehber.icerik}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Dahili Araçlar */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Dahili Otomasyon & Hesaplama Yetenekleri
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {modul.araclar.map((arac, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span>{arac}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
