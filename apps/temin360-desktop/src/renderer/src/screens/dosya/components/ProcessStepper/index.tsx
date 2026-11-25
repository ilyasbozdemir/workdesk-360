import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { useWorkspaceStore } from '../../../../store/workspaceStore'
import { documentPreloadService } from '../../../../services/documentPreloadService'
import { AppRoute } from '../../../../constants/routeConstants'
import { ProcessStepperProps, StepConfig } from './types'
import { STEPS, findCurrentStepIndex } from './steps.config'
import { useStepGuards } from './useStepGuards'
import { StepGuardModal } from './StepGuardModal'

export function ProcessStepper({ currentRoute }: ProcessStepperProps): React.JSX.Element {
  const navigate = useNavigate()
  const { activeDosyaId } = useWorkspaceStore()
  const currentIndex = findCurrentStepIndex(currentRoute)
  const prevStep = currentIndex > 0 ? STEPS[currentIndex - 1] : null
  const nextStep = currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null

  // Süreç Adım Kilitleri ve Kuralları Motoru
  const {
    isStepUnlocked,
    getAllRulesStatus,
    toggleBypassGuards,
    bypassGuards
  } = useStepGuards(activeDosyaId)

  // Kilit Modal Durumu
  const [guardModalTarget, setGuardModalTarget] = useState<StepConfig | null>(null)

  const goTo = (route: AppRoute): void => {
    navigate({ to: route as any })
  }

  const handleStepClick = (step: StepConfig) => {
    const unlocked = isStepUnlocked(step.id)
    if (!unlocked) {
      setGuardModalTarget(step)
      return
    }
    goTo(step.route)
  }

  const handleWarmStep = (step: StepConfig | null) => {
    if (activeDosyaId && step && step.docTemplates) {
      documentPreloadService.warmStageDocuments(step.shortLabel, activeDosyaId, step.docTemplates)
    }
  }

  const handleBypassAndProceed = () => {
    if (guardModalTarget) {
      const targetRoute = guardModalTarget.route
      setGuardModalTarget(null)
      goTo(targetRoute)
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 print:hidden select-none">
      {/* Önceki Adım Butonu */}
      <button
        type="button"
        onClick={() => prevStep && goTo(prevStep.route)}
        onMouseEnter={() => handleWarmStep(prevStep)}
        disabled={!prevStep}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border',
          prevStep
            ? 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer shadow-sm'
            : 'text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 cursor-not-allowed'
        )}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{prevStep?.shortLabel ?? 'Önceki'}</span>
      </button>

      {/* Stepper Orta Bölge */}
      <div className="flex items-center gap-0 flex-1 justify-center">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon
          const isCurrent = i === currentIndex
          const isPast = i < currentIndex
          const isLast = i === STEPS.length - 1
          const unlocked = isStepUnlocked(step.id)

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleStepClick(step)}
                onMouseEnter={() => unlocked && handleWarmStep(step)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold cursor-pointer group relative border-0 bg-transparent',
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : isPast
                      ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                      : unlocked
                        ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 opacity-70 hover:opacity-100'
                )}
                title={unlocked ? step.label : `🔒 ${step.label} (Ön şartlar eksik, görmek için tıklayın)`}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all',
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isPast
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        : unlocked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                          : 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900'
                  )}
                >
                  {!unlocked ? (
                    <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  ) : isPast ? (
                    <StepIcon className="w-3 h-3" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="hidden lg:inline">{step.shortLabel}</span>
              </button>

              {/* Bağlantı Çizgisi */}
              {!isLast && (
                <div
                  className={cn(
                    'w-4 sm:w-6 lg:w-8 h-0.5 rounded-full mx-0.5 shrink-0 transition-colors',
                    i < currentIndex
                      ? 'bg-blue-400 dark:bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Sonraki Adım Butonu */}
      <button
        type="button"
        onClick={() => nextStep && handleStepClick(nextStep)}
        onMouseEnter={() => nextStep && isStepUnlocked(nextStep.id) && handleWarmStep(nextStep)}
        disabled={!nextStep}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border',
          nextStep
            ? isStepUnlocked(nextStep.id)
              ? 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer shadow-sm'
              : 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/60 cursor-pointer'
            : 'text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 cursor-not-allowed'
        )}
      >
        <span className="hidden sm:inline">{nextStep?.shortLabel ?? 'Sonraki'}</span>
        {nextStep && !isStepUnlocked(nextStep.id) ? (
          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Kilit Uyarısı Modalı */}
      {guardModalTarget && (
        <StepGuardModal
          isOpen={Boolean(guardModalTarget)}
          onClose={() => setGuardModalTarget(null)}
          targetStep={guardModalTarget}
          allRules={getAllRulesStatus(guardModalTarget.id)}
          onNavigateToStep={(route) => {
            setGuardModalTarget(null)
            goTo(route)
          }}
          onBypassAndProceed={handleBypassAndProceed}
        />
      )}
    </div>
  )
}
