import React, { useState } from 'react'
import { Search, LayoutGrid, List, Table } from 'lucide-react'

interface PoolFirm {
  id: number
  unvan: string
  firma_kodu?: string
  istigal_konusu?: string
  il?: string
  vergi_no?: string
  telefon?: string
  email?: string
}

interface FirmaSecmeModaliProps {
  isOpen: boolean
  onClose: () => void
  allPoolFirms: PoolFirm[]
  invitedFirms: any[]
  selectedFirmIds: number[]
  setSelectedFirmIds: React.Dispatch<React.SetStateAction<number[]>>
  modalSearchQuery: string
  setModalSearchQuery: (query: string) => void
  onAddFirms: () => Promise<void>
}

export const FirmaSecmeModali: React.FC<FirmaSecmeModaliProps> = ({
  isOpen,
  onClose,
  allPoolFirms,
  invitedFirms,
  selectedFirmIds,
  setSelectedFirmIds,
  modalSearchQuery,
  setModalSearchQuery,
  onAddFirms
}) => {
  const [viewType, setViewType] = useState<'table' | 'grid' | 'list'>('table')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleAddFirmsWithLoading = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onAddFirms()
    } finally {
      setIsSubmitting(false)
    }
  }

  const unselectedFirms = allPoolFirms.filter(
    (pf) => !invitedFirms.some((ifrm) => ifrm.firma_id === pf.id)
  )

  const filteredFirms = unselectedFirms.filter((pf) => {
    if (!modalSearchQuery.trim()) return true
    const q = modalSearchQuery.toLowerCase()
    return (
      pf.unvan?.toLowerCase().includes(q) ||
      pf.firma_kodu?.toLowerCase().includes(q) ||
      pf.vergi_no?.toLowerCase().includes(q) ||
      pf.il?.toLowerCase().includes(q) ||
      pf.istigal_konusu?.toLowerCase().includes(q)
    )
  })

  const toggleFirmSelection = (id: number) => {
    if (selectedFirmIds.includes(id)) {
      setSelectedFirmIds((prev) => prev.filter((fid) => fid !== id))
    } else {
      setSelectedFirmIds((prev) => [...prev, id])
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-lg font-bold text-slate-855 dark:text-slate-100">
              İstekli Firmaları Seçin
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Dosya kapsamına davet edilip fiyat araştırması yapılacak istekli firmaları seçin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

        {/* Toolbar: Search and View Switcher */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-850 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Firma adı, kodu, vergi no, şehir veya iştigal konusu ara..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-medium text-left"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5 self-end sm:self-auto">
            <button
              onClick={() => setViewType('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewType === 'table'
                  ? 'bg-white dark:bg-slate-750 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Tablo Görünümü"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewType === 'grid'
                  ? 'bg-white dark:bg-slate-750 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Kart (Grid) Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewType === 'list'
                  ? 'bg-white dark:bg-slate-750 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/20 dark:bg-slate-950/20">
          {filteredFirms.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-500 dark:text-slate-400 italic">
              Arama kriterlerine uygun eklenebilecek yeni tedarikçi bulunamadı.
            </div>
          ) : (
            <>
              {/* TABLE VIEW */}
              {viewType === 'table' && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <th className="p-3 w-12 text-center">Seç</th>
                        <th className="p-3 w-28">Firma Kodu</th>
                        <th className="p-3">Firma Ünvanı</th>
                        <th className="p-3">İştigal Konusu / İl</th>
                        <th className="p-3 w-32">Vergi No</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredFirms.map((pf) => {
                        const isSelected = selectedFirmIds.includes(pf.id)
                        return (
                          <tr
                            key={pf.id}
                            onClick={() => toggleFirmSelection(pf.id)}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/20 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/30 dark:bg-blue-955/10 font-medium' : ''
                            }`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleFirmSelection(pf.id)}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-semibold text-slate-500 dark:text-slate-400">
                              {pf.firma_kodu || '-'}
                            </td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              {pf.unvan}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              <div className="truncate max-w-[200px]" title={pf.istigal_konusu}>
                                {pf.istigal_konusu || '-'}
                              </div>
                              <div className="text-[10px] text-slate-450 mt-0.5">
                                {pf.il || '-'}
                              </div>
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">
                              {pf.vergi_no || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* GRID VIEW */}
              {viewType === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredFirms.map((pf) => {
                    const isSelected = selectedFirmIds.includes(pf.id)
                    return (
                      <div
                        key={pf.id}
                        onClick={() => toggleFirmSelection(pf.id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between gap-3 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-955/10 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFirmSelection(pf.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <div className="overflow-hidden">
                            <div
                              className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate"
                              title={pf.unvan}
                            >
                              {pf.unvan}
                            </div>
                            <div className="text-[10px] text-slate-450 mt-1 font-semibold">
                              Kod: {pf.firma_kodu || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <div>İl: {pf.il || '-'}</div>
                          <div className="truncate" title={pf.istigal_konusu}>
                            Konu: {pf.istigal_konusu || '-'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* LIST VIEW */}
              {viewType === 'list' && (
                <div className="flex flex-col gap-2">
                  {filteredFirms.map((pf) => {
                    const isSelected = selectedFirmIds.includes(pf.id)
                    return (
                      <div
                        key={pf.id}
                        onClick={() => toggleFirmSelection(pf.id)}
                        className={`px-4 py-3 rounded-xl border cursor-pointer flex items-center justify-between text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-955/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/35'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFirmSelection(pf.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <span className="text-[11px] font-semibold text-slate-400 w-16 shrink-0">
                            {pf.firma_kodu || '-'}
                          </span>
                          <span
                            className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm"
                            title={pf.unvan}
                          >
                            {pf.unvan}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate ml-4 hidden md:inline">
                            {pf.istigal_konusu ? `(${pf.istigal_konusu})` : ''}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-md text-slate-500 dark:text-slate-400">
                          {pf.il || '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-650 dark:text-slate-400">
            {selectedFirmIds.length} tedarikçi seçildi
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              onClick={handleAddFirmsWithLoading}
              disabled={selectedFirmIds.length === 0 || isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Ekleniyor...' : 'Seçilenleri Dosyaya Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
