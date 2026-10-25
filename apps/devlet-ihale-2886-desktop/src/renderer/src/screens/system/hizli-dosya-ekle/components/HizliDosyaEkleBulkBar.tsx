import React, { useState } from 'react'
import { Trash2, Calendar, Check } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { SUREC_ASAMALARI, TEMIN_TURLERI } from './hizliDosyaEkle.types'

interface HizliDosyaEkleBulkBarProps {
  selectedCount: number
  handleBulkChangeAsama: (newAsama: string) => void
  handleBulkChangeTur: (newTur: string) => void
  handleBulkDelete: () => void
  handleBulkApplyDates?: (dates: {
    dosya_acilis_tarihi?: string
    son_teklif_verme_tarihi?: string
    teslim_tarihi?: string
  }) => void
}

export const HizliDosyaEkleBulkBar: React.FC<HizliDosyaEkleBulkBarProps> = ({
  selectedCount,
  handleBulkChangeAsama,
  handleBulkChangeTur,
  handleBulkDelete,
  handleBulkApplyDates
}) => {
  const [bulkAcilis, setBulkAcilis] = useState('')
  const [bulkSonTeklif, setBulkSonTeklif] = useState('')
  const [bulkTeslim, setBulkTeslim] = useState('')

  if (selectedCount === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-150 dark:border-blue-900/30 rounded-xl text-sm animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-blue-700 dark:text-blue-400">
          {selectedCount} dosya seçildi:
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Süreç Aşaması */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Süreç Aşaması:</span>
          <select
            title="Seçilenler için süreç aşaması belirleyin"
            onChange={(e) => {
              if (e.target.value) {
                handleBulkChangeAsama(e.target.value)
                e.target.value = ''
              }
            }}
            className="h-8 px-2 text-xs rounded border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="">Aşama Seçin...</option>
            {SUREC_ASAMALARI.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Temin / Alım Türü */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Temin Türü:</span>
          <select
            title="Seçilenler için temin türü belirleyin"
            onChange={(e) => {
              if (e.target.value) {
                handleBulkChangeTur(e.target.value)
                e.target.value = ''
              }
            }}
            className="h-8 px-2 text-xs rounded border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="">Tür Seçin...</option>
            {TEMIN_TURLERI.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Toplu Tarih Atama (Opsiyonel Mini Popover / Inputs) */}
        {handleBulkApplyDates && (
          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/70 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <input
              type="date"
              title="Seçilenlere toplu açılış tarihi ata"
              value={bulkAcilis}
              onChange={(e) => setBulkAcilis(e.target.value)}
              placeholder="Açılış"
              className="h-6 px-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            />
            <input
              type="datetime-local"
              title="Seçilenlere toplu son teklif tarihi/saati ata"
              value={bulkSonTeklif}
              onChange={(e) => setBulkSonTeklif(e.target.value)}
              className="h-6 px-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            />
            <input
              type="date"
              title="Seçilenlere toplu tahmini bitiş tarihi ata"
              value={bulkTeslim}
              onChange={(e) => setBulkTeslim(e.target.value)}
              className="h-6 px-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            />
            <button
              type="button"
              disabled={!bulkAcilis && !bulkSonTeklif && !bulkTeslim}
              onClick={() => {
                const dates: {
                  dosya_acilis_tarihi?: string
                  son_teklif_verme_tarihi?: string
                  teslim_tarihi?: string
                } = {}
                if (bulkAcilis) dates.dosya_acilis_tarihi = bulkAcilis
                if (bulkSonTeklif) dates.son_teklif_verme_tarihi = bulkSonTeklif
                if (bulkTeslim) dates.teslim_tarihi = bulkTeslim
                handleBulkApplyDates(dates)
                setBulkAcilis('')
                setBulkSonTeklif('')
                setBulkTeslim('')
              }}
              className="flex items-center gap-0.5 h-6 px-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/70 hover:bg-blue-200/80 rounded transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              Uygula
            </button>
          </div>
        )}

        <Button
          variant="outline"
          onClick={handleBulkDelete}
          className="h-8 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Seçilenleri Sil
        </Button>
      </div>
    </div>
  )
}
