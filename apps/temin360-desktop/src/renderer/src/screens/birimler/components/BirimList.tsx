import React from 'react'
import { Edit2, Trash2, Building, Hash, Users, MapPin, User } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

interface BirimListProps {
  birimler: any[]
  personeller: any[]
  dataViewMode: 'list' | 'table' | string
  handleViewClick: (birim: any) => void
  handleEditClick: (e: React.MouseEvent, birim: any) => void
  handleDeleteBirim: (e: React.MouseEvent, id: number) => void
}

export const BirimList: React.FC<BirimListProps> = ({
  birimler,
  personeller,
  dataViewMode,
  handleViewClick,
  handleEditClick,
  handleDeleteBirim
}) => {
  if (dataViewMode === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {birimler.map((birim) => {
          const personel = personeller.find((p) => p.id === birim.ilgili_personel_id)
          const legacyPersonelText = birim.ayrintili_bilgi_personel

          return (
            <div
              key={birim.id}
              onClick={() => handleViewClick(birim)}
              className="flex flex-col sm:flex-row p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-400 dark:hover:border-blue-700 transition-all group relative cursor-pointer gap-4 sm:items-center"
            >
              <div className="w-10 h-10 shrink-0 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400">
                <Building className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-[200px]">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                  {birim.birim_adi}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {birim.e_butce && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-600 dark:text-blue-450 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md">
                      <Hash className="w-3 h-3" /> {birim.e_butce}
                    </span>
                  )}
                  {birim.personel_sayisi !== undefined && birim.personel_sayisi > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">
                      <Users className="w-3 h-3" /> {birim.personel_sayisi} Personel
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-[150px] text-xs text-slate-600 dark:text-slate-400">
                {(personel || legacyPersonelText) && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>{personel ? personel.ad_soyad : legacyPersonelText}</span>
                  </div>
                )}
                {birim.ihtiyac_yeri_eki &&
                  birim.ihtiyac_yeri_eki !== '[]' &&
                  birim.ihtiyac_yeri_eki !== '[""]' && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate max-w-[200px]">
                        {(() => {
                          try {
                            if (birim.ihtiyac_yeri_eki.startsWith('[')) {
                              const arr = JSON.parse(birim.ihtiyac_yeri_eki)
                              return Array.isArray(arr) ? arr.join(', ') : birim.ihtiyac_yeri_eki
                            }
                          } catch {}
                          return birim.ihtiyac_yeri_eki.split('\n')[0]
                        })()}
                      </span>
                    </div>
                  )}
              </div>

              <div className="flex items-center gap-1 pr-2">
                <Button
                  title="Düzenle"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleEditClick(e, birim)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  title="Sil"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteBirim(e, birim.id)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-650"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Table view fallback
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3">Birim Adı</th>
            <th className="px-4 py-3">e-Bütçe Kodu</th>
            <th className="px-4 py-3">İlgili Personel</th>
            <th className="px-4 py-3 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {birimler.map((birim) => {
            const personel = personeller.find((p) => p.id === birim.ilgili_personel_id)
            const legacyPersonelText = birim.ayrintili_bilgi_personel
            return (
              <tr
                key={birim.id}
                onClick={() => handleViewClick(birim)}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {birim.birim_adi}
                </td>
                <td className="px-4 py-3 font-mono">{birim.e_butce || '-'}</td>
                <td className="px-4 py-3">
                  {personel ? personel.ad_soyad : legacyPersonelText || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditClick(e, birim)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteBirim(e, birim.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
