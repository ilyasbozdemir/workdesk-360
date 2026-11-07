import React, { useState } from 'react'
import { TkysZimmetKayit, KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { Boxes, UserCheck, Search, ShieldCheck, CheckCircle } from 'lucide-react'

interface TkysZimmetTabProps {
  tkysListesi: TkysZimmetKayit[]
  onZimmetKaydet?: (id: string, personel: string, oda: string) => void
  activeRole: KamuRole
}

export const TkysZimmetTab: React.FC<TkysZimmetTabProps> = ({
  tkysListesi
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = tkysListesi.filter(
    (t) =>
      t.malzemeAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tifNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tasinirKodu.includes(searchTerm) ||
      (t.zimmetliPersonel && t.zimmetliPersonel.toLowerCase().includes(searchTerm.toLowerCase()))
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
              placeholder="Malzeme adı, TİF No, taşınır kodu veya personel ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Toplam <strong>{filtered.length}</strong> TKYS Taşınır & TİF kaydı listeleniyor
        </div>
      </div>

      {/* Taşınır Tablosu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">TİF No & Tarih</th>
                <th className="py-3 px-4">Taşınır Kodu & Malzeme Adı</th>
                <th className="py-3 px-4 text-center">Miktar / Birim</th>
                <th className="py-3 px-4 text-right">Birim Fiyat</th>
                <th className="py-3 px-4 text-right">Toplam Tutar</th>
                <th className="py-3 px-4">Ambar / Yerleşim</th>
                <th className="py-3 px-4">Zimmetli Personel</th>
                <th className="py-3 px-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono">
                    <div className="font-extrabold text-amber-600 dark:text-amber-400">
                      {t.tifNo}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rapor: {t.muayeneRaporNo} ({t.muayeneKabulTarihi})
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded border border-blue-200/80 dark:border-blue-900/40">
                        {t.tasinirKodu}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {t.malzemeAdi}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center font-bold">
                    {t.miktar} {t.olcuBirimi}
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatCurrency(t.birimFiyat)}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(t.toplamTutar)}
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    <div>{t.ambarAdi}</div>
                    {t.odaNo && <div className="text-[10px] text-slate-400">{t.odaNo}</div>}
                  </td>

                  <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                    {t.zimmetliPersonel ? (
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <UserCheck size={13} className="text-emerald-500" />
                        {t.zimmetliPersonel}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Zimmet Atanmadı</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.durum === 'zimmetlendi'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : t.durum === 'tuketildi'
                          ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      <CheckCircle size={10} />
                      {t.durum}
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

