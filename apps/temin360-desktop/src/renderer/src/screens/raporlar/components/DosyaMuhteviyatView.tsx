import React, { useState, useEffect, useCallback } from 'react'
import {
  Layers,
  Printer,
  Download,
  Search,
  Building2,
  Package,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingDown,
  Briefcase
} from 'lucide-react'
import { cn } from '../../../utils/cn'
import { exportCsv } from '../../../utils/csvExport'
import type { RaporFilters } from '../raporlar.hooks'

const fmt = (n: number): string =>
  (n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'

interface KalemItem {
  id: number
  kalem_adi: string
  miktar: number
  birim: string
  yaklasik_birim_fiyat: number
  toplam_tutar: number
}

interface FirmaItem {
  id: number
  unvan: string
  vergi_no?: string
  teklif_tutari: number
  kazanan: boolean
}

interface DosyaMuhteviyatItem {
  id: number
  dosya_no: string
  temin_no?: string
  is_adi: string
  konu?: string
  birim?: string
  alim_turu: string
  butce_yili?: string
  durum: string
  yaklasik_maliyet: number
  sozlesme_bedeli: number
  kalemler: KalemItem[]
  firmalar: FirmaItem[]
}

interface DosyaMuhteviyatViewProps {
  filters: RaporFilters
}

export const DosyaMuhteviyatView: React.FC<DosyaMuhteviyatViewProps> = ({ filters }) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [dosyalar, setDosyalar] = useState<DosyaMuhteviyatItem[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [acikDosyalar, setAcikDosyalar] = useState<Record<number, boolean>>({})

  const fetchMuhteviyatData = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return
    setLoading(true)

    try {
      // 1. Dosyaları çek
      const resDosyalar = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
          d.id,
          COALESCE(d.dosya_no, d.temin_no, '#' || d.id) as dosya_no,
          d.temin_no,
          COALESCE(d.is_adi, d.dosya_adi, d.konu, 'İsimsiz Temin') as is_adi,
          d.konu,
          COALESCE(b.ad, b.birim_adi, d.birim, d.harcama_birimi, 'Genel İdare') as birim,
          COALESCE(d.alim_turu, d.tur, 'mal') as alim_turu,
          COALESCE(d.butce_yili, strftime('%Y', COALESCE(d.dosya_acilis_tarihi, d.created_at, 'now'))) as butce_yili,
          COALESCE(d.durum, 'Tamamlandı') as durum,
          COALESCE(d.yaklasik_maliyet, 0) as yaklasik_maliyet,
          COALESCE(d.net_odenen, 0) as net_odenen,
          d.firma_id
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
        WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
        ORDER BY d.id DESC`
      )

      if (!resDosyalar.success || !Array.isArray(resDosyalar.data)) {
        setDosyalar([])
        return
      }

      // 2. Kalemleri çek
      const resKalemler = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
          k.id,
          COALESCE(k.temin_dosya_id, k.dosya_id) as dosya_id,
          COALESCE(k.kalem_adi, k.malzeme_adi, 'Kalem') as kalem_adi,
          COALESCE(k.miktar, 1) as miktar,
          COALESCE(k.birim, 'Adet') as birim,
          COALESCE(k.birim_fiyat, k.yaklasik_maliyet, 0) as yaklasik_birim_fiyat,
          COALESCE(k.toplam_tutar, (k.miktar * k.birim_fiyat), 0) as toplam_tutar
        FROM DATA_TeminKalem k
        ORDER BY k.id ASC`
      )

      // 3. Firmaları çek
      const resFirmalar = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
          f.id,
          f.firma_id,
          COALESCE(f.temin_dosya_id, f.dosya_id) as dosya_id,
          COALESCE(tf.unvan, f.unvan, 'Firma') as unvan,
          COALESCE(tf.vergi_no, f.vergi_no, '') as vergi_no,
          COALESCE(f.teklif_toplami, 0) as teklif_tutari,
          COALESCE(f.kazandi_mi, f.kazanan_mi, 0) as kazanan
        FROM DATA_TeminFirma f
        LEFT JOIN TANIM_Firma tf ON tf.id = f.firma_id
        ORDER BY f.id ASC`
      )

      const kalemlerMap: Record<number, KalemItem[]> = {}
      if (resKalemler.success && Array.isArray(resKalemler.data)) {
        for (const k of resKalemler.data) {
          const did = Number(k.dosya_id)
          if (!kalemlerMap[did]) kalemlerMap[did] = []
          kalemlerMap[did].push({
            id: k.id,
            kalem_adi: k.kalem_adi,
            miktar: Number(k.miktar || 1),
            birim: k.birim,
            yaklasik_birim_fiyat: Number(k.yaklasik_birim_fiyat || 0),
            toplam_tutar: Number(k.toplam_tutar || 0)
          })
        }
      }

      const firmalarMap: Record<number, FirmaItem[]> = {}
      if (resFirmalar.success && Array.isArray(resFirmalar.data)) {
        for (const f of resFirmalar.data) {
          const did = Number(f.dosya_id)
          if (!firmalarMap[did]) firmalarMap[did] = []
          firmalarMap[did].push({
            id: f.id,
            unvan: f.unvan,
            vergi_no: f.vergi_no,
            teklif_tutari: Number(f.teklif_tutari || 0),
            kazanan: Boolean(f.kazanan === 1)
          })
        }
      }

      const mapped: DosyaMuhteviyatItem[] = resDosyalar.data.map((r: any) => {
        const fileKalemler = kalemlerMap[r.id] || []
        const fileFirmalar = (firmalarMap[r.id] || []).map((f) => ({
          ...f,
          kazanan: f.kazanan || Boolean(r.firma_id && f.id === r.firma_id)
        }))

        const kazananFirma = fileFirmalar.find((f) => f.kazanan)
        const sozlesmeBedeli = kazananFirma ? kazananFirma.teklif_tutari : Number(r.net_odenen || 0)
        const yaklasikMaliyet =
          Number(r.yaklasik_maliyet) > 0
            ? Number(r.yaklasik_maliyet)
            : fileKalemler.reduce((acc, k) => acc + k.toplam_tutar, 0) || sozlesmeBedeli

        return {
          id: r.id,
          dosya_no: r.dosya_no,
          temin_no: r.temin_no,
          is_adi: r.is_adi,
          konu: r.konu,
          birim: r.birim,
          alim_turu: r.alim_turu,
          butce_yili: r.butce_yili ? String(r.butce_yili) : '2026',
          durum: r.durum,
          yaklasik_maliyet: yaklasikMaliyet,
          sozlesme_bedeli: sozlesmeBedeli,
          kalemler: fileKalemler,
          firmalar: fileFirmalar
        }
      })

      // Filtrele
      const filtered = mapped.filter((d) => {
        if (filters.seciliYil) {
          const dYil = String(d.butce_yili || '').trim()
          const sYil = String(filters.seciliYil).trim()
          if (dYil && sYil && dYil !== sYil) return false
        }
        if (filters.seciliBirim && filters.seciliBirim !== 'tumu') {
          const dBirim = (d.birim || '').toLowerCase().trim()
          const sBirim = filters.seciliBirim.toLowerCase().trim()
          if (dBirim !== sBirim && !dBirim.includes(sBirim) && !sBirim.includes(dBirim)) {
            return false
          }
        }
        if (filters.alimTuru && filters.alimTuru !== 'tumu') {
          const dTur = (d.alim_turu || '').toLowerCase().trim()
          const sTur = filters.alimTuru.toLowerCase().trim()
          if (dTur !== sTur) return false
        }
        return true
      })

      setDosyalar(filtered)
      if (filtered.length > 0) {
        setAcikDosyalar({ [filtered[0].id]: true })
      }
    } catch (err) {
      console.error('Dosya muhteviyat raporu çekilirken hata:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.seciliYil, filters.seciliBirim, filters.alimTuru])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMuhteviyatData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchMuhteviyatData])

  // Arama filtreli liste
  const goruntulenenDosyalar = dosyalar.filter((d) => {
    if (!searchTerm.trim()) return true
    const s = searchTerm.toLowerCase()
    const kalemMatch = d.kalemler.some((k) => k.kalem_adi.toLowerCase().includes(s))
    const firmaMatch = d.firmalar.some((f) => f.unvan.toLowerCase().includes(s))
    return (
      d.dosya_no.toLowerCase().includes(s) ||
      d.is_adi.toLowerCase().includes(s) ||
      (d.birim && d.birim.toLowerCase().includes(s)) ||
      kalemMatch ||
      firmaMatch
    )
  })

  const toggleDosya = (id: number): void => {
    setAcikDosyalar((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleExportCSV = (): void => {
    if (dosyalar.length === 0) return
    const headers = [
      'Dosya No',
      'İşin Adı / Konusu',
      'Birim',
      'Alım Türü',
      'Kalem Sayısı',
      'Kalem Detayları (Miktar - Birim - Ad)',
      'Teklif Veren Firmalar',
      'Kazanan Firma',
      'Yaklaşık Maliyet',
      'Sözleşme Bedeli',
      'Durum'
    ]

    const csvRows = dosyalar.map((d) => {
      const kalemlerStr = d.kalemler
        .map((k) => `${k.miktar} ${k.birim} ${k.kalem_adi}`)
        .join('; ')
      const firmalarStr = d.firmalar.map((f) => `${f.unvan} (${fmt(f.teklif_tutari)})`).join('; ')
      const kazanan = d.firmalar.find((f) => f.kazanan)?.unvan || '-'

      return [
        `"${d.dosya_no}"`,
        `"${d.is_adi.replace(/"/g, '""')}"`,
        `"${d.birim || '-'}"`,
        `"${d.alim_turu}"`,
        d.kalemler.length,
        `"${kalemlerStr.replace(/"/g, '""')}"`,
        `"${firmalarStr.replace(/"/g, '""')}"`,
        `"${kazanan.replace(/"/g, '""')}"`,
        d.yaklasik_maliyet.toFixed(2),
        d.sozlesme_bedeli.toFixed(2),
        `"${d.durum}"`
      ]
    })

    exportCsv(`Dosya_Muhteviyat_Raporu_${filters.seciliYil}.csv`, headers, csvRows)
  }

  const handlePrint = (): void => {
    window.print()
  }

  return (
    <div className="space-y-5">
      {/* Üst Başlık & Araç Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <span>Dosya Muhteviyat & Kalem Döküm Raporu (Hangi Dosyada Ne Var?)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Her bir temin dosyasının içeriğindeki malzeme/hizmet kalemleri, miktarları, teklif veren firmalar ve nihai sonuçları
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Dışa Aktar</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır / PDF</span>
          </button>
        </div>
      </div>

      {/* Arama Çubuğu */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Dosya no, işin adı, malzeme veya firma adı ile arayın..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium shadow-xs"
        />
      </div>

      {/* Yükleniyor / Boş Durum */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Layers className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-xs font-bold">Dosya muhteviyatları, kalemler ve firma teklifleri taranıyor...</p>
        </div>
      ) : goruntulenenDosyalar.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Filtreye Uygun Dosya Bulunamadı
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Arama kriterinize veya seçili bütçe yılına uygun dosya muhteviyatı bulunamadı.
          </p>
        </div>
      ) : (
        /* Dosya Muhteviyat Akordeon Kartları */
        <div className="space-y-4">
          {goruntulenenDosyalar.map((dosya) => {
            const isAcik = acikDosyalar[dosya.id] !== false
            const tasarruf = Math.max(0, dosya.yaklasik_maliyet - dosya.sozlesme_bedeli)
            const tasarrufPct =
              dosya.yaklasik_maliyet > 0
                ? Math.round((tasarruf / dosya.yaklasik_maliyet) * 100)
                : 0

            return (
              <div
                key={dosya.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all"
              >
                {/* Dosya Başlık Şeridi */}
                <div
                  onClick={() => toggleDosya(dosya.id)}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      {dosya.id}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {dosya.dosya_no}
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {dosya.birim}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {dosya.durum}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {dosya.alim_turu.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        {dosya.is_adi}
                      </h3>
                    </div>
                  </div>

                  {/* Sağ Finansal Metrikler ve Aç/Kapa */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Yaklaşık Maliyet
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {fmt(dosya.yaklasik_maliyet)}
                      </span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Sözleşme / Nihai
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {fmt(dosya.sozlesme_bedeli)}
                      </span>
                      {tasarruf > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          %{tasarrufPct} Tasarruf
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      {isAcik ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Açılır Muhteviyat Gövdesi */}
                {isAcik && (
                  <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20 space-y-5">
                    {/* 1. BÖLÜM: KALEMLER (MALZEME / HİZMET LİSTESİ) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-indigo-500" />
                          <span>İhtiyaç Kalemleri ({dosya.kalemler.length} Kalem)</span>
                        </h4>
                      </div>

                      {dosya.kalemler.length > 0 ? (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-850/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="py-2.5 px-3 w-12 text-center">#</th>
                                <th className="py-2.5 px-3">Malzeme / İş Kalemi</th>
                                <th className="py-2.5 px-3 text-center">Miktar</th>
                                <th className="py-2.5 px-3 text-center">Birim</th>
                                <th className="py-2.5 px-3 text-right">Yaklaşık Birim Fiyat</th>
                                <th className="py-2.5 px-3 text-right">Toplam Yaklaşık Tutar</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {dosya.kalemler.map((kalem, ki) => (
                                <tr
                                  key={kalem.id || ki}
                                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                                >
                                  <td className="py-2 px-3 text-center font-bold text-slate-400">
                                    {ki + 1}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                    {kalem.kalem_adi}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                    {kalem.miktar}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-500">
                                    {kalem.birim}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                    {fmt(kalem.yaklasik_birim_fiyat)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                                    {fmt(kalem.toplam_tutar)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-center text-xs text-slate-400">
                          Bu dosyada kayıtlı ayrıntılı malzeme kalemi bulunmuyor.
                        </div>
                      )}
                    </div>

                    {/* 2. BÖLÜM: FİRMALAR & TEKLİFLER */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-emerald-500" />
                          <span>Teklif Veren Tedarikçiler ({dosya.firmalar.length} İstekli)</span>
                        </h4>
                      </div>

                      {dosya.firmalar.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {dosya.firmalar.map((firma) => (
                            <div
                              key={firma.id}
                              className={cn(
                                'p-3 rounded-2xl border transition-all flex items-center justify-between gap-2',
                                firma.kazanan
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-xs'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                              )}
                            >
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  {firma.kazanan && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {firma.unvan}
                                  </span>
                                </div>
                                {firma.vergi_no && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                    VKN: {firma.vergi_no}
                                  </span>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs font-black text-slate-900 dark:text-white block">
                                  {fmt(firma.teklif_tutari)}
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md inline-block mt-0.5',
                                    firma.kazanan
                                      ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  )}
                                >
                                  {firma.kazanan ? 'Kazanan Yüklenici' : 'Teklif Verdi'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-center text-xs text-slate-400">
                          Kayıtlı istekli firma bilgisi bulunmuyor.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
