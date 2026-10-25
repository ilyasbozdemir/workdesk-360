import React, { useMemo, useState } from 'react'
import { CheckCircle2, HelpCircle, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '../../../../../../utils/cn'
import { YeniDosyaTabProps } from '../../../../types'
import { useTeminNoChecker } from '../../../../../../hooks/useTeminNoChecker'
import { ButceTipiHelpModal } from './ButceTipiHelpModal'

export const TeminNoAndButceFields: React.FC<YeniDosyaTabProps> = (props) => {
  const { formData, setFormData, isEdit, editId, getNextTeminNo } = props
  const [showButceHelpModal, setShowButceHelpModal] = useState(false)

  const targetYear = useMemo(() => {
    return (
      formData.butce_yili ||
      (formData.dosya_acilis_tarihi
        ? new Date(formData.dosya_acilis_tarihi).getFullYear()
        : new Date().getFullYear())
    )
  }, [formData.butce_yili, formData.dosya_acilis_tarihi])

  const currentTargetId = isEdit
    ? editId || (formData as any)?.id || null
    : (formData as any)?.id || null

  const {
    isChecking: isCheckingTeminNo,
    isDuplicate: isDuplicateTeminNo,
    duplicateInfo,
    isYearMismatch,
    isAvailable: isAvailableTeminNo,
    nextAvailableNo
  } = useTeminNoChecker(
    formData.temin_no || '',
    targetYear,
    currentTargetId,
    formData.ihale_tipi || undefined
  )

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            Bütçe Yılı *
          </label>
          <select
            value={formData.butce_yili || new Date().getFullYear()}
            onChange={(e) => {
              const newYear = parseInt(e.target.value, 10)
              const oldYear = formData.butce_yili
              let updatedTeminNo = formData.temin_no

              if (newYear && newYear !== oldYear) {
                if (getNextTeminNo) {
                  updatedTeminNo = getNextTeminNo(newYear)
                } else if (updatedTeminNo) {
                  updatedTeminNo = updatedTeminNo.replace(/^\d{4}/, newYear.toString())
                }
              }

              setFormData({
                ...formData,
                butce_yili: newYear,
                temin_no: updatedTeminNo
              })
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-bold"
          >
            {(() => {
              const currentYear = new Date().getFullYear()
              const startYear = 2020
              const options: number[] = []
              for (let y = currentYear; y >= startYear; y--) {
                options.push(y)
              }
              return options.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))
            })()}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Bütçe Tipi *
            </label>
            <button
              type="button"
              onClick={() => setShowButceHelpModal(true)}
              className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md border-none transition-colors"
              title="Bütçe tipleri mevzuatı ve kapsam rehberini görüntüle"
            >
              <HelpCircle size={12} /> Rehber &amp; Bilgi
            </button>
          </div>
          <select
            value={formData.butce_tipi || 'Genel Bütçe'}
            onChange={(e) =>
              setFormData({
                ...formData,
                butce_tipi: e.target.value
              })
            }
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="Genel Bütçe">Genel Bütçe</option>
            <option value="Döner Sermaye">Döner Sermaye</option>
            <option value="Özel Bütçe">Özel Bütçe</option>
            <option value="Diğer">Diğer</option>
          </select>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            {formData.butce_tipi === 'Döner Sermaye'
              ? '💡 Döner Sermaye: Kurumun mal/hizmet üretim gelirlerinden karşılanır (Hastaneler, DÖSE vb.).'
              : formData.butce_tipi === 'Özel Bütçe'
                ? '💡 Özel Bütçe: Kurumun öz gelirleri ve genel bütçe transferiyle karşılanır (Üniversiteler, DSİ vb.).'
                : formData.butce_tipi === 'Diğer'
                  ? '💡 Diğer: Mahalli İdareler (Belediyeler), SGK veya Üst Kurullar (RTÜK, BDDK vb.).'
                  : '💡 Genel Bütçe: Hazine gelirlerinden Merkezi Yönetim Bütçe Kanununa göre karşılanır.'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-405 flex items-center gap-1.5">
              <span>Doğrudan Temin Numarası *</span>
            </label>
            {isCheckingTeminNo && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Kontrol ediliyor...
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={formData.temin_no || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  temin_no: e.target.value
                })
              }
              onBlur={(e) => {
                let val = e.target.value.trim()
                if (!val) return
                const doubleMatch = val.match(/^(\d{4})[/-]\1[/-](\d+)$/)
                if (doubleMatch) {
                  val = `${targetYear}/${doubleMatch[2]}`
                } else if (/^\d+$/.test(val)) {
                  val = `${targetYear}/${val}`
                } else {
                  const yearMatch = val.match(/^(\d{4})([/-].+)$/)
                  if (yearMatch && parseInt(yearMatch[1], 10) !== targetYear) {
                    val = `${targetYear}${yearMatch[2]}`
                  }
                }
                setFormData({
                  ...formData,
                  temin_no: val
                })
              }}
              placeholder={`Örn: ${targetYear}/1`}
              className={cn(
                'w-full pl-3.5 pr-24 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-xs focus:outline-none focus:ring-1 text-slate-800 dark:text-slate-200 font-bold transition-all',
                isYearMismatch
                  ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-400/20 bg-rose-50/20'
                  : isDuplicateTeminNo
                    ? 'border-amber-300 dark:border-amber-700/60 focus:ring-amber-400/20 bg-amber-50/20'
                    : isAvailableTeminNo
                      ? 'border-emerald-300 dark:border-emerald-700/50 focus:ring-emerald-400/20'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500'
              )}
            />
            <button
              type="button"
              title="Sıradaki müsait benzersiz numarayı ata"
              onClick={() => {
                const nextNo =
                  nextAvailableNo ||
                  (getNextTeminNo ? getNextTeminNo(targetYear) : `${targetYear}/1`)
                setFormData({ ...formData, temin_no: nextNo })
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border-none"
            >
              <RefreshCw size={11} /> Sıradaki No
            </button>
          </div>

          {/* YIL UYUŞMAZLIĞI İKAZI */}
          {isYearMismatch && (
            <div className="flex items-center justify-between gap-2 mt-1.5 px-3 py-1.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 rounded-lg text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-rose-500 shrink-0">⚠️</span>
                <span className="truncate">
                  Temin numarası (<strong>{formData.temin_no}</strong>) bütçe yılı (
                  <strong>{targetYear}</strong>) ile uyumlu değildir!
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  let val = (formData.temin_no || '').trim()
                  val = val.replace(/^\d{4}/, targetYear.toString())
                  if (!val.startsWith(`${targetYear}/`) && !val.startsWith(`DT${targetYear}/`)) {
                    val = `${targetYear}/${val}`
                  }
                  setFormData({ ...formData, temin_no: val })
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-colors shrink-0 cursor-pointer border-none"
              >
                {targetYear} Yılına Uyarla
              </button>
            </div>
          )}

          {/* KİBAR & ZARİF BİLGİLENDİRME SATIRI */}
          {!isYearMismatch && isDuplicateTeminNo && duplicateInfo && (
            <div className="flex items-center justify-between gap-2 mt-1.5 px-3 py-1.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 rounded-lg text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-amber-500 shrink-0">ℹ️</span>
                <span className="truncate">
                  Bu numara{' '}
                  <strong>
                    #{duplicateInfo.id} - {duplicateInfo.konu}
                  </strong>{' '}
                  dosyasında kayıtlı.
                </span>
              </div>
              {nextAvailableNo && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, temin_no: nextAvailableNo })}
                  className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded text-[10px] font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  Sıradaki: {nextAvailableNo}
                </button>
              )}
            </div>
          )}

          {!isYearMismatch && isAvailableTeminNo && formData.temin_no && (
            <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-150">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Bu numara kullanılabilir.</span>
            </div>
          )}
        </div>
      </div>

      <ButceTipiHelpModal
        isOpen={showButceHelpModal}
        onClose={() => setShowButceHelpModal(false)}
        selectedType={formData.butce_tipi || 'Genel Bütçe'}
      />
    </>
  )
}
