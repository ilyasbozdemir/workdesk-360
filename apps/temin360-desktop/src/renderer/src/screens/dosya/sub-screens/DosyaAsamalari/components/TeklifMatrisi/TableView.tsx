import React, { useRef, useState } from 'react'
import { Award } from 'lucide-react'
import { BiddingFirm, BiddingKalem, TableViewProps } from './types'
import { BidPriceInput } from './BidPriceInput'

export function TableView({
  invitedFirms,
  items,
  bids,
  getEstimatedCostTotal,
  getLowestBidInfo,
  getAverageBid,
  handlePriceChange
}: TableViewProps): React.JSX.Element {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [activeColIndex, setActiveColIndex] = useState<number | null>(null)
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null)

  const focusCell = (itemIdx: number, firmIdx: number) => {
    setActiveColIndex(firmIdx)
    setActiveCellKey(`${itemIdx}_${firmIdx}`)
    const key = `${itemIdx}_${firmIdx}`
    const el = inputRefs.current.get(key)
    if (el) {
      el.focus()
      el.select()
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    itemIdx: number,
    firmIdx: number
  ) => {
    const totalItems = items.length
    const totalFirms = invitedFirms.length

    // 1. Alt + Yön Tuşları: Tüm firmalar arasında yatay veya dikey hızlı geçiş
    //    Alt+ArrowRight: Sonraki firma
    //    Alt+ArrowLeft: Önceki firma
    //    Alt+ArrowDown: Sonraki kalem (aynı firma)
    //    Alt+ArrowUp: Önceki kalem (aynı firma)
    if (e.altKey) {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const nextFirm = (firmIdx + 1) % totalFirms
        focusCell(itemIdx, nextFirm)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prevFirm = (firmIdx - 1 + totalFirms) % totalFirms
        focusCell(itemIdx, prevFirm)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextItem = (itemIdx + 1) % totalItems
        focusCell(nextItem, firmIdx)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevItem = (itemIdx - 1 + totalItems) % totalItems
        focusCell(prevItem, firmIdx)
        return
      }
    }

    // 2. Normal Enter: Bir sonraki kaleme (aşağı) in (Excel stili)
    //    Shift + Enter: Bir önceki kaleme (yukarı) çık
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        if (itemIdx > 0) {
          focusCell(itemIdx - 1, firmIdx)
        }
      } else {
        if (itemIdx < totalItems - 1) {
          focusCell(itemIdx + 1, firmIdx)
        } else if (firmIdx < totalFirms - 1) {
          // Son kalemde Enter'a basarsa bir sonraki firmanın ilk kalemine geç
          focusCell(0, firmIdx + 1)
        }
      }
      return
    }

    // 3. Normal Ok Tuşları ile Hücreler Arası Gezinme (Yukarı / Aşağı kesin)
    if (e.key === 'ArrowDown') {
      if (itemIdx < totalItems - 1) {
        e.preventDefault()
        focusCell(itemIdx + 1, firmIdx)
      }
    } else if (e.key === 'ArrowUp') {
      if (itemIdx > 0) {
        e.preventDefault()
        focusCell(itemIdx - 1, firmIdx)
      }
    }
  }
  return (
    <div className="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs animate-in fade-in duration-300">
      <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-950/60">
            <th className="p-3 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 w-48">
              Malzeme/Hizmet Adı
            </th>
            <th className="p-3 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-center w-28">
              Miktar / Birim
            </th>
            {invitedFirms.map((firma, fIdx) => {
              const isColActive = activeColIndex === fIdx
              return (
                <th
                  key={`th_firm_${firma.id ?? fIdx}_${fIdx}`}
                  className={`p-3 border font-bold text-right min-w-[155px] transition-all cursor-pointer ${
                    isColActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                  }`}
                  onClick={() => focusCell(0, fIdx)}
                  title={`${firma.unvan} sütununa odaklan (Alt+Sağ/Sol)`}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {isColActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                    <div className="truncate max-w-[140px] text-right font-extrabold" title={firma.unvan}>
                      {firma.unvan}
                    </div>
                  </div>
                </th>
              )
            })}
            <th className="p-3 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-right w-36 bg-slate-100/30 dark:bg-slate-950/20">
              Ort. (Yaklaşık)
            </th>
            <th className="p-3 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-right w-36 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]">
              En Düşük
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((kalem, kIdx) => {
            const lowest = getLowestBidInfo(kalem.id)
            const avgPrice = getAverageBid(kalem.id)

            return (
              <tr
                key={`tr_kalem_${kalem.id ?? kIdx}_${kIdx}`}
                className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors"
              >
                <td className="p-3 border border-slate-200 dark:border-slate-805 font-semibold text-slate-800 dark:text-slate-200 bg-slate-50/20 dark:bg-slate-950/5">
                  {kalem.kalem_adi}
                </td>
                <td className="p-3 border border-slate-200 dark:border-slate-805 text-center text-slate-500">
                  {kalem.miktar} {kalem.birim}
                </td>
                {invitedFirms.map((firma, fIdx) => {
                  const val = bids[`${kalem.id}_${firma.id}`] || 0
                  const isLowest = lowest.price > 0 && lowest.firmaId === firma.id
                  const isColActive = activeColIndex === fIdx
                  const isCellFocused = activeCellKey === `${kIdx}_${fIdx}`

                  return (
                    <td
                      key={`td_firm_${kalem.id ?? kIdx}_${firma.id ?? fIdx}_${fIdx}`}
                      className={`p-0 border text-right transition-colors ${
                        isCellFocused
                          ? 'ring-2 ring-blue-500 z-10 border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                          : isColActive
                            ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                            : isLowest
                              ? 'bg-emerald-500/[0.05] dark:bg-emerald-500/[0.02] border-slate-200 dark:border-slate-805'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-805'
                      }`}
                    >
                      <div className="relative flex items-center w-full h-full">
                        <span
                          className={`absolute left-2 text-[10px] font-bold select-none ${
                            isColActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'
                          }`}
                        >
                          ₺
                        </span>
                        <BidPriceInput
                          inputRef={(el) => {
                            if (el) inputRefs.current.set(`${kIdx}_${fIdx}`, el)
                            else inputRefs.current.delete(`${kIdx}_${fIdx}`)
                          }}
                          initialValue={val}
                          onChange={(newVal) => handlePriceChange(kalem.id, firma.id, newVal)}
                          onKeyDown={(e) => handleKeyDown(e, kIdx, fIdx)}
                          onFocus={() => {
                            setActiveColIndex(fIdx)
                            setActiveCellKey(`${kIdx}_${fIdx}`)
                          }}
                          onBlur={() => {
                            setActiveCellKey(null)
                          }}
                          isLowest={isLowest}
                          isExcelStyle={true}
                        />
                      </div>
                    </td>
                  )
                })}
                <td className="p-3 border border-slate-200 dark:border-slate-805 text-right font-bold text-slate-700 dark:text-slate-300 bg-slate-100/10 dark:bg-slate-950/10 font-mono">
                  {avgPrice > 0
                    ? `${avgPrice.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} ₺`
                    : '-'}
                </td>
                <td className="p-3 border border-slate-200 dark:border-slate-805 text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.005] font-mono">
                  <div className="flex items-center justify-end gap-1">
                    {lowest.price > 0 && <Award className="w-3.5 h-3.5 text-emerald-500" />}
                    <span>
                      {lowest.price > 0
                        ? `${lowest.price.toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} ₺`
                        : '-'}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
          {/* TOPLAM TEKLİFLER SATIRI */}
          <tr className="bg-slate-50/80 dark:bg-slate-950/40 font-bold text-slate-850 dark:text-slate-100">
            <td className="p-3.5 border border-slate-200 dark:border-slate-800">
              Toplam Teklif Tutarı
            </td>
            <td className="p-3.5 border border-slate-200 dark:border-slate-800"></td>
            {invitedFirms.map((firma, fIdx) => {
              const isColActive = activeColIndex === fIdx
              return (
                <td
                  key={`td_total_firm_${firma.id ?? fIdx}_${fIdx}`}
                  className={`p-3.5 border text-right text-sm font-extrabold font-mono transition-colors ${
                    isColActive
                      ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-700'
                      : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {firma.teklif_toplami
                    ? `${firma.teklif_toplami.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} ₺`
                    : '0,00 ₺'}
                </td>
              )
            })}
            <td className="p-3.5 border border-slate-200 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-950/10 text-right font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {getEstimatedCostTotal() > 0
                ? `${getEstimatedCostTotal().toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ₺`
                : '-'}
            </td>
            <td className="p-3.5 border border-slate-200 dark:border-slate-800 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.005]"></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
