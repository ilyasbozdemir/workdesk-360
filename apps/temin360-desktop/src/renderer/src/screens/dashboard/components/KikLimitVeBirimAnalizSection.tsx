import React, { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calculator,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Scale,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '../../../utils/cn'
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
  const limitStat: KikLimitStat | null = stats.kikLimitStat
  const birimler: BirimHarcamaStat[] = stats.birimHarcamalari || []

  const [selectedBirim, setSelectedBirim] = useState<BirimHarcamaStat | null>(null)
  const activeSelectedBirim = selectedBirim || (birimler.length > 0 ? birimler[0] : null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse min-h-[420px]">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 mb-4" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl mb-4" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        </div>
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse min-h-[420px]">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 mb-4" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

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
          bg: 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60',
          barColor: 'bg-red-600',
          badgeText: 'Yıllık Limit Aşıldı!',
          badgeClass: 'bg-red-500 text-white',
          icon: ShieldAlert
        }
      case 'kritik':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60',
          barColor: 'bg-orange-500',
          badgeText: 'Kritik Limit Eşiği (>%85)',
          badgeClass: 'bg-orange-500 text-white',
          icon: AlertTriangle
        }
      case 'uyari':
        return {
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60',
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

  // Toplam birim harcaması ve dosya
  const toplamBirimHarcamasi = birimler.reduce((acc, b) => acc + (b.toplam_harcama || 0), 0)
  const toplamBirimDosyaSayisi = birimler.reduce((acc, b) => acc + (b.dosya_sayisi || 0), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ========================================================================= */}
      {/* ── 1. SOL: KİK 22/d YILLIK LİMİT VE DOĞRUDAN MEVZUAT RAPORU (IN-PAGE) ── */}
      {/* ========================================================================= */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    K.İ.K 22/d Yıllık Limit & Bütçe Tüketim Raporu
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

            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs shrink-0',
                durumCfg.badgeClass
              )}
            >
              <DurumIcon className="w-3.5 h-3.5" />
              {durumCfg.badgeText}
            </span>
          </div>

          {/* Limit Bar & Big Percentage */}
          {limitStat ? (
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-750/80 space-y-3">
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
                  <span className="text-[9px] text-slate-400 block mt-0.5 truncate">Azami Yasal Tavan</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">
                    Harcanan Tutar
                  </span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 truncate block mt-0.5">
                    {formatCurrency(limitStat.harcananTutar)}
                  </span>
                  <span className="text-[9px] text-blue-500/80 block mt-0.5 truncate">Doğrudan Temin</span>
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
                  <span className="text-[9px] text-emerald-500/80 block mt-0.5 truncate">Kalan Alım Hakkı</span>
                </div>
              </div>

              {/* Eşik İlerleme Çizelgesi */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span>%0 Başlangıç</span>
                <span className="text-amber-500 font-semibold">%65 İzleme Eşiği</span>
                <span className="text-orange-500 font-semibold">%85 Kritik Eşik</span>
                <span className="text-red-500 font-semibold">%100 Yasal Sınır</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl">
              Henüz tanımlı KİK 22/d limit dönemi bulunamadı.
            </div>
          )}

          {/* ── DOĞRUDAN EKRANDA MEVZUAT DENETİM RAPORU KUTUSU ── */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-750/80 space-y-2.5">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>4734 Sayılı Kanun Madde 22/d Denetim Kuralları & Yasal Yükümlülükler</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Kısımlara Bölme Yasağı:</strong> Aynı nitelikteki mal veya hizmet alımları, parasal eşik değerlerin altında kalmak amacıyla kısımlara bölünerek doğrudan teminle karşılanamaz.
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

        {/* Footer Aksiyonları */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Limitler Resmî Gazete KİK Tebliği uyarınca belirlenir.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/hesaplama-araclari' })}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Limit Hesaplama Motoru</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/dosyalar' })}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Temin Dosyaları</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── 2. SAĞ: BİRİMLER BAZINDA HARCAMA DAĞILIMI & SEÇİLİ BİRİM DETAYI ── */}
      {/* ========================================================================= */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Birimler Bazında Harcama Oranları & Dağılımı
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Harcama yetkilisi birimlerin doğrudan temin bütçe kullanım payları
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Toplam Harcama</span>
              <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(toplamBirimHarcamasi)}
              </span>
            </div>
          </div>

          {/* ── SEÇİLİ BİRİM DETAY KARTI (IN-PAGE VURGU KARTI) ── */}
          {activeSelectedBirim ? (
            <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  Seçili Birim Analizi
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {activeSelectedBirim.birim_adi}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Toplam <strong>{activeSelectedBirim.dosya_sayisi}</strong> doğrudan temin dosyası yürütüldü.
                </p>
              </div>
              <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-indigo-200 dark:border-indigo-800/80 pt-2 sm:pt-0 sm:pl-4 shrink-0">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Birim Harcama Payı
                </span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(activeSelectedBirim.toplam_harcama)}
                </span>
                <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                  Kurum Bütçesinin %{activeSelectedBirim.yuzde}&apos;si
                </span>
              </div>
            </div>
          ) : null}

          {/* Birimlerin Listesi ve İlerleme Barları */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
              <span>Harcama Birimi & Dosya Sayısı (Seçmek için tıklayın)</span>
              <span>Harcama & Kurum Payı</span>
            </div>

            {birimler.length > 0 ? (
              birimler.map((b, idx) => {
                const barGradient = barColors[idx % barColors.length]
                const isSelected = activeSelectedBirim?.id === b.id

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBirim(b)}
                    className={cn(
                      'p-2.5 rounded-xl border transition-all cursor-pointer group',
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-850/50 border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800/70'
                    )}
                    title={`${b.birim_adi} detayını görmek için tıklayın`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      <div className="flex items-center gap-2 truncate max-w-[65%]">
                        <span className={cn(
                          'w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-colors',
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 group-hover:border-indigo-400'
                        )}>
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
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                          %{b.yuzde}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                Henüz doğrudan temin dosyası bulunmuyor.
              </div>
            )}
          </div>

          {/* İdari Tavsiye & Konsolidasyon Uyarısı */}
          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Bütçe Planlama Uyarısı:</strong> Yıllık harcama payı yüksek birimlerin benzer kalemlerdeki alımları konsolide edilerek 4734 sayılı Kanun kapsamında Açık İhale (Md. 19) usulü ile daha avantajlı fiyatlarla tedarik edilebilir.
            </span>
          </div>
        </div>

        {/* Footer Aksiyonları */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Toplam {birimler.length} birim, {toplamBirimDosyaSayisi} dosya kayıtlı.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/birimler' })}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Birimler Yönetimi</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/dosyalar' })}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Dosyaları Listele</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
