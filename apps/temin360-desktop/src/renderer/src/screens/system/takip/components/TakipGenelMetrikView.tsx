import React, { useState, useMemo } from 'react'
import {
  Building,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileCheck,
  Layers,
  Sliders,
  TrendingUp,
  Percent,
  Users,
  Package,
  Calendar,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  RotateCcw
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid
} from 'recharts'
import {
  AsamaItem,
  TeminBelgeItem,
  TeminFirmaItem,
  TeminKalemItem,
  TeminKomisyonItem
} from './takip.types'

interface TakipGenelMetrikViewProps {
  activeDosya?: any
  dosyalar: any[]
  allBelgeler: any[]
  kalemler?: TeminKalemItem[]
  firmalar?: TeminFirmaItem[]
  dbBelgeler?: TeminBelgeItem[]
  komisyonlar?: TeminKomisyonItem[]
  stages: AsamaItem[]
  dbAsamalar: AsamaItem[]
  formatCurrency: (val: number) => string
  setActiveDosyaId: (id: number) => void
  onGoToDetail?: () => void
  onOpenKanban?: () => void
}

const TUR_COLORS: Record<string, string> = {
  MAL: '#3b82f6', // Mavi
  HIZMET: '#10b981', // Zümrüt Yeşili
  YAPIM: '#f59e0b', // Kehribar
  DANISMANLIK: '#8b5cf6' // Mor
}

const STAGE_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981']

