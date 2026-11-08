import React, { useState, useEffect } from 'react'
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  RotateCcw,
  History,
  FileCheck2,
  Info,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

interface DosyaSurecAsistaniProps {
  dosyaId: number
  dosyaNo?: string
  konu?: string
  onTransitionSuccess?: () => void
}

export const DosyaSurecAsistani: React.FC<DosyaSurecAsistaniProps> = ({
  dosyaId,
  dosyaNo,
  konu,
  onTransitionSuccess
}) => {
  const { userRoles } = useWorkspaceContextStore()
  const activeRole = userRoles[0] || 'satin_alma'

  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState<any>(null)
  const [availableActions, setAvailableActions] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [submittingTransition, setSubmittingTransition] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // İade / Gerekçe Modalı
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returnTransitionId, setReturnTransitionId] = useState<string | null>(null)
  const [returnReasonText, setReturnReasonText] = useState('')

  const loadWorkflowData = async () => {
    try {
      setLoading(true)
      setActionError(null)

      if (!window.api?.workflow) {
        setLoading(false)
        return
      }

      const [inst, actions, hist, tsk] = await Promise.all([
        window.api.workflow.getInstance(dosyaId),
        window.api.workflow.getAvailableActions({ dosyaId, actorRole: activeRole }),
        window.api.workflow.getHistory(dosyaId),
        window.api.workflow.getTasks({ dosyaId })
      ])

      setInstance(inst)
      setAvailableActions(actions || [])
      setHistory(hist || [])
      setTasks(tsk || [])
    } catch (err: any) {
      console.warn('[DosyaSurecAsistani] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dosyaId) {
      loadWorkflowData()
    }
  }, [dosyaId, activeRole])

  const handleExecuteTransition = async (transitionId: string, reason?: string) => {
    try {
      setSubmittingTransition(transitionId)
      setActionError(null)
      setActionSuccess(null)

      if (!window.api?.workflow) return

      const res = await window.api.workflow.executeTransition({
        dosyaId,
        transitionId,
        actorRole: activeRole,
        actorId: 'CURRENT_USER',
        reason
      })

      if (res?.success) {
        setActionSuccess('İşlem başarıyla gerçekleştirildi.')
        setReturnModalOpen(false)
        setReturnReasonText('')
        await loadWorkflowData()
        if (onTransitionSuccess) onTransitionSuccess()
      } else {
        setActionError(res?.error || 'Geçiş gerçekleştirilemedi.')
      }
    } catch (err: any) {
      setActionError(err?.message || 'Geçiş sırasında bir hata oluştu.')
    } finally {
      setSubmittingTransition(null)
    }
  }

  const getStateBadge = (stateId: string) => {
    switch (stateId) {
      case 'PROCUREMENT_DRAFT':
        return { label: '1. İhtiyaç & Dosya Hazırlığı', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' }
      case 'MARKET_RESEARCH':
        return { label: '2. Piyasa Fiyat Araştırması', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' }
      case 'ORDER_CONTRACT':
        return { label: '3. Sipariş & Sözleşme', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' }
      case 'INSPECTION_ACCEPTANCE':
        return { label: '4. Muayene & Kabul', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' }
      case 'FINANCE_REVIEW':
        return { label: '5. Mali Hizmetler İncelemesi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' }
      case 'ACCOUNTING_PAYMENT':
        return { label: '6. Muhasebe & Ödeme (MİF/ÖEB)', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800' }
      case 'COMPLETED':
        return { label: '7. Süreç Tamamlandı (Arşiv)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700' }
      case 'RETURNED':
        return { label: 'İade Edildi / Düzeltme Bekliyor', color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700' }
      default:
        return { label: stateId, color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300' }
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-center gap-3 text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        Dosya süreç asistanı ve kurallar değerlendiriliyor...
      </div>
    )
  }

  const currentBadge = getStateBadge(instance?.currentState || 'PROCUREMENT_DRAFT')

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      {/* Başlık ve Durum */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Compass className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Dosya Süreç Asistanı & Kural Motoru
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                Uçtan Uca Takip
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5018 & 4734 Kamu Süreç Zinciri — Sorumluluk, Onay ve Geçiş Denetimi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Mevcut Aşama:</span>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold border ${currentBadge.color}`}
          >
            {currentBadge.label}
          </span>
        </div>
      </div>

      {/* İade Gerekçesi (Varsa) */}
      {instance?.currentState === 'RETURNED' && instance?.returnReason && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 dark:text-rose-300">
            <strong className="font-bold">Dosya İade Gerekçesi:</strong>
            <p className="mt-1 leading-relaxed">{instance.returnReason}</p>
          </div>
        </div>
      )}

      {/* Hata veya Başarı Bildirimi */}
      {actionError && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Aktif Açık Görevler */}
      {tasks.length > 0 && tasks.some((t) => t.status === 'OPEN') && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Bekleyen Görevler (Sorumlu Birim)
          </div>
          {tasks
            .filter((t) => t.status === 'OPEN')
            .map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t.title}</span>
                  {t.description && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {t.description}
                    </p>
                  )}
                </div>
                {t.requiredRole && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Rol: {t.requiredRole}
                  </span>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Yapılabilecek Sonraki Eylemler & Kural Kontrolü */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Sonraki Olası Eylemler & Kural Denetimi
        </h3>

        {availableActions.length === 0 ? (
          <div className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
            Mevcut aşama için tanımlı sonraki işlem bulunmamaktadır veya süreç tamamlanmıştır.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {availableActions.map((item, idx) => {
              const { transition, evaluation } = item
              const isPassing = evaluation.canTransition
              const isSubmitting = submittingTransition === transition.id
              const isReturnAction = transition.toState === 'RETURNED'

              return (
                <div
                  key={transition.id || idx}
                  className={`border rounded-xl p-4 flex flex-col gap-3 transition-all ${
                    isPassing
                      ? 'border-blue-200 dark:border-blue-900/40 bg-blue-55/20 dark:bg-blue-955/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {transition.actionLabel}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Hedef: {getStateBadge(transition.toState).label}
                        </span>
                      </div>
                      {transition.requiredRole && (
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Gerekli Yetki: <code className="font-mono">{transition.requiredRole}</code>
                        </span>
                      )}
                    </div>

                    <div>
                      {isReturnAction ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReturnTransitionId(transition.id)
                            setReturnModalOpen(true)
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Gerekçeli İade Et
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!isPassing || isSubmitting}
                          onClick={() => handleExecuteTransition(transition.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                            isPassing
                              ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              İşleniyor...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Bu Aşamaya İlerlet
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Kural Değerlendirme Sonuçları */}
                  {evaluation.ruleSummary.allResults.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {evaluation.ruleSummary.allResults.map((r: any, rIdx: number) => {
                        const isBlock = r.severity === 'BLOCKING'
                        const isWarn = r.severity === 'WARNING'
                        const isOk = r.passed

                        return (
                          <div
                            key={r.ruleId || rIdx}
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                              isOk
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-800 dark:text-emerald-300'
                                : isBlock
                                ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isOk ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : isBlock ? (
                                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              ) : (
                                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold">{r.ruleTitle}</span>
                                <span
                                  className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                                    r.category === 'LEGAL'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                      : r.category === 'ORGANIZATIONAL'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                  }`}
                                >
                                  {r.category === 'LEGAL'
                                    ? 'Mevzuat Kuralı'
                                    : r.category === 'ORGANIZATIONAL'
                                    ? 'Kurum İş Akışı'
                                    : 'Sistem Önerisi'}
                                </span>
                                {r.sourceReference && (
                                  <span className="text-[10px] text-slate-400">
                                    Ref: {r.sourceReference}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] leading-relaxed">{r.message}</p>
                              {!isOk && r.suggestedAction && (
                                <p className="mt-1 font-semibold text-[11px] underline">
                                  Öneri: {r.suggestedAction}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Bloklanma Nedenleri (Durum / Yetki Uyuşmazlığı) */}
                  {evaluation.blockingReasons.length > 0 &&
                    evaluation.ruleSummary.blockingErrors.length === 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          {evaluation.blockingReasons.map((b: string, bIdx: number) => (
                            <div key={bIdx}>{b}</div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Süreç Geçmişi Zaman Çizelgesi (Akordeon) */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 py-1"
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            Süreç Denetim Geçmişi ({history.length} Olay)
          </span>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="mt-3 flex flex-col gap-2 pl-2 border-l-2 border-blue-200 dark:border-blue-900/40">
            {history.map((ev, i) => (
              <div key={ev.id || i} className="text-xs text-slate-600 dark:text-slate-400 py-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(ev.timestamp).toLocaleString('tr-TR')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ev.eventType}
                  </span>
                  <span className="text-[11px] px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                    {ev.fromState} → {ev.toState}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({ev.actorRole || 'system'})
                  </span>
                </div>
                {ev.reason && (
                  <p className="mt-1 text-[11px] text-slate-500 italic pl-4">
                    Gerekçe: {ev.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* İade Gerekçe Modalı */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              Dosyayı İade Et
            </h3>
            <p className="text-xs text-slate-500">
              Satın alma birimine eksik belge veya düzeltme gerekçesini belirtiniz. Bu gerekçe süreç
              kayıtlarına işlenecektir.
            </p>
            <textarea
              rows={3}
              value={returnReasonText}
              onChange={(e) => setReturnReasonText(e.target.value)}
              placeholder="Örn: Faturadaki vergi tevkifat oranı hatalı girilmiş..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!returnReasonText.trim()}
                onClick={() =>
                  returnTransitionId &&
                  handleExecuteTransition(returnTransitionId, returnReasonText)
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
              >
                İadeyi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

