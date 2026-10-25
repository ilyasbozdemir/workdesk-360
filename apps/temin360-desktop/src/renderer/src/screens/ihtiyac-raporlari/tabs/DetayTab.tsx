import React from 'react'
import {
  Building2,
  Edit,
  ExternalLink,
  FileText,
  Link2,
  Package,
  Sparkles,
  TrendingUp,
  User
} from 'lucide-react'
import { IhtiyacRaporu, IhtiyacRaporuKalem } from '../../../services/ihtiyacRaporuService'
import { resolveKdvOrani } from '../../../utils/ihtiyacRaporuTotals'
import { formatCurrency } from '../../../utils/formatters'

interface DetayTabProps {
  rapor: IhtiyacRaporu
  kalemler: IhtiyacRaporuKalem[]
  totals: {
    araToplam: number
    kdv: number
    genelToplam: number
  }
  onEdit: (raporId: number) => void
  onNavigateToDosya: (dosyaId: number) => void
  onOpenYiUfeModal?: () => void
  filterSection?: 'all' | 'info' | 'items'
}

export function DetayTab({
  rapor,
  kalemler,
  totals,
  onEdit,
  onNavigateToDosya,
  onOpenYiUfeModal,
  filterSection = 'all'
}: DetayTabProps): React.JSX.Element {
  const showInfo = filterSection === 'all' || filterSection === 'info'
  const showItems = filterSection === 'all' || filterSection === 'items'

  return (
    <div className="space-y-4">
      {/* Meta Cards Grid & Info */}
      {showInfo && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Talep Eden Birim
              </span>
              <p className="text-sm font-bold text-slate-850 dark:text-slate-100 mt-1 flex items-center gap-2">
                <Building2 size={15} className="text-purple-500 shrink-0" />
                <span className="truncate">{rapor.birim_adi || 'Birim Belirtilmedi'}</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Talep Eden Personel
              </span>
              <div className="mt-1 flex items-start gap-2">
                <User size={15} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-850 dark:text-slate-100 truncate">
                    {rapor.talep_eden_personel || 'Belirtilmedi'}
                  </p>
                  {rapor.talep_eden_unvan && (
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 truncate">
                      {rapor.talep_eden_unvan}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Toplam Kalem Sayısı
              </span>
              <p className="text-sm font-bold text-slate-850 dark:text-slate-100 mt-1 flex items-center gap-2">
                <Package size={15} className="text-emerald-500 shrink-0" />
                <span>{kalemler.length} Kalem</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Hesaplanan KDV
              </span>
              <p className="text-sm font-bold font-mono text-slate-850 dark:text-slate-100 mt-1 flex items-center gap-2">
                <TrendingUp size={15} className="text-cyan-500 shrink-0" />
                <span>{formatCurrency(totals.kdv)}</span>
              </p>
            </div>
          </div>

          {/* Linked Dossier Card if connected */}
          {rapor.temin_dosya_id ? (
            <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Link2 size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Bağlı Bulunan Alım Dosyası
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      {rapor.dosya_tur || 'Doğrudan Temin'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-850 dark:text-slate-100 mt-0.5 truncate">
                    <span className="font-mono text-blue-600 dark:text-blue-400 mr-2">
                      [{rapor.dosya_no || `Dosya #${rapor.temin_dosya_id}`}]
                    </span>
                    {rapor.dosya_konu || 'Alım Dosyası'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToDosya(rapor.temin_dosya_id!)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Dosyayı Aç &amp; Kalemleri Gör</span>
              </button>
            </div>
          ) : null}

          {/* Justification Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                İhtiyaç Gerekçesi ve Kapsamı
              </h3>
              <span className="text-[11px] text-slate-400">
                Lüzum müzekkeresi &amp; alım hazırlık gerekçesi
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-855">
              {rapor.gerekce?.trim() || 'Gerekçe açıklaması girilmemiş.'}
            </p>
          </div>
        </>
      )}

      {/* Items Table Card */}
      {showItems && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <Package size={17} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">
                İhtiyaç Kalemleri Listesi
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                {kalemler.length} Kalem
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onOpenYiUfeModal && kalemler.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenYiUfeModal}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="TÜİK Yİ-ÜFE Endeksleri ile Birim Fiyatları Güncelle / Eskale Et"
                >
                  <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>TÜİK ile Güncelle</span>
                </button>
              )}

              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                KDV Dahil Toplam: {formatCurrency(totals.genelToplam)}
              </span>
            </div>
          </div>

          {kalemler.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-450 space-y-3">
              <Package size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-medium">Bu ihtiyaç raporuna henüz kalem eklenmemiş.</p>
              <button
                onClick={() => onEdit(rapor.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit size={13} />
                Kalem Ekle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/40 dark:bg-slate-950/20">
                    <th className="py-3 px-4 w-12 text-center">Sıra</th>
                    <th className="py-3 px-4">Kalem / İşin Adı &amp; Açıklama</th>
                    <th className="py-3 px-4 w-24">Tür</th>
                    <th className="py-3 px-4 w-32 text-right">Miktar &amp; Birim</th>
                    <th className="py-3 px-4 w-20 text-center">KDV</th>
                    <th className="py-3 px-4 w-32 text-right">Tahmini B. Fiyat</th>
                    <th className="py-3 px-4 w-32 text-right">Satır Tutarı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {kalemler.map((k, idx) => {
                    const rowTotal = (Number(k.miktar) || 0) * (Number(k.tahmini_birim_fiyat) || 0)
                    const kdvRate = resolveKdvOrani(k.kdv_orani)
                    return (
                      <tr
                        key={k.id || idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                          {k.sira_no || idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-850 dark:text-slate-100 block text-xs">
                            {k.kalem_adi}
                          </span>
                          {k.aciklama && (
                            <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              {k.aciklama}
                            </span>
                          )}
                          {(k.tasinir_kodu || k.okas_kodu || k.poz_no) && (
                            <div className="flex gap-2.5 mt-1.5 text-[10.5px] text-slate-400 font-mono">
                              {k.tasinir_kodu && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  TK: {k.tasinir_kodu}
                                </span>
                              )}
                              {k.okas_kodu && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  OKAS: {k.okas_kodu}
                                </span>
                              )}
                              {k.poz_no && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  POZ: {k.poz_no}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {k.tipi || 'Mal'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                          <span className="font-bold font-mono text-xs">{k.miktar}</span>{' '}
                          <span className="text-[11px] text-slate-450 font-normal">{k.birim}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          %{kdvRate}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {k.tahmini_birim_fiyat ? formatCurrency(k.tahmini_birim_fiyat) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-850 dark:text-slate-100">
                          {rowTotal > 0 ? formatCurrency(rowTotal) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/60 font-bold">
                    <td colSpan={4} className="py-3 px-4 text-slate-500 text-xs">
                      Toplam {kalemler.length} Kalem
                    </td>
                    <td
                      colSpan={2}
                      className="py-3 px-4 text-right text-xs text-slate-600 dark:text-slate-300"
                    >
                      Ara Toplam (KDV Hariç):
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-850 dark:text-slate-100">
                      {formatCurrency(totals.araToplam)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/60 font-bold">
                    <td colSpan={4} />
                    <td
                      colSpan={2}
                      className="py-2 px-4 text-right text-xs text-slate-600 dark:text-slate-300"
                    >
                      Hesaplanan Toplam KDV:
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-xs text-slate-850 dark:text-slate-100">
                      {formatCurrency(totals.kdv)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50 dark:bg-blue-950/30 font-black text-sm border-t border-blue-200/50 dark:border-blue-900/40">
                    <td colSpan={4} />
                    <td
                      colSpan={2}
                      className="py-3 px-4 text-right text-blue-900 dark:text-blue-200"
                    >
                      Genel Toplam (KDV Dahil):
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700 dark:text-cyan-400">
                      {formatCurrency(totals.genelToplam)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Notes if any */}
      {rapor.notlar && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
          <span className="font-bold flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Rapor Notları ve Ek Açıklamalar:
          </span>
          <p className="leading-relaxed pl-5 whitespace-pre-line">{rapor.notlar}</p>
        </div>
      )}
    </div>
  )
}
