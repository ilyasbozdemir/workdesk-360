import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Gavel,
  Kanban,
  KeyRound,
  Plus,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react'
import { APP_ROUTES } from '../../../constants/routeConstants'
import type { DashboardStats } from '../dashboard.hooks'

export type HeroProcurementMode =
  | 'all'
  | 'dogrudan_temin'
  | 'ihale'
  | 'devlet_ihale_2886'
  | 'modul_magazasi'

export interface SmartAlertItem {
  id?: string | number
  title: string
  message: string
  actionText: string
  actionLink: string
  actionSearch?: Record<string, unknown>
}

export interface DashboardHeroV3Props {
  /** Mevcut çalışma modu */
  procurementMode?:
    | 'all'
    | 'dogrudan_temin'
    | 'ihale'
    | 'devlet_ihale_2886'
    | 'modul_magazasi'
    | string
  /** Mod değiştirme fonksiyonu */
  onSwitchMode?: (mode: 'all' | 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886') => void
  /** Geriye dönük V2 uyumluluğu için */
  isIhale?: boolean
  currentDate: string
  greeting: string
  adminName?: string
  adminUsername?: string
  adminTitle?: string
  institutionName?: string
  isAiConfigured: boolean
  stats: DashboardStats | Partial<DashboardStats> | Record<string, unknown>
  onOpenAi: () => void
  onShowAiMissing: () => void
  smartAlerts: SmartAlertItem[]
}

export const DashboardHeroV3: React.FC<DashboardHeroV3Props> = ({
  procurementMode: initialMode,
  onSwitchMode,
  isIhale: propIsIhale,
  currentDate,
  greeting,
  adminName,
  adminUsername,
  adminTitle,
  institutionName,
  isAiConfigured,
  stats,
  onOpenAi,
  onShowAiMissing,
  smartAlerts
}) => {
  const navigate = useNavigate()

  // Dahili seçili mod (prop yoksa isIhale'den türetilir)
  const [internalMode, setInternalMode] = useState<HeroProcurementMode>(() => {
    if (initialMode && ['all', 'dogrudan_temin', 'ihale'].includes(initialMode)) {
      return initialMode as HeroProcurementMode
    }
    return propIsIhale ? 'ihale' : 'dogrudan_temin'
  })

  // Props güncellendiğinde senkronize et
  const activeMode: HeroProcurementMode =
    initialMode && ['all', 'dogrudan_temin', 'ihale'].includes(initialMode)
      ? (initialMode as HeroProcurementMode)
      : internalMode

  const handleSelectMode = (mode: HeroProcurementMode): void => {
    setInternalMode(mode)
    if (onSwitchMode && (mode === 'all' || mode === 'dogrudan_temin' || mode === 'ihale')) {
      onSwitchMode(mode)
    }
  }
  void handleSelectMode

  // Stats sayıları
  const dogrudanTeminSayisi = Number(stats.dogrudanTeminSayisi || 0)
  const ihaleDosyaSayisi = Number(stats.ihaleDosyaSayisi || 0)
  const toplamDosyaSayisi = dogrudanTeminSayisi + ihaleDosyaSayisi

  // TEMİN 360 Mod konfigürasyonları
  const modeConfigs = {
    all: {
      badgeTitle: 'TEMİN 360 KOMUTA MERKEZİ • TÜM DOĞRUDAN TEMİN SÜREÇLERİ',
      badgeLaw: '4734 KİK • 5018 MALİ YÖNETİM & MERKEZİ HARCAMA BELGELERİ',
      roleBadge:
        adminTitle && !adminTitle.includes('YÖNETİCİ')
          ? adminTitle
          : 'Harcama Yetkilisi / Şube Müdürü',
      description:
        'Kurum bünyesindeki tüm doğrudan temin alımları (22/d, 22/a-f), piyasa fiyat araştırmaları, onay belgeleri, muayene kabul ve ödeme tahakkuk işlemleri konsolide yönetiliyor.',
      bgGradient:
        'bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-700/40 text-white shadow-xl shadow-indigo-950/30',
      glow1: 'bg-indigo-500/30 dark:bg-indigo-600/30',
      glow2: 'bg-blue-500/20 dark:bg-violet-600/25',
      accentColor: 'text-indigo-400',
      badgeBorder: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
      lawBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    },
    dogrudan_temin: {
      badgeTitle: 'DOĞRUDAN TEMİN PORTALI • KİK 22/d HARCAMA YÖNETİMİ',
      badgeLaw: '4734 Sayılı KİK m.22/d & 5018 Sayılı Mali Yönetim Uyumlu',
      roleBadge:
        adminTitle && !adminTitle.includes('YÖNETİCİ')
          ? adminTitle
          : 'Harcama Yetkilisi / Satın Alma Sorumlusu',
      description:
        'Doğrudan temin süreçleri (22/d), piyasa fiyat araştırmaları, KİK eşik limit denetimleri, harcama talimatları ve ödeme tahakkuk işlemleri yönetiliyor.',
      bgGradient:
        'bg-linear-to-br from-blue-50/95 via-white to-slate-50/90 border-blue-200 dark:bg-linear-to-br dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/80 dark:border-blue-900/40 text-slate-800 dark:text-white shadow-lg shadow-blue-950/10',
      glow1: 'bg-blue-300/40 dark:bg-blue-600/25',
      glow2: 'bg-cyan-300/30 dark:bg-cyan-600/20',
      accentColor: 'text-blue-600 dark:text-blue-400',
      badgeBorder:
        'bg-blue-100 text-blue-700 border-blue-300/80 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/30',
      lawBadge:
        'bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
    },
    ihale: {
      badgeTitle: 'KAMU İHALE MERKEZİ • KİK 19/21 & HAKEDİŞ YÖNETİMİ',
      badgeLaw: '4734 Kamu İhale & 4735 Sözleşmeler Kanunu Uyumlu',
      roleBadge:
        adminTitle && !adminTitle.includes('YÖNETİCİ')
          ? adminTitle
          : 'İhale Yetkilisi / Şube Müdürü',
      description:
        'Açık İhale (KİK 19), Pazarlık Usulü (KİK 21), yaklaşık maliyet analizleri, ihale komisyon kararları, sözleşme ve ara/kesin hakediş işlemleri yönetiliyor.',
      bgGradient:
        'bg-linear-to-br from-indigo-50/95 via-white to-slate-50/90 border-indigo-200 dark:bg-linear-to-br dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/80 dark:border-indigo-800/50 text-slate-800 dark:text-white shadow-lg shadow-indigo-950/10',
      glow1: 'bg-indigo-300/40 dark:bg-indigo-600/30',
      glow2: 'bg-purple-300/30 dark:bg-purple-600/25',
      accentColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBorder:
        'bg-indigo-100 text-indigo-700 border-indigo-300/80 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/30',
      lawBadge:
        'bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
    }
  }

  const currentConfig = modeConfigs[activeMode as keyof typeof modeConfigs] || modeConfigs.dogrudan_temin

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 md:p-8 border transition-all duration-500 ${currentConfig.bgGradient}`}
    >
      {/* Dekoratif Glow Işıkları */}
      <div
        className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-40 dark:opacity-80 ${currentConfig.glow1}`}
      />
      <div
        className={`absolute bottom-0 left-1/3 -ml-20 -mb-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-30 dark:opacity-80 ${currentConfig.glow2}`}
      />

