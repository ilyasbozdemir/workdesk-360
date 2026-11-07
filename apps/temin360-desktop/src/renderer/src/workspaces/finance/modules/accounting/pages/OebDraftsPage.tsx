import React, { useState } from 'react'
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
import { OebRecordItem } from '../../../types'

export const OebDraftsPage: React.FC<{
  onOpenMatbuOeb?: (oeb: OebRecordItem) => void
}> = ({ onOpenMatbuOeb }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDurum, setFilterDurum] = useState('all')

  const [oebList, setOebList] = useState<OebRecordItem[]>([
    {
      id: 'oeb-1',
      oebNo: '2026/ÖEB-042',
      dosyaId: 104,
      dosyaNo: '2026/DT-104',
      harcamaBirimi: 'Bilgi İşlem Dairesi Başkanlığı',
      hakSahibiAdi: 'Mega Bilişim ve İletişim Sis. San. Tic. Ltd. Şti.',
      hakSahibiVkn: '6140592817',
      hakSahibiIban: 'TR56 0006 2000 1234 5678 9012 34',
      brutTutar: 245000,
      damgaVergisi: 2322.6,
      kararPulu: 1394.05,
      kdvTevkifat: 14700,
      digerKesinti: 0,
      toplamKesinti: 18416.65,
      netOdenecekTutar: 226583.35,
      butceTertibi: '46.06.01.05 - 01.3.2.00 - 5 - 03.5.2.02',
      odemeTuru: 'Banka Havalesi / EFT',
      durum: 'harcama_yetkilisinde',
      tarih: '2026-03-05'
    },
    {
      id: 'oeb-2',
      oebNo: '2026/ÖEB-045',
      dosyaId: 112,
      dosyaNo: '2026/DT-112',
      harcamaBirimi: 'Destek Hizmetleri Dairesi Başkanlığı',
      hakSahibiAdi: 'Öz Ulaşım Otomotiv Sanayi Ltd. Şti.',
      hakSahibiVkn: '6820194833',
      hakSahibiIban: 'TR89 0006 4000 5555 4444 3333 22',
      brutTutar: 165000,
      damgaVergisi: 1564.2,
      kararPulu: 938.85,
      kdvTevkifat: 16500,
      digerKesinti: 0,
      toplamKesinti: 19003.05,
      netOdenecekTutar: 145996.95,
      butceTertibi: '46.06.01.05 - 01.3.1.00 - 5 - 03.7.1.01',
      odemeTuru: 'Hazine Hesabı / Banka',
      durum: 'taslak',
      tarih: '2026-03-03'
    },
    {
      id: 'oeb-3',
      oebNo: '2026/ÖEB-039',
      dosyaId: 115,
      dosyaNo: '2026/DT-115',
      harcamaBirimi: 'Mali Hizmetler Müdürlüğü',
      hakSahibiAdi: 'Ofisline Büro Gereçleri San. Tic. A.Ş.',
      hakSahibiVkn: '4820194821',
      hakSahibiIban: 'TR34 0001 0000 4444 8888 1234 56',
      brutTutar: 112000,
      damgaVergisi: 1061.76,
      kararPulu: 637.28,
      kdvTevkifat: 0,
      digerKesinti: 0,
      toplamKesinti: 1699.04,
      netOdenecekTutar: 110300.96,
      butceTertibi: '46.06.01.05 - 01.3.1.00 - 5 - 03.2.1.01',
      odemeTuru: 'Ziraat Bankası / EFT',
      durum: 'e_imzali',
      onaylayan: 'Harcama Yetkilisi (E-İmza)',
      tarih: '2026-02-28'
    }
  ])

  const filteredOeb = oebList.filter((o) => {
    const matchesSearch =
      o.oebNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.hakSahibiAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.hakSahibiVkn.includes(searchTerm)

    if (filterDurum === 'all') return matchesSearch
    return matchesSearch && o.durum === filterDurum
  })

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Receipt size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ödeme Emri Belgesi (ÖEB) Masası
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                5018 Sayılı Kanun Md. 31/33
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hazine ve Maliye Bakanlığı Muhasebat Genel Müdürlüğü resmî A4 Ödeme Emri formatında tahakkuk ve ödeme belgeleri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            Toplam Ödenecek Net:{' '}
            <span className="font-bold">
              {formatCurrency(oebList.reduce((acc, o) => acc + o.netOdenecekTutar, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Arama & Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ÖEB No, dosya no, alacaklı firma adı veya VKN ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'taslak', label: 'Taslaklar' },
            { id: 'harcama_yetkilisinde', label: 'İmza Bekleyen' },
            { id: 'e_imzali', label: 'E-İmzalı / Onaylı' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDurum(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterDurum === f.id
                  ? 'bg-emerald-600 text-white shadow-xs'
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">ÖEB No / Tarih</th>
                <th className="py-3 px-4">Dosya / Birim</th>
                <th className="py-3 px-4">Hak Sahibi / IBAN</th>
                <th className="py-3 px-4 text-right">Brüt Tutar</th>
                <th className="py-3 px-4 text-right">Toplam Kesinti</th>
                <th className="py-3 px-4 text-right">Net Ödenecek</th>
                <th className="py-3 px-4 text-center">Onay Durumu</th>
                <th className="py-3 px-4 text-center">Matbu Çıktı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredOeb.map((oeb) => (
                <tr key={oeb.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{oeb.oebNo}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{oeb.tarih}</div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-bold text-blue-600 dark:text-blue-400">{oeb.dosyaNo}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {oeb.harcamaBirimi}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px]">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={oeb.hakSahibiAdi}>
                      {oeb.hakSahibiAdi}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {oeb.hakSahibiIban}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatCurrency(oeb.brutTutar)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    -{formatCurrency(oeb.toplamKesinti)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(oeb.netOdenecekTutar)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        oeb.durum === 'e_imzali'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : oeb.durum === 'harcama_yetkilisinde'
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {oeb.durum === 'e_imzali' ? (
                        <>
                          <CheckCircle2 size={10} /> E-İmzalandı
                        </>
                      ) : oeb.durum === 'harcama_yetkilisinde' ? (
                        <>
                          <Clock size={10} /> Harcama Yetkilisinde
                        </>
                      ) : (
                        <>
                          <Clock size={10} /> Taslak Hazırlık
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onOpenMatbuOeb?.(oeb)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-2xs transition-colors"
                      title="Hazine ve Maliye Bakanlığı Standartlarında Resmî A4 Ödeme Emri Belgesi"
                    >
                      <Printer size={12} />
                      <span>Resmî ÖEB Yazdır</span>
                    </button>
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

