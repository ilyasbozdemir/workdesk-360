import React from 'react'
import {
  FileText,
  UserCheck,
  Eye,
  CheckCircle2,
  Printer,
  ChevronRight,
  Zap,
  SlidersHorizontal
} from 'lucide-react'

export type WizardStepId = 1 | 2 | 3 | 4 | 5

interface StepDefinition {
  id: WizardStepId
  title: string
  shortTitle: string
  icon: React.ComponentType<{ className?: string }>
}

const WIZARD_STEPS: StepDefinition[] = [
  { id: 1, title: '1. Belgeler', shortTitle: 'Belgeler', icon: FileText },
  { id: 2, title: '2. Ortak Bilgiler', shortTitle: 'Ortak Bilgi', icon: UserCheck },
  { id: 3, title: '3. Göster / Gizle', shortTitle: 'Görünürlük', icon: Eye },
  { id: 4, title: '4. Kontrol', shortTitle: 'Kontrol', icon: CheckCircle2 },
  { id: 5, title: '5. Çıktı & Yazdır', shortTitle: 'Çıktı', icon: Printer }
]

interface CiktiWizardStepperProps {
  currentStep: WizardStepId
  setCurrentStep: (step: WizardStepId) => void
  selectedCount: number
  wizardMode: boolean
  setWizardMode: (enabled: boolean) => void
  onQuickOutput: () => void
}

export function CiktiWizardStepper({
  currentStep,
  setCurrentStep,
  selectedCount,
  wizardMode,
  setWizardMode,
  onQuickOutput
}: CiktiWizardStepperProps): React.JSX.Element {
  return (
    <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 select-none">
      {/* STEPS LIST */}
      <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto custom-scrollbar py-0.5">
        {WIZARD_STEPS.map((step, idx) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isPassed = currentStep > step.id
          const isClickable =
            wizardMode && (isPassed || isActive || (selectedCount > 0 && step.id <= 5))

          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/40'
                    : isPassed
                      ? 'bg-slate-800/80 text-blue-400 hover:bg-slate-800 hover:text-blue-300'
                      : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
                title={step.title}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span className="hidden md:inline">{step.title}</span>
                <span className="md:hidden">{step.shortTitle}</span>
                {step.id === 1 && selectedCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {selectedCount}
                  </span>
                )}
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* QUICK ACTIONS & MODE TOGGLE */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Output Button */}
        {currentStep < 5 && selectedCount > 0 && (
          <button
            type="button"
            onClick={onQuickOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Adımları atla ve doğrudan çıktı önizlemesine geç"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="hidden sm:inline">Hızlı Çıktı</span>
          </button>
        )}

        {/* Wizard Mode Toggle (Özellik Anahtarı) */}
        <button
          type="button"
          onClick={() => setWizardMode(!wizardMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            wizardMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              : 'bg-indigo-950/40 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/50'
          }`}
          title={wizardMode ? 'Klasik tek tık yazdırma görünümüne geç' : 'Sihirbaz moduna geç'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{wizardMode ? 'Sihirbaz Modu' : 'Klasik Mod'}</span>
        </button>
      </div>
    </div>
  )
}
