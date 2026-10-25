import React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { TifKayit } from '../ambar.hooks'

interface AmbarTiflerTabProps {
  filteredTifler: TifKayit[]
  isLoadingTifler: boolean
  onDeleteTif: (id: number) => void
}

export const AmbarTiflerTab: React.FC<AmbarTiflerTabProps> = ({
  filteredTifler,
  isLoadingTifler,
  onDeleteTif
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="p-3">Fiş No</th>
              <th className="p-3">Fiş Tarihi</th>
              <th className="p-3">Ambar</th>
              <th className="p-3">İlişkili Temin Dosyası</th>
              <th className="p-3 text-center">Kalem Sayısı</th>
              <th className="p-3 text-right">Toplam Tutar (₺)</th>
              <th className="p-3 text-center">Durum</th>
              <th className="p-3 text-center">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {isLoadingTifler ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                  TİF belgeleri yükleniyor...
                </td>
              </tr>
            ) : filteredTifler.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  Henüz oluşturulmuş Taşınır İşlem Fişi (TİF) bulunmuyor.
                </td>
              </tr>
            ) : (
              filteredTifler.map((tif) => (
                <tr
                  key={tif.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40 transition-colors"
                >
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {tif.fis_no}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                    {tif.fis_tarihi || '-'}
                  </td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                    {tif.ambar_adi || 'Genel Ambar'}
                  </td>
                  <td className="p-3">
                    {tif.dosya_no ? (
                      <div>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {tif.dosya_no}
                        </span>
                        {tif.dosya_adi && (
                          <span className="block text-[11px] text-slate-400 line-clamp-1">
                            {tif.dosya_adi}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {tif.kalem_sayisi || 0} Kalem
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {(tif.toplam_tutar || 0).toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    ₺
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {tif.durum || 'ONAYLANDI'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteTif(tif.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                        title="TİF Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
