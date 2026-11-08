import React, { useState } from 'react'
import { ButceTertip, KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { Plus, Search, CheckCircle, ShieldAlert, Coins } from 'lucide-react'

interface ButceOdenekTabProps {
  tertipler: ButceTertip[]
  onBlokeKoy?: (tertipId: string, tutar: number) => void
  activeRole: KamuRole
}

export const ButceOdenekTab: React.FC<ButceOdenekTabProps> = ({
  tertipler,
  activeRole
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEkonomik, setFilterEkonomik] = useState('all')

  const filtered = tertipler.filter((t) => {
    const matchesSearch =
      t.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ekonomikKod.includes(searchTerm) ||
      t.kurumsalKod.includes(searchTerm)
    const matchesEko = filterEkonomik === 'all' || t.ekonomikKod.startsWith(filterEkonomik)
    return matchesSearch && matchesEko
  })

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
              placeholder="Tertip açıklaması, ekonomik veya kurumsal kod ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={filterEkonomik}
            onChange={(e) => setFilterEkonomik(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Ekonomik Kodlar</option>
            <option value="03.2">03.2 Tüketime Yönelik Mal</option>
            <option value="03.5">03.5 Hizmet Alımları</option>
            <option value="03.7">03.7 Menkul Mal Bakım/Alım</option>
            <option value="03.8">03.8 Gayrimenkul Onarım</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Toplam <strong>{filtered.length}</strong> analitik bütçe tertibi listeleniyor
        </div>
      </div>

      {/* Tertip Tablosu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Kurumsal / Fonk. / Fin.</th>
                <th className="py-3 px-4">Ekonomik Kod & Açıklama</th>
                <th className="py-3 px-4 text-right">Başlangıç Ödeneği</th>
                <th className="py-3 px-4 text-right">Gerçekleşen Harcama</th>
                <th className="py-3 px-4 text-right">Bloke / Taahhüt</th>
                <th className="py-3 px-4 text-right">Kullanılabilir Ödenek</th>
                <th className="py-3 px-4 text-center">Ödenek Doluluk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Coins className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {searchTerm || filterEkonomik !== 'all'
                          ? 'Arama kriterlerine uygun bütçe tertibi bulunamadı.'
                          : 'Kayıtlı bütçe tertibi veya bloke işlemi bulunmuyor.'}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-md">
                        Satın alma masasında doğrudan temin dosyası açılıp yaklaşık maliyet veya onay belgesi hazırlandığında, tutarlar ilgili bütçe tertibine re'sen bloke / taahhüt olarak yansıyacaktır.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                const totalUsed = t.harcananTutar + t.blokeEdilenTutar
                const usedPercent = Math.min(100, (totalUsed / t.baslangicOdenegi) * 100)
                const isCritical = usedPercent > 85

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {t.kurumsalKod}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Fonk: {t.fonksiyonelKod} | Fin: {t.finansmanKod}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/40">
                          {t.ekonomikKod}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {t.aciklama}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(t.baslangicOdenegi)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatCurrency(t.harcananTutar)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {formatCurrency(t.blokeEdilenTutar)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">
                      {formatCurrency(t.kullanilabilirOdenek)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="w-28 mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>%{usedPercent.toFixed(0)}</span>
                          {isCritical && (
                            <span className="text-rose-500 flex items-center gap-0.5">
                              <ShieldAlert size={10} /> Kritik
                            </span>
                          )}
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCritical ? 'bg-rose-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${usedPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

