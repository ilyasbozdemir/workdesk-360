import React, { useState, useEffect } from 'react'
import {
  Coins,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Lock,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BookOpen
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { loadRealBkmybsData } from '@renderer/services/finance/bkmybsDataService'

export interface RealTertipItem {
  id: string | number
  kurumsalKod: string
  fonksiyonelKod: string
  finansmanKod: string
  ekonomikKod: string
  aciklama: string
  baslangicOdenegi: number
  harcananTutar: number
  blokeEdilenTutar: number
  kullanilabilirOdenek: number
  yil: number
}

export const BudgetAppropriationPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEko, setFilterEko] = useState('all')
  const [tertipler, setTertipler] = useState<RealTertipItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadBudgetData = async () => {
    try {
      setLoading(true)
      const realData = await loadRealBkmybsData()
      if (realData && realData.tertipler.length > 0) {
        setTertipler(realData.tertipler)
      } else {
        setTertipler([])
      }
    } catch (err) {
      console.error('Bütçe verileri yüklenirken hata:', err)
      setTertipler([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgetData()
  }, [])

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
            {toplamBaslangic > 0
              ? `%${((toplamHarcanan / toplamBaslangic) * 100).toFixed(1)} Nakit Çıkışı`
              : 'Aktif harcama'}
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
            {toplamBaslangic > 0
              ? `%${((toplamSerbest / toplamBaslangic) * 100).toFixed(1)} Kalan Harcanabilir Limit`
              : 'Serbest ödenek'}
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
            placeholder="Tertip kodu (03.2.1.01) veya açıklama ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tüm Kodlar' },
            { id: '03.2', label: '03.2 Tüketim' },
            { id: '03.5', label: '03.5 Hizmet' },
            { id: '03.7', label: '03.7 Menkul Mal' },
            { id: '03.8', label: '03.8 Gayrimenkul Bakım' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterEko(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterEko === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tertip Tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Bütçe tertipleri yükleniyor...</div>
        ) : filteredTertipler.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Coins size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Henüz Bütçe Tertibi Bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Satın alma dosyalarındaki bütçe kodları ve tanımlanan bütçe ödenekleri burada gerçek zamanlı izlenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ekonomik Kod</th>
                  <th className="py-3 px-4">Bütçe Tertibi Açıklaması</th>
                  <th className="py-3 px-4 text-right">Başlangıç Ödeneği</th>
                  <th className="py-3 px-4 text-right">Harcanan</th>
                  <th className="py-3 px-4 text-right">Bloke Edilen</th>
                  <th className="py-3 px-4 text-right">Kullanılabilir Ödenek</th>
                  <th className="py-3 px-4 text-center">Doluluk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTertipler.map((t) => {
                  const oran =
                    t.baslangicOdenegi > 0
                      ? Math.min(100, ((t.harcananTutar + t.blokeEdilenTutar) / t.baslangicOdenegi) * 100)
                      : 0

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {t.ekonomikKod}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={t.aciklama}>
                          {t.aciklama}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {t.kurumsalKod} - {t.fonksiyonelKod} - {t.finansmanKod}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatCurrency(t.baslangicOdenegi)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(t.harcananTutar)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {formatCurrency(t.blokeEdilenTutar)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-purple-600 dark:text-purple-400 whitespace-nowrap">
                        {formatCurrency(t.kullanilabilirOdenek)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                oran > 90 ? 'bg-rose-500' : oran > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${oran}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                            %{oran.toFixed(0)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
