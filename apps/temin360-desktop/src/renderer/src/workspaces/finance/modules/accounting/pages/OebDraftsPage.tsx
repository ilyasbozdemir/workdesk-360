import React, { useState, useEffect } from 'react'
import {
  Receipt,
  Search,
  Printer,
  FileCheck,
  CheckCircle2,
  Clock,
  Eye,
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { useGlobalDocumentPreviewStore } from '@renderer/store/globalDocumentPreviewStore'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

export interface RealOebItem {
  id: string
  oebNo: string
  dosyaId: number
  dosyaNo: string
  harcamaBirimi: string
  hakSahibiAdi: string
  hakSahibiVkn: string
  hakSahibiIban: string
  brutTutar: number
  damgaVergisi: number
  kararPulu: number
  kdvTevkifat: number
  toplamKesinti: number
  netOdenecekTutar: number
  butceTertibi: string
  odemeTuru: string
  durum: string
  tarih: string
}

export const OebDraftsPage: React.FC = () => {
  const { setActiveWorkspace } = useWorkspaceContextStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDurum, setFilterDurum] = useState('all')
  const [oebList, setOebList] = useState<RealOebItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadOebs = async () => {
    try {
      setLoading(true)
      const res = await window.electron?.ipcRenderer?.invoke(
        'db:query',
        `SELECT 
          d.id as dosyaId,
          COALESCE(d.temin_no, '#' || d.id) as dosyaNo,
          COALESCE(d.harcama_birimi, b.ad, 'Harcama Birimi') as harcamaBirimi,
          COALESCE(f.unvan, 'Yüklenici Belirlenmedi') as hakSahibiAdi,
          COALESCE(f.vergi_no, '-') as hakSahibiVkn,
          COALESCE(f.iban, '-') as hakSahibiIban,
          COALESCE(d.yaklasik_maliyet, 0) as brutTutar,
          COALESCE(d.kesinti_damga, 0) as damgaVergisi,
          COALESCE(d.kesinti_karar_pulu, 0) as kararPulu,
          COALESCE(d.kesinti_kdv_tevkifat, 0) as kdvTevkifat,
          COALESCE(d.net_odenen, 0) as netOdenecekTutar,
          COALESCE(d.butce_kodu, '03.2.1.01') as butceTertibi,
          d.status,
          COALESCE(d.temin_tarihi, SUBSTR(d.created_at, 1, 10), DATE('now')) as tarih
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
        LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
        WHERE d.is_deleted = 0
        ORDER BY d.id DESC`
      )

      if (res && Array.isArray(res)) {
        const mapped: RealOebItem[] = res.map((r: any) => {
          const brut = Number(r.brutTutar) || 0
          const dv = Number(r.damgaVergisi) > 0 ? Number(r.damgaVergisi) : brut * 0.00948
          const kp = Number(r.kararPulu) > 0 ? Number(r.kararPulu) : brut * 0.00569
          const kt = Number(r.kdvTevkifat) || 0
          const net = Number(r.netOdenecekTutar) > 0 ? Number(r.netOdenecekTutar) : brut - dv - kp - kt
          const isPaid = r.status === 'tamamlandi' || r.status === 'ODENDI'

          return {
            id: `oeb-${r.dosyaId}`,
            oebNo: `2026/ÖEB-${String(r.dosyaId).padStart(3, '0')}`,
            dosyaId: r.dosyaId,
            dosyaNo: r.dosyaNo,
            harcamaBirimi: r.harcamaBirimi,
            hakSahibiAdi: r.hakSahibiAdi,
            hakSahibiVkn: r.hakSahibiVkn,
            hakSahibiIban: r.hakSahibiIban,
            brutTutar: brut,
            damgaVergisi: dv,
            kararPulu: kp,
            kdvTevkifat: kt,
            toplamKesinti: dv + kp + kt,
            netOdenecekTutar: net,
            butceTertibi: r.butceTertibi,
            odemeTuru: 'Hazine Hesabı / Banka',
            durum: isPaid ? 'odendi' : 'taslak',
            tarih: r.tarih
          }
        })
        setOebList(mapped)
      } else {
        setOebList([])
      }
    } catch (err) {
      console.error('ÖEB listesi çekilirken hata:', err)
      setOebList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOebs()
  }, [])

  // Resmî A4 Şablonu ile Aç (Template Tabanlı)
  const handlePrintOfficialOeb = (item: RealOebItem) => {
    useGlobalDocumentPreviewStore.getState().openDocument({
      documentId: 'odeme-yazisi',
      dosyaId: item.dosyaId,
      documentTitle: `Ödeme Emri Belgesi — ${item.dosyaNo}`
    })
    setActiveWorkspace('procurement')
  }

  const filteredList = oebList.filter((item) => {
    const matchesSearch =
      item.oebNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hakSahibiAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.harcamaBirimi.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterDurum === 'all') return matchesSearch
    return matchesSearch && item.durum === filterDurum
  })

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Receipt size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ödeme Emri Belgesi (ÖEB) Masası
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                5018 Sayılı Kanun m. 31/33
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Harcama yetkilisi ve gerçekleştirme görevlisi onaylı tahakkuk ödeme emirleri ve resmî A4 çıktıları.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Toplam ÖEB: <span className="font-bold text-purple-600 dark:text-purple-400">{oebList.length} Belge</span>
          </div>
        </div>
      </div>

      {/* Arama & Durum Filtreleri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ÖEB No, dosya no, alacaklı adı veya harcama birimi ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tüm Belgeler' },
            { id: 'taslak', label: 'Ödeme Bekleyenler' },
            { id: 'odendi', label: 'Ödenenler / Onaylananlar' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDurum(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterDurum === f.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ÖEB Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">ÖEB kayıtları yükleniyor...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Henüz ÖEB Kaydı Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Satın alma dosyaları mali incelemeye sevk edildiğinde ÖEB taslakları burada listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">ÖEB No / Tarih</th>
                  <th className="py-3 px-4">İlgili Dosya & Birim</th>
                  <th className="py-3 px-4">Hak Sahibi / VKN</th>
                  <th className="py-3 px-4 text-right">Brüt Tutar</th>
                  <th className="py-3 px-4 text-right">Yasal Kesintiler</th>
                  <th className="py-3 px-4 text-right">Net Ödenecek</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-center">Resmî Belge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-purple-600 dark:text-purple-400">{item.oebNo}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {item.tarih}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.dosyaNo}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
                        <Building2 size={10} /> {item.harcamaBirimi}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={item.hakSahibiAdi}>
                        {item.hakSahibiAdi}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">VKN: {item.hakSahibiVkn}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatCurrency(item.brutTutar)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        -{formatCurrency(item.toplamKesinti)}
                      </span>
                      <div className="text-[9px] text-slate-400">DV: {formatCurrency(item.damgaVergisi)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(item.netOdenecekTutar)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.durum === 'odendi' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Ödendi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          <Clock size={11} /> Ödeme Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handlePrintOfficialOeb(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center gap-1.5 shadow-2xs transition-colors mx-auto cursor-pointer"
                        title="Sistemin Gerçek A4 Ödeme Belgesi Şablonunu Aç"
                      >
                        <Printer size={13} />
                        <span>Resmî ÖEB Aç (A4)</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
