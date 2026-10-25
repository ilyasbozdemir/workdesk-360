import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Info, Scale } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { APP_ROUTES } from '../../../constants/routeConstants'
import type { DashboardStats } from '../dashboard.hooks'

interface ProcurementMethodsSummaryProps {
  procurementMode: 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886' | 'all'
  switchProcurementMode: (mode: 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886' | 'all') => void
  stats: DashboardStats
  isLoading: boolean
  formatCurrency: (value: number) => string
}

export const ProcurementMethodsSummary: React.FC<ProcurementMethodsSummaryProps> = ({
  procurementMode,
  switchProcurementMode,
  stats,
  isLoading,
  formatCurrency
}) => {
  const navigate = useNavigate()

  // İhale modundayken kullanıcının odaklandığı spesifik alt usul
  const [selectedIhaleMethod, setSelectedIhaleMethod] = useState<
    'acik_ihale' | 'pazarlik' | 'hakedis'
  >('acik_ihale')

  // Aktif filtrelenen tür (Doğrudan Temin modunda)
  const [selectedDtTur, setSelectedDtTur] = useState<string | null>(null)

  const isDtMode = procurementMode === 'dogrudan_temin' || procurementMode === 'all'
  const is2886Mode = procurementMode === 'devlet_ihale_2886'

  // Doğrudan Temin toplam dosya sayısı
  const totalDtCount =
    (stats.malDosyaSayisi || 0) +
      (stats.hizmetDosyaSayisi || 0) +
      (stats.yapimDosyaSayisi || 0) +
      (stats.danismanlikDosyaSayisi || 0) ||
    stats.dogrudanTeminSayisi ||
    0

  const malPct =
    totalDtCount > 0 ? Math.round(((stats.malDosyaSayisi || 0) / totalDtCount) * 100) : 0
  const hizmetPct =
    totalDtCount > 0 ? Math.round(((stats.hizmetDosyaSayisi || 0) / totalDtCount) * 100) : 0
  const yapimPct =
    totalDtCount > 0 ? Math.round(((stats.yapimDosyaSayisi || 0) / totalDtCount) * 100) : 0
  const danismanlikPct =
    totalDtCount > 0 ? Math.round(((stats.danismanlikDosyaSayisi || 0) / totalDtCount) * 100) : 0

  const handleDtCardClick = (tur: string): void => {
    setSelectedDtTur(tur)
    navigate({ to: APP_ROUTES.DOSYALAR, search: { tur } as never })
  }

  // =========================================================================
  // 1. DOĞRUDAN TEMİN (4734 Md. 22) MODU: MAL, HİZMET, YAPIM, DANIŞMANLIK
  // =========================================================================
  if (isDtMode && !is2886Mode) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Başlık ve Sistem Modu Rozeti */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center border border-blue-200 dark:border-blue-900/50 shrink-0">
              <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Doğrudan Temin Alım Türleri Dağılımı
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  4734 Sayılı Kanun Madde 22 (Doğrudan Temin)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                4734 Sayılı KİK m.22 kapsamındaki mal, hizmet, yapım ve istisnai alımların anlık
                özeti
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <Info className="w-3 h-3 text-slate-400" />
              <span>
                Karta tıklayarak ilgili türdeki doğrudan temin dosyalarını filtreleyebilirsiniz
              </span>
            </div>
            <Link to="/dosyalar">
              <button
                type="button"
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Tüm Dosyalar <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>

        {/* 4'lü Doğrudan Temin Kart Grid'i: Mal, Hizmet, Yapım, Danışmanlık */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          {/* 1. Mal Alımı (22/d) */}
          <div
            onClick={() => handleDtCardClick('mal')}
            className={cn(
              'p-4 md:p-5 transition-all cursor-pointer relative group',
              selectedDtTur === 'mal'
                ? 'bg-blue-50/90 dark:bg-blue-950/40 ring-2 ring-inset ring-blue-500/80 shadow-inner'
                : 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Mal Alımı
                </span>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Tüketim, Kırtasiye & Demirbaş
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                  22/d Mal
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 mt-2">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {isLoading ? (
                    <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    stats.malDosyaSayisi
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  dosya
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                  {isLoading ? '...' : formatCurrency(stats.malYaklasikMaliyet)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  yaklaşık maliyet
                </div>
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${malPct}%` }}
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
              <span>% {malPct} doğrudan temin içinde</span>
              <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">
                22/d Eşik Altı
              </span>
            </div>
          </div>

          {/* 2. Hizmet Alımı (22/d) */}
          <div
            onClick={() => handleDtCardClick('hizmet')}
            className={cn(
              'p-4 md:p-5 transition-all cursor-pointer relative group',
              selectedDtTur === 'hizmet'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-inset ring-emerald-500/80 shadow-inner'
                : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Hizmet Alımı
                </span>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Bakım, Onarım & Temizlik
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                  22/d Hizmet
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 mt-2">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {isLoading ? (
                    <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    stats.hizmetDosyaSayisi
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  dosya
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {isLoading ? '...' : formatCurrency(stats.hizmetYaklasikMaliyet)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  yaklaşık maliyet
                </div>
              </div>
            </div>

            <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${hizmetPct}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
              <span>% {hizmetPct} doğrudan temin içinde</span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                22/d Eşik Altı
              </span>
            </div>
          </div>

          {/* 3. Yapım İşi (22/d) */}
          <div
            onClick={() => handleDtCardClick('yapim')}
            className={cn(
              'p-4 md:p-5 transition-all cursor-pointer relative group',
              selectedDtTur === 'yapim'
                ? 'bg-amber-50/90 dark:bg-amber-950/40 ring-2 ring-inset ring-amber-500/80 shadow-inner'
                : 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Yapım İşi
                </span>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Küçük Onarım, Tadilat & Fen
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                  22/d Yapım
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 mt-2">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {isLoading ? (
                    <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    stats.yapimDosyaSayisi
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  dosya
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                  {isLoading ? '...' : formatCurrency(stats.yapimYaklasikMaliyet)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  yaklaşık maliyet
                </div>
              </div>
            </div>

            <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${yapimPct}%` }}
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
              <span>% {yapimPct} doğrudan temin içinde</span>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                22/d Eşik Altı
              </span>
            </div>
          </div>

          {/* 4. Danışmanlık & İstisna (22/a-b-c) */}
          <div
            onClick={() => handleDtCardClick('danismanlik')}
            className={cn(
              'p-4 md:p-5 transition-all cursor-pointer relative group',
              selectedDtTur === 'danismanlik'
                ? 'bg-purple-50/90 dark:bg-purple-950/40 ring-2 ring-inset ring-purple-500/80 shadow-inner'
                : 'hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                  Danışmanlık & İstisna
                </span>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Tek Satıcı (22/a-b) & Uyumluluk (22/c)
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                  KİK Md. 22
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 mt-2">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {isLoading ? (
                    <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    stats.danismanlikDosyaSayisi
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  dosya
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">
                  {isLoading ? '...' : formatCurrency(stats.danismanlikYaklasikMaliyet)}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  yaklaşık maliyet
                </div>
              </div>
            </div>

            <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${danismanlikPct}%` }}
                className="h-full bg-purple-500 rounded-full transition-all duration-700"
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
              <span>% {danismanlikPct} doğrudan temin içinde</span>
              <span className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold">
                İstisnai / Tek Satıcı
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 2. İHALE (LIMIT ÜSTÜ) MODU: AÇIK İHALE, PAZARLIK, HAKEDİŞ
  // =========================================================================
  const totalIhaleAllCount =
    (stats.dogrudanTeminSayisi || 0) +
    (stats.acikIhaleSayisi || 0) +
    (stats.pazarlikSayisi || 0) +
    (stats.hakediseSayisi || 0)

  const handleSelectIhaleCard = (
    method: 'dogrudan_temin' | 'acik_ihale' | 'pazarlik' | 'hakedis'
  ): void => {
    if (method === 'dogrudan_temin') {
      switchProcurementMode('dogrudan_temin')
    } else {
      setSelectedIhaleMethod(method)
      switchProcurementMode('ihale')
    }
  }

  const isDtActive = (procurementMode as string) === 'dogrudan_temin'
  const isAcikActive = procurementMode === 'ihale' && selectedIhaleMethod === 'acik_ihale'
  const isPazarlikActive = procurementMode === 'ihale' && selectedIhaleMethod === 'pazarlik'
  const isHakedisActive = procurementMode === 'ihale' && selectedIhaleMethod === 'hakedis'

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Başlık ve Sistem Modu Rozeti */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-200 dark:border-indigo-900/50 shrink-0">
            <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Kamu İhale Usulleri Dağılımı
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Aktif Çalışma Alanı: İhale Süreçleri (Limit Üstü)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              4734 Sayılı KİK kapsamındaki ihale usulleri anlık özeti
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Karta tıklayarak ilgili usul moduna geçebilirsiniz</span>
          </div>
          <Link to="/dosyalar">
            <button
              type="button"
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Tümünü Gör <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {/* 4'lü İhale Kart Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
        {/* 1. Doğrudan Temin (KİK Md. 22) */}
        <div
          onClick={() => handleSelectIhaleCard('dogrudan_temin')}
          className={cn(
            'p-4 md:p-5 transition-all cursor-pointer relative group',
            isDtActive
              ? 'bg-blue-50/90 dark:bg-blue-950/40 ring-2 ring-inset ring-blue-500/80 shadow-inner'
              : 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Doğrudan Temin
              </span>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Limit Altı (Mal, Hizmet, Yapım)
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isDtActive && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                  Aktif Mod
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                Md. 22
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? (
                  <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  stats.dogrudanTeminSayisi
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                dosya
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                {isLoading ? '...' : formatCurrency(stats.dogrudanTeminMaliyet)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                yaklaşık maliyet
              </div>
            </div>
          </div>

          <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{
                width: `${
                  totalIhaleAllCount > 0
                    ? Math.round(((stats.dogrudanTeminSayisi || 0) / totalIhaleAllCount) * 100)
                    : 0
                }%`
              }}
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
            <span>
              %{' '}
              {totalIhaleAllCount > 0
                ? Math.round(((stats.dogrudanTeminSayisi || 0) / totalIhaleAllCount) * 100)
                : 0}{' '}
              toplam alım içinde
            </span>
            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">
              22/d Eşik Altı
            </span>
          </div>
        </div>

        {/* 2. Açık İhale (KİK Md. 19) */}
        <div
          onClick={() => handleSelectIhaleCard('acik_ihale')}
          className={cn(
            'p-4 md:p-5 transition-all cursor-pointer relative group',
            isAcikActive
              ? 'bg-amber-50/90 dark:bg-amber-950/40 ring-2 ring-inset ring-amber-500/80 shadow-inner'
              : 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Açık İhale
              </span>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Limit Üstü / Genel İhale
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isAcikActive && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-600 text-white shadow-xs">
                  Aktif Usul
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                Md. 19
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? (
                  <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  stats.acikIhaleSayisi
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                dosya
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                {isLoading ? '...' : formatCurrency(stats.acikIhaleMaliyet)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                yaklaşık maliyet
              </div>
            </div>
          </div>

          <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{
                width: `${
                  totalIhaleAllCount > 0
                    ? Math.round(((stats.acikIhaleSayisi || 0) / totalIhaleAllCount) * 100)
                    : 0
                }%`
              }}
              className="h-full bg-amber-500 rounded-full transition-all duration-700"
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
            <span>
              %{' '}
              {totalIhaleAllCount > 0
                ? Math.round(((stats.acikIhaleSayisi || 0) / totalIhaleAllCount) * 100)
                : 0}{' '}
              toplam alım içinde
            </span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
              Temel İhale Usulü
            </span>
          </div>
        </div>

        {/* 3. Pazarlık Usulü (KİK Md. 21) */}
        <div
          onClick={() => handleSelectIhaleCard('pazarlik')}
          className={cn(
            'p-4 md:p-5 transition-all cursor-pointer relative group',
            isPazarlikActive
              ? 'bg-purple-50/90 dark:bg-purple-950/40 ring-2 ring-inset ring-purple-500/80 shadow-inner'
              : 'hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                Pazarlık Usulü
              </span>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Özel Haller / İvedilik (21/b, 21/f)
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isPazarlikActive && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-600 text-white shadow-xs">
                  Aktif Usul
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                Md. 21
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? (
                  <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  stats.pazarlikSayisi
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                dosya
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">
                {isLoading ? '...' : formatCurrency(stats.pazarlikMaliyet)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                yaklaşık maliyet
              </div>
            </div>
          </div>

          <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{
                width: `${
                  totalIhaleAllCount > 0
                    ? Math.round(((stats.pazarlikSayisi || 0) / totalIhaleAllCount) * 100)
                    : 0
                }%`
              }}
              className="h-full bg-purple-500 rounded-full transition-all duration-700"
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
            <span>
              %{' '}
              {totalIhaleAllCount > 0
                ? Math.round(((stats.pazarlikSayisi || 0) / totalIhaleAllCount) * 100)
                : 0}{' '}
              toplam alım içinde
            </span>
            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold">
              İstisnai / İvedi
            </span>
          </div>
        </div>

        {/* 4. Sözleşmeli Yapım & Hakediş */}
        <div
          onClick={() => handleSelectIhaleCard('hakedis')}
          className={cn(
            'p-4 md:p-5 transition-all cursor-pointer relative group',
            isHakedisActive
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-inset ring-emerald-500/80 shadow-inner'
              : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Hakediş / Yapım
              </span>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Sözleşmeli İhale & Hakediş Süreci
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isHakedisActive && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                  Aktif Süreç
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                Sözleşmeli
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 mt-2">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? (
                  <span className="inline-block w-8 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  stats.hakediseSayisi
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                dosya
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isLoading ? '...' : formatCurrency(stats.hakediseMaliyet)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                yaklaşık maliyet
              </div>
            </div>
          </div>

          <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{
                width: `${
                  totalIhaleAllCount > 0
                    ? Math.round(((stats.hakediseSayisi || 0) / totalIhaleAllCount) * 100)
                    : 0
                }%`
              }}
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center justify-between">
            <span>
              %{' '}
              {totalIhaleAllCount > 0
                ? Math.round(((stats.hakediseSayisi || 0) / totalIhaleAllCount) * 100)
                : 0}{' '}
              toplam alım içinde
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Yapım & Taahhüt
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
