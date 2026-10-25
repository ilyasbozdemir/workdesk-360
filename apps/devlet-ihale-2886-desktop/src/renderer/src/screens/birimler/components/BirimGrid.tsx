import React from 'react'
import { Edit2, Trash2, Building, Hash, Users, AlignLeft, Type, MapPin, User } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

interface BirimGridProps {
  birimler: any[]
  personeller: any[]
  handleViewClick: (birim: any) => void
  handleEditClick: (e: React.MouseEvent, birim: any) => void
  handleDeleteBirim: (e: React.MouseEvent, id: number) => void
}

export const BirimGrid: React.FC<BirimGridProps> = ({
  birimler,
  personeller,
  handleViewClick,
  handleEditClick,
  handleDeleteBirim
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {birimler.map((birim) => {
        const personel = personeller.find((p) => p.id === birim.ilgili_personel_id)
        const legacyPersonelText = birim.ayrintili_bilgi_personel

        return (
          <div
            key={birim.id}
            onClick={() => handleViewClick(birim)}
            className="flex flex-col p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-700 transition-all group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all bg-gradient-to-l from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 pl-8">
              <Button
                title="Düzenle"
                variant="ghost"
                size="sm"
                onClick={(e) => handleEditClick(e, birim)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                title="Sil"
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteBirim(e, birim.id)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Card Header */}
            <div className="flex items-start gap-3 mb-4 pr-16">
              <div className="w-10 h-10 shrink-0 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-450">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-tight mb-1">
                  {birim.birim_adi}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {birim.e_butce && (
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-blue-600 dark:text-blue-450 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/50"
                      title="e-Bütçe Kodu"
                    >
                      <Hash className="w-3 h-3" />
                      {birim.e_butce}
                    </span>
                  )}
                  {birim.say2000i && (
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                      title="Say2000i Kodu"
                    >
                      <Hash className="w-3 h-3" />
                      {birim.say2000i}
                    </span>
                  )}
                  {birim.personel_sayisi !== undefined && birim.personel_sayisi > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                      <Users className="w-3 h-3" />
                      {birim.personel_sayisi} Personel
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
              {birim.sunum_makami && (
                <div className="flex items-start gap-2 text-[11px] text-slate-650 dark:text-slate-400 col-span-full">
                  <AlignLeft className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">
                      Sunum Makamı:
                    </span>
                    <span className="line-clamp-2">{birim.sunum_makami}</span>
                  </div>
                </div>
              )}
              {(birim.detsis_kodu || birim.dtvt_kodu) && (
                <div className="flex items-start gap-2 text-[11px] text-slate-655 dark:text-slate-400 col-span-full">
                  <Building className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">
                      DETSİS Kodu:
                    </span>
                    <span className="font-mono">{birim.detsis_kodu || birim.dtvt_kodu}</span>
                  </div>
                </div>
              )}
              {birim.muhasebe_kodu && (
                <div className="flex items-start gap-2 text-[11px] text-slate-655 dark:text-slate-400 col-span-full">
                  <Hash className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">
                      Muhasebe:
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {birim.muhasebe_kodu}
                    </span>
                    {birim.muhasebe_adi && (
                      <span className="text-slate-500 dark:text-slate-400 ml-1">
                        ({birim.muhasebe_adi})
                      </span>
                    )}
                  </div>
                </div>
              )}
              {birim.harcama_kodu && (
                <div className="flex items-start gap-2 text-[11px] text-slate-655 dark:text-slate-400 col-span-full">
                  <Hash className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">
                      Harcama:
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {birim.harcama_kodu}
                    </span>
                    {birim.harcama_adi && (
                      <span className="text-slate-500 dark:text-slate-400 ml-1">
                        ({birim.harcama_adi})
                      </span>
                    )}
                  </div>
                </div>
              )}
              {birim.antet_ek_satir && (
                <div className="flex items-start gap-2 text-[11px] text-slate-655 dark:text-slate-400">
                  <Type className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Antet Ek Satır
                    </span>
                    <span className="line-clamp-2 leading-relaxed">{birim.antet_ek_satir}</span>
                  </div>
                </div>
              )}

              {birim.ihtiyac_yeri_eki &&
                birim.ihtiyac_yeri_eki !== '[]' &&
                birim.ihtiyac_yeri_eki !== '[""]' && (
                  <div className="flex items-start gap-2 text-[11px] text-slate-655 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                        İhtiyaç Yeri
                      </span>
                      <span className="line-clamp-2 leading-relaxed">
                        {(() => {
                          try {
                            if (birim.ihtiyac_yeri_eki.startsWith('[')) {
                              const arr = JSON.parse(birim.ihtiyac_yeri_eki)
                              return Array.isArray(arr) ? arr.join(', ') : birim.ihtiyac_yeri_eki
                            }
                          } catch {}
                          return birim.ihtiyac_yeri_eki
                        })()}
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {/* Footer (Personel) */}
            {(personel || legacyPersonelText) && (
              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 -mx-5 -mb-5 px-5 py-3">
                <User className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-500 mb-0.5">
                    İlgili Personel
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {personel ? personel.ad_soyad : legacyPersonelText}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
