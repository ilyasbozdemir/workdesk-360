import React, { useState } from 'react'
import { Check, CheckCheck, Plus, PlusCircle, Search, X } from 'lucide-react'
import { cn } from '@renderer/utils/cn'

interface MalzemeKutuphaneTabProps {
  isYapim: boolean
  isHizmet: boolean
  libraryItems: any[]
  selectedItemIds: Set<number>
  setSelectedItemIds: React.Dispatch<React.SetStateAction<Set<number>>>
  itemMiktarlar: Record<number, number>
  setItemMiktarlar: React.Dispatch<React.SetStateAction<Record<number, number>>>
  libSearchQuery: string
  setLibSearchQuery: (val: string) => void
  onClose: () => void
  onAddSelected: () => void
  onSwitchToNewTab: (name?: string) => void
}

export const MalzemeKutuphaneTab: React.FC<MalzemeKutuphaneTabProps> = ({
  isYapim,
  isHizmet,
  libraryItems,
  selectedItemIds,
  setSelectedItemIds,
  itemMiktarlar,
  setItemMiktarlar,
  libSearchQuery,
  setLibSearchQuery,
  onClose,
  onAddSelected,
  onSwitchToNewTab
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü')
  const categoryOptions = ['Tümü', 'Mal', 'Hizmet', 'Yapım', 'Danışmanlık']

  const filteredLibraryItems = libraryItems.filter((item: any) => {
    const matchesSearch =
      !libSearchQuery.trim() ||
      item.kalem_adi?.toLowerCase().includes(libSearchQuery.toLowerCase()) ||
      (item.tasinir_kodu || '').toLowerCase().includes(libSearchQuery.toLowerCase()) ||
      (item.okas_kodu || '').toLowerCase().includes(libSearchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'Tümü' || item.tipi === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleSelectAllFiltered = () => {
    if (selectedItemIds.size === filteredLibraryItems.length) {
      setSelectedItemIds(new Set())
    } else {
      const next = new Set<number>()
      filteredLibraryItems.forEach((i: any) => next.add(i.id))
      setSelectedItemIds(next)
    }
  }

  return (
    <div className="space-y-4">
      {/* Arama & Kategori Filtresi */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={libSearchQuery}
            onChange={(e) => setLibSearchQuery(e.target.value)}
            placeholder={
              isYapim
                ? 'Poz no (örn: 15.120.1001), imalat adı veya OKAS ile canlı arayın...'
                : isHizmet
                  ? 'Hizmet adı, kodu veya açıklama ile canlı arayın...'
                  : 'Kalem adı, taşınır kodu veya OKAS ile canlı arayın...'
            }
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200 font-medium transition-all"
          />
          {libSearchQuery && (
            <button
              type="button"
              onClick={() => setLibSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Arama yapılmışsa doğrudan yeni kalem oluşturma ipucu */}
        {libSearchQuery.trim().length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl">
            <span className="text-xs text-blue-800 dark:text-blue-300 font-medium truncate">
              Aranan: <strong>&ldquo;{libSearchQuery.trim()}&rdquo;</strong>
            </span>
            <button
              type="button"
              onClick={() => onSwitchToNewTab(libSearchQuery.trim())}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 shrink-0 underline cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Yeni Kalem Olarak Tanımla &rarr;
            </button>
          </div>
        )}

        {/* Kategori Filtre Butonları */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredLibraryItems.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {selectedItemIds.size === filteredLibraryItems.length
                ? 'Seçimi Kaldır'
                : 'Tümünü Seç'}
            </button>
          )}
        </div>
      </div>

      {/* Kalem Listesi */}
      <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {filteredLibraryItems.map((item: any) => {
          const isSelected = selectedItemIds.has(item.id)
          const mkt = itemMiktarlar[item.id] ?? 1
          return (
            <div
              key={item.id}
              onClick={() => {
                const next = new Set(selectedItemIds)
                if (isSelected) {
                  next.delete(item.id)
                } else {
                  next.add(item.id)
                  if (!itemMiktarlar[item.id]) {
                    setItemMiktarlar((prev: any) => ({
                      ...prev,
                      [item.id]: 1
                    }))
                  }
                }
                setSelectedItemIds(next)
              }}
              className={cn(
                'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3',
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    'w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {item.kalem_adi}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={cn(
                        'text-[9px] font-black uppercase px-2 py-0.5 rounded-md border',
                        item.tipi === 'Mal' &&
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
                        item.tipi === 'Hizmet' &&
                          'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
                        item.tipi === 'Yapım' &&
                          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                        item.tipi === 'Danışmanlık' &&
                          'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800'
                      )}
                    >
                      {item.tipi || 'Mal'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {item.birim} · %{item.kdv_orani ?? 20} KDV
                    </span>
                    {item.tasinir_kodu && (
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {isYapim ? `Poz: ${item.tasinir_kodu}` : item.tasinir_kodu}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Miktar Arttır/Azalt Kontrolü */}
              {isSelected && (
                <div
                  className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-950 p-1 border border-blue-200 dark:border-blue-800 rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setItemMiktarlar((prev: any) => ({
                        ...prev,
                        [item.id]: Math.max(1, (prev[item.id] ?? 1) - 1)
                      }))
                    }
                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={mkt}
                    onChange={(e) =>
                      setItemMiktarlar((prev: any) => ({
                        ...prev,
                        [item.id]: Math.max(1, parseInt(e.target.value, 10) || 1)
                      }))
                    }
                    className="w-10 text-center text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setItemMiktarlar((prev: any) => ({
                        ...prev,
                        [item.id]: (prev[item.id] ?? 1) + 1
                      }))
                    }
                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {filteredLibraryItems.length === 0 && (
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center gap-3">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {libSearchQuery.trim()
                  ? `"${libSearchQuery.trim()}" kütüphanede bulunamadı`
                  : 'Aramanızla eşleşen kayıt bulunamadı'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Bu kalemi doğrudan yeni kalem olarak tanımlayabilir ve dosyaya ekleyebilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchToNewTab(libSearchQuery.trim())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              {libSearchQuery.trim()
                ? `"${libSearchQuery.trim()}" Olarak Yeni Kalem Tanımla`
                : 'Yeni Kalem Tanımla'}
            </button>
          </div>
        )}
      </div>

      {/* Ekle / İptal Aksiyon Butonları */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          İptal
        </button>
        <button
          type="button"
          disabled={selectedItemIds.size === 0}
          onClick={onAddSelected}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {selectedItemIds.size > 0
            ? isYapim
              ? `${selectedItemIds.size} Pozu Ekle`
              : isHizmet
                ? `${selectedItemIds.size} Hizmeti Ekle`
                : `${selectedItemIds.size} Kalem Ekle`
            : isYapim
              ? 'Poz Seçin'
              : 'Kalem Seçin'}
        </button>
      </div>
    </div>
  )
}
