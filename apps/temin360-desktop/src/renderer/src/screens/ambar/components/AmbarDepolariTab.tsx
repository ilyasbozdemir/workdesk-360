import React from 'react'
import { Archive, MapPin, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Ambar } from '../ambar.hooks'

interface AmbarDepolariTabProps {
  ambarlar: Ambar[]
  isLoadingAmbarlar: boolean
  onOpenEdit: (ambar: Ambar) => void
  onDeleteAmbar: (id: number) => void
}

export const AmbarDepolariTab: React.FC<AmbarDepolariTabProps> = ({
  ambarlar,
  isLoadingAmbarlar,
  onOpenEdit,
  onDeleteAmbar
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoadingAmbarlar ? (
          <div className="col-span-full p-8 text-center text-slate-450 dark:text-slate-500 animate-pulse italic">
            Ambar depoları yükleniyor...
          </div>
        ) : ambarlar.length === 0 ? (
          <div className="col-span-full p-16 flex flex-col items-center justify-center text-slate-450 bg-slate-50 dark:bg-slate-950 rounded-xl">
            <Archive className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Kayıtlı Ambar Bulunmuyor
            </h3>
          </div>
        ) : (
          ambarlar.map((ambar) => (
            <div
              key={ambar.id}
              className="flex flex-col p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl hover:border-blue-300 dark:hover:border-blue-800 transition-colors group relative shadow-xs"
            >
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-md shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-0.5">
                <Button
                  title="Düzenle"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenEdit(ambar)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/15"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </Button>
                <Button
                  title="Sil"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteAmbar(ambar.id)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-2 pr-8">
                {ambar.tasinir_kodu && (
                  <span className="font-mono font-bold text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100/20 dark:border-blue-900/10 px-1.5 py-0.5 rounded">
                    {ambar.tasinir_kodu}
                  </span>
                )}
                {ambar.sehir && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {ambar.sehir}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 leading-normal pr-8">
                {ambar.ambar_adi}
              </h4>
              {ambar.aciklama && (
                <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 flex-1">
                  {ambar.aciklama}
                </p>
              )}

              <div className="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 pt-3 flex flex-col gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                {ambar.adres && (
                  <span className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{ambar.adres}</span>
                  </span>
                )}
                {ambar.telefon && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs">📞</span> {ambar.telefon}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
