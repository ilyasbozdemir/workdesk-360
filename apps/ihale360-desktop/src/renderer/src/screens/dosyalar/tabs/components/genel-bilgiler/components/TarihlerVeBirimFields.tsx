import React from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../../../../../utils/cn'
import { YeniDosyaTabProps } from '../../../../types'

function formatDateTimeLocal(raw?: string | null): string {
  if (!raw) return ''
  const str = String(raw).trim().replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str}T10:00`
  }
  const standardMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (standardMatch) {
    return `${standardMatch[1]}-${standardMatch[2]}-${standardMatch[3]}T${standardMatch[4]}:${standardMatch[5]}`
  }
  const malformedMatch = str.match(/^(\d{4})\d+-(\d{2})-(\d{2})(?:T(\d{1,2})(?::(\d{1,2}))?)?/)
  if (malformedMatch) {
    const hh = (malformedMatch[4] || '10').padStart(2, '0')
    const mm = (malformedMatch[5] || '00').padStart(2, '0')
    return `${malformedMatch[1]}-${malformedMatch[2]}-${malformedMatch[3]}T${hh}:${mm}`
  }
  return ''
}

export const TarihlerVeBirimFields: React.FC<YeniDosyaTabProps> = (props) => {
  const {
    formData,
    setFormData,
    birimler,
    getNextTeminNo,
    showBirimSearch,
    setShowBirimSearch,
    birimSearchQuery,
    setBirimSearchQuery,
    filteredBirimler,
    handleSelectBirim
  } = props

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
          Dosya Açılış Tarihi *
        </label>
        <input
          type="date"
          value={formData.dosya_acilis_tarihi || ''}
          onChange={(e) => {
            const newDate = e.target.value
            const oldDate = formData.dosya_acilis_tarihi
            const newYear = newDate ? new Date(newDate).getFullYear() : null
            const oldYear = oldDate ? new Date(oldDate).getFullYear() : null

            let updatedTeminNo = formData.temin_no
            if (newYear && newYear !== oldYear) {
              const oldYearStr = oldYear ? oldYear.toString() : ''
              const isOldPattern =
                !formData.temin_no ||
                formData.temin_no.startsWith(`${oldYearStr}/`) ||
                formData.temin_no.startsWith(`DT${oldYearStr}/`)

              if (isOldPattern && getNextTeminNo) {
                updatedTeminNo = getNextTeminNo(newYear)
              }
            }

            setFormData({
              ...formData,
              dosya_acilis_tarihi: newDate,
              butce_yili: newYear || formData.butce_yili,
              temin_no: updatedTeminNo
            })
          }}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
          Son Teklif Verme Tarih &amp; Saati
        </label>
        <input
          type="datetime-local"
          value={formatDateTimeLocal(formData.son_teklif_verme_tarihi)}
          onChange={(e) =>
            setFormData({
              ...formData,
              son_teklif_verme_tarihi: e.target.value
            })
          }
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
          Tahmini Bitiş / Teslim Tarihi
        </label>
        <input
          type="date"
          value={formData.teslim_tarihi || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              teslim_tarihi: e.target.value
            })
          }
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
        />
      </div>

      <div className="relative">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">
          İhalesi Yapılacak Birim / Müdürlük
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBirimSearch?.(!showBirimSearch)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 text-left cursor-pointer"
          >
            <span>
              {formData.birim_id
                ? birimler.find((b) => b.id === formData.birim_id)?.birim_adi
                : 'Birim Seçiniz...'}
            </span>
            <Search size={14} className="text-slate-400" />
          </button>

          {showBirimSearch && (
            <div className="absolute left-0 mt-1.5 w-full bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <input
                type="text"
                placeholder="Birim ara..."
                value={birimSearchQuery}
                onChange={(e) => setBirimSearchQuery?.(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                {(filteredBirimler ?? []).length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-450">Birim bulunamadı.</div>
                ) : (
                  (filteredBirimler ?? []).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBirim?.(b)}
                      className={cn(
                        'w-full text-left p-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors cursor-pointer',
                        formData.birim_id === b.id &&
                          'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 font-bold'
                      )}
                    >
                      {b.birim_adi}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Birim seçildiğinde antet, sunum makamı ve bütçe kodları otomatik doldurulur.
        </p>
      </div>
    </>
  )
}
