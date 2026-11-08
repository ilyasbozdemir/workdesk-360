import React, { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Building,
  ShieldCheck
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { useGlobalDocumentPreviewStore } from '@renderer/store/globalDocumentPreviewStore'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

export interface RealMifItem {
  id: string
  mifNo: string
  dosyaId: number
  dosyaNo: string
  tarih: string
  aciklama: string
  alacakliUnvan: string
  alacakliVkn: string
  alacakliIban: string
  butceTertibi: string
  brutTutar: number
  damgaVergisi: number
  kararPulu: number
  kdvTevkifat: number
  netOdenecekTutar: number
  durum: string
  hazirlayan: string
}

export const MifDraftsPage: React.FC = () => {
  const { setActiveWorkspace } = useWorkspaceContextStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDurum, setFilterDurum] = useState('all')
  const [mifList, setMifList] = useState<RealMifItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadMifs = async () => {
    try {
      setLoading(true)
      const res = window.api?.accounting?.getMifDrafts
        ? await window.api.accounting.getMifDrafts()
        : await window.electron?.ipcRenderer?.invoke('accounting:get-mif-drafts')

      if (res && Array.isArray(res)) {
        const mapped: RealMifItem[] = res.map((r: any) => {
          const brut = Number(r.brutTutar) || 0
          const dv = Number(r.damgaVergisi) > 0 ? Number(r.damgaVergisi) : brut * 0.00948
          const kp = Number(r.kararPulu) > 0 ? Number(r.kararPulu) : brut * 0.00569
          const kt = Number(r.kdvTevkifat) || 0
          const net = Number(r.netOdenecekTutar) > 0 ? Number(r.netOdenecekTutar) : brut - dv - kp - kt
          const isPaid = r.status === 'tamamlandi' || r.status === 'ODENDI'

          return {
            id: `mif-${r.dosyaId}`,
            mifNo: `2026/MİF-${String(r.dosyaId).padStart(3, '0')}`,
            dosyaId: r.dosyaId,
            dosyaNo: r.dosyaNo,
            tarih: r.tarih,
            aciklama: `${r.dosyaNo} Sayılı Doğrudan Temin Hak Sahibi Ödemesi (${r.konu})`,
            alacakliUnvan: r.alacakliUnvan,
            alacakliVkn: r.alacakliVkn,
            alacakliIban: r.alacakliIban,
            butceTertibi: r.butceTertibi,
            brutTutar: brut,
            damgaVergisi: dv,
            kararPulu: kp,
            kdvTevkifat: kt,
            netOdenecekTutar: net,
            durum: isPaid ? 'onaylandi' : 'taslak',
            hazirlayan: 'Mali Hizmetler & Bütçe Mutemedi'
          }
        })
        setMifList(mapped)
      } else {
        setMifList([])
      }
    } catch (err) {
      console.error('MİF kayıtları yüklenirken hata:', err)
      setMifList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMifs()
  }, [])

  const handlePrintOfficialMif = (item: RealMifItem) => {
    useGlobalDocumentPreviewStore.getState().openDocument({
      documentId: 'odeme-yazisi',
      dosyaId: item.dosyaId,
      documentTitle: `Muhasebe İşlem Fişi & Ödeme Yazısı — ${item.dosyaNo}`
    })
    setActiveWorkspace('procurement')
  }

  const filteredMif = mifList.filter((m) => {
    const matchesSearch =
      m.mifNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.alacakliUnvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.alacakliVkn.includes(searchTerm)

    if (filterDurum === 'all') return matchesSearch
    return matchesSearch && m.durum === filterDurum
  })

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Muhasebe İşlem Fişi (MİF) Masası
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                5018 Muhasebat GM Formatı
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Harcama birimlerinden aktarılan tahakkuk fişleri, borç/alacak hesap bağlamaları ve resmî MİF dökümleri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Toplam MİF: <span className="font-bold text-blue-600 dark:text-blue-400">{mifList.length} Fiş</span>
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
            placeholder="MİF No, açıklama, alacaklı unvanı veya vergi kimlik no ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tüm MİF Kayıtları' },
            { id: 'taslak', label: 'Taslaklar' },
            { id: 'onaylandi', label: 'Onaylanan / Ödenenler' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDurum(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterDurum === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* MİF Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">MİF kayıtları yükleniyor...</div>
        ) : filteredMif.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Henüz MİF Kaydı Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Satın alma dosyaları üzerinden tahakkuk yapıldığında muhasebe işlem fişleri burada listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">MİF No / Tarih</th>
                  <th className="py-3 px-4">İşlem Açıklaması</th>
                  <th className="py-3 px-4">Alacaklı Firma</th>
                  <th className="py-3 px-4">Bütçe Tertibi</th>
                  <th className="py-3 px-4 text-right">Brüt Tutar</th>
                  <th className="py-3 px-4 text-right">Net Ödenen</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-center">Resmî Belge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMif.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-blue-600 dark:text-blue-400">{item.mifNo}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {item.tarih}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.aciklama}>
                        {item.aciklama}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dosya: {item.dosyaNo}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={item.alacakliUnvan}>
                        {item.alacakliUnvan}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">VKN: {item.alacakliVkn}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {item.butceTertibi}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatCurrency(item.brutTutar)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(item.netOdenecekTutar)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.durum === 'onaylandi' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Muhasebeleştirildi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock size={11} /> Taslak Fiş
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handlePrintOfficialMif(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center gap-1.5 shadow-2xs transition-colors mx-auto cursor-pointer"
                        title="Sistemin Gerçek A4 Belge Şablonunu Aç"
                      >
                        <Printer size={13} />
                        <span>Resmî MİF Aç (A4)</span>
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
