import React from 'react'
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react'
import { AmbarHareket } from '../ambar.hooks'

interface AmbarHareketlerTabProps {
  filteredHareketler: AmbarHareket[]
  isLoadingHareketler: boolean
}

export const AmbarHareketlerTab: React.FC<AmbarHareketlerTabProps> = ({
  filteredHareketler,
  isLoadingHareketler
}) => {
  const getHareketBadge = (type: string): React.JSX.Element => {
    switch (type) {
      case 'giris':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ArrowDownLeft className="w-3 h-3" /> Giriş
          </span>
        )
      case 'cikis':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <ArrowUpRight className="w-3 h-3" /> Çıkış
          </span>
        )
      case 'zimmet':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            <ShieldCheck className="w-3 h-3" /> Zimmet
          </span>
        )
      case 'iade':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <RotateCcw className="w-3 h-3" /> İade
          </span>
        )
      case 'hasar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
            <AlertTriangle className="w-3 h-3" /> Hasar / Fire
          </span>
        )
      default:
        return <span className="text-slate-500">{type}</span>
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3">Tarih</th>
              <th className="p-3">Hareket Türü</th>
              <th className="p-3">Malzeme Adı</th>
              <th className="p-3">Ambar</th>
              <th className="p-3 text-right">Miktar</th>
              <th className="p-3">Teslim Alan / Eden</th>
              <th className="p-3">Belge / Fiş No</th>
              <th className="p-3">İlişkili Dosya</th>
              <th className="p-3 text-right">Tutar (₺)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {isLoadingHareketler ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                  Hareketler yükleniyor...
                </td>
              </tr>
            ) : filteredHareketler.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400">
                  Henüz stok hareketi veya zimmet kaydı bulunmuyor.
                </td>
              </tr>
            ) : (
              filteredHareketler.map((h) => (
                <tr
                  key={h.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-colors"
                >
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                    {h.islem_tarihi ? h.islem_tarihi.substring(0, 10) : '-'}
                  </td>
                  <td className="p-3">{getHareketBadge(h.hareket_turu)}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                    {h.kalem_adi}
                    {h.tasinir_kodu && (
                      <span className="block font-mono text-[10px] text-slate-400 font-normal">
                        {h.tasinir_kodu}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{h.ambar_adi}</td>
                  <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                    {h.miktar} {h.olcu_birimi}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    {h.kisi_veya_birim || '-'}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {h.belge_no || '-'}
                  </td>
                  <td className="p-3">
                    {h.dosya_no ? (
                      <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                        {h.dosya_no}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {(h.toplam_tutar || 0).toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    ₺
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
