import React from 'react'
import { ShieldCheck, ArrowUpRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { AmbarStok } from '../ambar.hooks'

interface AmbarStoklarTabProps {
  filteredStoklar: AmbarStok[]
  isLoadingStoklar: boolean
  onOpenHareketModal: (stok: AmbarStok, type: 'zimmet' | 'cikis') => void
}

export const AmbarStoklarTab: React.FC<AmbarStoklarTabProps> = ({
  filteredStoklar,
  isLoadingStoklar,
  onOpenHareketModal
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3">Malzeme / Kalem Adı</th>
              <th className="p-3">Taşınır Kodu</th>
              <th className="p-3">Bulunduğu Ambar</th>
              <th className="p-3 text-right">Mevcut Miktar</th>
              <th className="p-3">Birim</th>
              <th className="p-3 text-right">Son Fiyat (₺)</th>
              <th className="p-3 text-right">Toplam Tutar (₺)</th>
              <th className="p-3 text-center">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {isLoadingStoklar ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                  Stoklar listeleniyor...
                </td>
              </tr>
            ) : filteredStoklar.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400">
                  Kayıtlı stok kalemi bulunmuyor veya arama kriterine uygun veri yok.
                </td>
              </tr>
            ) : (
              filteredStoklar.map((stok, idx) => (
                <tr
                  key={stok.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-colors"
                >
                  <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                    {stok.kalem_adi}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                    {stok.tasinir_kodu || '-'}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {stok.ambar_adi || 'Genel Depo'}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        stok.toplam_miktar <= 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/50'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                      }`}
                    >
                      {stok.toplam_miktar}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{stok.olcu_birimi || 'Adet'}</td>
                  <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    {(stok.birim_fiyat || 0).toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    ₺
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {(stok.toplam_tutar || 0).toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    ₺
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenHareketModal(stok, 'zimmet')}
                        className="h-7 text-[11px] px-2 gap-1 text-indigo-600 hover:bg-indigo-50 border-indigo-200 dark:border-indigo-800"
                      >
                        <ShieldCheck className="w-3 h-3" /> Zimmet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenHareketModal(stok, 'cikis')}
                        className="h-7 text-[11px] px-2 gap-1 text-blue-600 hover:bg-blue-50"
                      >
                        <ArrowUpRight className="w-3 h-3" /> Çıkış
                      </Button>
                    </div>
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
