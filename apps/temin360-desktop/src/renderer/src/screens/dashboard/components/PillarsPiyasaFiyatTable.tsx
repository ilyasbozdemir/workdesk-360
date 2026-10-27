import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Coins,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  ChevronRight
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../../constants/routeConstants'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { cn } from '../../../utils/cn'

export interface FiyatItem {
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

export const PillarsPiyasaFiyatTable: React.FC = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<FiyatItem[]>([])
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
    if (!window?.electron?.ipcRenderer) {
      setIsLoading(false)
      return
    }
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
         LIMIT 60`
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
      console.error('Pillars fiyat araştırması verileri alınamadı:', err)
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

  const stats = useMemo(() => {
    const totalDosya = data.length
    const yeterliTeklif = data.filter((d) => d.gecerli_teklif_sayisi >= 3).length
    const eksikTeklif = data.filter(
      (d) => d.gecerli_teklif_sayisi > 0 && d.gecerli_teklif_sayisi < 3
    ).length
    const teklifBekleyen = data.filter((d) => d.gecerli_teklif_sayisi === 0).length
    const toplamYaklasikMaliyet = data.reduce((acc, curr) => acc + curr.yaklasik_maliyet, 0)

    return {
      totalDosya,
      yeterliTeklif,
      eksikTeklif,
      teklifBekleyen,
      toplamYaklasikMaliyet
    }
  }, [data])

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
      useWorkspaceStore.getState().setActiveDosyaId(id)
      navigate({ to: APP_ROUTES.TAKIP })
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
      {/* ── 1. BAŞLIK VE HIZLI KONTROLLER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Doğrudan Temin Dosyaları Piyasa Fiyat Araştırmaları Tablosu
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              KİK Md. 22/d uyarınca toplanan piyasa teklifleri, geçerli teklif durumu ve sonuç analizi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            title="Verileri Yenile"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-blue-500')} />
          </button>
          <Link to={APP_ROUTES.PIYASA_FIYAT_ARASTIRMALARI_MASASI}>
            <button
              type="button"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200/80 dark:border-blue-900/60 py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Geniş Ekranda İncele</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>

      {/* ── 2. METRİK CHIP'LERİ VE FİLTRELER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Arama Alanı */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dosya no, konu, birim veya firma..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filtre Butonları */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterDurum('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer',
              filterDurum === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            )}
          >
            Tümü ({stats.totalDosya})
          </button>
          <button
            type="button"
            onClick={() => setFilterDurum('yeterli')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1',
              filterDurum === 'yeterli'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            )}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>≥3 Teklif ({stats.yeterliTeklif})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterDurum('eksik')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1',
              filterDurum === 'eksik'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>1-2 Teklif ({stats.eksikTeklif})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterDurum('bekliyor')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1',
              filterDurum === 'bekliyor'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
            )}
          >
            <Clock className="w-3 h-3" />
            <span>Teklif Bekleyen ({stats.teklifBekleyen})</span>
          </button>
        </div>
      </div>

      {/* ── 3. LİSTE VE DOSYALAR TABLOSU ── */}
      {isLoading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
          <Coins className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="text-xs font-bold">Kriterlere uygun piyasa fiyat araştırması dosyası bulunamadı.</div>
          <p className="text-[11px] text-slate-400">
            Filtrenizi temizleyebilir veya yeni doğrudan temin başlatabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/90 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Temin No & Konu</th>
                <th className="py-2.5 px-3">Harcama Birimi & Tür</th>
                <th className="py-2.5 px-3 text-right">Yaklaşık Maliyet</th>
                <th className="py-2.5 px-3 text-center">Piyasa Teklifleri</th>
                <th className="py-2.5 px-3 text-right">Kazanan Firma & Tutar</th>
                <th className="py-2.5 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredData.slice(0, 15).map((item) => {
                const isYeterli = item.gecerli_teklif_sayisi >= 3
                const isEksik = item.gecerli_teklif_sayisi > 0 && item.gecerli_teklif_sayisi < 3
                const isBekliyor = item.gecerli_teklif_sayisi === 0

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDosya(item.id)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    {/* Temin No & Konu */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                          {item.temin_no}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {item.tur}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.konu}
                      </div>
                    </td>

                    {/* Birim */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1 font-medium truncate max-w-[140px]">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.birim_adi}</span>
                      </div>
                    </td>

                    {/* Yaklaşık Maliyet */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatCurrency(item.yaklasik_maliyet)}
                    </td>

                    {/* Piyasa Teklifleri Rozeti */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isYeterli ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item.gecerli_teklif_sayisi} Geçerli</span>
                        </span>
                      ) : isEksik ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/50">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{item.gecerli_teklif_sayisi} Teklif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Bekliyor</span>
                        </span>
                      )}
                    </td>

                    {/* Kazanan Firma & Tutar */}
                    <td className="py-2.5 px-3 text-right max-w-[160px]">
                      {item.kazanan_firma ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {item.kazanan_firma}
                          </div>
                          <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatCurrency(item.kazanan_tutar || item.en_dusuk_teklif || 0)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belirlenmedi</span>
                      )}
                    </td>

                    {/* İşlem */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDosya(item.id)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white border border-blue-200/80 dark:border-blue-900/60 transition-colors cursor-pointer"
                      >
                        <span>Aç</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 4. ALT BİLGİ VE HIZLI YÖNLENDİRME ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>
            Toplam {stats.totalDosya} doğrudan temin dosyasından ilk {Math.min(filteredData.length, 15)} dosya listeleniyor.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to={APP_ROUTES.DOSYALAR} className="font-bold text-slate-700 dark:text-slate-300 hover:underline">
            Tüm Dosyalar Listesi →
          </Link>
          <Link to={APP_ROUTES.PIYASA_FIYAT_ARASTIRMALARI_MASASI} className="font-black text-blue-600 dark:text-blue-400 hover:underline">
            Tam Ekran Fiyat Araştırma Masası →
          </Link>
        </div>
      </div>
    </div>
  )
}
