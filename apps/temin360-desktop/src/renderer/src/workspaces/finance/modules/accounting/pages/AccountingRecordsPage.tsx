import React, { useState } from 'react'
import {
  BookMarked,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Filter,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { AccountingRecordItem } from '../../../types'

export const AccountingRecordsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const [records] = useState<AccountingRecordItem[]>([
    {
      id: 'rec-1',
      yevmiyeNo: '2026/YEV-184',
      tarih: '2026-03-05',
      mifNo: '2026/MİF-088',
      hesapKodu: '630.03.02.01',
      hesapAdi: 'Kırtasiye ve Büro Malzemesi Alımları',
      borc: 45000,
      alacak: 0,
      aciklama: 'Büro sarf malzemesi doğrudan temin alımı gider tahakkuku',
      durum: 'kesinlesti'
    },
    {
      id: 'rec-2',
      yevmiyeNo: '2026/YEV-184',
      tarih: '2026-03-05',
      mifNo: '2026/MİF-088',
      hesapKodu: '360.01.01',
      hesapAdi: 'Damga Vergisi Kesintisi (Binde 9,48)',
      borc: 0,
      alacak: 426.6,
      aciklama: 'Sözleşme damga vergisi kesintisi',
      durum: 'kesinlesti'
    },
    {
      id: 'rec-3',
      yevmiyeNo: '2026/YEV-184',
      tarih: '2026-03-05',
      mifNo: '2026/MİF-088',
      hesapKodu: '103.02.01',
      hesapAdi: 'Verilen Çekler ve Gönderme Emirleri Hesabı (Banka)',
      borc: 0,
      alacak: 44573.4,
      aciklama: 'Hak sahibi firmaya banka gönderme emri ile net ödeme',
      durum: 'kesinlesti'
    },
    {
      id: 'rec-4',
      yevmiyeNo: '2026/YEV-185 (Taslak)',
      tarih: '2026-03-04',
      mifNo: '2026/MİF-091',
      hesapKodu: '630.03.05.02',
      hesapAdi: 'Bilgisayar Yazılım Alımları ve Lisans Giderleri',
      borc: 120000,
      alacak: 0,
      aciklama: 'Hizmet binası güvenlik ve ağ donanımı alımı',
      durum: 'taslak'
    },
    {
      id: 'rec-5',
      yevmiyeNo: '2026/YEV-185 (Taslak)',
      tarih: '2026-03-04',
      mifNo: '2026/MİF-091',
      hesapKodu: '360.02.01',
      hesapAdi: 'Tevkif Edilen KDV Hesabı (5/10)',
      borc: 0,
      alacak: 12000,
      aciklama: 'Vergi dairesine aktarılmak üzere 5/10 KDV tevkifatı',
      durum: 'taslak'
    },
    {
      id: 'rec-6',
      yevmiyeNo: '2026/YEV-185 (Taslak)',
      tarih: '2026-03-04',
      mifNo: '2026/MİF-091',
      hesapKodu: '103.02.01',
      hesapAdi: 'Verilen Çekler ve Gönderme Emirleri Hesabı',
      borc: 0,
      alacak: 108000,
      aciklama: 'Yüklenici firmaya net ödeme emri taslağı',
      durum: 'taslak'
    }
  ])

  const filteredRecords = records.filter(
    (r) =>
      r.hesapKodu.includes(searchTerm) ||
      r.hesapAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.yevmiyeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mifNo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toplamBorc = filteredRecords.reduce((sum, r) => sum + r.borc, 0)
  const toplamAlacak = filteredRecords.reduce((sum, r) => sum + r.alacak, 0)

  return (
    <div className="space-y-6">
      {/* Üst Kart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookMarked size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Yevmiye Defteri ve Muhasebe Kayıt Hazırlığı
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                Merkezi Yönetim Hesap Planı
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Çift taraflı kayıt sistemi uyarınca borç ve alacak hesapları denkliği (Borç = Alacak).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs">
            Borç Denkliği: {formatCurrency(toplamBorc)} = {formatCurrency(toplamAlacak)}
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Hesap kodu (630..., 103...), hesap adı, yevmiye no veya MİF ara..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Yevmiye Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Yevmiye / Tarih</th>
                <th className="py-3 px-4">MİF No</th>
                <th className="py-3 px-4">Hesap Kodu & Adı</th>
                <th className="py-3 px-4">Kayıt Açıklaması</th>
                <th className="py-3 px-4 text-right">Borç (₺)</th>
                <th className="py-3 px-4 text-right">Alacak (₺)</th>
                <th className="py-3 px-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{rec.yevmiyeNo}</div>
                    <div className="text-[10px] text-slate-400">{rec.tarih}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                    {rec.mifNo}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400 mr-2">
                      {rec.hesapKodu}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{rec.hesapAdi}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={rec.aciklama}>
                    {rec.aciklama}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {rec.borc > 0 ? formatCurrency(rec.borc) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {rec.alacak > 0 ? formatCurrency(rec.alacak) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.durum === 'kesinlesti'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {rec.durum === 'kesinlesti' ? 'Yevmiyeleşti' : 'Taslak Kayıt'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right uppercase text-[11px] text-slate-500">
                  Toplam Denk Kayıt:
                </td>
                <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black">
                  {formatCurrency(toplamBorc)}
                </td>
                <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-black">
                  {formatCurrency(toplamAlacak)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

