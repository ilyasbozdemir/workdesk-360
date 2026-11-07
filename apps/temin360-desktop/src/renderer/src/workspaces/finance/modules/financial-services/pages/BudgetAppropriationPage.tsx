import React, { useState } from 'react'
import {
  Coins,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Layers,
  Sparkles,
  PieChart,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { INITIAL_BUTCE_TERTIPLERI } from '@renderer/screens/bkmybs-mali-yonetim/bkmybsMockData'
import { ButceTertip } from '@renderer/screens/bkmybs-mali-yonetim/types'

export const BudgetAppropriationPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEko, setFilterEko] = useState('all')
  const [tertipler, setTertipler] = useState<ButceTertip[]>(INITIAL_BUTCE_TERTIPLERI)

  const filteredTertipler = tertipler.filter((t) => {
    const matchesSearch =
      t.ekonomikKod.includes(searchTerm) ||
      t.kurumsalKod.includes(searchTerm) ||
      t.aciklama.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterEko === 'all') return matchesSearch
    return matchesSearch && t.ekonomikKod.startsWith(filterEko)
  })

  const toplamBaslangic = tertipler.reduce((sum, t) => sum + t.baslangicOdenegi, 0)
  const toplamHarcanan = tertipler.reduce((sum, t) => sum + t.harcananTutar, 0)
  const toplamBloke = tertipler.reduce((sum, t) => sum + t.blokeEdilenTutar, 0)
  const toplamSerbest = tertipler.reduce((sum, t) => sum + t.kullanilabilirOdenek, 0)

  return (
    <div className="space-y-6">
      {/* 4 Ana Ödenek KPI Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Toplam Başlangıç Ödeneği</span>
            <Coins size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatCurrency(toplamBaslangic)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">2026 Mali Yılı Bütçesi</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Gerçekleşen Harcama</span>
            <ArrowUpRight size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(toplamHarcanan)}
          </div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">
            %{((toplamHarcanan / toplamBaslangic) * 100).toFixed(1)} Nakit Çıkışı
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Bloke Edilen Ödenek</span>
            <Lock size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrency(toplamBloke)}
          </div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-1">
            Devam eden satın almalar için rezerve
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Kullanılabilir Serbest Ödenek</span>
            <PieChart size={16} className="text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {formatCurrency(toplamSerbest)}
          </div>
          <div className="text-[11px] text-purple-600/80 font-medium mt-1">
            %{((toplamSerbest / toplamBaslangic) * 100).toFixed(1)} Kalan Harcanabilir Limit
          </div>
        </div>
      </div>

      {/* Arama & Hızlı Filtre */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tertip kodu (03.2...), kurumsal kod veya harcama açıklaması ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tüm Kodlar' },
            { id: '03.2', label: '03.2 Tüketime Yönelik' },
            { id: '03.5', label: '03.5 Hizmet Alımları' },
            { id: '03.7', label: '03.7 Menkul Mal Alımları' },
            { id: '06.1', label: '06.1 Yatırım & Yapım' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterEko(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterEko === f.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bütçe Tertipleri Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Analitik Bütçe Tertibi</th>
                <th className="py-3 px-4">Tertip Açıklaması</th>
                <th className="py-3 px-4 text-right">Başlangıç Ödeneği</th>
                <th className="py-3 px-4 text-right">Harcanan</th>
                <th className="py-3 px-4 text-right">Bloke Edilen</th>
                <th className="py-3 px-4 text-right">Kullanılabilir Serbest</th>
                <th className="py-3 px-4 text-center">Ödenek Doluluk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTertipler.map((tertip) => {
                const dolulukOrani = (
                  ((tertip.harcananTutar + tertip.blokeEdilenTutar) / tertip.baslangicOdenegi) *
                  100
                ).toFixed(1)
                const dolulukNum = Number(dolulukOrani)

                return (
                  <tr
                    key={tertip.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {tertip.kurumsalKod} - {tertip.fonksiyonelKod} - {tertip.finansmanKod} -{' '}
                        <span className="text-emerald-600 dark:text-emerald-400">{tertip.ekonomikKod}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Mali Yıl: {tertip.yil}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={tertip.aciklama}>
                        {tertip.aciklama}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatCurrency(tertip.baslangicOdenegi)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(tertip.harcananTutar)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {formatCurrency(tertip.blokeEdilenTutar)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {formatCurrency(tertip.kullanilabilirOdenek)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              dolulukNum > 90
                                ? 'bg-rose-500'
                                : dolulukNum > 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, dolulukNum)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 w-9 text-right">
                          %{dolulukOrani}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
