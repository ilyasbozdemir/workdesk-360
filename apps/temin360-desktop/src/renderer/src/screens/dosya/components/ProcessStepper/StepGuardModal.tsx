import React from 'react'
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Unlock,
  X
} from 'lucide-react'
import { StageRule } from '@temin360/direct-procurement-core'
import { StepConfig } from './types'
import { STEPS } from './steps.config'
import { AppRoute } from '../../../../constants/routeConstants'

interface StepGuardModalProps {
  isOpen: boolean
  onClose: () => void
  targetStep: StepConfig | null
  allRules: Array<{ rule: StageRule; passed: boolean }>
  onNavigateToStep: (route: AppRoute) => void
  onBypassAndProceed: () => void
}

export const StepGuardModal: React.FC<StepGuardModalProps> = ({
  isOpen,
  onClose,
  targetStep,
  allRules,
  onNavigateToStep,
  onBypassAndProceed
}) => {
  if (!isOpen || !targetStep) return null

  const missingMandatoryRules = allRules.filter((r) => r.rule.isMandatory && !r.passed)
  const passedRules = allRules.filter((r) => r.passed)

  // Eksik şartların hangi aşamada tamamlanması gerektiğini bul
  const earliestIncompleteStepId = missingMandatoryRules.length > 0
    ? Math.min(...missingMandatoryRules.map((m) => m.rule.requiredStageId))
    : 1
  const incompleteStepConfig = STEPS.find((s) => s.id === earliestIncompleteStepId) || STEPS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Üst Başlık */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-amber-500/[0.04] dark:bg-amber-500/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/60">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  Aşama Kilitli
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {targetStep.id}. Aşama
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {targetStep.label}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik & Kural Listesi */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Kamu İhale Mevzuatı ve Doğrudan Temin kuralları gereği bu aşamaya geçebilmek için önceki adımlardaki zorunlu işlemlerin tamamlanması gerekmektedir.
          </p>

          {/* Eksik Zorunlu Kurallar */}
          {missingMandatoryRules.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Tamamlanması Gereken Zorunlu Şartlar ({missingMandatoryRules.length})</span>
              </div>

              <div className="space-y-2">
                {missingMandatoryRules.map(({ rule }) => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex items-start gap-2.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          {rule.title}
                        </h4>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                          {rule.requiredStageId}. Aşama Şartı
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5 leading-snug">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tamamlanmış Şartlar */}
          {passedRules.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sağlanan Şartlar ({passedRules.length})</span>
              </div>

              <div className="space-y-1.5">
                {passedRules.map(({ rule }) => (
                  <div
                    key={rule.id}
                    className="px-3 py-2 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {rule.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          {/* Serbest Geçiş Butonu (İsteğe Bağlı Bypass) */}
          <button
            type="button"
            onClick={onBypassAndProceed}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer px-2 py-1 rounded"
            title="Kural kilitlerini geçici olarak devreden çıkar ve aşamaya git"
          >
            <Unlock className="w-3.5 h-3.5 text-slate-400" />
            <span>Kuralı Aş ve İlerle</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={() => onNavigateToStep(incompleteStepConfig.route)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20"
            >
              <span>{incompleteStepConfig.shortLabel} Aşamasına Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
