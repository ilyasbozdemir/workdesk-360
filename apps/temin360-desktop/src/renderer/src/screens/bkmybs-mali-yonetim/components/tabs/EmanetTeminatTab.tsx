import React, { useState } from 'react'
import { EmanetTeminatKayit, KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { Lock, Search, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

interface EmanetTeminatTabProps {
  emanetListesi: EmanetTeminatKayit[]
  activeRole: KamuRole
}

export const EmanetTeminatTab: React.FC<EmanetTeminatTabProps> = ({
  emanetListesi
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = emanetListesi.filter(
    (e) =>
      e.istekliUnvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.mektupNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.bankaAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Filtre ve Arama Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İstekli unvan, banka adı, mektup no veya dosya no ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Toplam <strong>{filtered.length}</strong> emanet / teminat mektubu kaydı listeleniyor
        </div>
      </div>

      {/* Emanet ve Teminat Tablosu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Dosya No & Tarih</th>
                <th className="py-3 px-4">İstekli / Yüklenici</th>
                <th className="py-3 px-4">Banka & Mektup No</th>
                <th className="py-3 px-4 text-center">Teminat Türü</th>
                <th className="py-3 px-4 text-right">Teminat Tutarı</th>
                <th className="py-3 px-4 text-center">Vade Tarihi</th>
                <th className="py-3 px-4 text-center">Banka Teyit</th>
                <th className="py-3 px-4 text-center">İade Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono">
                    <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                      {e.dosyaNo}
                    </div>
                    <div className="text-[10px] text-slate-400">{e.alinisTarihi}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {e.istekliUnvan}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">VKN: {e.istekliVkn}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {e.bankaAdi}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{e.mektupNo}</div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                      {e.teminatTuru === 'kesin' ? '%6 Kesin Teminat' : 'Geçici Teminat'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(e.tutar)}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                    {e.vadeTarihi}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      Teyitli
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        e.iadeDurumu === 'emanette'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}
                    >
                      {e.iadeDurumu === 'emanette' ? 'Emanette Tutuluyor' : 'İade Edildi'}
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