      <div className="relative z-10 space-y-6">
        {/* ========================================================================= */}
        {/* ÜST BÖLÜM: DOĞRUDAN TEMİN (KİK 22/d) ETİKETİ VE TARİH */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-inner">
            {/* Doğrudan Temin (22/d) Rozeti */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Doğrudan Temin (4734 Sayılı KİK Md. 22/d)</span>
              {dogrudanTeminSayisi > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/30 text-white font-extrabold ml-0.5">
                  {dogrudanTeminSayisi} Dosya
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentDate}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ORTA BÖLÜM: BAŞLIK, ROZETLER, KURUM VE HIZLI AKSİYON BUTONLARI */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Mevzuat Rozetleri */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${currentConfig.badgeBorder}`}
              >
                {activeMode === 'ihale' ? (
                  <Gavel className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                {currentConfig.badgeTitle}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${currentConfig.lawBadge}`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {currentConfig.badgeLaw}
              </span>
            </div>

            {/* Selamlama & Başlık */}
            <div>
              <div
                className={`text-xs font-bold tracking-wider uppercase mb-1 ${currentConfig.accentColor}`}
              >
                {greeting},
              </div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight">
                  {adminName && !adminName.includes('YÖNETİCİ')
                    ? adminName
                    : adminUsername || 'İdare Yöneticisi'}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  {currentConfig.roleBadge}
                </span>
              </div>
              <p className="text-sm opacity-90 leading-relaxed max-w-2xl">
                <strong className="font-semibold">
                  {institutionName && !institutionName.includes('KURUM')
                    ? institutionName
                    : 'Kurum İdaresi'}
                </strong>{' '}
                {currentConfig.description}
              </p>
            </div>
          </div>

          {/* Hızlı Aksiyon Butonları (Sağ Panel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-97.5 shrink-0">
            {/* AI Asistan Butonu */}
            {isAiConfigured ? (
              <button
                type="button"
                onClick={onOpenAi}
                className="w-full bg-linear-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md shadow-purple-900/20 border border-purple-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
              >
                <Sparkles className="w-4 h-4 text-purple-200 animate-spin" />
                <span className="font-extrabold tracking-wide">TEMİN 360 AI</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onShowAiMissing}
                className="w-full bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400/80 dark:hover:border-amber-500/80 flex items-center justify-between gap-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] text-xs group"
                title="TEMİN 360 AI (API Anahtarı Gerekli - Tanımlamak için tıklayın)"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                    TEMİN 360 AI
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shrink-0">
                  API Key Gerekli
                </span>
              </button>
            )}

            {/* Modun Ana Aksiyon Butonu */}
            {activeMode === 'ihale' ? (
              <Link to={APP_ROUTES.HARCAMA_MERKEZI} className="w-full">
                <button
                  type="button"
                  className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md shadow-indigo-900/20 border border-indigo-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-extrabold tracking-wide">+ Yeni İhale (19/21)</span>
                </button>
              </Link>
            ) : (
              <Link to={APP_ROUTES.YENI_DOSYA} className="w-full">
                <button
                  type="button"
                  className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md shadow-blue-900/20 border border-blue-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-extrabold tracking-wide">+ Yeni Temin (22/d)</span>
                </button>
              </Link>
            )}

            {/* İkincil Aksiyon Butonu */}
            {activeMode === 'ihale' ? (
              <Link to={APP_ROUTES.HAKEDIS} className="w-full">
                <button
                  type="button"
                  className="w-full bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md shadow-amber-900/20 border border-amber-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
                >
                  <Gavel className="w-4 h-4" />
                  <span className="font-extrabold tracking-wide">İhale & Hakediş</span>
                </button>
              </Link>
            ) : (
              <Link to={APP_ROUTES.HARCAMA_MERKEZI} className="w-full">
                <button
                  type="button"
                  className="w-full bg-linear-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-2.5 px-3.5 rounded-xl shadow-md shadow-blue-900/20 border border-blue-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span className="font-extrabold tracking-wide">Piyasa Araştırması</span>
                </button>
              </Link>
            )}

            {/* Dosyalar Havuzu Butonu */}
            <Link to={APP_ROUTES.DOSYALAR} className="w-full">
              <button
                type="button"
                className="w-full bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-700/90 font-bold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
              >
                <FileSpreadsheet
                  className={`w-4 h-4 ${
                    activeMode === 'ihale'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                />
                <span className="font-bold">
                  {activeMode === 'ihale'
                    ? `İhale Dosyaları (${ihaleDosyaSayisi})`
                    : `Temin Dosyaları (${dogrudanTeminSayisi})`}
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ALT BÖLÜM: TEMİN 360 MERKEZİ SATIN ALMA VE MEVZUAT FIRLATMA KARTLARI */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Hızlı Temin ve Satın Alma Masası Fırlatma Merkezi</span>
            </div>
            <Link
              to={APP_ROUTES.DOSYALAR}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Tüm Temin Dosyaları Havuzu ({toplamDosyaSayisi})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. Piyasa Fiyat Araştırması & Teklifler */}
            <div
              onClick={() => navigate({ to: APP_ROUTES.HARCAMA_MERKEZI })}
              role="button"
              tabIndex={0}
              className="group p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-850 border border-blue-200/70 dark:border-blue-900/40 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  KİK 22/d
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                  Piyasa Araştırması
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Teklif Mektubu & Cetvel
                </div>
              </div>
            </div>

            {/* 2. Onay Belgesi & Resmî Çıktı Merkezi */}
            <div
              onClick={() => navigate({ to: APP_ROUTES.SABLONLAR })}
              role="button"
              tabIndex={0}
              className="group p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-850 border border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  5018 Harcama
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                  Onay & Harcama Belgesi
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Resmî Evrak & Çıktı
                </div>
              </div>
            </div>

            {/* 3. KİK Eşik Limit & Damga Vergisi Motoru */}
            <div
              onClick={() => navigate({ to: APP_ROUTES.HESAPLAMA_ARACLARI })}
              role="button"
              tabIndex={0}
              className="group p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-850 border border-indigo-200/70 dark:border-indigo-900/40 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  %10 Limit
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                  Eşik Limit & Damga
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Parasal Sınır Denetimi
                </div>
              </div>
            </div>

            {/* 4. Muayene & Kabul Heyeti */}
            <div
              onClick={() => navigate({ to: APP_ROUTES.KOMISYONLAR })}
              role="button"
              tabIndex={0}
              className="group p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-850 border border-purple-200/70 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Kabul Heyeti
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                  Muayene & Kabul Heyeti
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Kabul Tutanakları
                </div>
              </div>
            </div>

            {/* 5. İstekli & Tedarikçi Havuzu */}
            <div
              onClick={() => navigate({ to: APP_ROUTES.FIRMALAR })}
              role="button"
              tabIndex={0}
              className="group p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-850 border border-amber-200/70 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Firmalar
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                  Tedarikçi Havuzu
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Teklif Geçmişi & Vergi No
                </div>
              </div>
            </div>

            {/* 6. Süreç Takip & Belge Kanban */}
            <div
              onClick={() => navigate({ to: APP_ROUTES.TAKIP })}
              role="button"
              tabIndex={0}
              className="group p-3 rounded-2xl bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-850 border border-cyan-200/70 dark:border-cyan-900/40 hover:border-cyan-400 dark:hover:border-cyan-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Kanban className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  Kanban
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                  Süreç & Dosya Takip
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Aşamalar & Onay Akışı
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Akıllı Durum Uyarıları (Smart Alerts) */}
      {smartAlerts && smartAlerts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/90 dark:bg-amber-950/40 -mx-6 md:-mx-8 -mb-6 md:-mb-8 px-6 md:px-8 py-3.5 border-t-amber-300/50 dark:border-t-amber-500/30">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-700 dark:text-amber-300 font-bold">
                Sistem Uyarısı:
              </strong>{' '}
              {smartAlerts[0].title} —{' '}
              <span className="text-slate-700 dark:text-slate-200">{smartAlerts[0].message}</span>
            </span>
          </div>
          <Link
            to={smartAlerts[0].actionLink as unknown as string}
            search={smartAlerts[0].actionSearch as unknown as Record<string, unknown>}
          >
            <button className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline flex items-center gap-1 cursor-pointer shrink-0">
              {smartAlerts[0].actionText} <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
