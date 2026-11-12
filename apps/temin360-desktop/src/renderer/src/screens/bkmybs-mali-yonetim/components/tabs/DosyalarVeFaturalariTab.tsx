import React, { useState, useEffect } from 'react'
import {
  FolderOpen,
  Receipt,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Banknote
} from 'lucide-react'
import { KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'

// ─── Tipler ────────────────────────────────────────────────────────────────

interface FaturaKayit {
  id: number
  faturaNo: string
  faturaTarihi: string
  firmaTutar: number       // brüt fatura tutarı
  kdvOrani: number
  odemeYontemi: string | null
  durum: 'beklemede' | 'odendi' | 'iptal'
}

interface DosyaOzet {
  id: number
  dosyaNo: string
  dosyaKonusu: string
  alimTuru: string
  toplamBedel: number
  kazananFirmaUnvani: string | null
  kazananFirmaVkn: string | null
  olusturmaTarihi: string
  faturalar: FaturaKayit[]
}

interface DosyalarVeFaturalariTabProps {
  activeRole: KamuRole
}

// ─── Durum Badge ────────────────────────────────────────────────────────────

function FaturaDurumBadge({ durum }: { durum: FaturaKayit['durum'] }) {
  if (durum === 'odendi') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
        <CheckCircle size={9} /> Ödendi
      </span>
    )
  }
  if (durum === 'iptal') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
        <AlertCircle size={9} /> İptal
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
      <Clock size={9} /> Beklemede
    </span>
  )
}

