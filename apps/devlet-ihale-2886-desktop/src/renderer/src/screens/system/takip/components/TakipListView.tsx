import React from 'react'
import { ExternalLink, Edit, CheckCircle2, Layers, Eye } from 'lucide-react'
import { formatDate } from '../../../../utils/formatters'
import type { TeminDosyasi } from '../../../dosyalar/dosyalar.hooks'
import { TakipFilterToolbar } from './TakipFilterToolbar'

export interface TakipListViewProps {
  dosyalar: TeminDosyasi[]
  activeDosyaId: number | null
  setActiveDosyaId: (id: number) => void
  formatCurrency: (val: number) => string
  onOpenDetail: (dosya: TeminDosyasi) => void
  onOpenSurec: (dosya: TeminDosyasi) => void
  onEdit: (dosyaId: number) => void
  searchQuery?: string
  setSearchQuery?: (q: string) => void
  selectedYil?: string
  setSelectedYil?: (y: string) => void
  selectedTur?: string
  setSelectedTur?: (t: string) => void
  uniqueYillar?: number[]
  totalCount?: number
  onOpenWizard?: (stageId?: number) => void
}

const STAGE_LABELS: Record<number, string> = {
  1: '1. İhtiyaç Tespiti',
  2: '2. Piyasa & Teklif',
  3: '3. Sipariş & Onay',
  4: '4. Kabul & Muayene'
}

export function TakipListView({
  dosyalar,
  activeDosyaId,
  setActiveDosyaId,
  formatCurrency,
  onOpenDetail,
  onOpenSurec,
  onEdit,
  searchQuery,
  setSearchQuery,
  selectedYil,
  setSelectedYil,
  selectedTur,
  setSelectedTur,
  uniqueYillar = [],
  totalCount,
  onOpenWizard
}: TakipListViewProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4 w-full">
      {searchQuery !== undefined && setSearchQuery && (
        <TakipFilterToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedYil={selectedYil || 'all'}
          setSelectedYil={setSelectedYil || (() => {})}
          selectedTur={selectedTur || 'all'}
          setSelectedTur={setSelectedTur || (() => {})}
          uniqueYillar={uniqueYillar}
          totalCount={totalCount ?? dosyalar.length}
          filteredCount={dosyalar.length}
          onOpenWizard={onOpenWizard}
        />
      )}

      {dosyalar.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Kriterlere Uygun Dosya Bulunamadı
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Arama sorgunuzu veya filtrelerinizi değiştirerek tekrar deneyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider select-none">
                  <th className="py-3 px-4">Dosya No</th>
                  <th className="py-3 px-4 min-w-60">Konu</th>
                  <th className="py-3 px-4">Aşama</th>
                  <th className="py-3 px-4">Tür</th>
                  <th className="py-3 px-4">Birim</th>
                  <th className="py-3 px-4 text-right">Yaklaşık Maliyet</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {dosyalar.map((dosya) => {
                  const stageId =
                    dosya.status === 'tamamlandi' ? 4 : Number(dosya.durum_asama_id) || 1
                  const isActive = activeDosyaId === dosya.id

                  return (
                    <tr
                      key={dosya.id}
                      onClick={() => {
                        setActiveDosyaId(dosya.id)
                        onOpenDetail(dosya)
                      }}
                      onDoubleClick={() => onOpenSurec(dosya)}
                      className={`group transition-colors cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-950/20 ${
                        isActive ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''
                      }`}
                      title="Detay dialog'u için tıklayın, süreç ekranını açmak için çift tıklayın."
                    >
                      {/* Dosya No */}
                      <td className="py-3 px-4 font-mono font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                          {dosya.temin_no || `#${dosya.id}`}
                        </span>
                      </td>

                      {/* Konu */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-850 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {dosya.konu || 'İsimsiz Temin Dosyası'}
                        </span>
                      </td>

                      {/* Aşama */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            stageId === 4
                              ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : stageId === 3
                                ? 'bg-purple-100/70 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                : stageId === 2
                                  ? 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {STAGE_LABELS[stageId] || `Aşama ${stageId}`}
                        </span>
                      </td>

                      {/* Tür */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 capitalize">
                        {dosya.tur === 'yapim_isi' ? 'Yapım' : dosya.tur || 'Mal'}
                      </td>

                      {/* Birim */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 max-w-45 truncate">
                        {dosya.birim_adi || '-'}
                      </td>

                      {/* Yaklaşık Maliyet */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatCurrency(dosya.yaklasik_maliyet || 0)}
                      </td>

                      {/* Tarih */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {formatDate(dosya.dosya_acilis_tarihi)}
                      </td>

                      {/* Durum */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dosya.status === 'tamamlandi'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : dosya.status === 'iptal'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}
                        >
                          {dosya.status === 'tamamlandi'
                            ? 'Tamamlandı'
                            : dosya.status === 'iptal'
                              ? 'İptal'
                              : 'Devam Ediyor'}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenDetail(dosya)
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Trello Kart Detayını Aç"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenSurec(dosya)
                            }}
                            className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-500 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
                            title="Süreç Adımlarına Git"
                          >
                            <ExternalLink size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(dosya.id)
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Dosyayı Düzenle"
                          >
                            <Edit size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveDosyaId(dosya.id)
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-1 ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:text-slate-300'
                            }`}
                            title="Dosyayı Seç"
                          >
                            <CheckCircle2 size={11} />
                            {isActive ? 'Aktif' : 'Seç'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
