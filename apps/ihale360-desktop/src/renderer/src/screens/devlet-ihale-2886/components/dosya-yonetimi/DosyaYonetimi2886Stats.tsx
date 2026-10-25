import React from 'react'
import { Landmark, Gavel, Building2, ShieldCheck, TrendingUp } from 'lucide-react'
import { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'
import { formatMoney } from './dosyaYonetimi2886.utils'

interface DosyaYonetimi2886StatsProps {
  dosyalar: Dosya2886Item[]
}

export const DosyaYonetimi2886Stats: React.FC<DosyaYonetimi2886StatsProps> = ({ dosyalar }) => {
  const totalHacim = dosyalar.reduce((acc, d) => {
    const val = d.muhammenBedel?.takdirEdilenMuhammenBedel || d.muhammenBedel?.hesaplananBedel || 0
    return acc + val
  }, 0)

  const satisCount = dosyalar.filter((d) => d.islemTuru === 'satis').length
  const kiraCount = dosyalar.filter((d) => d.islemTuru === 'kiralama').length
  const hakCount = dosyalar.filter(
    (d) => d.islemTuru === 'irtifak_hakki' || d.islemTuru === 'irtifak' || d.islemTuru === 'trampa'
  ).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Toplam Dosya */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Toplam İhale</span>
          <div className="w-7 h-7 rounded-xl bg-purple-50 dark:purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-slate-800 dark:text-slate-100">
            {dosyalar.length}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">Dosya</span>
        </div>
      </div>

      {/* Satış Dosyaları */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Satış İhaleleri</span>
          <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Gavel className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-blue-600 dark:text-blue-400">{satisCount}</span>
          <span className="text-[10px] text-blue-500 font-semibold">Md. 35/36/45</span>
        </div>
      </div>

      {/* Kiralama Dosyaları */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Kiralama</span>
          <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">{kiraCount}</span>
          <span className="text-[10px] text-amber-500 font-semibold">Kira Takibi</span>
        </div>
      </div>

      {/* Hak Tesisi & Trampa */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase">İrtifak & Trampa</span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {hakCount}
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold">Ayni Hak</span>
        </div>
      </div>

      {/* Toplam Muhammen Bedel Hacmi */}
      <div className="bg-linear-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-3.5 rounded-2xl shadow-md col-span-2 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-indigo-200">
          <span className="text-[11px] font-bold uppercase">Toplam Muhammen Bedel</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 font-mono font-black text-base md:text-lg text-emerald-400 truncate">
          ₺{formatMoney(totalHacim)}
        </div>
      </div>
    </div>
  )
}
