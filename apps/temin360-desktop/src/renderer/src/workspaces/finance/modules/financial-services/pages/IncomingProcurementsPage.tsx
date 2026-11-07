import React, { useState, useEffect } from 'react'
import {
  FolderInput,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calculator,
  FileText,
  AlertCircle,
  Building,
  DollarSign,
  Receipt,
  Search,
  Filter,
  Check,
  Printer,
  ShieldCheck,
  X,
  CreditCard,
  MessageSquare
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { useGlobalDocumentPreviewStore } from '@renderer/store/globalDocumentPreviewStore'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

export interface RealProcurementItem {
  id: number
  dosyaNo: string
  konu: string
  harcamaBirimi: string
  aliciTur: string
  kazananFirma: string
  kazananVergiNo: string
  kazananIban: string
  brutTutar: number
  damgaVergisi: number
  kararPulu: number
  kdvTevkifati: number
  netOdenecek: number
  butceTertibi: string
  durumAsamaId: number | null
  status: string | null
  tarih: string
  notlar: string
}

export const IncomingProcurementsPage: React.FC = () => {
  const { activeDosyaId } = useWorkspaceStore()
  const { setActiveWorkspace } = useWorkspaceContextStore()
  const [items, setItems] = useState<RealProcurementItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Seçili dosya için Mali İnceleme, Fatura & Ödeme Modalı
  const [selectedItem, setSelectedItem] = useState<RealProcurementItem | null>(null)
  const [faturaNo, setFaturaNo] = useState('')
  const [faturaTarihi, setFaturaTarihi] = useState(() => new Date().toISOString().split('T')[0])
  const [faturaTutar, setFaturaTutar] = useState<number>(0)
  const [damgaVergisi, setDamgaVergisi] = useState<number>(0)
  const [kararPulu, setKararPulu] = useState<number>(0)
  const [kdvTevkifat, setKdvTevkifat] = useState<number>(0)
  const [maliYorum, setMaliYorum] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Gerçek veritabanı sorgusu (Asla sahte mock veri yok)
  const loadProcurements = async () => {
    try {
      setLoading(true)
      const res = await window.electron?.ipcRenderer?.invoke(
        'db:query',
        `SELECT 
          d.id,
          COALESCE(d.temin_no, '#' || d.id) as dosyaNo,
          COALESCE(d.konu, 'Doğrudan Temin Dosyası') as konu,
          COALESCE(d.harcama_birimi, b.ad, 'Harcama Birimi') as harcamaBirimi,
          COALESCE(d.tur, 'mal') as aliciTur,
          COALESCE(f.unvan, 'Yüklenici Belirlenmedi') as kazananFirma,
          COALESCE(f.vergi_no, '-') as kazananVergiNo,
          COALESCE(f.hesap_no, '-') as kazananIban,
          COALESCE(d.yaklasik_maliyet, 0) as brutTutar,
          COALESCE(d.kesinti_damga, 0) as damgaVergisi,
          COALESCE(d.kesinti_karar_pulu, 0) as kararPulu,
          COALESCE(d.kesinti_kdv_tevkifat, 0) as kdvTevkifati,
          COALESCE(d.net_odenen, 0) as netOdenecek,
          COALESCE(d.butce_kodu, '03.2.1.01') as butceTertibi,
          d.durum_asama_id as durumAsamaId,
          d.status,
          COALESCE(d.temin_tarihi, SUBSTR(d.created_at, 1, 10), DATE('now')) as tarih,
          COALESCE(d.notlar, '') as notlar
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
        LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
        WHERE d.is_deleted = 0
        ORDER BY d.id DESC`
      )

      if (res && Array.isArray(res)) {
        const mapped: RealProcurementItem[] = res.map((r: any) => {
          const brut = Number(r.brutTutar) || 0
          const dv = Number(r.damgaVergisi) > 0 ? Number(r.damgaVergisi) : brut * 0.00948
          const kp = Number(r.kararPulu) > 0 ? Number(r.kararPulu) : brut * 0.00569
          const kt = Number(r.kdvTevkifati) || 0
          const net = Number(r.netOdenecek) > 0 ? Number(r.netOdenecek) : brut - dv - kp - kt

          return {
            id: r.id,
            dosyaNo: r.dosyaNo,
            konu: r.konu,
            harcamaBirimi: r.harcamaBirimi,
            aliciTur: r.aliciTur,
            kazananFirma: r.kazananFirma,
            kazananVergiNo: r.kazananVergiNo,
            kazananIban: r.kazananIban,
            brutTutar: brut,
            damgaVergisi: dv,
            kararPulu: kp,
            kdvTevkifati: kt,
            netOdenecek: net,
            butceTertibi: r.butceTertibi,
            durumAsamaId: r.durumAsamaId,
            status: r.status,
            tarih: r.tarih,
            notlar: r.notlar
          }
        })
        setItems(mapped)
      } else {
        setItems([])
      }
    } catch (err) {
      console.error('Dosyalar yüklenirken hata oluştu:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProcurements()
  }, [activeDosyaId])

  // İnceleme modalını aç
  const handleOpenReview = (item: RealProcurementItem) => {
    setSelectedItem(item)
    const brut = item.brutTutar || 0
    setFaturaNo(`FAT-${item.dosyaNo.replace(/[^0-9A-Z]/gi, '')}`)
    setFaturaTarihi(new Date().toISOString().split('T')[0])
    setFaturaTutar(brut)
    setDamgaVergisi(item.damgaVergisi > 0 ? item.damgaVergisi : brut * 0.00948)
    setKararPulu(item.kararPulu > 0 ? item.kararPulu : brut * 0.00569)
    setKdvTevkifat(item.kdvTevkifati || 0)
    setMaliYorum(
      '5018 sayılı Kanun m. 31/33 uyarınca harcama yetkilisi talimatı, muayene kabul belgesi ve fatura tetkik edilmiş olup ödenek tertibinden ödenmesi uygundur.'
    )
  }

  // Fatura tutarı değiştikçe yasal kesintileri otomatik güncelle
  const handleFaturaTutarChange = (val: number) => {
    setFaturaTutar(val)
    setDamgaVergisi(val * 0.00948)
    setKararPulu(val * 0.00569)
  }

  const calculatedNet = Math.max(0, faturaTutar - damgaVergisi - kararPulu - kdvTevkifat)

  // Resmî A4 ÖEB / Ödeme Yazısı Şablonunu Aç (Gerçek Document Engine)
  const handleOpenOfficialDocument = (docId: string = 'odeme-yazisi') => {
    if (!selectedItem) return
    useGlobalDocumentPreviewStore.getState().openDocument({
      documentId: docId,
      dosyaId: selectedItem.id,
      documentTitle: `Ödeme Gönderme Müzekkeresi — ${selectedItem.dosyaNo}`
    })
    setActiveWorkspace('procurement')
  }

  // Re'sen Ödeme Onayı ve 4734'e Yansıtma
  const handleConfirmPayment = async () => {
    if (!selectedItem) return
    setIsSubmitting(true)
    try {
      const auditNote = `[MALİ HİZMETLER & MUHASEBE VİZESİ]: Fatura No: ${faturaNo || '-'}, Tarih: ${faturaTarihi}, Brüt: ${formatCurrency(faturaTutar)}, Net Ödenen: ${formatCurrency(calculatedNet)} TL. İnceleme Görüşü: ${maliYorum}`
      const newNotlar = selectedItem.notlar ? `${selectedItem.notlar}\n\n${auditNote}` : auditNote

      await window.electron?.ipcRenderer?.invoke(
        'db:query',
        `UPDATE DATA_TeminDosyasi 
         SET status = 'tamamlandi',
             durum_asama_id = 4,
             net_odenen = ?,
             kesinti_damga = ?,
             kesinti_karar_pulu = ?,
             kesinti_kdv_tevkifat = ?,
             notlar = ?
         WHERE id = ?`,
        [calculatedNet, damgaVergisi, kararPulu, kdvTevkifat, newNotlar, selectedItem.id]
      )

      setSuccessToast(
        `Dosya ${selectedItem.dosyaNo} için fatura ve ödeme işlemi onaylandı! Satın Alma Masasındaki (4734) süreç re'sen tamamlandı olarak güncellendi.`
      )
      setSelectedItem(null)
      await loadProcurements()
    } catch (err) {
      console.error('Ödeme işlemi kaydedilirken hata:', err)
      alert('Ödeme kaydedilirken bir hata meydana geldi.')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSuccessToast(null), 6000)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.konu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kazananFirma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.harcamaBirimi.toLowerCase().includes(searchTerm.toLowerCase())

    const isPaid = item.status === 'tamamlandi' || item.status === 'ODENDI'
    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'odendi') return matchesSearch && isPaid
    if (filterStatus === 'bekleyen') return matchesSearch && !isPaid
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Toast Bildirimi */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:bg-emerald-200/50 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Üst Bilgi Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FolderInput size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Satın Alma Masasından Gelen Dosyalar (4734 ➔ 5018)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Canlı Veritabanı
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Teklif değerlendirmesi ve kabul süreci tamamlanan, mali tahakkuk, fatura girişi ve ödeme bekleyen doğrudan temin dosyaları.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
            Toplam: <span className="font-bold text-blue-600 dark:text-blue-400">{items.length} Dosya</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            {formatCurrency(items.reduce((acc, i) => acc + i.brutTutar, 0))}
          </div>
        </div>
      </div>

      {/* Arama & Filtre Çubuğu */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Dosya no, konu, firma adı veya harcama birimi ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'bekleyen', label: 'Ödeme Bekleyenler' },
            { id: 'odendi', label: 'Ödenenler / Tamamlananlar' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dosyalar Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Veritabanından dosyalar yükleniyor...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FolderInput size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Henüz Mali İnceleme Bekleyen Dosya Bulunmuyor
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Satın Alma Masasından (4734) oluşturulan veya teklif değerlendirmesi yapılan doğrudan temin dosyaları burada otomatik olarak listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Dosya / Tarih</th>
                  <th className="py-3 px-4">İhale Konusu / Birim</th>
                  <th className="py-3 px-4">Yüklenici Firma</th>
                  <th className="py-3 px-4 text-right">Brüt Tutar</th>
                  <th className="py-3 px-4 text-right">Kesintiler (DV+KP)</th>
                  <th className="py-3 px-4 text-right">Net Ödenecek</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-center">Mali İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredItems.map((item) => {
                  const isPaid = item.status === 'tamamlandi' || item.status === 'ODENDI'
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-blue-600 dark:text-blue-400">{item.dosyaNo}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> {item.tarih}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.konu}>
                          {item.konu}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
                          <Building size={10} /> {item.harcamaBirimi}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={item.kazananFirma}>
                          {item.kazananFirma}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">VKN: {item.kazananVergiNo}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatCurrency(item.brutTutar)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          -{formatCurrency(item.damgaVergisi + item.kararPulu + item.kdvTevkifati)}
                        </span>
                        <div className="text-[9px] text-slate-400">
                          DV: {formatCurrency(item.damgaVergisi)} | KP: {formatCurrency(item.kararPulu)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(item.netOdenecek)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Ödendi / Tamamlandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Clock size={11} /> Ödeme Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReview(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors mx-auto cursor-pointer"
                          title="Fatura Bilgisi Gir, Kesintileri Hesapla ve Ödemeyi Onayla"
                        >
                          <Receipt size={13} />
                          <span>Mali İnceleme & Ödeme</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5018 MALİ İNCELEME, FATURA VE ÖDEME MASASI MODALI */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Mali Hizmetler & Muhasebe İnceleme Masası</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                      {selectedItem.dosyaNo}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    5018 sayılı Kanun kapsamında fatura girişi, yasal vergi tevkifatı ve re&apos;sen ödeme onayı
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {/* Dosya Künyesi Bilgi Kartı */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">İhale / Temin Konusu:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedItem.konu}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/40">
                  <div>
                    <strong>Harcama Birimi:</strong> {selectedItem.harcamaBirimi}
                  </div>
                  <div>
                    <strong>Bütçe Tertibi:</strong> {selectedItem.butceTertibi}
                  </div>
                  <div>
                    <strong>Hak Sahibi Firma:</strong> {selectedItem.kazananFirma}
                  </div>
                  <div>
                    <strong>VKN / TCKN:</strong> {selectedItem.kazananVergiNo} | <strong>IBAN:</strong> {selectedItem.kazananIban}
                  </div>
                </div>
              </div>

              {/* Fatura Bilgileri Girişi */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-blue-500" />
                  <span>1. Fatura ve Hak Ediş Bilgileri</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Fatura Seri & No:
                    </label>
                    <input
                      type="text"
                      value={faturaNo}
                      onChange={(e) => setFaturaNo(e.target.value)}
                      placeholder="GIB2026000000123"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Fatura / Evrak Tarihi:
                    </label>
                    <input
                      type="date"
                      value={faturaTarihi}
                      onChange={(e) => setFaturaTarihi(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Fatura Brüt Tutarı (TL):
                    </label>
                    <input
                      type="number"
                      value={faturaTutar}
                      onChange={(e) => handleFaturaTutarChange(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Yasal Vergi & Kesintiler Cetveli */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator size={14} className="text-emerald-500" />
                  <span>2. Yasal Vergi ve Kesinti Dağılımı</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Damga Vergisi (‰ 9,48):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={damgaVergisi}
                      onChange={(e) => setDamgaVergisi(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-rose-600 dark:text-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Karar Pulu (‰ 5,69):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={kararPulu}
                      onChange={(e) => setKararPulu(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-rose-600 dark:text-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      KDV Tevkifatı (Varsa):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={kdvTevkifat}
                      onChange={(e) => setKdvTevkifat(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-rose-600 dark:text-rose-400"
                    />
                  </div>
                </div>

                {/* Net Hesap Özeti */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs">
                  <div>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Hak Sahibine Ödenecek Net Tutar:</span>
                    <div className="text-[10px] text-slate-400">
                      Brüt ({formatCurrency(faturaTutar)}) - Kesintiler ({formatCurrency(damgaVergisi + kararPulu + kdvTevkifat)})
                    </div>
                  </div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(calculatedNet)}
                  </div>
                </div>
              </div>

              {/* Mali Hizmetler & Muhasebe Şerh / İnceleme Yorumu */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-purple-500" />
                  <span>3. Mali Hizmetler ve Muhasebe Yetkilisi İnceleme / Vize Görüşü</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Dosyanın ödenek uygunluğu, fatura doğrulaması ve 5018 kontrol notunu buraya ekleyin:
                </p>
                <textarea
                  rows={3}
                  value={maliYorum}
                  onChange={(e) => setMaliYorum(e.target.value)}
                  placeholder="İnceleme notu, varsa şerh veya onay açıklaması..."
                  className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {/* Resmî Şablon Motorunu Açan Buton (Template Tabanlı) */}
                <button
                  type="button"
                  onClick={() => handleOpenOfficialDocument('odeme-yazisi')}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sistemin Gerçek A4 Ödeme Belgesi Şablonunu Aç"
                >
                  <Printer size={14} />
                  <span>Resmî ÖEB / Ödeme Yazısı Aç (A4)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>

                {/* Re'sen Ödeme Onay Butonu */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>{isSubmitting ? 'İşleniyor...' : "Ödemeyi Onayla ve Re'sen Tamamla"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
