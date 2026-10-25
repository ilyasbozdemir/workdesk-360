import React, { useEffect, useState } from 'react'
import {
  Building,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Hammer,
  Layers,
  Package,
  Sparkles,
  Wrench,
  X
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../../../constants/routeConstants'
import { emitAppEvent } from '../../../../utils/appEvents'
import { logActivity } from '../../../../utils/logger'
import { formatDate } from '../../../../utils/formatters'
import type { TeminDosyasi } from '../../../dosyalar/dosyalar.hooks'

export interface TakipDosyaDetayDialogProps {
  isOpen: boolean
  onClose: () => void
  dosya: TeminDosyasi | null
  formatCurrency: (val: number) => string
  onEdit: (dosyaId: number) => void
  onOpenSurec: (dosya: TeminDosyasi) => void
  onDosyaUpdated?: (updatedDosya: Partial<TeminDosyasi> & { id: number }) => void
}

const STAGES = [
  { id: 1, title: 'İhtiyaç Tespiti & Başlangıç', short: '1. Hazırlık' },
  { id: 2, title: 'Piyasa Fiyat Araştırması', short: '2. Piyasa & Teklif' },
  { id: 3, title: 'Sipariş & Sözleşme', short: '3. Sipariş & Onay' },
  { id: 4, title: 'Kabul & Ödeme İşlemleri', short: '4. Kabul & Muayene' }
]

export function TakipDosyaDetayDialog({
  isOpen,
  onClose,
  dosya,
  formatCurrency,
  onEdit,
  onOpenSurec,
  onDosyaUpdated
}: TakipDosyaDetayDialogProps): React.JSX.Element | null {
  const navigate = useNavigate()
  const [overrideStage, setOverrideStage] = useState<number | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const currentStage =
    overrideStage ?? (dosya?.status === 'tamamlandi' ? 4 : Number(dosya?.durum_asama_id) || 1)
  const currentStatus = overrideStatus ?? (dosya?.status || 'devam_ediyor')

  // ESC tuşu ile kapatma
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !dosya) return null

  // Aşama değiştirme (Dialog içi etkileşim)
  const handleStageChange = async (newStageId: number): Promise<void> => {
    if (currentStage === newStageId || isUpdating) return

    try {
      setIsUpdating(true)
      const newStatus = newStageId === 4 ? 'tamamlandi' : 'devam_ediyor'
      setOverrideStage(newStageId)
      setOverrideStatus(newStatus)

      if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET durum_asama_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newStageId, newStatus, dosya.id]
        )
      }

      emitAppEvent('status:changed', {
        dosyaId: dosya.id,
        payload: { status: newStatus }
      })
      emitAppEvent('dossier:updated', { dosyaId: dosya.id })

      if (onDosyaUpdated) {
        onDosyaUpdated({
          id: dosya.id,
          durum_asama_id: newStageId,
          status: newStatus
        })
      }

      await logActivity(
        'Dosya Aşaması Güncellendi (Detay Dialog)',
        `#${dosya.temin_no || dosya.id} dosyası Aşama ${newStageId} (${
          STAGES[newStageId - 1]?.short
        }) olarak güncellendi.`,
        'info'
      )

      setFeedbackMsg(`Aşama başarıyla "${STAGES[newStageId - 1]?.title}" olarak güncellendi.`)
      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch (err: unknown) {
      console.error('Aşama güncelleme hatası:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Durum değiştirme (Aktif, Tamamlandı, İptal)
  const handleStatusChange = async (newStatus: string): Promise<void> => {
    if (currentStatus === newStatus || isUpdating) return

    try {
      setIsUpdating(true)
      setOverrideStatus(newStatus)
      const newStage = newStatus === 'tamamlandi' ? 4 : currentStage
      if (newStatus === 'tamamlandi') {
        setOverrideStage(4)
      }

      if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET status = ?, durum_asama_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newStatus, newStage, dosya.id]
        )
      }

      emitAppEvent('status:changed', {
        dosyaId: dosya.id,
        payload: { status: newStatus }
      })
      emitAppEvent('dossier:updated', { dosyaId: dosya.id })

      if (onDosyaUpdated) {
        onDosyaUpdated({
          id: dosya.id,
          status: newStatus,
          durum_asama_id: newStage
        })
      }

      setFeedbackMsg(`Dosya durumu "${newStatus}" olarak güncellendi.`)
      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch (err: unknown) {
      console.error('Durum güncelleme hatası:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Alım Türü Rozeti
  const getTurInfo = (tur?: string): { label: string; icon: React.ElementType; color: string } => {
    switch (tur) {
      case 'mal':
        return {
          label: 'Mal Alımı',
          icon: Package,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
        }
      case 'hizmet':
        return {
          label: 'Hizmet Alımı',
          icon: Wrench,
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
        }
      case 'yapim_isi':
        return {
          label: 'Yapım İşi',
          icon: Hammer,
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        }
      case 'danismanlik':
        return {
          label: 'Danışmanlık',
          icon: FileText,
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
        }
      default:
        return {
          label: tur || 'Standart Alım',
          icon: Package,
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
        }
    }
  }

  const turInfo = getTurInfo(dosya.tur)
  const TurIcon = turInfo.icon

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* TOP BAR / HEADER */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-blue-100/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
              {dosya.temin_no || `#${dosya.id}`}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl ${turInfo.color}`}
            >
              <TurIcon size={13} />
              {turInfo.label}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {dosya.ihale_sekli || '22/d*'}
            </span>

            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border ${
                currentStatus === 'tamamlandi'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : currentStatus === 'iptal'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {currentStatus === 'tamamlandi'
                ? 'Tamamlandı'
                : currentStatus === 'iptal'
                  ? 'İptal Edildi'
                  : 'Devam Ediyor'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedbackMsg && (
          <div className="mx-6 mt-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-in fade-in">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* MAIN BODY (TWO COLUMNS: LEFT CONTENT & RIGHT TRELLO ACTION SIDEBAR) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {/* LEFT CONTENT AREA */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Subject Title */}
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                {dosya.konu || 'İsimsiz Temin Dosyası'}
              </h2>
              {dosya.isin_aciklamasi && (
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {dosya.isin_aciklamasi}
                </p>
              )}
            </div>

            {/* STAGE PIPELINE STEPPER (TRELLO FLOW) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-blue-600 dark:text-blue-400" />
                  İş Akışı Aşaması (Tıklayarak Değiştirebilirsiniz)
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                  Aşama {currentStage} / 4
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STAGES.map((s) => {
                  const isActive = currentStage === s.id
                  const isPassed = currentStage > s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStageChange(s.id)}
                      disabled={isUpdating}
                      className={`flex flex-col p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                          : isPassed
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-300'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold opacity-80">
                        {isPassed ? '✓ ' : ''}
                        {s.short}
                      </span>
                      <span className="text-[11px] font-bold truncate mt-0.5">{s.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* KEY METRICS & TIMELINE */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Yaklaşık Maliyet
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                  {formatCurrency(dosya.yaklasik_maliyet || 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bütçe Yılı / KDV
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {dosya.butce_yili || new Date().getFullYear()} / %{dosya.kdv || 20}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sözleşme / Teklif Şekli
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                  {dosya.teklif_sozlesme_turu || 'Birim Fiyat'}
                </span>
              </div>
            </div>

            {/* ADMINISTRATIVE & DEPARTMENT DETAILS */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                İdari & Birim Bilgileri
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {dosya.birim_adi && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Building size={14} className="text-blue-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Talep Eden Birim
                      </span>
                      <span className="font-bold">{dosya.birim_adi}</span>
                    </div>
                  </div>
                )}

                {dosya.ihtiyac_yeri && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Layers size={14} className="text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        İhtiyaç Yeri
                      </span>
                      <span className="font-bold">{dosya.ihtiyac_yeri}</span>
                    </div>
                  </div>
                )}

                {dosya.dosya_acilis_tarihi && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Calendar size={14} className="text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Açılış Tarihi
                      </span>
                      <span className="font-bold">{formatDate(dosya.dosya_acilis_tarihi)}</span>
                    </div>
                  </div>
                )}

                {dosya.son_teklif_verme_tarihi && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock size={14} className="text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Son Teklif Tarihi
                      </span>
                      <span className="font-bold">{formatDate(dosya.son_teklif_verme_tarihi)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Açıklama & Maddeler */}
            {dosya.isin_aciklamasi && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-extrabold uppercase text-[10px] tracking-wider block text-amber-700 dark:text-amber-400">
                  İşin Açıklaması & Kapsamı
                </span>
                <p className="whitespace-pre-line leading-relaxed">{dosya.isin_aciklamasi}</p>
              </div>
            )}
          </div>

          {/* RIGHT ACTION SIDEBAR (TRELLO STYLE) */}
          <div className="w-full md:w-64 p-5 bg-slate-50/60 dark:bg-slate-950/40 space-y-5">
            {/* Quick Actions */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                İşlemler & Hızlı Erişim
              </span>

              <button
                type="button"
                onClick={() => {
                  onOpenSurec(dosya)
                  onClose()
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} />
                  <span>Süreç Adımlarına Git</span>
                </div>
                <ChevronRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => {
                  onEdit(dosya.id)
                  onClose()
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                <Edit size={14} className="text-slate-500" />
                <span>Dosyayı Düzenle</span>
              </button>
            </div>

            {/* Status Change Dropdown */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
                Dosya Durumu
              </span>

              <div className="space-y-1">
                {[
                  { id: 'devam_ediyor', label: 'Devam Ediyor' },
                  { id: 'tamamlandi', label: 'Tamamlandı' },
                  { id: 'iptal', label: 'İptal Edildi' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStatusChange(st.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                      currentStatus === st.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    <span>{st.label}</span>
                    {currentStatus === st.id && (
                      <CheckCircle2 size={13} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-400 space-y-1">
              <div>Kayıt ID: #{dosya.id}</div>
              <div>
                Son Güncelleme: {dosya.updated_at ? formatDate(dosya.updated_at) : 'Güncel'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
