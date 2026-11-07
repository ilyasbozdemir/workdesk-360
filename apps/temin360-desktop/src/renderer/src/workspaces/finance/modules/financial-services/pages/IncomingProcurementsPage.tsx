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
  Check
} from 'lucide-react'
import { IncomingProcurementItem } from '../../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'

export const IncomingProcurementsPage: React.FC<{
  onSelectForOeb?: (item: IncomingProcurementItem) => void
  onSelectForMif?: (item: IncomingProcurementItem) => void
}> = ({ onSelectForOeb, onSelectForMif }) => {
  const { activeDosyaId } = useWorkspaceStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Satın Alma Masasından aktarılan veya sistemde mali inceleme bekleyen doğrudan temin dosyaları
  const [items, setItems] = useState<IncomingProcurementItem[]>([
    {
      id: 1,
      dosyaNo: '2026/DT-104',
      konu: 'Fen İşleri Hizmet Binası Güvenlik ve Ağ Donanımı Alımı',
      harcamaBirimi: 'Bilgi İşlem Dairesi Başkanlığı',
      aliciTur: 'mal',
      kazananFirma: 'Mega Bilişim ve İletişim Sis. San. Tic. Ltd. Şti.',
      kazananVergiNo: '6140592817',
      kazananIban: 'TR56 0006 2000 1234 5678 9012 34',
      brutTutar: 245000,
      damgaVergisi: 2322.6,
      kararPulu: 1394.05,
      kdvTevkifati: 14700,
      netOdenecek: 226583.35,
      butceTertibi: '46.06.01.05 - 01.3.2.00 - 5 - 03.5.2.02',
      mifDurumu: 'taslak',
      oebDurumu: 'taslak',
      tifDurumu: 'tamamlandi',
      tarih: '2026-03-05',
      oncelik: 'acil'
    },
    {
      id: 2,
      dosyaNo: '2026/DT-108',
      konu: 'Merkez Kütüphane ve Arşiv Süreli Yayın & Kitap Alımı',
      harcamaBirimi: 'Kültür ve Sosyal İşler Müdürlüğü',
      aliciTur: 'mal',
      kazananFirma: 'Kültür Kitap Kırtasiye Dağıtım A.Ş.',
      kazananVergiNo: '5930412890',
      kazananIban: 'TR12 0001 5000 9876 5432 1098 76',
      brutTutar: 88500,
      damgaVergisi: 838.98,
      kararPulu: 503.57,
      kdvTevkifati: 0,
      netOdenecek: 87157.45,
      butceTertibi: '46.06.01.05 - 01.3.1.00 - 5 - 03.2.1.02',
      mifDurumu: 'bekliyor',
      oebDurumu: 'hazirlanmadi',
      tifDurumu: 'tamamlandi',
      tarih: '2026-03-04',
      oncelik: 'normal'
    },
    {
      id: 3,
      dosyaNo: '2026/DT-112',
      konu: 'Hizmet Araçları Periyodik Bakım ve Onarım Hizmeti',
      harcamaBirimi: 'Destek Hizmetleri Dairesi Başkanlığı',
      aliciTur: 'hizmet',
      kazananFirma: 'Öz Ulaşım Otomotiv Sanayi Ltd. Şti.',
      kazananVergiNo: '6820194833',
      kazananIban: 'TR89 0006 4000 5555 4444 3333 22',
      brutTutar: 165000,
      damgaVergisi: 1564.2,
      kararPulu: 938.85,
      kdvTevkifati: 16500,
      netOdenecek: 145996.95,
      butceTertibi: '46.06.01.05 - 01.3.1.00 - 5 - 03.7.1.01',
      mifDurumu: 'taslak',
      oebDurumu: 'taslak',
      tifDurumu: 'gerekmiyor',
      tarih: '2026-03-02',
      oncelik: 'onemli'
    },
    {
      id: 4,
      dosyaNo: '2026/DT-115',
      konu: 'Harcama Birimleri 2026 Yılı Tüketim Kırtasiye Malzemesi',
      harcamaBirimi: 'Mali Hizmetler Müdürlüğü',
      aliciTur: 'mal',
      kazananFirma: 'Ofisline Büro Gereçleri San. Tic. A.Ş.',
      kazananVergiNo: '4820194821',
      kazananIban: 'TR34 0001 0000 4444 8888 1234 56',
      brutTutar: 112000,
      damgaVergisi: 1061.76,
      kararPulu: 637.28,
      kdvTevkifati: 0,
      netOdenecek: 110300.96,
      butceTertibi: '46.06.01.05 - 01.3.1.00 - 5 - 03.2.1.01',
      mifDurumu: 'onaylandi',
      oebDurumu: 'imza_bekliyor',
      tifDurumu: 'tamamlandi',
      tarih: '2026-02-28',
      oncelik: 'normal'
    }
  ])

  // Veritabanından mevcut aktif dosya varsa listeye yansıt
  useEffect(() => {
    if (activeDosyaId) {
      window.electron?.ipcRenderer
        ?.invoke('db:get', 'SELECT * FROM DATA_TeminDosyasi WHERE id = ?', [activeDosyaId])
        .then((row: any) => {
          if (row && !items.some((i) => i.id === row.id)) {
            const newItem: IncomingProcurementItem = {
              id: row.id,
              dosyaNo: row.temin_no || `2026/DT-${row.id}`,
              konu: row.konu || 'Aktif Doğrudan Temin Dosyası',
              harcamaBirimi: row.harcama_birimi || 'Destek Hizmetleri',
              aliciTur: row.tur || 'mal',
              kazananFirma: 'Seçili Teklif Sahibi',
              kazananVergiNo: '1111111111',
              kazananIban: 'TR11 0000 0000 0000 0000 0000 00',
              brutTutar: Number(row.yaklasik_maliyet) || 120000,
              damgaVergisi: (Number(row.yaklasik_maliyet) || 120000) * 0.00948,
              kararPulu: (Number(row.yaklasik_maliyet) || 120000) * 0.00569,
              kdvTevkifati: 0,
              netOdenecek: (Number(row.yaklasik_maliyet) || 120000) * (1 - 0.00948 - 0.00569),
              butceTertibi: '06.01.00.02 - 01.3.9.00 - 1 - 03.2.1.01',
              mifDurumu: 'bekliyor',
              oebDurumu: 'hazirlanmadi',
              tifDurumu: 'bekliyor',
              tarih: new Date().toISOString().split('T')[0],
              oncelik: 'onemli'
            }
            setItems((prev) => [newItem, ...prev])
          }
        })
        .catch(() => {})
    }
  }, [activeDosyaId])

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.konu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kazananFirma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.harcamaBirimi.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'bekleyen') return matchesSearch && item.oebDurumu === 'hazirlanmadi'
    if (filterStatus === 'taslak') return matchesSearch && item.oebDurumu === 'taslak'
    if (filterStatus === 'imza') return matchesSearch && item.oebDurumu === 'imza_bekliyor'
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FolderInput size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Satın Alma Masasından Gelen Dosyalar
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                4734 ➔ 5018 Entegrasyonu
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Teklif değerlendirmesi ve onay tutanağı tamamlanan, mali tahakkuk ve ödeme bekleyen doğrudan temin dosyaları.
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
            { id: 'bekleyen', label: 'ÖEB Bekleyenler' },
            { id: 'taslak', label: 'Taslak Hazırlananlar' },
            { id: 'imza', label: 'İmzaya Sevk Edilenler' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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
                <th className="py-3 px-4 text-center">TİF Durumu</th>
                <th className="py-3 px-4 text-center">ÖEB & MİF Durumu</th>
                <th className="py-3 px-4 text-center">Mali İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.map((item) => (
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
                    {item.tifDurumu === 'tamamlandi' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <Check size={10} /> TİF Alındı
                      </span>
                    ) : item.tifDurumu === 'gerekmiyor' ? (
                      <span className="text-[10px] text-slate-400 font-medium">Hizmet / Muaf</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Clock size={10} /> TİF Bekliyor
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.oebDurumu === 'imza_bekliyor'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                            : item.oebDurumu === 'taslak'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        ÖEB: {item.oebDurumu === 'imza_bekliyor' ? 'İmzada' : item.oebDurumu === 'taslak' ? 'Taslak' : 'Bekliyor'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        MİF: {item.mifDurumu}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onSelectForOeb?.(item)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs transition-colors"
                        title="Ödeme Emri Belgesi (ÖEB) Taslağı Oluştur"
                      >
                        <Receipt size={12} />
                        <span>ÖEB Üret</span>
                      </button>

                      <button
                        onClick={() => onSelectForMif?.(item)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                        title="Muhasebe İşlem Fişi (MİF) Kaydı"
                      >
                        <FileText size={12} />
                        <span>MİF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
