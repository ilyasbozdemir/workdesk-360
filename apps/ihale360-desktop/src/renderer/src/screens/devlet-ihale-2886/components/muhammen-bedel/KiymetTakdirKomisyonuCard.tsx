import React from 'react'
import { Users, Plus, UserPlus, Trash2 } from 'lucide-react'
import { KiymetTakdirKomisyonUyesi } from '../../types/devletIhale2886.types'

interface KiymetTakdirKomisyonuCardProps {
  komisyonUyeleri: KiymetTakdirKomisyonUyesi[]
  setKomisyonUyeleri: React.Dispatch<React.SetStateAction<KiymetTakdirKomisyonUyesi[]>>
  onAddStandartKomisyon: () => void
  onAddKomisyonUyesi: () => void
  onRemoveKomisyonUyesi: (id: string) => void
}

export const KiymetTakdirKomisyonuCard: React.FC<KiymetTakdirKomisyonuCardProps> = ({
  komisyonUyeleri,
  setKomisyonUyeleri,
  onAddStandartKomisyon,
  onAddKomisyonUyesi,
  onRemoveKomisyonUyesi
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Kıymet Takdir Komisyonu (2886 Md. 9)
        </h3>
        <div className="flex items-center gap-1.5">
          {komisyonUyeleri.length === 0 && (
            <button
              type="button"
              onClick={onAddStandartKomisyon}
              className="px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Şablon Yükle
            </button>
          )}
          <button
            type="button"
            onClick={onAddKomisyonUyesi}
            className="px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Üye Ekle
          </button>
        </div>
      </div>

      {komisyonUyeleri.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
          <UserPlus className="w-7 h-7 mb-2 opacity-50" />
          <p className="text-xs font-medium">Henüz komisyon üyesi atanmadı.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            2886 sayılı kanuna uygun komisyon üyelerini eklemek için butonu kullanabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {komisyonUyeleri.map((u, idx) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 rounded-lg text-xs gap-2"
            >
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={u.adSoyad}
                  onChange={(e) => {
                    const updated = [...komisyonUyeleri]
                    updated[idx].adSoyad = e.target.value
                    setKomisyonUyeleri(updated)
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Ünvan (Örn: Şube Müdürü)"
                  value={u.unvan}
                  onChange={(e) => {
                    const updated = [...komisyonUyeleri]
                    updated[idx].unvan = e.target.value
                    setKomisyonUyeleri(updated)
                  }}
                  className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs"
                />
              </div>
              <select
                value={u.gorev}
                onChange={(e) => {
                  const updated = [...komisyonUyeleri]
                  updated[idx].gorev = e.target.value as 'Baskan' | 'Uye' | 'Uzman'
                  setKomisyonUyeleri(updated)
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 border border-slate-200 dark:border-slate-700 ${
                  u.gorev === 'Baskan'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                }`}
              >
                <option value="Baskan">Başkan</option>
                <option value="Uye">Üye</option>
                <option value="Uzman">Bilirkişi / Uzman</option>
              </select>
              <button
                type="button"
                onClick={() => onRemoveKomisyonUyesi(u.id)}
                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                title="Üyeyi Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
