import React from 'react'
import { Sparkles, Edit3, Trash2 } from 'lucide-react'
import { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'
import { formatMoney, getTurBadge, getUsulLabel } from './dosyaYonetimi2886.utils'

interface DosyaYonetimi2886TableProps {
  filteredDosyalar: Dosya2886Item[]
  activeDosyaId?: string
  onOpenEditModal: (dosya: Dosya2886Item) => void
  onDeleteRequest: (dosya: Dosya2886Item) => void
  onSelectAndOpenStudio: (dosya: Dosya2886Item) => void
}

export const DosyaYonetimi2886Table: React.FC<DosyaYonetimi2886TableProps> = ({
  filteredDosyalar,
  activeDosyaId,
  onOpenEditModal,
  onDeleteRequest,
  onSelectAndOpenStudio
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <th className="p-3 w-32 font-mono">Dosya No</th>
              <th className="p-3">İhale Konusu & Taşınmaz</th>
              <th className="p-3 w-32">İşlem Türü</th>
              <th className="p-3 w-40">İhale Usulü</th>
              <th className="p-3 w-36 text-right font-mono">Muhammen Bedel</th>
              <th className="p-3 w-28 text-center">İhale Tarihi</th>
              <th className="p-3 w-32 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredDosyalar.map((d) => {
              const isActive = activeDosyaId === d.id
              const bedel =
                d.muhammenBedel?.takdirEdilenMuhammenBedel || d.muhammenBedel?.hesaplananBedel || 0

              return (
                <tr
                  key={d.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/80 transition-colors ${
                    isActive ? 'bg-purple-50/40 dark:bg-purple-950/30 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                    {d.ihaleKayitNo}
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                    {d.ihaleAdi}
                  </td>
                  <td className="p-3">{getTurBadge(d.islemTuru)}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{getUsulLabel(d.usul)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₺{formatMoney(bedel)}
                  </td>
                  <td className="p-3 text-center font-mono text-slate-500">{d.ihaleTarihi}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectAndOpenStudio(d)}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-300 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                        title="Dinamik Belge & Form Stüdyosunda Aç"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Stüdyo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(d)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(d)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
  )
}
