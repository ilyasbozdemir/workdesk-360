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
      // 0. Schema inspection: Check all tables and columns dynamically
      const tableColsMap = new Map<string, Set<string>>()
      try {
        const tRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          "SELECT name FROM sqlite_master WHERE type IN ('table', 'view')"
        )
        if (tRes && tRes.success && Array.isArray(tRes.data)) {
          const names: string[] = tRes.data.map((r: { name: string }) => String(r.name).toLowerCase())
          await Promise.all(
            names.map(async (tbl) => {
              try {
                const pRes = await window.electron.ipcRenderer.invoke('db:query', `PRAGMA table_info("${tbl}")`)
                if (pRes && pRes.success && Array.isArray(pRes.data)) {
                  tableColsMap.set(
                    tbl,
                    new Set(pRes.data.map((c: { name: string }) => String(c.name).toLowerCase()))
                  )
                }
              } catch {
                // ignore
              }
            })
          )
        }
      } catch {
        // ignore
      }

      const hasTable = (tbl: string) => tableColsMap.has(tbl.toLowerCase())
      const hasCol = (tbl: string, col: string) =>
        tableColsMap.get(tbl.toLowerCase())?.has(col.toLowerCase()) ?? false

      if (!hasTable('DATA_TeminDosyasi')) {
        setData([])
        return
      }

      const hasDosyaTeminNo = hasCol('DATA_TeminDosyasi', 'temin_no')
      const hasDosyaKonu = hasCol('DATA_TeminDosyasi', 'konu')
      const hasDosyaYm = hasCol('DATA_TeminDosyasi', 'yaklasik_maliyet')
      const hasDosyaTur = hasCol('DATA_TeminDosyasi', 'tur')
      const hasDosyaTarih = hasCol('DATA_TeminDosyasi', 'dosya_acilis_tarihi')
      const hasDosyaNetOdenen = hasCol('DATA_TeminDosyasi', 'net_odenen')
      const hasDosyaBirimId = hasCol('DATA_TeminDosyasi', 'birim_id')
      const hasDosyaBirim = hasCol('DATA_TeminDosyasi', 'birim')
      const hasDosyaHarcamaBirimi = hasCol('DATA_TeminDosyasi', 'harcama_birimi')
      const hasDosyaFirmaId = hasCol('DATA_TeminDosyasi', 'firma_id')
      const hasDosyaIsDeleted = hasCol('DATA_TeminDosyasi', 'is_deleted')

      // Birim
      const hasBirimTable = hasTable('TANIM_Birim')
      const hasBirimAd = hasCol('TANIM_Birim', 'ad')
      const hasBirimAdi = hasCol('TANIM_Birim', 'birim_adi')
      const birimJoin =
        hasBirimTable && hasDosyaBirimId ? 'LEFT JOIN TANIM_Birim b ON d.birim_id = b.id' : ''

      const birimFieldCandidates: string[] = []
      if (hasDosyaBirim) birimFieldCandidates.push("NULLIF(TRIM(d.birim), '')")
      if (hasDosyaHarcamaBirimi) birimFieldCandidates.push("NULLIF(TRIM(d.harcama_birimi), '')")
      if (hasBirimTable && hasBirimAdi) birimFieldCandidates.push("NULLIF(TRIM(b.birim_adi), '')")
      if (hasBirimTable && hasBirimAd) birimFieldCandidates.push("NULLIF(TRIM(b.ad), '')")
      birimFieldCandidates.push("'Genel İdare'")
      const birimSelect = `COALESCE(${birimFieldCandidates.join(', ')})`

      const whereDeleted = hasDosyaIsDeleted ? '(d.is_deleted = 0 OR d.is_deleted IS NULL)' : '1=1'

      // Firma & Teklif
      const hasFirmaTable = hasTable('DATA_TeminFirma')
      const hasFirmaDosyaId = hasCol('DATA_TeminFirma', 'dosya_id')
      const hasFirmaTeminDosyaId = hasCol('DATA_TeminFirma', 'temin_dosya_id')
      const hasFirmaTeklifVerdiMi = hasCol('DATA_TeminFirma', 'teklif_verdi_mi')
      const hasFirmaTeklifToplami = hasCol('DATA_TeminFirma', 'teklif_toplami')
      const hasFirmaKazananMi = hasCol('DATA_TeminFirma', 'kazanan_mi')
      const hasFirmaKazandiMi = hasCol('DATA_TeminFirma', 'kazandi_mi')
      const hasFirmaFirmaId = hasCol('DATA_TeminFirma', 'firma_id')
      const hasFirmaUnvan = hasCol('DATA_TeminFirma', 'unvan')

      const hasKalemTeklifTable = hasTable('DATA_TeminKalemTeklif')
      const hasKalemTeklifBirimFiyat = hasCol('DATA_TeminKalemTeklif', 'birim_fiyat')
      const hasKalemTeklifFirmaId = hasCol('DATA_TeminKalemTeklif', 'temin_firma_id')
      const hasKalemTeklifKalemId = hasCol('DATA_TeminKalemTeklif', 'temin_kalem_id')

      const hasKalemTable = hasTable('DATA_TeminKalem')
      const hasKalemMiktar = hasCol('DATA_TeminKalem', 'miktar')

      const hasKalemTeklifSupport =
        hasKalemTeklifTable && hasKalemTeklifBirimFiyat && hasKalemTeklifFirmaId

      const kalemTeklifExistsCond = hasKalemTeklifSupport
        ? 'EXISTS (SELECT 1 FROM DATA_TeminKalemTeklif tkt WHERE tkt.temin_firma_id = tf.id AND tkt.birim_fiyat > 0)'
        : '1=0'

      const kalemTeklifSumExpr = hasKalemTeklifSupport
        ? hasKalemTable && hasKalemMiktar && hasKalemTeklifKalemId
          ? '(SELECT SUM(tkt2.birim_fiyat * COALESCE(tk2.miktar, 1)) FROM DATA_TeminKalemTeklif tkt2 LEFT JOIN DATA_TeminKalem tk2 ON tkt2.temin_kalem_id = tk2.id WHERE tkt2.temin_firma_id = tf.id)'
          : '(SELECT SUM(tkt2.birim_fiyat) FROM DATA_TeminKalemTeklif tkt2 WHERE tkt2.temin_firma_id = tf.id)'
        : 'NULL'

      let firmaJoin = ''
      let toplamTeklifExpr = '0 as toplam_teklif_sayisi'
      let gecerliTeklifExpr = '0 as gecerli_teklif_sayisi'
      let enDusukTeklifExpr = 'NULL as en_dusuk_teklif'
      let kazananFirmaExpr = 'NULL as kazanan_firma'
      let kazananTutarExpr = hasDosyaNetOdenen ? 'd.net_odenen as kazanan_tutar' : 'NULL as kazanan_tutar'

      const hasTanimFirma = hasTable('TANIM_Firma')

      if (hasFirmaTable) {
        const firmaJoinCond =
          hasFirmaTeminDosyaId && hasFirmaDosyaId
            ? '(tf.temin_dosya_id = d.id OR tf.dosya_id = d.id)'
            : hasFirmaDosyaId
              ? 'tf.dosya_id = d.id'
              : 'tf.temin_dosya_id = d.id'

        firmaJoin = `LEFT JOIN DATA_TeminFirma tf ON ${firmaJoinCond}`
        toplamTeklifExpr = 'COUNT(DISTINCT tf.id) as toplam_teklif_sayisi'

        const validPriceConditions: string[] = []
        if (hasFirmaTeklifVerdiMi) validPriceConditions.push('tf.teklif_verdi_mi = 1')
        if (hasFirmaTeklifToplami) validPriceConditions.push('COALESCE(tf.teklif_toplami, 0) > 0')
        if (hasKalemTeklifSupport) validPriceConditions.push(kalemTeklifExistsCond)

        const validPriceCond =
          validPriceConditions.length > 0 ? `(${validPriceConditions.join(' OR ')})` : '1=0'
        gecerliTeklifExpr = `SUM(CASE WHEN tf.id IS NOT NULL AND ${validPriceCond} THEN 1 ELSE 0 END) as gecerli_teklif_sayisi`

        const enDusukCases: string[] = []
        if (hasFirmaTeklifToplami) {
          enDusukCases.push('WHEN COALESCE(tf.teklif_toplami, 0) > 0 THEN tf.teklif_toplami')
        }
        if (hasKalemTeklifSupport) {
          enDusukCases.push(`WHEN ${kalemTeklifExistsCond} THEN ${kalemTeklifSumExpr}`)
        }
        enDusukTeklifExpr =
          enDusukCases.length > 0
            ? `MIN(CASE ${enDusukCases.join(' ')} ELSE NULL END) as en_dusuk_teklif`
            : 'NULL as en_dusuk_teklif'

        const subFirmaJoinCond =
          hasFirmaTeminDosyaId && hasFirmaDosyaId
            ? '(tf2.temin_dosya_id = d.id OR tf2.dosya_id = d.id)'
            : hasFirmaDosyaId
              ? 'tf2.dosya_id = d.id'
              : 'tf2.temin_dosya_id = d.id'

        const winnerConds: string[] = []
        if (hasFirmaKazandiMi) winnerConds.push('tf2.kazandi_mi = 1')
        if (hasFirmaKazananMi) winnerConds.push('tf2.kazanan_mi = 1')
        const winnerCond = winnerConds.length > 0 ? `(${winnerConds.join(' OR ')})` : '1=0'

        const tanimFirmaJoin =
          hasTanimFirma && hasFirmaFirmaId
            ? 'LEFT JOIN TANIM_Firma tfn ON tf2.firma_id = tfn.id'
            : ''
        const firmUnvanSelect =
          hasTanimFirma && hasFirmaFirmaId && hasFirmaUnvan
            ? 'COALESCE(tf2.unvan, tfn.unvan)'
            : hasFirmaUnvan
              ? 'tf2.unvan'
              : hasTanimFirma && hasFirmaFirmaId
                ? 'tfn.unvan'
                : 'NULL'

        const winnerFirmSubquery =
          winnerConds.length > 0
            ? `(SELECT ${firmUnvanSelect} FROM DATA_TeminFirma tf2 ${tanimFirmaJoin} WHERE ${subFirmaJoinCond} AND ${winnerCond} LIMIT 1)`
            : 'NULL'

        const fallbackWinnerFirm =
          hasTanimFirma && hasDosyaFirmaId
            ? '(SELECT tfn2.unvan FROM TANIM_Firma tfn2 WHERE tfn2.id = d.firma_id LIMIT 1)'
            : 'NULL'

        kazananFirmaExpr = `COALESCE(${winnerFirmSubquery}, ${fallbackWinnerFirm}) as kazanan_firma`

        const winnerTutarSubquery =
          winnerConds.length > 0 && hasFirmaTeklifToplami
            ? `(SELECT tf2.teklif_toplami FROM DATA_TeminFirma tf2 WHERE ${subFirmaJoinCond} AND ${winnerCond} LIMIT 1)`
            : 'NULL'

        kazananTutarExpr = hasDosyaNetOdenen
          ? `COALESCE(${winnerTutarSubquery}, d.net_odenen) as kazanan_tutar`
          : `${winnerTutarSubquery} as kazanan_tutar`
      } else {
        const fallbackWinnerFirm =
          hasTanimFirma && hasDosyaFirmaId
            ? '(SELECT tfn2.unvan FROM TANIM_Firma tfn2 WHERE tfn2.id = d.firma_id LIMIT 1)'
            : 'NULL'
        kazananFirmaExpr = `${fallbackWinnerFirm} as kazanan_firma`
      }

      const teminNoExpr = hasDosyaTeminNo
        ? "COALESCE(NULLIF(TRIM(d.temin_no), ''), 'DT-' || d.id)"
        : "'DT-' || d.id"
      const konuExpr = hasDosyaKonu
        ? "COALESCE(NULLIF(TRIM(d.konu), ''), 'İsimsiz Doğrudan Temin')"
        : "'İsimsiz Doğrudan Temin'"
      const ymExpr = hasDosyaYm ? 'COALESCE(d.yaklasik_maliyet, 0)' : '0'
      const turExpr = hasDosyaTur ? "COALESCE(d.tur, 'mal')" : "'mal'"
      const tarihExpr = hasDosyaTarih ? 'd.dosya_acilis_tarihi' : 'NULL'

      const query = `SELECT 
           d.id,
           ${teminNoExpr} as temin_no,
           ${konuExpr} as konu,
           ${birimSelect} as birim_adi,
           ${ymExpr} as yaklasik_maliyet,
           ${turExpr} as tur,
           ${tarihExpr} as dosya_acilis_tarihi,
           ${toplamTeklifExpr},
           ${gecerliTeklifExpr},
           ${enDusukTeklifExpr},
           ${kazananFirmaExpr},
           ${kazananTutarExpr}
         FROM DATA_TeminDosyasi d
         ${birimJoin}
         ${firmaJoin}
         WHERE ${whereDeleted}
         GROUP BY d.id
         ORDER BY d.id DESC
         LIMIT 60`

      const res = await window.electron.ipcRenderer.invoke('db:query', query)

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
      navigate({ to: APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI })
    }
  }

  const handleOpenDosyaTakip = (id: number, e?: React.MouseEvent): void => {
    e?.stopPropagation()
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
            <span>≥3 Teklif Havuzu ({stats.yeterliTeklif})</span>
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
            <span>Teklif Kaydı Yok ({stats.teklifBekleyen})</span>
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
                      <div className="flex items-center gap-1 font-medium truncate max-w-35">
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
                          <span>{item.gecerli_teklif_sayisi} Teklif (≥3 Havuz)</span>
                        </span>
                      ) : isEksik ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/50">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{item.gecerli_teklif_sayisi} Teklif (Ek Önerilir)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Teklif Yok</span>
                        </span>
                      )}
                    </td>

                    {/* Kazanan Firma & Tutar */}
                    <td className="py-2.5 px-3 text-right max-w-40">
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
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDosya(item.id)
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white border border-blue-200/80 dark:border-blue-900/60 transition-colors cursor-pointer"
                        >
                          <span>Aç</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenDosyaTakip(item.id, e)}
                          title="Süreç Takibinde Gör"
                          className="px-1.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          /takip
                        </button>
                      </div>
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
