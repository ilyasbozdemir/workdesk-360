import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Unlock,
  X,
  XCircle,
} from "lucide-react";
import { StageRule } from "@temin360/direct-procurement-core";
import { StepConfig } from "./types";
import { STEPS } from "./steps.config";
import { AppRoute } from "../../../../constants/routeConstants";

interface StepGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStep: StepConfig | null;
  allRules: Array<{ rule: StageRule; passed: boolean }>;
  onNavigateToStep: (route: AppRoute) => void;
  onBypassAndProceed: () => void;
}

export const StepGuardModal: React.FC<StepGuardModalProps> = ({
  isOpen,
  onClose,
  targetStep,
  allRules,
  onNavigateToStep,
  onBypassAndProceed,
}) => {
  // ESC tuşu ile kapatma
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetStep) return null;
  if (typeof document === "undefined") return null;

  const missingMandatoryRules = allRules.filter((r) =>
    r.rule.isMandatory && !r.passed
  );
  const passedRules = allRules.filter((r) => r.passed);

  // Eksik şartların hangi aşamada tamamlanması gerektiğini bul
  const earliestIncompleteStepId = missingMandatoryRules.length > 0
    ? Math.min(...missingMandatoryRules.map((m) => m.rule.requiredStageId))
    : 1;
  const incompleteStepConfig =
    STEPS.find((s) => s.id === earliestIncompleteStepId) || STEPS[0];

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 relative z-10"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-amber-500/[0.04] dark:bg-amber-500/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  Aşama Kilitli
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {targetStep.label}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Ön Koşullar Tamamlanmadı
              </h2>
            </div>
          </div>
        </div>

        {/* İçerik & Kural Listesi */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Kamu İhale Mevzuatı ve Doğrudan Temin kuralları gereği bu aşamaya
            geçebilmek için önceki adımlardaki zorunlu işlemlerin tamamlanması
            gerekmektedir.
          </p>

          {/* Eksik Zorunlu Kurallar */}
          {missingMandatoryRules.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  Tamamlanması Gereken Zorunlu Şartlar ({missingMandatoryRules
                    .length})
                </span>
              </div>

              <div className="space-y-2">
                {missingMandatoryRules.map(({ rule }) => {
                  const reqStep = STEPS.find(
                    (s) => s.id === rule.requiredStageId,
                  );
                  return (
                    <div
                      key={rule.id}
                      className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-955/20 flex items-start gap-2.5"
                    >
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                            {rule.title}
                          </span>
                          {reqStep && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                              {reqStep.shortLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-rose-700/80 dark:text-rose-300/70 mt-1 leading-normal">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tamamlanan Kurallar (Bilgi Amaçlı) */}
          {passedRules.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Sağlanan Şartlar ({passedRules.length})
              </span>
              <div className="space-y-1">
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
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={() => onNavigateToStep(incompleteStepConfig.route)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer active:scale-95"
            >
              <span>{incompleteStepConfig.shortLabel} Aşamasına Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
