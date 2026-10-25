import React from 'react'
import { Check, Edit2, Package, RefreshCw, Trash2, X } from 'lucide-react'
import { cn } from '../../../../../../../utils/cn'

interface MalzemeTablosuBodyProps {
  loading: boolean
  items: any[]
  isYapim: boolean
  isHizmet: boolean
  selectedIds: Set<number>
  handleToggleSelectAll: () => void
  handleToggleSelectRow: (id: number) => void
  editingId: number | null
  setEditingId: (id: number | null) => void
  editMiktar: number
  setEditMiktar: (val: number) => void
  editBirim: string
  setEditBirim: (val: string) => void
  editKdv: number
  setEditKdv: (val: number) => void
  units: any[]
  handleSaveEdit: (id: number) => void
  handleStartEdit: (item: any) => void
  handleDeleteItem: (id: number) => void
  handleTriggerKatalogSync: (item?: any) => void
}

export function MalzemeTablosuBody({
  loading,
  items,
  isYapim,
  isHizmet,
  selectedIds,
  handleToggleSelectAll,
  handleToggleSelectRow,
  editingId,
  setEditingId,
  editMiktar,
  setEditMiktar,
  editBirim,
  setEditBirim,
  editKdv,
  setEditKdv,
  units,
  handleSaveEdit,
  handleStartEdit,
  handleDeleteItem,
  handleTriggerKatalogSync
}: MalzemeTablosuBodyProps): React.JSX.Element {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
        Yükleniyor...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
        <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-xs">
          {isYapim
            ? 'Bu dosyada henüz herhangi bir imalat veya poz kalemi eklenmemiş.'
            : isHizmet
              ? 'Bu dosyada henüz herhangi bir hizmet kalemi eklenmemiş.'
              : 'Bu dosyada henüz herhangi bir ihtiyaç kalemi eklenmemiş.'}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          {isYapim
            ? 'Yukarıdaki butonu kullanarak ilk imalat/poz kalemini ekleyebilirsiniz.'
            : isHizmet
              ? 'Yukarıdaki butonu kullanarak ilk hizmet kalemini ekleyebilirsiniz.'
              : 'Yukarıdaki butonu kullanarak ilk ihtiyaç kalemini ekleyebilirsiniz.'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto custom-scrollbar flex-1">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
          <tr>
            <th className="p-3 pl-4 w-10">
              <input
                type="checkbox"
                checked={items.length > 0 && selectedIds.size === items.length}
                onChange={handleToggleSelectAll}
                className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
              />
            </th>
            <th className="p-3 pl-4">Sıra No</th>
            <th className="p-3 pl-4">
              {isYapim ? 'Poz No' : isHizmet ? 'Hizmet Kodu' : 'Taşınır Kodu'}
            </th>
            <th className="p-3 pl-4">
              {isYapim
                ? 'İmalat / Poz Adı (İş Kalemi)'
                : isHizmet
                  ? 'Hizmet Kalemi Adı'
                  : 'İhtiyaç Kalemi Adı'}
            </th>
            <th className="p-3">Tür</th>
            <th className="p-3 text-center">Miktar</th>
            <th className="p-3">Birim</th>
            <th className="p-3 text-center">KDV (%)</th>
            <th className="p-3 text-right pr-4">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
          {items.map((item: any, index: number) => {
            const isEditing = editingId === item.id
            return (
              <tr
                key={item.id}
                className={cn(
                  'hover:bg-slate-50/50 dark:hover:bg-slate-800/10',
                  selectedIds.has(item.id) && 'bg-blue-50/30 dark:bg-blue-955/15'
                )}
              >
                <td className="p-3 pl-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleToggleSelectRow(item.id)}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                </td>
                <td className="p-3 pl-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  {index + 1}
                </td>

                <td className="p-3 pl-4 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                  {item.tasinir_kodu || '-'}
                </td>

                <td className="p-3 pl-4">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {item.kalem_adi}
                  </div>
                  {item.okas_kodu && (
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      OKAS: {item.okas_kodu}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase',
                      item.tipi === 'Mal' &&
                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
                      item.tipi === 'Hizmet' &&
                        'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
                      item.tipi === 'Yapım' &&
                        'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
                      item.tipi === 'Danışmanlık' &&
                        'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400'
                    )}
                  >
                    {item.tipi}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editMiktar}
                      onChange={(e) => setEditMiktar(parseFloat(e.target.value) || 1)}
                      className="w-16 p-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 rounded text-center text-xs font-bold"
                    />
                  ) : (
                    <span className="font-black text-slate-750 dark:text-slate-300">
                      {item.miktar}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {isEditing ? (
                    <select
                      value={editBirim}
                      onChange={(e) => setEditBirim(e.target.value)}
                      className="p-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 rounded text-xs"
                    >
                      {units.map((u: any, idx: number) => (
                        <option key={idx} value={u.ad}>
                          {u.ad}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{item.birim}</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {isEditing ? (
                    <select
                      value={editKdv}
                      onChange={(e) => setEditKdv(parseInt(e.target.value, 10))}
                      className="p-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 rounded text-xs"
                    >
                      <option value="0">%0</option>
                      <option value="1">%1</option>
                      <option value="10">%10</option>
                      <option value="20">%20</option>
                    </select>
                  ) : (
                    <span>%{item.kdv_orani}</span>
                  )}
                </td>
                <td className="p-3 text-right pr-4">
                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 border border-emerald-250 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800 text-emerald-600 dark:text-emerald-450 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center justify-center"
                          title="Değişiklikleri Kaydet"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-950/30 border border-red-250 dark:border-red-900/40 hover:border-red-300 dark:hover:border-red-800 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center justify-center"
                          title="İptal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTriggerKatalogSync(item)}
                          className="p-1.5 bg-slate-50 hover:bg-sky-50 dark:bg-slate-950 dark:hover:bg-sky-955/30 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-900/50 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center justify-center"
                          title="Kütüphane / Katalog ile Karşılaştır &amp; Eşitle"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 bg-slate-50 hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-blue-955/30 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900/50 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center justify-center"
                          title="İhtiyaç Kalemi Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 dark:bg-slate-950 dark:hover:bg-red-955/20 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900/50 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center justify-center"
                          title="İhtiyaç Kalemi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
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
