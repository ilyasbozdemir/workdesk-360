import React from 'react'
import { Archive, Boxes, TrendingUp, ShieldCheck } from 'lucide-react'
import { Ambar, AmbarStok, AmbarHareket, TifKayit } from '../ambar.hooks'

interface AmbarMetricsProps {
  ambarlar: Ambar[]
  stoklar: AmbarStok[]
  hareketler: AmbarHareket[]
  tifler: TifKayit[]
}

export const AmbarMetrics: React.FC<AmbarMetricsProps> = ({
  ambarlar,
  stoklar,
  hareketler,
  tifler
}) => {
  const totalStockItems = stoklar.reduce((sum, s) => sum + (Number(s.toplam_miktar) || 0), 0)
  const totalStockValue = stoklar.reduce((sum, s) => sum + (Number(s.toplam_tutar) || 0), 0)
  const zimmetCount = hareketler.filter((h) => h.hareket_turu === 'zimmet').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Archive className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Tanımlı Ambarlar
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {ambarlar.length} Depo
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Stok Kalem Çeşidi / Adet
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {stoklar.length} Çeşit ({totalStockItems.toLocaleString('tr-TR')} Birim)
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Toplam Stok Değeri
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 font-mono">
            {totalStockValue.toLocaleString('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}{' '}
            ₺
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Aktif Zimmet &amp; TİF
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {zimmetCount} Zimmet / {tifler.length} TİF
          </div>
        </div>
      </div>
    </div>
  )
}
