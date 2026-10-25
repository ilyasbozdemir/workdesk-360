import React from 'react'
import { Building2, Edit3, Trash2, BadgeCheck } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { getInitials } from '@renderer/utils/formatters'
import { KurumVerisi } from '../../kurum/kurum.hooks'

interface KurumProfilesSectionProps {
  allKurumlar: KurumVerisi[]
  activeKurumId: number | null
  onOpenEditModal: (kurum: KurumVerisi) => void
  onDeleteKurum: (id: number, name: string) => void
  onSwitchKurum: (id: number, name: string) => void
}

export const KurumProfilesSection: React.FC<KurumProfilesSectionProps> = ({
  allKurumlar,
  activeKurumId,
  onOpenEditModal,
  onDeleteKurum,
  onSwitchKurum
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Tanımlı Kurum Profilleri ({allKurumlar.length})
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          İşlem yapmak istediğiniz kurum profilini seçerek tüm şablon ve süreçleri o kurum adına
          yürütebilirsiniz.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allKurumlar.map((kurum) => {
          const isActive = kurum.id === activeKurumId
          return (
            <div
              key={kurum.id}
              className={`relative rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-500/60 shadow-lg shadow-blue-500/5 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-4 right-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif Profil
                </div>
              )}

              <div>
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-base shrink-0 overflow-hidden">
                    {kurum.logo_kurum ? (
                      <img
                        src={kurum.logo_kurum}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      getInitials(kurum.kurum_adi || 'Kurum')
                    )}
                  </div>
                  <div className="pr-16">
                    <h3
                      className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2"
                      title={kurum.kurum_adi}
                    >
                      {kurum.kurum_adi || 'İsimsiz Kurum'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                      {kurum.makam_adi || kurum.ust_kurum_adi || 'Makam Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/80 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-400">DETSİS / DTVT:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {kurum.detsis_kodu || kurum.dtvt_kodu || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">E-Bütçe Kodu:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {kurum.ebutce_kodu || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Limit / Tür:</span>
                    <span className="font-medium text-slate-600 dark:text-slate-400 capitalize">
                      {kurum.limit_tipi === 'buyuksehir' ? 'Büyükşehir' : 'Diğer İdareler'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(kurum)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="Profili Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => onDeleteKurum(kurum.id!, kurum.kurum_adi || 'Kurum')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Profili Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isActive ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 py-1 px-2.5">
                    <BadgeCheck className="w-4 h-4" /> Seçili
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSwitchKurum(kurum.id!, kurum.kurum_adi || 'Kurum')}
                    className="text-xs font-semibold hover:bg-blue-600 hover:text-white rounded-lg px-3 py-1 border-slate-200 dark:border-slate-700"
                  >
                    Bu Profile Geç
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
