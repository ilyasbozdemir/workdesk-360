import React from 'react'
import { FolderKanban, Plus, TrendingUp, Wallet, Clock, PieChart } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

interface SummaryMetrics {
  totalProjects: number
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  activeCount: number
  overallPercentage: number
}

interface ProjeHeaderAndKPIsProps {
  totalProjects: number
  summary: SummaryMetrics
  handleOpenCreate: () => void
}

export function ProjeHeaderAndKPIs({
  totalProjects,
  summary,
  handleOpenCreate
}: ProjeHeaderAndKPIsProps): React.JSX.Element {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Proje Yönetimi & Yatırım Takibi
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-semibold">
                {totalProjects} Proje
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Üst alım ve yatırım projelerini tanımlayın; harcama tutarları bağlı doğrudan temin /
              ihale dosyalarından otomatik türetilir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <Plus size={16} /> Yeni Proje Tanımla
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Bütçe */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tahsis Edilen Toplam Ödenek
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary.totalBudget > 0
                ? `${summary.totalBudget.toLocaleString('tr-TR')} ₺`
                : 'Belirtilmedi'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Toplam {summary.totalProjects} proje için planlanan ödenek
            </p>
          </div>
        </div>

        {/* Gerçekleşen Harcama */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Otomatik Gerçekleşen Harcama
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {summary.totalSpent.toLocaleString('tr-TR')} ₺
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                {summary.totalBudget > 0 ? `%${summary.overallPercentage}` : 'Bağlı Dosyalar'}
              </span>
              <span className="text-[11px] text-slate-400">dosya harcamaları toplamı</span>
            </div>
          </div>
        </div>

        {/* Kalan Fon */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Kalan Kullanılabilir Bütçe
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PieChart size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {summary.totalBudget > 0
                ? `${summary.totalRemaining.toLocaleString('tr-TR')} ₺`
                : 'Sınırsız / Esnek'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Henüz harcanmamış kullanılabilir ödenek
            </p>
          </div>
        </div>

        {/* Aktif Süreçler */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Aktif Süreçteki Projeler
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {summary.activeCount}{' '}
              <span className="text-sm font-normal text-slate-400">/ {summary.totalProjects}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Yürürlükteki aktif yatırım ve alımlar</p>
          </div>
        </div>
      </div>
    </>
  )
}