function AlimTuruBadge({ turu }: { turu: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    mal: { label: 'Mal Alımı', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
    hizmet: { label: 'Hizmet', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
    danismanlik: { label: 'Danışmanlık', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' },
    yapim: { label: 'Yapım İşi', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' },
    yapim_isi: { label: 'Yapım İşi', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' }
  }
  const info = map[turu?.toLowerCase()] ?? { label: turu || 'Belirsiz', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${info.cls}`}>
      {info.label}
    </span>
  )
}

// ─── Veri Yükleme ───────────────────────────────────────────────────────────

async function loadDosyalarVeFaturalar(): Promise<DosyaOzet[]> {
  if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return []

  try {
    // 5018 kapsamındaki tamamlanmış / aktif temin dosyaları
    const dosyaRes: Array<{
      id: number
      dosya_no: string
      dosya_konusu: string
      alim_turu: string
      toplam_bedel: number | null
      kazanan_firma_unvani: string | null
      kazanan_firma_vkn: string | null
      olusturma_tarihi: string
    }> = await window.electron.ipcRenderer.invoke(
      'db:query',
      `SELECT
         d.id,
         d.dosya_no,
         d.dosya_konusu,
         COALESCE(d.alim_turu, 'mal') AS alim_turu,
         d.toplam_bedel,
         f.firma_unvani   AS kazanan_firma_unvani,
         f.firma_vkn      AS kazanan_firma_vkn,
         d.olusturma_tarihi
       FROM DATA_TeminDosyasi d
       LEFT JOIN DATA_TeminFirma f
         ON f.temin_dosya_id = d.id AND f.id = (
           SELECT id FROM DATA_TeminFirma
           WHERE temin_dosya_id = d.id
           ORDER BY teklif_tutari ASC LIMIT 1
         )
       ORDER BY d.olusturma_tarihi DESC
       LIMIT 200`
    )

    if (!Array.isArray(dosyaRes) || dosyaRes.length === 0) return []

    // Fatura verisi: DATA_TeminFatura tablosundan (varsa) veya DATA_TeminBelgeSnapshot'tan türetilir
    const faturaRes: Array<{
      id: number
      temin_dosya_id: number
      fatura_no: string
      fatura_tarihi: string
      fatura_tutari: number | null
      kdv_orani: number | null
      odeme_yontemi: string | null
      durum: string | null
    }> = await window.electron.ipcRenderer.invoke(
      'db:query',
      `SELECT
         id,
         temin_dosya_id,
         COALESCE(fatura_no, 'Belirtilmemiş') AS fatura_no,
         COALESCE(fatura_tarihi, '')           AS fatura_tarihi,
         fatura_tutari,
         COALESCE(kdv_orani, 0)               AS kdv_orani,
         odeme_yontemi,
         durum
       FROM DATA_TeminFatura
       ORDER BY fatura_tarihi DESC`
    ).catch(() => [] as typeof faturaRes)   // Tablo henüz yoksa sessiz dön

    // dosya_id → fatura listesi haritası
    const faturaMap = new Map<number, FaturaKayit[]>()
    for (const f of faturaRes) {
      const list = faturaMap.get(f.temin_dosya_id) ?? []
      list.push({
        id: f.id,
        faturaNo: f.fatura_no,
        faturaTarihi: f.fatura_tarihi,
        firmaTutar: f.fatura_tutari ?? 0,
        kdvOrani: f.kdv_orani ?? 0,
        odemeYontemi: f.odeme_yontemi,
        durum: (f.durum === 'odendi' || f.durum === 'iptal') ? f.durum : 'beklemede'
      })
      faturaMap.set(f.temin_dosya_id, list)
    }

    return dosyaRes.map((d) => ({
      id: d.id,
      dosyaNo: d.dosya_no,
      dosyaKonusu: d.dosya_konusu,
      alimTuru: d.alim_turu,
      toplamBedel: d.toplam_bedel ?? 0,
      kazananFirmaUnvani: d.kazanan_firma_unvani,
      kazananFirmaVkn: d.kazanan_firma_vkn,
      olusturmaTarihi: d.olusturma_tarihi,
      faturalar: faturaMap.get(d.id) ?? []
    }))
  } catch (err) {
    console.warn('[DosyalarVeFaturalariTab] Veri yüklenemedi:', err instanceof Error ? err.message : String(err))
    return []
  }
}

// ─── Ana Bileşen ────────────────────────────────────────────────────────────

export const DosyalarVeFaturalariTab: React.FC<DosyalarVeFaturalariTabProps> = ({ activeRole: _activeRole }) => {
  const [dosyalar, setDosyalar] = useState<DosyaOzet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [alimFilter, setAlimFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    loadDosyalarVeFaturalar()
      .then((data) => { if (isMounted) { setDosyalar(data); setLoading(false) } })
      .catch(() => { if (isMounted) setLoading(false) })

    const handleRefresh = () => {
      loadDosyalarVeFaturalar().then((data) => { if (isMounted) setDosyalar(data) }).catch(() => { /* noop */ })
    }
    window.addEventListener('app:db-changed', handleRefresh)
    window.addEventListener('focus', handleRefresh)
    return () => {
      isMounted = false
      window.removeEventListener('app:db-changed', handleRefresh)
      window.removeEventListener('focus', handleRefresh)
    }
  }, [])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = dosyalar.filter((d) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      d.dosyaNo.toLowerCase().includes(q) ||
      d.dosyaKonusu.toLowerCase().includes(q) ||
      (d.kazananFirmaUnvani ?? '').toLowerCase().includes(q) ||
      (d.kazananFirmaVkn ?? '').includes(q)
    const matchesAlim = alimFilter === 'all' || d.alimTuru === alimFilter
    return matchesSearch && matchesAlim
  })

  // Özet sayımlar
  const toplamFatura = dosyalar.reduce((s, d) => s + d.faturalar.length, 0)
  const bekleyenFatura = dosyalar.reduce((s, d) => s + d.faturalar.filter((f) => f.durum === 'beklemede').length, 0)
  const toplamBedel = dosyalar.reduce((s, d) => s + d.toplamBedel, 0)

  return (
    <div className="space-y-4">
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Toplam Dosya</span>
            <FolderOpen size={14} className="text-blue-500" />
          </div>
          <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{dosyalar.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5018 kapsamında</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Toplam Fatura</span>
            <Receipt size={14} className="text-emerald-500" />
          </div>
          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{toplamFatura}</div>
          <div className="text-[10px] text-amber-500 font-bold mt-0.5">{bekleyenFatura} Beklemede</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Toplam Harcama Bedeli</span>
            <Banknote size={14} className="text-indigo-500" />
          </div>
          <div className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(toplamBedel)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tüm dosyaların yaklaşık maliyeti / onay tutarı</div>
        </div>
      </div>

      {/* Filtre Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Dosya no, konu, firma unvanı veya VKN ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
            />
          </div>
          <select
            value={alimFilter}
            onChange={(e) => setAlimFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Alım Türleri</option>
            <option value="mal">Mal Alımı</option>
            <option value="hizmet">Hizmet Alımı</option>
            <option value="danismanlik">Danışmanlık</option>
            <option value="yapim">Yapım İşi</option>
          </select>
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Toplam <strong>{filtered.length}</strong> dosya listeleniyor
        </div>
      </div>

      {/* Dosya Listesi (Genişletilebilir) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            Veriler yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Kayıtlı dosya bulunamadı.</p>
            <p className="text-[11px] text-slate-400 max-w-sm text-center">
              Doğrudan Temin masasında dosya oluşturulduğunda burada otomatik listelenecektir.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.map((dosya) => {
              const isOpen = expanded.has(dosya.id)
              const faturaVar = dosya.faturalar.length > 0
              return (
                <div key={dosya.id}>
                  {/* Dosya Satırı */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(dosya.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
                  >
                    <span className="text-slate-400">
                      {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </span>

                    <FolderOpen size={15} className="text-blue-500 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          {dosya.dosyaNo || `#${dosya.id}`}
                        </span>
                        <AlimTuruBadge turu={dosya.alimTuru} />
                        {dosya.faturalar.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Receipt size={9} />
                            {dosya.faturalar.length} Fatura
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold truncate mt-0.5">
                        {dosya.dosyaKonusu || '—'}
                      </div>
                      {dosya.kazananFirmaUnvani && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          Firma: {dosya.kazananFirmaUnvani}
                          {dosya.kazananFirmaVkn ? ` (VKN: ${dosya.kazananFirmaVkn})` : ''}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200">
                        {dosya.toplamBedel > 0 ? formatCurrency(dosya.toplamBedel) : '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {dosya.olusturmaTarihi ? dosya.olusturmaTarihi.slice(0, 10) : ''}
                      </div>
                    </div>
                  </button>

                  {/* Fatura Alt Tablosu */}
                  {isOpen && (
                    <div className="bg-slate-50/60 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 px-10 py-3">
                      {!faturaVar ? (
                        <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
                          <FileText size={14} />
                          <span>Bu dosyaya ait kayıtlı fatura bulunmuyor.</span>
                          <span className="text-[10px] text-slate-400">
                            (Faturaları <strong>DATA_TeminFatura</strong> tablosundan yönetebilirsiniz.)
                          </span>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="py-2 pr-4">Fatura No</th>
                              <th className="py-2 pr-4">Tarih</th>
                              <th className="py-2 pr-4 text-right">Brüt Tutar</th>
                              <th className="py-2 pr-4 text-center">KDV %</th>
                              <th className="py-2 pr-4">Ödeme Yöntemi</th>
                              <th className="py-2 pr-4 text-center">Durum</th>
                              <th className="py-2 text-center">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium text-slate-700 dark:text-slate-300">
                            {dosya.faturalar.map((f) => (
                              <tr key={f.id} className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2 pr-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {f.faturaNo}
                                </td>
                                <td className="py-2 pr-4 text-slate-500">
                                  {f.faturaTarihi ? f.faturaTarihi.slice(0, 10) : '—'}
                                </td>
                                <td className="py-2 pr-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(f.firmaTutar)}
                                </td>
                                <td className="py-2 pr-4 text-center text-slate-500">
                                  %{f.kdvOrani}
                                </td>
                                <td className="py-2 pr-4 text-slate-500">
                                  {f.odemeYontemi || '—'}
                                </td>
                                <td className="py-2 pr-4 text-center">
                                  <FaturaDurumBadge durum={f.durum} />
                                </td>
                                <td className="py-2 text-center">
                                  <button
                                    type="button"
                                    title="Fatura belgesini aç"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition-all cursor-pointer shadow-xs text-[10px]"
                                  >
                                    <ExternalLink size={10} />
                                    Görüntüle
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

