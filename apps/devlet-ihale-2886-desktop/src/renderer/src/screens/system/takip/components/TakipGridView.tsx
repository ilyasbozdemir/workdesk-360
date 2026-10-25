import React from 'react'
import {
  Package,
  Wrench,
  Hammer,
  FileText,
  Building,
  Calendar,
  ExternalLink,
  Edit,
  CheckCircle2,
  Layers
} from 'lucide-react'
import { formatDate } from '../../../../utils/formatters'
import type { TeminDosyasi } from '../../../dosyalar/dosyalar.hooks'
import { TakipFilterToolbar } from './TakipFilterToolbar'

export interface TakipGridViewProps {
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
  3: '3. Sipariş & Sözleşme',
  4: '4. Kabul & Ödeme'
}

export function TakipGridView({
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
}: TakipGridViewProps): React.JSX.Element {
  const getTurBadge = (
    tur?: string
  ): { label: string; icon: React.ElementType; classes: string } => {
    switch (tur) {
      case 'mal':
        return {
          label: 'Mal',
          icon: Package,
          classes: 'bg-blue-100/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
        }
      case 'hizmet':
        return {
          label: 'Hizmet',
          icon: Wrench,
          classes: 'bg-purple-100/70 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
        }
      case 'yapim_isi':
        return {
          label: 'Yapım',
          icon: Hammer,
          classes: 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
        }
      case 'danismanlik':
        return {
          label: 'Danışmanlık',
          icon: FileText,
          classes: 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
        }
      default:
        return {
          label: tur || 'Standart',
          icon: Package,
          classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }
    }
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {dosyalar.map((dosya) => {
            const turInfo = getTurBadge(dosya.tur)
            const TurIcon = turInfo.icon
            const stageId = dosya.status === 'tamamlandi' ? 4 : Number(dosya.durum_asama_id) || 1
            const isActive = activeDosyaId === dosya.id

            return (
              <div
                key={dosya.id}
                onClick={() => {
                  setActiveDosyaId(dosya.id)
                  onOpenDetail(dosya)
                }}
                onDoubleClick={() => onOpenSurec(dosya)}
                className={`group relative flex flex-col justify-between p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30 shadow-blue-500/10'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
                title="Detay dialog'u için tıklayın, süreç ekranını açmak için çift tıklayın."
              >
                {/* Top Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {dosya.temin_no || `#${dosya.id}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${turInfo.classes}`}
                      >
                        <TurIcon size={10} />
                        {turInfo.label}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          stageId === 4
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        }`}
                      >
                        Aşama {stageId}
                      </span>
                    </div>
                  </div>

                  {/* Title / Konu */}
                  <h4
                    className="text-xs font-bold text-slate-850 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    title={dosya.konu || 'İsimsiz Temin Dosyası'}
                  >
                    {dosya.konu || 'İsimsiz Temin Dosyası'}
                  </h4>

                  {/* Stage Stepper Line */}
                  <div className="mt-3 py-1.5 px-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-semibold truncate">
                      {STAGE_LABELS[stageId] || `Aşama ${stageId}`}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      %{stageId * 25}
                    </span>
                  </div>

                  {/* Meta details */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {dosya.birim_adi && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate text-[11px]">
                        <Building size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{dosya.birim_adi}</span>
                      </div>
                    )}

                    {dosya.dosya_acilis_tarihi && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <span>{formatDate(dosya.dosya_acilis_tarihi)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Maliyet & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Yaklaşık Maliyet
                    </span>
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(dosya.yaklasik_maliyet || 0)}
                    </span>
                  </div>

                  {/* Action Buttons (with stopPropagation) */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveDosyaId(dosya.id)
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:text-slate-300'
                      }`}
                      title="Dosyayı aktif yap"
                    >
                      <CheckCircle2 size={11} />
                      {isActive ? 'Aktif' : 'Seç'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenSurec(dosya)
                      }}
                      className="p-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
                      title="Süreç Aşamasına Git"
                    >
                      <ExternalLink size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(dosya.id)
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Dosyayı Düzenle"
                    >
                      <Edit size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
