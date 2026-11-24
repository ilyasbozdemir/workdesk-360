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
      {/* ÜST YATAY ADIM GEÇİŞ BAR'I (Piyasa Fiyat Alt Adımları) */}
      <nav
        aria-label="Piyasa Fiyat Alt Adımları"
        className="w-full flex items-center justify-between gap-2 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs select-none"
      >
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
          {/* 1. Adım Butonu */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer border",
              currentStep === 1
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : isStep1Done
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100/60"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                currentStep === 1
                  ? "bg-white/20 text-white"
                  : isStep1Done
                  ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
              )}
            >
              {isStep1Done && currentStep !== 1
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : "1"}
            </span>
            <span>1. İstekliler &amp; Dağıtım</span>
          </button>

          {/* 2. Adım Butonu */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer border",
              currentStep === 2
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : isStep2Done
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100/60"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                currentStep === 2
                  ? "bg-white/20 text-white"
                  : isStep2Done
                  ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
              )}
            >
              {isStep2Done && currentStep !== 2
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : "2"}
            </span>
            <span>2. Fiyatlar &amp; Kazanan Tespiti</span>
          </button>

          {/* 3. Adım Butonu */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer border",
              currentStep === 3
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : isStep3Done
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100/60"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                currentStep === 3
                  ? "bg-white/20 text-white"
                  : isStep3Done
                  ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
              )}
            >
              {isStep3Done && currentStep !== 3
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : "3"}
            </span>
            <span>3. Tutanak &amp; Maliyet Çıktısı</span>
          </button>
        </div>

        {/* Önceki / Sonraki Hızlı Butonlar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() =>
              setCurrentStep(Math.max(1, currentStep - 1) as 1 | 2 | 3)}
            title="Önceki Adıma Dön"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 text-xs font-bold"
          >
            <ChevronUp className="w-4 h-4 -rotate-90" />
            <span className="hidden sm:inline">Geri</span>
          </button>

          <button
            type="button"
            disabled={currentStep === 3}
            onClick={() =>
              setCurrentStep(Math.min(3, currentStep + 1) as 1 | 2 | 3)}
            title="Sonraki Adıma Geç"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 text-xs font-bold"
          >
            <span className="hidden sm:inline">İleri</span>
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      </nav>

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
    </div>
  );
}
