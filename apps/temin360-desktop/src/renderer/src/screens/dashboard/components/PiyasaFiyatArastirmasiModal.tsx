import React, { useState, useEffect, useMemo } from 'react'
import {
  Coins,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  ExternalLink,
  FileSpreadsheet,
  PlusCircle,
  TrendingDown,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Modal } from '../../../components/ui/Modal'
import { cn } from '../../../utils/cn'

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

interface PiyasaFiyatArastirmasiModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PiyasaFiyatArastirmasiModal: React.FC<PiyasaFiyatArastirmasiModalProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate()
  const [data, setData] = useState<FiyatArastirmasiItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDurum, setFilterDurum] = useState<'all' | 'yeterli' | 'eksik' | 'bekliyor'>('all')

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2
    }).format(val || 0)
  }

  const loadData = React.useCallback(async () => {
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
             NULLIF(TRIM(d.birim), ''),
             NULLIF(TRIM(d.harcama_birimi), ''),
             NULLIF(TRIM(b.birim_adi), ''),
             NULLIF(TRIM(b.ad), ''),
             'Genel Birim'
           ) as birim_adi,
           COALESCE(d.yaklasik_maliyet, 0) as yaklasik_maliyet,
           COALESCE(d.tur, 'mal') as tur,
           d.dosya_acilis_tarihi,
           COUNT(tf.id) as toplam_teklif_sayisi,
           SUM(CASE WHEN tf.teklif_verdi_mi = 1 OR tf.teklif_toplami > 0 THEN 1 ELSE 0 END) as gecerli_teklif_sayisi,
           MIN(CASE WHEN tf.teklif_toplami > 0 THEN tf.teklif_toplami ELSE NULL END) as en_dusuk_teklif,
           (SELECT tf2.unvan FROM DATA_TeminFirma tf2 WHERE tf2.temin_dosya_id = d.id AND (tf2.kazandi_mi = 1 OR tf2.kazanan_mi = 1) LIMIT 1) as kazanan_firma,
           (SELECT tf2.teklif_toplami FROM DATA_TeminFirma tf2 WHERE tf2.temin_dosya_id = d.id AND (tf2.kazandi_mi = 1 OR tf2.kazanan_mi = 1) LIMIT 1) as kazanan_tutar
         FROM DATA_TeminDosyasi d
         LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
         LEFT JOIN DATA_TeminFirma tf ON tf.temin_dosya_id = d.id
         WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
         GROUP BY d.id
         ORDER BY d.id DESC
         LIMIT 150`
      )

      if (res && res.success && Array.isArray(res.data)) {
        setData(
          (res.data as Array<Record<string, unknown>>).map((row) => ({
            id: Number(row.id),
            temin_no: String(row.temin_no || ''),
            konu: String(row.konu || ''),
            birim_adi: String(row.birim_adi || 'Genel Birim'),
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
      console.error('Fiyat araştırma verileri çekilemedi:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      void loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen, loadData])

  // İstatistikler
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

  // Filtrelenmiş liste
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchQuery =
        !searchQuery ||
        item.temin_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.konu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.birim_adi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.kazanan_firma && item.kazanan_firma.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchQuery) return false

      if (filterDurum === 'yeterli') return item.gecerli_teklif_sayisi >= 3
      if (filterDurum === 'eksik') return item.gecerli_teklif_sayisi > 0 && item.gecerli_teklif_sayisi < 3
      if (filterDurum === 'bekliyor') return item.gecerli_teklif_sayisi === 0
      return true
    })
  }, [data, searchQuery, filterDurum])

  const handleOpenDosya = (id: number): void => {
    onClose()
    if (id > 0) {
      sessionStorage.setItem('selected_dosya_id', String(id))
    }
    navigate({ to: '/dosyalar' })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doğrudan Temin Dosyaları • Piyasa Fiyat Araştırmaları Masası"
      description="4734 Sayılı Kanun Madde 22/d kapsamında toplanan piyasa teklifleri, geçerlilik durumu, yaklaşık maliyet ve kazanan teklif analizi."
      className="max-w-5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>KİK Md. 22/d uyarınca en az 3 geçerli teklif toplanması esastır.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate({ to: '/dosyalar' })
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Tüm Dosyaları Aç</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate({ to: '/dosyalar/yeni' })
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Yeni Temin Dosyası</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-slate-800 dark:text-slate-200">
        {/* Metrik Özet Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
              <span className="text-[11px] font-bold uppercase tracking-wider">İncelenen Dosya</span>
              <Coins className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalDosya}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Toplam</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
              <span className="text-[11px] font-bold uppercase tracking-wider">≥3 Teklif (Yeterli)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.yeterliTeklif}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                %{stats.totalDosya > 0 ? Math.round((stats.yeterliTeklif / stats.totalDosya) * 100) : 0}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
              <span className="text-[11px] font-bold uppercase tracking-wider">1-2 Teklif (Eksik)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.eksikTeklif}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Teklif İkmalı</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-[11px] font-bold uppercase tracking-wider">Teklif Bekleniyor</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                {stats.teklifBekleyen}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Başlangıç</span>
            </div>
          </div>
        </div>

        {/* Arama ve Filtre Çubuğu */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Dosya No, konu, birim veya firma ara..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterDurum('all')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                filterDurum === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
              )}
            >
              Tümü ({data.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterDurum('yeterli')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                filterDurum === 'yeterli'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              )}
            >
              ≥3 Teklif ({stats.yeterliTeklif})
            </button>
            <button
              type="button"
              onClick={() => setFilterDurum('eksik')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                filterDurum === 'eksik'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300'
              )}
            >
              1-2 Teklif ({stats.eksikTeklif})
            </button>
            <button
              type="button"
              onClick={() => setFilterDurum('bekliyor')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                filterDurum === 'bekliyor'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
              )}
            >
              Teklifsiz ({stats.teklifBekleyen})
            </button>

            <button
              type="button"
              onClick={loadData}
              title="Yenile"
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Dosyalar Listesi */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              Arama kriterlerine uygun piyasa fiyat araştırması kaydı bulunamadı.
            </div>
          ) : (
            filteredData.map((item) => {
              const isYeterli = item.gecerli_teklif_sayisi >= 3
              const isEksik = item.gecerli_teklif_sayisi > 0 && item.gecerli_teklif_sayisi < 3
              const tasarruf =
                item.yaklasik_maliyet > 0 && item.en_dusuk_teklif
                  ? item.yaklasik_maliyet - item.en_dusuk_teklif
                  : 0

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDosya(item.id)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-xs cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-900">
                        {item.temin_no}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.birim_adi}
                      </span>
                      {/* Teklif Rozeti */}
                      {isYeterli ? (
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {item.gecerli_teklif_sayisi} Teklif (Yeterli)
                        </span>
                      ) : isEksik ? (
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          {item.gecerli_teklif_sayisi}/3 Teklif (Eksik)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Teklif Bekleniyor
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {item.konu}
                    </h4>

                    {item.kazanan_firma && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-400">Kazanan İstekli:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.kazanan_firma}
                        </span>
                        {item.kazanan_tutar != null && (
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ({formatCurrency(item.kazanan_tutar)})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Maliyet ve Teklif Rakamları */}
                  <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-2 md:pt-0 md:pl-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Yaklaşık Maliyet
                      </span>
                      <span className="text-xs md:text-sm font-mono font-black text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.yaklasik_maliyet)}
                      </span>
                    </div>

                    {item.en_dusuk_teklif != null && (
                      <div className="text-right mt-0.5">
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 justify-end">
                          <TrendingDown className="w-2.5 h-2.5" /> En Düşük Teklif
                        </span>
                        <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.en_dusuk_teklif)}
                        </span>
                        {tasarruf > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                            Tasarruf: {formatCurrency(tasarruf)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="hidden group-hover:flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                      <span>Teklifleri İncele</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
