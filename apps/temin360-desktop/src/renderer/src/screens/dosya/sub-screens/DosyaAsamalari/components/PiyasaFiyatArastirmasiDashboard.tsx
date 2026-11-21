import React from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@renderer/utils/cn";
import {
  PiyasaFiyatArastirmasiDashboardProps,
  Step1IsteklilerVeDagitim,
  Step2FiyatlarVeKazanan,
  Step3TutanakVeMaliyet,
  usePiyasaFiyatArastirmasiDashboard,
} from "./PiyasaFiyatArastirmasi";

export type { PiyasaFiyatArastirmasiDashboardProps };

export function PiyasaFiyatArastirmasiDashboard(
  props: PiyasaFiyatArastirmasiDashboardProps,
): React.JSX.Element {
  const {
    currentStep,
    setCurrentStep,
    handleOpenSablonByDosyaAdi,
    handleOpenEkapSorgu,
    mappedBelgeler,
    handleOpenBelgePreview,
    handleOpenExternalForBelge,
    handleQuickPrintForBelge,
    firmaColumns,
    formattedFirms,
    activeWinnerFirma,
    lowestBidFirm,
    isStep1Done,
    isStep2Done,
    isStep3Done,
  } = usePiyasaFiyatArastirmasiDashboard(props);

  const {
    setIsFormOpen,
    handleNewDocument,
    docViewMode,
    changeDocViewMode,
    invitedFirms,
    handleAddSingleFirm,
    handleCreateNewFirm,
    handleRemoveFirm,
    items,
    bids,
    setActiveFormTab,
    handleDeleteDocument,
    manualWinnerFirmaId,
    handleSetWinnerFirma,
  } = props;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* ADIM 1 */}
      {currentStep === 1 && (
        <Step1IsteklilerVeDagitim
          formattedFirms={formattedFirms}
          firmaColumns={firmaColumns}
          manualWinnerFirmaId={manualWinnerFirmaId}
          handleSetWinnerFirma={handleSetWinnerFirma}
          handleCreateNewFirm={handleCreateNewFirm}
          setCurrentStep={setCurrentStep}
          setIsFormOpen={setIsFormOpen}
          setActiveFormTab={setActiveFormTab}
          handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi}
          handleOpenEkapSorgu={handleOpenEkapSorgu}
          handleAddSingleFirm={handleAddSingleFirm}
          handleRemoveFirm={handleRemoveFirm}
        />
      )}

      {/* ADIM 2 */}
      {currentStep === 2 && (
        <Step2FiyatlarVeKazanan
          activeWinnerFirma={activeWinnerFirma}
          lowestBidFirm={lowestBidFirm}
          invitedFirms={invitedFirms}
          items={items}
          bids={bids}
          manualWinnerFirmaId={manualWinnerFirmaId}
          handleSetWinnerFirma={handleSetWinnerFirma}
          setIsFormOpen={setIsFormOpen}
          setActiveFormTab={setActiveFormTab}
          setCurrentStep={setCurrentStep}
          hesaplamaEsasi={props.hesaplamaEsasi}
          setHesaplamaEsasi={props.setHesaplamaEsasi}
        />
      )}

      {/* ADIM 3 */}
      {currentStep === 3 && (
        <Step3TutanakVeMaliyet
          mappedBelgeler={mappedBelgeler}
          docViewMode={docViewMode}
          changeDocViewMode={changeDocViewMode}
          handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi}
          handleNewDocument={handleNewDocument}
          handleOpenBelgePreview={handleOpenBelgePreview}
          handleOpenExternalForBelge={handleOpenExternalForBelge}
          handleQuickPrintForBelge={handleQuickPrintForBelge}
          handleDeleteDocument={handleDeleteDocument}
          setCurrentStep={setCurrentStep}
          setIsFormOpen={setIsFormOpen}
          setActiveFormTab={setActiveFormTab}
        />
      )}

      {/* Dikey Hızlı Adım Geçiş Dock'u (Sağ Kenar Floating) */}
      <aside
        aria-label="Hızlı Adım Geçiş Dock'u"
        className="fixed right-2.5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 ring-1 ring-slate-900/5 transition-all select-none animate-in fade-in slide-in-from-right-3 duration-200"
      >
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 rotate-180 [writing-mode:vertical-lr] py-1">
          Adımlar
        </span>

        {/* 1. Adım Butonu */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          title="1. Adım: İstekliler & Dağıtım"
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer",
            currentStep === 1
              ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30 scale-105"
              : isStep1Done
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:scale-105"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-105",
          )}
        >
          {isStep1Done && currentStep !== 1
            ? <CheckCircle2 className="w-4 h-4" />
            : "1"}
        </button>

        {/* 2. Adım Butonu */}
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          title="2. Adım: Fiyatlar & Kazanan Tespiti"
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer",
            currentStep === 2
              ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30 scale-105"
              : isStep2Done
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:scale-105"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-105",
          )}
        >
          {isStep2Done && currentStep !== 2
            ? <CheckCircle2 className="w-4 h-4" />
            : "2"}
        </button>

        {/* 3. Adım Butonu */}
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          title="3. Adım: Tutanak & Maliyet Çıktısı"
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer",
            currentStep === 3
              ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30 scale-105"
              : isStep3Done
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:scale-105"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-105",
          )}
        >
          {isStep3Done && currentStep !== 3
            ? <CheckCircle2 className="w-4 h-4" />
            : "3"}
        </button>

        <div className="w-4 h-[1px] bg-slate-200 dark:border-slate-800 my-0.5" />

        {/* Önceki Adım */}
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() =>
            setCurrentStep(Math.max(1, currentStep - 1) as 1 | 2 | 3)}
          title="Önceki Adıma Dön"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Sonraki Adım */}
        <button
          type="button"
          disabled={currentStep === 3}
          onClick={() =>
            setCurrentStep(Math.min(3, currentStep + 1) as 1 | 2 | 3)}
          title="Sonraki Adıma Geç"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </aside>
    </div>
  );
}
