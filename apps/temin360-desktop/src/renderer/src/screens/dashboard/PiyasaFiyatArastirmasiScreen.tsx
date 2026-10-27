import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Coins,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  FileSpreadsheet,
  PlusCircle,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Filter
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { exportCsv } from '../../utils/csvExport'
import { cn } from '../../utils/cn'

export interface FiyatArastirmasiItem {
  id: number
  temin_no: string
  konu: string
  birim_adi: string
  yaklasik_maliyet: number
  tur: string
  dosya_acilis_tarihi?: string
  toplam_teklif_sayisi: number
  gecerli_teklif_sayisi: number
  en_dusuk_teklif: number | null
  kazanan_firma: string | null
  kazanan_tutar: number | null
}

export default function PiyasaFiyatArastirmasiScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const [data, setData] = useState<FiyatArastirmasiItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDurum, setFilterDurum] = useState<'all' | 'yeterli' | 'eksik' | 'bekliyor'>('all')

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2
    }).format(val || 0)
  }

  const loadData = useCallback(async () => {
    if (!window?.electron?.ipcRenderer) return
    setIsLoading(true)
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
           d.id,
           COALESCE(NULLIF(TRIM(d.temin_no), ''), 'DT-' || d.id) as temin_no,
           COALESCE(NULLIF(TRIM(d.konu), ''), 'İsimsiz Doğrudan Temin') as konu,
           COALESCE(
             NULLIF(TRIM(b.ad), ''),
             NULLIF(TRIM(b.birim_adi), ''),
             NULLIF(TRIM(d.birim), ''),
             NULLIF(TRIM(d.harcama_birimi), ''),
             'Genel İdare'
           ) as birim_adi,
           COALESCE(d.yaklasik_maliyet, 0) as yaklasik_maliyet,
           COALESCE(d.tur, 'mal') as tur,
           d.dosya_acilis_tarihi,
           COUNT(tf.id) as toplam_teklif_sayisi,
           SUM(CASE WHEN tf.teklif_verdi_mi = 1 OR COALESCE(tf.teklif_toplami, tf.teklif_tutari, tf.teklif_bedeli, 0) > 0 THEN 1 ELSE 0 END) as gecerli_teklif_sayisi,
           MIN(CASE WHEN COALESCE(tf.teklif_toplami, tf.teklif_tutari, tf.teklif_bedeli, 0) > 0 THEN COALESCE(tf.teklif_toplami, tf.teklif_tutari, tf.teklif_bedeli) ELSE NULL END) as en_dusuk_teklif,
           COALESCE(
             (SELECT COALESCE(tf2.unvan, tfn.unvan) FROM DATA_TeminFirma tf2 LEFT JOIN TANIM_Firma tfn ON tf2.firma_id = tfn.id WHERE (tf2.temin_dosya_id = d.id OR tf2.dosya_id = d.id) AND (tf2.kazandi_mi = 1 OR tf2.kazanan_mi = 1 OR tf2.secildi = 1 OR tf2.kazanan = 1) LIMIT 1),
             (SELECT tfn.unvan FROM TANIM_Firma tfn WHERE tfn.id = d.firma_id LIMIT 1)
           ) as kazanan_firma,
           COALESCE(
             (SELECT COALESCE(tf2.teklif_toplami, tf2.teklif_tutari, tf2.teklif_bedeli) FROM DATA_TeminFirma tf2 WHERE (tf2.temin_dosya_id = d.id OR tf2.dosya_id = d.id) AND (tf2.kazandi_mi = 1 OR tf2.kazanan_mi = 1 OR tf2.secildi = 1 OR tf2.kazanan = 1) LIMIT 1),
             d.net_odenen
           ) as kazanan_tutar
         FROM DATA_TeminDosyasi d
         LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
         LEFT JOIN DATA_TeminFirma tf ON (tf.temin_dosya_id = d.id OR tf.dosya_id = d.id)
         WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
         GROUP BY d.id
         ORDER BY d.id DESC
         LIMIT 200`
      )

      if (res && res.success && Array.isArray(res.data)) {
        setData(
          (res.data as Array<Record<string, unknown>>).map((row) => ({
            id: Number(row.id),
            temin_no: String(row.temin_no || ''),
            konu: String(row.konu || ''),
            birim_adi: String(row.birim_adi || 'Genel İdare'),
            yaklasik_maliyet: Number(row.yaklasik_maliyet) || 0,
            tur: String(row.tur || 'mal'),
            dosya_acilis_tarihi: row.dosya_acilis_tarihi as string | undefined,
            toplam_teklif_sayisi: Number(row.toplam_teklif_sayisi) || 0,
            gecerli_teklif_sayisi: Number(row.gecerli_teklif_sayisi) || 0,
            en_dusuk_teklif: row.en_dusuk_teklif != null ? Number(row.en_dusuk_teklif) : null,
            kazanan_firma: (row.kazanan_firma as string) || null,
            kazanan_tutar: row.kazanan_tutar != null ? Number(row.kazanan_tutar) : null
          }))
        )
      }
    } catch (err) {
      console.error('Piyasa fiyat araştırma verileri çekilemedi:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  // İstatistikler
  const stats = useMemo(() => {
    const totalDosya = data.length
    const yeterliTeklif = data.filter((d) => d.gecerli_teklif_sayisi >= 3).length
    const eksikTeklif = data.filter(
      (d) => d.gecerli_teklif_sayisi > 0 && d.gecerli_teklif_sayisi < 3
    ).length
    const teklifBekleyen = data.filter((d) => d.gecerli_teklif_sayisi === 0).length
    const toplamYaklasikMaliyet = data.reduce((acc, curr) => acc + curr.yaklasik_maliyet, 0)
    const toplamKazananTutar = data.reduce((acc, curr) => acc + (curr.kazanan_tutar || 0), 0)

    return {
      totalDosya,
      yeterliTeklif,
      eksikTeklif,
      teklifBekleyen,
      toplamYaklasikMaliyet,
      toplamKazananTutar
    }
  }, [data])

  // Filtrelenmiş liste
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        item.temin_no.toLowerCase().includes(q) ||
        item.konu.toLowerCase().includes(q) ||
        item.birim_adi.toLowerCase().includes(q) ||
        (item.kazanan_firma && item.kazanan_firma.toLowerCase().includes(q))

      if (!matchQuery) return false

      if (filterDurum === 'yeterli') return item.gecerli_teklif_sayisi >= 3
      if (filterDurum === 'eksik') return item.gecerli_teklif_sayisi > 0 && item.gecerli_teklif_sayisi < 3
      if (filterDurum === 'bekliyor') return item.gecerli_teklif_sayisi === 0
      return true
    })
  }, [data, searchQuery, filterDurum])

  const handleOpenDosya = (id: number): void => {
    if (id > 0) {
      sessionStorage.setItem('selected_dosya_id', String(id))
    }
    navigate({ to: '/dosyalar' })
  }

  const handleExportCSV = (): void => {
    if (filteredData.length === 0) return
    const headers = [
      'Temin No',
      'İşin Konusu',
      'Harcama Birimi',
      'Alım Türü',
      'Yaklaşık Maliyet (TL)',
      'Toplam Teklif',
      'Geçerli Teklif',
      'Durum',
      'En Düşük Teklif (TL)',
      'Kazanan Firma',
      'Sözleşme / Fatura Bedeli (TL)'
    ]

    const rows = filteredData.map((d) => [
      `"${d.temin_no}"`,
      `"${d.konu.replace(/"/g, '""')}"`,
      `"${d.birim_adi.replace(/"/g, '""')}"`,
      `"${d.tur}"`,
      d.yaklasik_maliyet.toFixed(2),
      d.toplam_teklif_sayisi,
      d.gecerli_teklif_sayisi,
      d.gecerli_teklif_sayisi >= 3 ? 'Yeterli (>=3)' : d.gecerli_teklif_sayisi > 0 ? 'Eksik (1-2)' : 'Teklif Bekliyor',
      d.en_dusuk_teklif != null ? d.en_dusuk_teklif.toFixed(2) : '0.00',
      `"${(d.kazanan_firma || '-').replace(/"/g, '""')}"`,
      d.kazanan_tutar != null ? d.kazanan_tutar.toFixed(2) : '0.00'
    ])

    exportCsv(`Piyasa_Fiyat_Arastirmalari_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* ── 1. ÜST HEADER & BREADCRUMB & AKSİYONLAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfa</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-bold">Piyasa Fiyat Araştırmaları Masası</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <span>Piyasa Fiyat Araştırmaları Masası</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  KİK Md. 22/d
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                4734 Sayılı Kamu İhale Kanunu uyarınca toplanan piyasa teklifleri, geçerlilik denetimi ve kazanan firma analiz paneli
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', isLoading && 'animate-spin')} />
            <span>Yenile</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV İndir</span>
          </button>
          <Link to="/dosyalar/yeni">
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Yeni Temin Dosyası</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── 2. METRİK & GÖSTERGE KARTLARI ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">İncelenen Dosya</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalDosya}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Doğrudan temin kaydı</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">≥3 Teklif (Yeterli)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.yeterliTeklif}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1">
            %{stats.totalDosya > 0 ? Math.round((stats.yeterliTeklif / stats.totalDosya) * 100) : 0} Mevzuata Tam Uyumlu
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">1-2 Teklif (Eksik)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.eksikTeklif}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold mt-1">
            Ek teklif mektubu gerekli
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Teklif Bekleniyor</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
            {stats.teklifBekleyen}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Piyasa araştırması aşamasında</span>
        </div>
      </div>

      {/* ── 3. MEVZUAT HATIRLATMA BANDI ── */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>KİK Madde 22/d Kuralı:</strong> İhtiyaç duyulan mal ve hizmet alımlarında piyasa fiyat araştırması yapılarak en az 3 geçerli teklif toplanması ve Harcama Yetkilisi onayına sunulması esastır.
          </span>
        </div>
        <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
          Toplam Yaklaşık Maliyet Hacmi: {formatCurrency(stats.toplamYaklasikMaliyet)}
        </div>
      </div>

      {/* ── 4. ARAMA VE FİLTRE ŞERİDİ ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Arama Kutusu */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Temin No, Konu, Birim veya Kazanan Firma ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre Butonları */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterDurum('all')}
              className={cn(
                'px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer',
                filterDurum === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              )}
            >
              Tümü ({data.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterDurum('yeterli')}
              className={cn(
                'px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1',
                filterDurum === 'yeterli'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>≥3 Teklif ({stats.yeterliTeklif})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterDurum('eksik')}
              className={cn(
                'px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1',
                filterDurum === 'eksik'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>1-2 Teklif ({stats.eksikTeklif})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterDurum('bekliyor')}
              className={cn(
                'px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1',
                filterDurum === 'bekliyor'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Teklif Bekleyen ({stats.teklifBekleyen})</span>
            </button>
          </div>
        </div>

        {/* ── 5. DOSYALAR LİSTESİ ── */}
        {isLoading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Coins className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-bold">Aramanıza uygun piyasa fiyat araştırması dosyası bulunamadı.</div>
            <p className="text-xs text-slate-400">
              Arama filtrenizi temizleyebilir veya yeni bir doğrudan temin dosyası başlatabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <div className="col-span-4">Dosya No & Temin Konusu</div>
              <div className="col-span-2">Harcama Birimi & Tür</div>
              <div className="col-span-2 text-right">Yaklaşık Maliyet</div>
              <div className="col-span-2 text-center">Piyasa Teklifleri</div>
              <div className="col-span-2 text-right">Kazanan / Sonuç</div>
            </div>

            {filteredData.map((item) => {
              const isYeterli = item.gecerli_teklif_sayisi >= 3
              const isEksik = item.gecerli_teklif_sayisi > 0 && item.gecerli_teklif_sayisi < 3
              const isBekliyor = item.gecerli_teklif_sayisi === 0

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDosya(item.id)}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-slate-800/80 transition-all cursor-pointer group"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                    {/* 1. Temin No & Konu */}
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/60">
                          {item.temin_no}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {item.tur}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {item.konu}
                      </h4>
                    </div>

                    {/* 2. Harcama Birimi */}
                    <div className="lg:col-span-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.birim_adi}</span>
                    </div>

                    {/* 3. Yaklaşık Maliyet */}
                    <div className="lg:col-span-2 text-left lg:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block lg:hidden">
                        Yaklaşık Maliyet
                      </span>
                      <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.yaklasik_maliyet)}
                      </span>
                    </div>

                    {/* 4. Teklif Sayısı & Rozet */}
                    <div className="lg:col-span-2 flex flex-col items-start lg:items-center">
                      {isYeterli && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item.gecerli_teklif_sayisi} Geçerli Teklif</span>
                        </span>
                      )}
                      {isEksik && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{item.gecerli_teklif_sayisi} Teklif (Eksik)</span>
                        </span>
                      )}
                      {isBekliyor && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          <Clock className="w-3 h-3" />
                          <span>Teklif Bekliyor</span>
                        </span>
                      )}
                      {item.en_dusuk_teklif != null && item.en_dusuk_teklif > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          En Düşük: {formatCurrency(item.en_dusuk_teklif)}
                        </span>
                      )}
                    </div>

                    {/* 5. Kazanan / Sonuç */}
                    <div className="lg:col-span-2 text-left lg:text-right">
                      {item.kazanan_firma ? (
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
                            {item.kazanan_firma}
                          </span>
                          <span className="text-[11px] font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.kazanan_tutar || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 italic">
                          Henüz sonuçlanmadı
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
