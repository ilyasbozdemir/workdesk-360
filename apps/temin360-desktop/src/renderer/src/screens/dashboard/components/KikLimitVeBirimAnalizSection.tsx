import React, { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Info,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '../../../utils/cn'
import { Modal } from '../../../components/ui/Modal'
import type { DashboardStats, KikLimitStat, BirimHarcamaStat } from '../dashboard.hooks'

interface KikLimitVeBirimAnalizSectionProps {
  stats: DashboardStats
  isLoading: boolean
  formatCurrency: (value: number) => string
}

export const KikLimitVeBirimAnalizSection: React.FC<KikLimitVeBirimAnalizSectionProps> = ({
  stats,
  isLoading,
  formatCurrency
}): React.ReactElement => {
  const navigate = useNavigate()
  const [isKikModalOpen, setIsKikModalOpen] = useState(false)
  const [isBirimModalOpen, setIsBirimModalOpen] = useState(false)
  const [selectedBirim, setSelectedBirim] = useState<BirimHarcamaStat | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse min-h-[340px]">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 mb-4" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl mb-4" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse min-h-[340px]">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const limitStat: KikLimitStat | null = stats.kikLimitStat
  const birimler: BirimHarcamaStat[] = stats.birimHarcamalari || []

  // Durum renk ve metin belirleyicileri
  const getDurumConfig = (
    durum?: string
  ): {
    color: string
    bg: string
    barColor: string
    badgeText: string
    badgeClass: string
    icon: typeof ShieldCheck
  } => {
    switch (durum) {
      case 'asildi':
        return {
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60',
          barColor: 'bg-red-600',
          badgeText: 'Yıllık Limit Aşıldı!',
          badgeClass: 'bg-red-500 text-white',
          icon: ShieldAlert
        }
      case 'kritik':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60',
          barColor: 'bg-orange-500',
          badgeText: 'Kritik Limit Eşiği (>%85)',
          badgeClass: 'bg-orange-500 text-white',
          icon: AlertTriangle
        }
      case 'uyari':
        return {
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
          barColor: 'bg-amber-500',
          badgeText: 'Limit İzleme Modu (>%65)',
          badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300',
          icon: AlertTriangle
        }
      default:
        return {
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40',
          barColor: 'bg-emerald-500',
          badgeText: 'Güvenli Limit Alanı',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300',
          icon: ShieldCheck
        }
    }
  }

  const durumCfg = getDurumConfig(limitStat?.durum)
  const DurumIcon = durumCfg.icon

  // Birim renk paleti
  const barColors = [
    'from-blue-600 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-600 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-cyan-600',
    'from-rose-500 to-pink-600'
  ]

  // Toplam birim harcaması ve toplam dosya
  const toplamBirimHarcamasi = birimler.reduce((acc, b) => acc + (b.toplam_harcama || 0), 0)
  const toplamBirimDosyaSayisi = birimler.reduce((acc, b) => acc + (b.dosya_sayisi || 0), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── 1. SOL: KİK 22/d YILLIK LİMİT TÜKETİM GÖSTERGESİ ── */}
      <div
        onClick={() => setIsKikModalOpen(true)}
        className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between cursor-pointer group hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all"
        title="Detaylı KİK 22/d limit ve mevzuat analizini açmak için tıklayın"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    K.İ.K 22/d Yıllık Limit Tüketimi
                  </h3>
                  {limitStat && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {limitStat.donem_kodu} Dönemi
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  4734 Sayılı Kanun Madde 22/d Doğrudan Temin Yasal Eşik Kontrolü
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs',
                  durumCfg.badgeClass
                )}
              >
                <DurumIcon className="w-3.5 h-3.5" />
                {durumCfg.badgeText}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                Detay <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Limit Bar & Big Percentage */}
          {limitStat ? (
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-750/80 my-3 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Toplam Bütçe Tüketim Oranı
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                      %{limitStat.tuketimYuzdesi}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      tüketildi
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kurum Tipi / Statü
                  </span>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {limitStat.limitType === 'buyuksehir'
                      ? 'Büyükşehir Belediyesi / İdaresi (22/d*)'
                      : 'Diğer İdareler (22/d**)'}
                  </div>
                </div>
              </div>

              {/* Progress Bar with Gradient */}
              <div className="relative w-full h-3.5 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden p-0.5">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 shadow-xs',
                    durumCfg.barColor
                  )}
                  style={{ width: `${Math.min(100, Math.max(2, limitStat.tuketimYuzdesi))}%` }}
                />
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">
                    Yıllık Eşik Limit
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                    {formatCurrency(limitStat.limit)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">
                    Harcanan Tutar
                  </span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 truncate block mt-0.5">
                    {formatCurrency(limitStat.harcananTutar)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">
                    Kalan Güvenli Limit
                  </span>
                  <span
                    className={cn(
                      'text-xs font-black truncate block mt-0.5',
                      limitStat.kalanTutar > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {formatCurrency(limitStat.kalanTutar)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl my-3">
              Henüz tanımlı KİK 22/d limit dönemi bulunamadı.
            </div>
          )}
        </div>

        {/* Footer Warning Info */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>22/d alımlarında kısımlara bölme yasağı ve yıllık limit takibi esastır.</span>
          </div>
          <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:underline shrink-0">
            Detaylı Raporu Aç →
          </span>
        </div>
      </div>

      {/* ── 2. SAĞ: BİRİMLER BAZINDA HARCAMA DAĞILIMI & ANALİZİ ── */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Birimler Bazında Harcama Oranları
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Harcama yetkilisi birimlerin doğrudan temin bütçe kullanım payları
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedBirim(null)
                setIsBirimModalOpen(true)
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Detaylı Dağılım</span> <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Unit List with Progress Bars */}
          <div className="space-y-3 my-2 max-h-64 overflow-y-auto pr-1">
            {birimler.length > 0 ? (
              birimler.map((b, idx) => {
                const barGradient = barColors[idx % barColors.length]
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBirim(b)
                      setIsBirimModalOpen(true)
                    }}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800/80 transition-all cursor-pointer group"
                    title={`${b.birim_adi} detaylı analizini açmak için tıklayın`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      <div className="flex items-center gap-2 truncate max-w-[65%]">
                        <span className="w-5 h-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0 group-hover:border-indigo-400">
                          {idx + 1}
                        </span>
                        <span className="truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {b.birim_adi}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          ({b.dosya_sayisi} dosya)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(b.toplam_harcama)}
                        </span>
                        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                          %{b.yuzde}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                          barGradient
                        )}
                        style={{ width: `${Math.min(100, Math.max(3, b.yuzde))}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl">
                Henüz birim atanmış harcama dosyası bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Toplam {birimler.length} harcama birimi doğrudan temin sürecinde aktif.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedBirim(null)
              setIsBirimModalOpen(true)
            }}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Tüm Birimleri İncele →
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── 3. DETAY MODAL: KİK 22/d YILLIK LİMİT VE MEVZUAT ANALİZİ ── */}
      {/* ========================================================================= */}
      {isKikModalOpen && (
        <Modal
          isOpen={isKikModalOpen}
          onClose={() => setIsKikModalOpen(false)}
          title="K.İ.K 22/d Yıllık Limit & Mevzuat Uyum Analizi"
          description="4734 Sayılı Kamu İhale Kanunu Madde 22/d Doğrudan Temin limit denetimi, bütçe tüketim tavanı ve mevzuat kontrol raporu."
          className="max-w-2xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Limitler KİK Tebliği ve Yıllık Bütçe Kanunu uyarınca güncellenir.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsKikModalOpen(false)
                    navigate({ to: '/hesaplama-araclari' })
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Limit Motoru</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsKikModalOpen(false)
                    navigate({ to: '/dosyalar' })
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Temin Dosyaları</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            {/* Büyük Durum Kartı */}
            {limitStat && (
              <div
                className={cn(
                  'p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  durumCfg.bg
                )}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-extrabold border',
                        durumCfg.badgeClass
                      )}
                    >
                      {durumCfg.badgeText}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {limitStat.donem_kodu} Mali Yılı
                    </span>
                  </div>
                  <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    Toplam Harcama Oranı: %{limitStat.tuketimYuzdesi}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    İdare Statüsü:{' '}
                    <strong>
                      {limitStat.limitType === 'buyuksehir'
                        ? 'Büyükşehir Belediye Sınırları (Madde 22/d*)'
                        : 'Diğer İdareler (Madde 22/d**)'}
                    </strong>
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-slate-300 dark:sm:border-slate-700 sm:pl-5 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Kalan Güvenli Bütçe
                  </span>
                  <span
                    className={cn(
                      'text-lg font-black block mt-0.5',
                      limitStat.kalanTutar > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {formatCurrency(limitStat.kalanTutar)}
                  </span>
                </div>
              </div>
            )}

            {/* İlerleme Çizelgesi */}
            {limitStat && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Harcama Seviyesi</span>
                  <span>
                    {formatCurrency(limitStat.harcananTutar)} / {formatCurrency(limitStat.limit)}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      durumCfg.barColor
                    )}
                    style={{ width: `${Math.min(100, Math.max(3, limitStat.tuketimYuzdesi))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>%0 Başlangıç</span>
                  <span>%65 İzleme Eşiği</span>
                  <span>%85 Kritik Eşik</span>
                  <span>%100 Yasal Sınır</span>
                </div>
              </div>
            )}

            {/* 3 Temel Finansal Sütun */}
            {limitStat && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Yıllık Eşik Limit
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white block mt-1">
                    {formatCurrency(limitStat.limit)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Resmî KİK Tebliği Azami Tavan
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
                    Gerçekleşen Harcama
                  </span>
                  <span className="text-sm font-black text-blue-700 dark:text-blue-300 block mt-1">
                    {formatCurrency(limitStat.harcananTutar)}
                  </span>
                  <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5">
                    Onaylanmış Doğrudan Teminler
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                    Kalan Güvenli Limit
                  </span>
                  <span
                    className={cn(
                      'text-sm font-black block mt-1',
                      limitStat.kalanTutar > 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {formatCurrency(limitStat.kalanTutar)}
                  </span>
                  <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">
                    Yapılabilecek Ek Alım Hakkı
                  </span>
                </div>
              </div>
            )}

            {/* Hukuki Denetim Rehberi */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                4734 Sayılı Kanun Madde 22/d Denetim Kuralları
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Kısımlara Bölme Yasağı:</strong> Aynı nitelikteki mal veya hizmet alımları, eşik değerlerin altında kalmak amacıyla kısımlara bölünerek doğrudan teminle karşılanamaz.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>%10 Ödenek Tavanı (KİK Md. 62/ı):</strong> Bütçeye konulan ödeneklerin toplamının %10&apos;u, Kamu İhale Kurulu uygun görüşü alınmadan doğrudan temin (22/d) ve pazarlık (21/f) yoluyla aşılamaz.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Piyasa Fiyat Araştırması Tutanağı:</strong> İhtiyaç duyulan alımlarda en az 3 geçerli teklif toplanarak Harcama Yetkilisi onayına sunulmalıdır.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ── 4. DETAY MODAL: BİRİMLER BAZINDA HARCAMA DAĞILIMI ANALİZİ ── */}
      {/* ========================================================================= */}
      {isBirimModalOpen && (
        <Modal
          isOpen={isBirimModalOpen}
          onClose={() => {
            setIsBirimModalOpen(false)
            setSelectedBirim(null)
          }}
          title={
            selectedBirim
              ? `${selectedBirim.birim_adi} • Harcama ve Süreç Analizi`
              : 'Tüm Harcama Birimlerinin Bütçe Payları & Dağılımı'
          }
          description="Harcama yetkilisi birimlerin doğrudan temin dosya sayıları, toplam bütçe tüketimleri ve kurum içi harcama ağırlıkları."
          className="max-w-2xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>
                  Toplam {birimler.length} birim, {toplamBirimDosyaSayisi} dosya, {formatCurrency(toplamBirimHarcamasi)} harcama
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBirimModalOpen(false)
                    navigate({ to: '/birimler' })
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Birimler Yönetimi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBirimModalOpen(false)
                    navigate({ to: '/dosyalar' })
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Dosyaları Listele</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            {/* Seçili Birim Varsa Vurgu Kartı */}
            {selectedBirim && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    Seçili Birim Detayı
                  </span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {selectedBirim.birim_adi}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Toplam {selectedBirim.dosya_sayisi} Doğrudan Temin Dosyası
                  </p>
                </div>
                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-indigo-200 dark:border-indigo-800/80 pt-2 sm:pt-0 sm:pl-4 shrink-0">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Toplam Harcama Payı
                  </span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(selectedBirim.toplam_harcama)}
                  </span>
                  <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                    Kurumun %{selectedBirim.yuzde}&apos;si
                  </span>
                </div>
              </div>
            )}

            {/* Birimlerin Karşılaştırmalı Listesi */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              <div className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
                <span>Harcama Birimi & Dosya Sayısı</span>
                <span>Tutar & Kurum Payı</span>
              </div>

              {birimler.map((b, idx) => {
                const barGradient = barColors[idx % barColors.length]
                const isSelected = selectedBirim?.id === b.id

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBirim(b)}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer',
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-850/50 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                      <div className="flex items-center gap-2 truncate max-w-[65%]">
                        <span className="w-5 h-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{b.birim_adi}</span>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          ({b.dosya_sayisi} dosya)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {formatCurrency(b.toplam_harcama)}
                        </span>
                        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                          %{b.yuzde}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                          barGradient
                        )}
                        style={{ width: `${Math.min(100, Math.max(3, b.yuzde))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* İdari Tavsiye Kartı */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bütçe Planlama Uyarısı:</strong> Yıllık harcama payı yüksek birimlerin benzer kalemlerdeki alımları konsolide edilerek 4734 sayılı Kanun kapsamında Açık İhale (Md. 19) usulü ile daha avantajlı fiyatlarla tedarik edilebilir.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