export function TakipGenelMetrikView({
  activeDosya,
  dosyalar = [],
  allBelgeler = [],
  kalemler = [],
  firmalar = [],
  dbBelgeler = [],
  stages = [],
  dbAsamalar = [],
  formatCurrency,
  setActiveDosyaId,
  onGoToDetail,
  onOpenKanban
}: TakipGenelMetrikViewProps): React.JSX.Element {
  // Görünüm Kapsamı: Aktif Dosya Odaklı vs Tüm Portföy
  const [metricScope, setMetricScope] = useState<'aktif' | 'genel'>(() => {
    return activeDosya ? 'aktif' : 'genel'
  })

  // Filtreler (Genel mod için)
  const [selectedTur, setSelectedTur] = useState<string>('all')
  const [selectedYil, setSelectedYil] = useState<string>('all')

  // En yüksek yaklaşık maliyeti bul (slider sınırı için)
  const maxDosyaMaliyeti = useMemo(() => {
    const max = Math.max(...dosyalar.map((d) => d.yaklasik_maliyet || 0), 100000)
    return Math.ceil(max / 50000) * 50000
  }, [dosyalar])

  const [tutarLimitSlider, setTutarLimitSlider] = useState<number>(maxDosyaMaliyeti)

  // Mevcut Yıllar Listesi
  const uniqueYillar = useMemo(() => {
    const years = new Set<number>()
    dosyalar.forEach((d) => {
      const y =
        d.butce_yili ||
        (d.dosya_acilis_tarihi ? new Date(d.dosya_acilis_tarihi).getFullYear() : null)
      if (y) years.add(y)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [dosyalar])

  // Filtrelenmiş Dosyalar
  const filteredDosyalar = useMemo(() => {
    return dosyalar.filter((d) => {
      if (selectedTur !== 'all' && (d.tur || '').toUpperCase() !== selectedTur) {
        return false
      }
      if (selectedYil !== 'all') {
        const dYear =
          d.butce_yili ||
          (d.dosya_acilis_tarihi ? new Date(d.dosya_acilis_tarihi).getFullYear() : null)
        if (String(dYear) !== selectedYil) return false
      }
      if (tutarLimitSlider < maxDosyaMaliyeti) {
        const m = d.yaklasik_maliyet || 0
        if (m > tutarLimitSlider) return false
      }
      return true
    })
  }, [dosyalar, selectedTur, selectedYil, tutarLimitSlider, maxDosyaMaliyeti])

  // Toplam Tutar
  const toplamYaklasikMaliyet = useMemo(() => {
    return filteredDosyalar.reduce((sum, d) => sum + (d.yaklasik_maliyet || 0), 0)
  }, [filteredDosyalar])

  // Aşama Dağılımı Verisi (Recharts Bar Chart için)
  const stageChartData = useMemo(() => {
    return stages.map((asama, idx) => {
      const matched = filteredDosyalar.filter(
        (d) => (d.durum_asama_id || 1) === asama.asama_sira
      )
      const stageMaliyet = matched.reduce((s, d) => s + (d.yaklasik_maliyet || 0), 0)
      return {
        name: asama.asama_adi || `${asama.asama_sira}. Aşama`,
        sira: asama.asama_sira,
        count: matched.length,
        maliyet: stageMaliyet,
        color: STAGE_COLORS[idx % STAGE_COLORS.length]
      }
    })
  }, [stages, filteredDosyalar])

  // Alım Türü Dağılımı Verisi (Pie Chart için)
  const turChartData = useMemo(() => {
    const counts: Record<string, { count: number; maliyet: number }> = {}
    filteredDosyalar.forEach((d) => {
      const t = (d.tur || 'DİĞER').toUpperCase()
      if (!counts[t]) counts[t] = { count: 0, maliyet: 0 }
      counts[t].count += 1
      counts[t].maliyet += d.yaklasik_maliyet || 0
    })

    return Object.entries(counts).map(([name, val]) => ({
      name: `${name} Alımı`,
      turKey: name,
      count: val.count,
      maliyet: val.maliyet,
      color: TUR_COLORS[name] || '#94a3b8'
    }))
  }, [filteredDosyalar])

  // Belge İmza Oranı Verisi (Donut Chart için)
  const imzaChartData = useMemo(() => {
    const signedCount = allBelgeler.filter((b) => b.is_signed).length
    const pendingCount = allBelgeler.length - signedCount
    return [
      { name: 'İmzalanan', value: signedCount, color: '#10b981' },
      { name: 'İmza Bekleyen', value: pendingCount, color: '#f59e0b' }
    ]
  }, [allBelgeler])

  const imzaYuzdesi = useMemo(() => {
    if (allBelgeler.length === 0) return 0
    const signed = allBelgeler.filter((b) => b.is_signed).length
    return Math.round((signed / allBelgeler.length) * 100)
  }, [allBelgeler])

  // Aktif Dosya Metrikleri
  const aktifDosyaSignedBelgeler = useMemo(() => {
    return dbBelgeler.filter((b) => b.is_signed).length
  }, [dbBelgeler])

  const aktifDosyaBelgeYuzdesi = useMemo(() => {
    if (dbBelgeler.length === 0) return 0
    return Math.round((aktifDosyaSignedBelgeler / dbBelgeler.length) * 100)
  }, [dbBelgeler, aktifDosyaSignedBelgeler])

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto my-4 w-full animate-in fade-in duration-300">
      {/* 1. ÜST KONTROL BAR: KAPSAM SEÇİCİ & AKTİF DOSYA FOCUS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setMetricScope('aktif')}
            disabled={!activeDosya}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              metricScope === 'aktif'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            } ${!activeDosya ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <ClipboardList size={15} />
            <span>Aktif Dosya Analizi</span>
            {activeDosya && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {activeDosya.temin_no || 'Aktif'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMetricScope('genel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              metricScope === 'genel'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 size={15} />
            <span>Tüm Kurum Portföyü</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {dosyalar.length} Dosya
            </span>
          </button>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2">
          {activeDosya && (
            <button
              type="button"
              onClick={onGoToDetail}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FileCheck size={14} />
              <span>Süreç & Evrak Detayına Git</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenKanban}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Layers size={14} />
            <span>Kanban Panosuna Dön</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GÖRÜNÜM A: AKTİF DOSYA DERİNLEMESİNE METRİKLERİ */}
      {/* ========================================================================= */}
      {metricScope === 'aktif' && activeDosya && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Aktif Dosya Kimlik Kartı */}
          <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl border border-blue-800/40 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  {activeDosya.temin_no || 'Dosya No Belirsiz'}
                </span>
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeDosya.tur} Alımı
                </span>
                <span className="text-xs font-semibold text-blue-200/80">
                  {activeDosya.birim_adi || 'Birim Belirtilmedi'}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">{activeDosya.konu}</h1>
            </div>

            <div className="text-right bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0">
              <span className="text-[10px] text-blue-200 uppercase tracking-widest font-bold block">
                Yaklaşık Maliyet
              </span>
              <span className="text-2xl font-mono font-black text-white">
                {formatCurrency(activeDosya.yaklasik_maliyet || 0)}
              </span>
            </div>
          </div>

          {/* 4 Özet KPI Kartı */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Süreç Aşaması */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Mevcut Aşama</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                {activeDosya.durum_asama_id || 1}. Aşama
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 truncate">
                {stages.find((s) => s.asama_sira === (activeDosya.durum_asama_id || 1))
                  ?.asama_adi || 'Hazırlık'}
              </p>
            </div>

            {/* Belge Tamamlama Oranı */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Percent size={16} />
                </div>
                <span className="text-[11px] font-bold text-slate-500">İmza & Belge Oranı</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                %{aktifDosyaBelgeYuzdesi}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {aktifDosyaSignedBelgeler} / {dbBelgeler.length} evrak imzalandı
              </p>
            </div>

            {/* İhtiyaç Kalemleri */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Package size={16} />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Malzeme / Kalem</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                {kalemler.length} Kalem
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Toplam ihale/alım içeriği</p>
            </div>

            {/* Teklif Veren Firmalar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <span className="text-[11px] font-bold text-slate-500">İstekli Firmalar</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                {firmalar.length} Firma
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Piyasa araştırması teklifleri</p>
            </div>
          </div>

          {/* Süreç İlerleme Adımları (Aşama İlerleme Çubuğu) */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              Süreç İlerleme Durumu & Aşamalar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {stages.map((stg) => {
                const currentSira = activeDosya.durum_asama_id || 1
                const isCompleted = stg.asama_sira < currentSira
                const isCurrent = stg.asama_sira === currentSira

                return (
                  <div
                    key={stg.asama_sira}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-100 shadow-xs'
                        : isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 shadow-2xs">
                        {stg.asama_sira}. Adım
                      </span>
                      {isCompleted && <CheckCircle2 size={16} className="text-emerald-600" />}
                      {isCurrent && <Clock size={16} className="text-blue-600 animate-pulse" />}
                    </div>
                    <p className="text-xs font-bold truncate">{stg.asama_adi}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {stg.aciklama || 'Bu aşamada mevzuat evrakları hazırlanır.'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GÖRÜNÜM B: TÜM KURUM PORTFÖYÜ & İNTERAKTİF CHARTS + SLIDER */}
      {/* ========================================================================= */}
      {metricScope === 'genel' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* İNTERAKTİF FİLTRE VE SLIDER PANELİ */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  İnteraktif Portföy Filtreleri & Bütçe Simülatörü
                </h3>
              </div>

              {(selectedTur !== 'all' ||
                selectedYil !== 'all' ||
                tutarLimitSlider < maxDosyaMaliyeti) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTur('all')
                    setSelectedYil('all')
                    setTutarLimitSlider(maxDosyaMaliyeti)
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Filtreleri Sıfırla
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Alım Türü Filtresi */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Alım Türü:
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'MAL', 'HIZMET', 'YAPIM', 'DANISMANLIK'].map((tur) => (
                    <button
                      key={tur}
                      type="button"
                      onClick={() => setSelectedTur(tur)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedTur === tur
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tur === 'all' ? 'Tümü' : tur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bütçe Yılı */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Bütçe Yılı:
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedYil('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      selectedYil === 'all'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tümü
                  </button>
                  {uniqueYillar.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setSelectedYil(String(y))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedYil === String(y)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tutar Limit Slider'ı */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Maksimum Yaklaşık Maliyet:
                  </label>
                  <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(tutarLimitSlider)}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max={maxDosyaMaliyeti}
                  step="25000"
                  value={tutarLimitSlider}
                  onChange={(e) => setTutarLimitSlider(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>10.000 ₺</span>
                  <span>{formatCurrency(maxDosyaMaliyeti)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 BÜYÜK KPI KARTI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Toplam Dosya */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                  <Layers size={18} />
                </div>
                <span className="text-xs font-bold text-slate-500">Dosya Sayısı</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {filteredDosyalar.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Filtreye uyan toplam doğrudan temin
              </p>
            </div>

            {/* Toplam Maliyet Hacmi */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                  <TrendingUp size={18} />
                </div>
                <span className="text-xs font-bold text-slate-500">Toplam Hacim</span>
              </div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 truncate">
                {formatCurrency(toplamYaklasikMaliyet)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Ortalama:{' '}
                {formatCurrency(
                  filteredDosyalar.length > 0 ? toplamYaklasikMaliyet / filteredDosyalar.length : 0
                )}
              </p>
            </div>

            {/* Belge İmza Oranı */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
                  <Percent size={18} />
                </div>
                <span className="text-xs font-bold text-slate-500">İmzalanma Oranı</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                %{imzaYuzdesi}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {allBelgeler.filter((b) => !b.is_signed).length} evrak imza bekliyor
              </p>
            </div>

            {/* Tamamlanma Oranı */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-xs font-bold text-slate-500">Sonuçlanan</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {filteredDosyalar.filter((d) => d.status === 'tamamlandi').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {filteredDosyalar.filter((d) => d.status === 'devam_ediyor').length} dosya devam
                ediyor
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RECHARTS GRAFİK ALANI: BAR CHART + DONUT / PIE CHARTS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. GRAFİK: AŞAMALARA GÖRE DOSYA VE MALİYET DAĞILIMI (BAR CHART) */}
            <div className="lg:col-span-8 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" />
                    Süreç Aşamalarına Göre Dağılım
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hangi aşamada kaç dosya ve ne kadar bütçe bekliyor
                  </p>
                </div>
              </div>

              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                  <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
                              <p className="font-bold">{data.name}</p>
                              <p className="text-blue-300">Dosya Sayısı: {data.count} Adet</p>
                              <p className="text-emerald-300">
                                Bütçe Hacmi: {formatCurrency(data.maliyet)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {stageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. GRAFİK: ALIM TÜRÜ DAĞILIMI (DONUT / PIE CHART) */}
            <div className="lg:col-span-4 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <PieChartIcon size={16} className="text-purple-600" />
                  Alım Türü Kırılımı
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mal, Hizmet ve Yapım oranları</p>
              </div>

              <div className="h-56 w-full min-w-0 flex items-center justify-center">
                {turChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                    <PieChart>
                      <Pie
                        data={turChartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {turChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs space-y-1">
                                <p className="font-bold">{data.name}</p>
                                <p className="text-blue-300">{data.count} Dosya</p>
                                <p className="text-emerald-300">{formatCurrency(data.maliyet)}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-slate-400">Veri bulunamadı</span>
                )}
              </div>

              {/* Legend Bilgisi */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {turChartData.map((item) => (
                  <div key={item.turKey} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {item.turKey}:
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SON İŞLEM GÖREN DOSYALAR LİSTESİ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Son İşlem Gören Dosyalar
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Çalışmak istediğiniz dosyaya tıklayarak detay ve evrak stüdyosuna geçin
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDosyalar.slice(0, 6).map((dosya) => {
                const stageInfo = dbAsamalar.find(
                  (a) => a.asama_sira === (dosya.durum_asama_id || 1)
                )

                return (
                  <div
                    key={dosya.id}
                    onClick={() => {
                      setActiveDosyaId(dosya.id)
                      setMetricScope('aktif')
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-blue-50/70 dark:bg-slate-900/40 dark:hover:bg-blue-950/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:border-blue-400 transition-colors">
                        <FileCheck size={18} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600">
                          {dosya.konu || 'İsimsiz Temin'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                            {dosya.temin_no}
                          </span>
                          <span>•</span>
                          <span>{dosya.tur}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(dosya.yaklasik_maliyet || 0)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {stageInfo?.asama_adi || '1. Aşama'}
                      </span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
