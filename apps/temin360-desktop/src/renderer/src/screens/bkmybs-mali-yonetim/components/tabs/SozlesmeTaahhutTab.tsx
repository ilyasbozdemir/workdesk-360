import React, { useState } from 'react'
import { SozlesmeTaahhutKayit, KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { FileText, Search, CheckCircle, Clock } from 'lucide-react'

interface SozlesmeTaahhutTabProps {
  sozlesmeListesi: SozlesmeTaahhutKayit[]
  activeRole: KamuRole
}

export const SozlesmeTaahhutTab: React.FC<SozlesmeTaahhutTabProps> = ({
  sozlesmeListesi
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = sozlesmeListesi.filter(
    (s) =>
      s.yukleniciUnvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sozlesmeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dosyaNo.toLowerCase().includes(searchTerm.toLowerCase())
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
              placeholder="Yüklenici unvan, sözleşme no veya dosya no ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Toplam <strong>{filtered.length}</strong> harcama sözleşmesi & taahhüt kaydı listeleniyor
        </div>
      </div>

      {/* Sözleşme Tablosu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Sözleşme No & Dosya</th>
                <th className="py-3 px-4">Yüklenici Firma & VKN</th>
                <th className="py-3 px-4 text-center">Sözleşme Süresi</th>
                <th className="py-3 px-4 text-right">Sözleşme Bedeli</th>
                <th className="py-3 px-4 text-right">Damga Vergisi (Binde 9.48)</th>
                <th className="py-3 px-4 text-right">Ödenen Hakediş</th>
                <th className="py-3 px-4 text-right">Kalan Taahhüt</th>
                <th className="py-3 px-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Kayıtlı sözleşme veya harcama taahhüdü bulunmuyor.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-md">
                        Sözleşmeye bağlanan doğrudan temin ve ihale dosyaları sonuçlandığında taahhüt ve hakediş takibi burada re'sen listelenir.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                const progress = Math.min(100, (s.hakedisToplami / s.sozlesmeBedeli) * 100)

                return (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="font-extrabold text-blue-600 dark:text-blue-400">
                        {s.sozlesmeNo}
                      </div>
                      <div className="text-[10px] text-slate-400">{s.dosyaNo}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {s.yukleniciUnvan}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        VKN: {s.yukleniciVkn}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div>{s.sozlesmeTarihi}</div>
                      <div className="text-[10px] text-slate-400">Bitiş: {s.isBitisTarihi}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(s.sozlesmeBedeli)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {formatCurrency(s.damgaVergisiTutari)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.hakedisToplami)}
                      <div className="text-[10px] text-slate-400">%{progress.toFixed(0)} Harcandı</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-extrabold text-purple-600 dark:text-purple-400">
                      {formatCurrency(s.kalanTaahhut)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle size={10} />
                        {s.durum}
                      </span>
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

