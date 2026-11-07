import React, { useState } from 'react'
import {
  ShieldCheck,
  Search,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileCheck
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { INITIAL_EMANET_LISTESI } from '@renderer/screens/bkmybs-mali-yonetim/bkmybsMockData'
import { EmanetTeminatKayit } from '@renderer/screens/bkmybs-mali-yonetim/types'

export const GuaranteesEscrowPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDurum, setFilterDurum] = useState('all')
  const [teminatList, setTeminatList] = useState<EmanetTeminatKayit[]>(INITIAL_EMANET_LISTESI)

  const filteredTeminat = teminatList.filter((t) => {
    const matchesSearch =
      t.mektupNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.istekliUnvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bankaAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterDurum === 'all') return matchesSearch
    return matchesSearch && t.iadeDurumu === filterDurum
  })

  return (
    <div className="space-y-6">
      {/* Üst Kart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Teminat Mektupları ve Emanetler Masası
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                4734 & 5018 Emanet Takibi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Geçici teminatlar, %6 kesin teminat mektupları, banka teyit yazıları ve 333 emanet hesap mahsupları.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            Toplam Teminat:{' '}
            <span className="font-bold">
              {formatCurrency(teminatList.reduce((acc, t) => acc + t.tutar, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Arama & Filtre */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Mektup no, banka adı, firma unvanı veya ihale no ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'aktif', label: 'Aktif Teminatlar' },
            { id: 'iade_surecinde', label: 'İade Sürecinde' },
            { id: 'iade_edildi', label: 'İade Edildi' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDurum(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterDurum === f.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teminat Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Dosya / Tür</th>
                <th className="py-3 px-4">Yüklenici İstekli</th>
                <th className="py-3 px-4">Banka & Mektup No</th>
                <th className="py-3 px-4 text-right">Teminat Tutarı</th>
                <th className="py-3 px-4">Vade Tarihi</th>
                <th className="py-3 px-4 text-center">Banka Teyidi</th>
                <th className="py-3 px-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTeminat.map((teminat) => (
                <tr key={teminat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{teminat.dosyaNo}</div>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mt-1 ${
                        teminat.teminatTuru === 'kesin'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                      }`}
                    >
                      %{teminat.teminatTuru === 'kesin' ? '6 Kesin' : '3 Geçici'} Teminat
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px]">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={teminat.istekliUnvan}>
                      {teminat.istekliUnvan}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-[180px]">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {teminat.bankaAdi}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{teminat.mektupNo}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatCurrency(teminat.tutar)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{teminat.vadeTarihi}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Süreç Devam Ediyor</div>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {teminat.teyitDurumu === 'teyit_edildi' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 size={10} /> Teyit Alındı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Clock size={10} /> Teyit Bekliyor
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        teminat.iadeDurumu === 'emanette'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : teminat.iadeDurumu === 'iade_edildi'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {teminat.iadeDurumu === 'emanette' ? 'Kasada / Emanette' : teminat.iadeDurumu === 'iade_edildi' ? 'İade Edildi' : 'Nakde Çevrilecek'}
                    </span>
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
