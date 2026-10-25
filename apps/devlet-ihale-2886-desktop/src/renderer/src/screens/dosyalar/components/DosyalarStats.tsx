import React from 'react'
import { FileText, CheckCircle2, Clock, DollarSign } from 'lucide-react'

export function DosyalarStats({
  totalCount,
  aktifCount,
  taslakCount,
  toplamMaliyet,
  formatMoney
}: {
  totalCount: number
  aktifCount: number
  taslakCount: number
  toplamMaliyet: number
  formatMoney: (val: number) => string
}) {
  return (
    <div className="flex-none grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-medium">Toplam Dosya</p>
          <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">
            {totalCount}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-medium">Aktif</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
            {aktifCount}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <Clock size={16} className="text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-medium">Taslak</p>
          <p className="text-lg font-black text-slate-600 dark:text-slate-300 leading-tight">
            {taslakCount}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
          <DollarSign size={16} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-medium">Toplam Yaklaşık Maliyet</p>
          <p className="text-sm font-black text-green-600 dark:text-green-400 leading-tight">
            ₺ {formatMoney(toplamMaliyet)}
          </p>
        </div>
      </div>
    </div>
  )
}
