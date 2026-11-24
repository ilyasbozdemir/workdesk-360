import { HIZMET_ALIMI_ONAY_EKI_COLUMNS } from "@temin360/document-templates/src/templates/luzum-muzekkeresi-onay-eki";
import React, { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FileSpreadsheet,
  PackageSearch,
  Printer,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@renderer/utils/cn";
import { SubScreen } from "../../SubScreens.screen";
import { FirmaSecmeModali } from "./components/FirmaSecmeModali";
import { PiyasaFiyatArastirmasiForm } from "./components/PiyasaFiyatArastirmasiForm";
import { FiyatIstenenFirmalarınSecilmesi } from "./components/FiyatIstenenFirmalarınSecilmesi";
import { DagitimBelgeleriKartlari } from "./components/PiyasaFiyatArastirmasi/DagitimBelgeleriKartlari";
import { KazananKararPaneli } from "./components/PiyasaFiyatArastirmasi/KazananKararPaneli";
import { PricesSummaryDashboard } from "./components/PricesSummaryDashboard";
import { SonucBelgesiKartlari } from "./components/PiyasaFiyatArastirmasi/SonucBelgesiKartlari";
import { usePiyasaFiyatArastirmasiDashboard } from "./components/PiyasaFiyatArastirmasi/usePiyasaFiyatArastirmasiDashboard";
import { usePiyasaFiyatArastirmasiLogic } from "./hooks/usePiyasaFiyatArastirmasi";
import { useSettingsStore } from "../../../../store/settingsStore";

export function PiyasaFiyatArastirmasiNew(): React.JSX.Element {
  const logic = usePiyasaFiyatArastirmasiLogic();
  const {
    sablonsContext: {
      previewModalOpen,
      setPreviewModalOpen,
      previewData,
      quickPrint,
      quickExport,
      quickOpenExternal,
      activeStarredDocs,
      handleOpenPreviewForSablon,
      sablons,
      ciktiLoading,
      isSablonDisabled,
    },
    invitedFirms,
    allPoolFirms,
    isFormOpen,
    setIsFormOpen,
    items,
    bids,
    hesaplamaEsasi,
    setHesaplamaEsasi,
    isFirmModalOpen,
    setIsFirmModalOpen,
    selectedFirmIds,
    setSelectedFirmIds,
    modalSearchQuery,
    setModalSearchQuery,
    handleBulkAddFirms,
    handleAddSingleFirm,
    handleRemoveFirm,
    handlePriceChange,
    getLowestBidInfo,
    getAverageBid,
    getEstimatedCostTotal,
    handleSaveToDosya,
    handleNewDocument,
    lowestTotalFirmaId,
    isEditingFirms,
    setIsEditingFirms,
    setMaliyetCetveliTarihi,
    tutanakTarihi,
    setTutanakTarihi,
    savedDocuments,
    stageSablons,
    formMode,
    syncTutanak,
    setSyncTutanak,
    setLowestFirmAsWinner,
    setSetLowestFirmAsWinner,
    manualWinnerFirmaId,
    setManualWinnerFirmaId,
    maliyetCetveliTarihi,
    belgeleriKaydet,
    setBelgeleriKaydet,
    handleUpdateDocumentDate,
    handleDeleteDocument,
    handleSetWinnerFirma,
  } = logic;

  const [activeFormTab, setActiveFormTab] = useState<
    "firms" | "matrix" | "comparison"
  >(() => {
    return invitedFirms.length > 0 ? "matrix" : "firms";
  });
  const [activeActionDropdown, setActiveActionDropdown] = useState<
    string | null
  >(null);
  const [isFormFullscreen, setIsFormFullscreen] = useState<boolean>(false);
  const [dashboardViewMode, setDashboardViewMode] = useState<
    "documents" | "prices"
  >("documents");
  const [docViewMode, setDocViewMode] = useState<"grid" | "list" | "table">(
    () => {
      try {
        return (localStorage.getItem("dta_doc_view_mode") as any) || "grid";
      } catch {
        return "grid";
      }
    },
  );

  const changeDocViewMode = (mode: "grid" | "list" | "table"): void => {
    setDocViewMode(mode);
    try {
      localStorage.setItem("dta_doc_view_mode", mode);
    } catch (e) {
      console.error(e);
    }
  };

  const stageDocs = savedDocuments;
  const { disableDocumentGuidance } = useSettingsStore();

  // Fiyat girilip girilmediğini tespit et
  const hasPricesEntered = useMemo(() => {
    if (!invitedFirms || invitedFirms.length === 0) return false;
    return invitedFirms.some(
      (f: any) =>
        (f.teklif_toplami && Number(f.teklif_toplami) > 0) ||
        (f.kalem_sayisi && Number(f.kalem_sayisi) > 0),
    );
  }, [invitedFirms]);

  // Dağıtım belgeleri kartı: Fiyat girilmişse başlangıçta kapalı (sakin mod), girilmemişse açık
  const [isDagitimExpanded, setIsDagitimExpanded] = useState<boolean>(
    () => !hasPricesEntered,
  );

  // Dashboard verilerini ve yardımcı fonksiyonlarını hazırla
  const dashboardHelpers = usePiyasaFiyatArastirmasiDashboard({
    stageDocs,
    stageSablons,
    sablons,
    activeStarredDocs,
    ciktiLoading,
    handleOpenPreviewForSablon,
    quickPrint,
    quickExport,
    quickOpenExternal,
    isSablonDisabled,
    disableDocumentGuidance,
    invitedFirms,
    allPoolFirms,
    handleAddSingleFirm,
    handleCreateNewFirm: logic.handleCreateNewFirm,
    handleRemoveFirm,
    items,
    bids,
    setActiveFormTab,
    activeActionDropdown,
    setActiveActionDropdown,
    handleUpdateDocumentDate,
    handleDeleteDocument,
    setIsFirmModalOpen,
    handleSaveToDosya,
    getEstimatedCostTotal,
    manualWinnerFirmaId,
    handleSetWinnerFirma,
    lowestTotalFirmaId,
    hesaplamaEsasi,
    setHesaplamaEsasi,
    setIsFormOpen,
    handleNewDocument,
    dashboardViewMode,
    setDashboardViewMode,
    docViewMode,
    changeDocViewMode,
  });

  const {
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
  } = dashboardHelpers;

  return (
    <SubScreen
      title="Teklifler & Piyasa Fiyat Araştırması"
      icon={PackageSearch}
      description="Tedarikçi teklif mektupları hazırlayabilir, toplanan teklifleri fiyat araştırma tablosuna girerek en uygun teklifleri ve yaklaşık maliyeti belirleyebilirsiniz."
      previewDocumentId={previewModalOpen && previewData?.dosyaAdi
        ? previewData.dosyaAdi
        : null}
      selectedFirma={previewData?.selectedFirma}
      invitedFirms={logic.invitedFirms}
      onClosePreview={(): void => setPreviewModalOpen(false)}
    >
      {!isFormOpen ? (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200 pb-16">
          {/* 1. AKILLI DAĞITIM BELGELERİ ŞERİDİ (Fiyat girildiyse sakinleştirilir) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs overflow-hidden transition-all">
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                    hasPricesEntered
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                  )}
                >
                  {hasPricesEntered ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Teklif İsteme &amp; Dağıtım Belgeleri
                    </h3>
                    {hasPricesEntered ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        ✓ Fiyatlar Alındı ({invitedFirms.length} İstekli)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {invitedFirms.length} Firma Kayıtlı
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {hasPricesEntered
                      ? "Teklifler girildiği için bu belgeler arşivlendi. İhtiyaç halinde tekrar açıp yazdırabilirsiniz."
                      : "Firmalara gönderilecek teklif isteme mektuplarını ve dağıtım çizelgesini buradan hazırlayıp yazdırabilirsiniz."}
                  </p>
                </div>
              </div>

              {/* Aç / Kapa Butonu */}
              <button
                type="button"
                onClick={(): void => setIsDagitimExpanded((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {isDagitimExpanded
                    ? "Belgeleri Gizle"
                    : "Belgeleri Aç & Yazdır"}
                </span>
                {isDagitimExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>

            {/* Genişletilmiş Dağıtım Kartları */}
            {isDagitimExpanded && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 animate-in fade-in duration-150">
                <DagitimBelgeleriKartlari
                  handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi}
                />
              </div>
            )}
          </div>

          {/* 2. ANA ODAK: İSTEKLİ FİRMALAR & FİYAT GİRİŞİ */}
          <div className="grid grid-cols-1 gap-5">
            {/* İstekli Firmaların Belirlenmesi */}
            <FiyatIstenenFirmalarınSecilmesi
              title="Fiyat İstenen İstekli Firmalar"
              firms={formattedFirms}
              columns={firmaColumns}
              winnerFirmaId={manualWinnerFirmaId}
              onSetWinnerFirma={(f): void => {
                if (handleSetWinnerFirma) {
                  const targetId = (f.firma_id as number) || f.id;
                  handleSetWinnerFirma(
                    manualWinnerFirmaId === targetId ? null : targetId,
                  );
                }
              }}
              onCreateNewFirm={logic.handleCreateNewFirm}
              onFiyatGir={(): void => {
                setIsFormOpen(true);
                setActiveFormTab("matrix");
              }}
              onEkapSorgula={handleOpenEkapSorgu}
              onOpenFirmaSecmeModali={(): void => {
                if (setIsFirmModalOpen) setIsFirmModalOpen(true);
              }}
              onFirmaCikar={(f): void => {
                if (handleRemoveFirm) {
                  handleRemoveFirm(f.id);
                }
              }}
              onFirmaEkle={(f): void => {
                if (handleAddSingleFirm) {
                  handleAddSingleFirm(f);
                }
              }}
            />

            {/* Fiyatlar Girildiyse: Kazanan İstekli & Karar Özeti */}
            {hasPricesEntered && (
              <KazananKararPaneli
                activeWinnerFirma={activeWinnerFirma}
                lowestBidFirm={lowestBidFirm}
                handleSetWinnerFirma={handleSetWinnerFirma}
                setIsFormOpen={setIsFormOpen}
                setActiveFormTab={setActiveFormTab}
                hesaplamaEsasi={hesaplamaEsasi}
                setHesaplamaEsasi={setHesaplamaEsasi}
              />
            )}

            {/* Teklif Fiyat Matrisi Özeti */}
            <PricesSummaryDashboard
              invitedFirms={invitedFirms}
              items={items}
              bids={bids}
              manualWinnerFirmaId={manualWinnerFirmaId}
              handleSetWinnerFirma={handleSetWinnerFirma}
              hesaplamaEsasi={hesaplamaEsasi}
              onManageFirmsClick={(): void => {
                setIsFormOpen(true);
                setActiveFormTab("matrix");
              }}
            />

            {/* Fiyatlar Tamamsa: Sonuç ve Tutanak Çıktıları */}
            {hasPricesEntered && (
              <div className="mt-2">
                <SonucBelgesiKartlari
                  handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi}
                  handleNewDocument={handleNewDocument}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. DÜZENLEME & MATRİS FORMU (Alt+Arrow, Enter tuşları ve Excel navigasyonu) */
        <PiyasaFiyatArastirmasiForm
          formMode={formMode}
          setIsFormOpen={setIsFormOpen}
          activeFormTab={activeFormTab}
          setActiveFormTab={setActiveFormTab}
          hesaplamaEsasi={hesaplamaEsasi}
          setHesaplamaEsasi={setHesaplamaEsasi}
          invitedFirms={invitedFirms}
          items={items}
          bids={bids}
          getEstimatedCostTotal={getEstimatedCostTotal}
          handleSaveToDosya={handleSaveToDosya}
          maliyetCetveliTarihi={maliyetCetveliTarihi}
          setMaliyetCetveliTarihi={setMaliyetCetveliTarihi}
          tutanakTarihi={tutanakTarihi}
          setTutanakTarihi={setTutanakTarihi}
          syncTutanak={syncTutanak}
          setSyncTutanak={setSyncTutanak}
          setLowestFirmAsWinner={setLowestFirmAsWinner}
          setSetLowestFirmAsWinner={setSetLowestFirmAsWinner}
          manualWinnerFirmaId={manualWinnerFirmaId}
          setManualWinnerFirmaId={setManualWinnerFirmaId}
          belgeleriKaydet={belgeleriKaydet}
          setBelgeleriKaydet={setBelgeleriKaydet}
          isEditingFirms={isEditingFirms}
          setIsEditingFirms={setIsEditingFirms}
          setIsFirmModalOpen={setIsFirmModalOpen}
          lowestTotalFirmaId={lowestTotalFirmaId}
          handleRemoveFirm={handleRemoveFirm}
          getLowestBidInfo={getLowestBidInfo}
          getAverageBid={getAverageBid}
          handlePriceChange={handlePriceChange}
          isFormFullscreen={isFormFullscreen}
        />
      )}

      {/* İSTEKLİ FİRMALARDAN SEÇ MODALI */}
      <FirmaSecmeModali
        isOpen={isFirmModalOpen}
        onClose={(): void => setIsFirmModalOpen(false)}
        allPoolFirms={allPoolFirms}
        invitedFirms={invitedFirms}
        selectedFirmIds={selectedFirmIds}
        setSelectedFirmIds={setSelectedFirmIds}
        modalSearchQuery={modalSearchQuery}
        setModalSearchQuery={setModalSearchQuery}
        onAddFirms={handleBulkAddFirms}
      />
    </SubScreen>
  );
}

export default PiyasaFiyatArastirmasiNew;
