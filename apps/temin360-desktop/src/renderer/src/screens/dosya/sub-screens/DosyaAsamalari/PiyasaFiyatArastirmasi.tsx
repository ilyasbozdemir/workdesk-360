import React, { useState } from "react";
import { Layers, PackageSearch } from "lucide-react";
import { SubScreen } from "../../SubScreens.screen";
import { FirmaSecmeModali } from "./components/FirmaSecmeModali";
import { PiyasaFiyatArastirmasiDashboard } from "./components/PiyasaFiyatArastirmasiDashboard";
import { PiyasaFiyatArastirmasiForm } from "./components/PiyasaFiyatArastirmasiForm";
import { PiyasaFiyatArastirmasiOld } from "./PiyasaFiyatArastirmasi.old";
import { usePiyasaFiyatArastirmasiLogic } from "./hooks/usePiyasaFiyatArastirmasi";
import { useSettingsStore } from "../../../../store/settingsStore";

export function PiyasaFiyatArastirmasi(): React.JSX.Element {
  const [useOldView, setUseOldView] = useState<boolean>(() => {
    try {
      return localStorage.getItem("temin360_use_old_piyasa_view") === "true";
    } catch {
      return false;
    }
  });

  const toggleViewMode = () => {
    setUseOldView((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("temin360_use_old_piyasa_view", String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  if (useOldView) {
    return (
      <div className="relative">
        <div className="absolute top-2 right-4 z-50">
          <button
            type="button"
            onClick={toggleViewMode}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Yeni Tasarıma Geç"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>⚡ Yeni Görünüme Geç</span>
          </button>
        </div>
        <PiyasaFiyatArastirmasiOld />
      </div>
    );
  }

  return <PiyasaFiyatArastirmasiNew onToggleViewMode={toggleViewMode} />;
}

interface PiyasaFiyatArastirmasiNewProps {
  onToggleViewMode: () => void;
}

function PiyasaFiyatArastirmasiNew({
  onToggleViewMode,
}: PiyasaFiyatArastirmasiNewProps): React.JSX.Element {
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

  const changeDocViewMode = (mode: "grid" | "list" | "table") => {
    setDocViewMode(mode);
    try {
      localStorage.setItem("dta_doc_view_mode", mode);
    } catch (e) {
      console.error(e);
    }
  };

  const stageDocs = savedDocuments;
  const { disableDocumentGuidance } = useSettingsStore();

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
      onClosePreview={() => setPreviewModalOpen(false)}
    >
      {!isFormOpen
        ? (
          <PiyasaFiyatArastirmasiDashboard
            onToggleViewMode={onToggleViewMode}
            setIsFormOpen={setIsFormOpen}
            handleNewDocument={handleNewDocument}
            setActiveFormTab={setActiveFormTab}
            dashboardViewMode={dashboardViewMode}
            setDashboardViewMode={setDashboardViewMode}
            docViewMode={docViewMode}
            changeDocViewMode={changeDocViewMode}
            activeActionDropdown={activeActionDropdown}
            setActiveActionDropdown={setActiveActionDropdown}
            stageDocs={stageDocs}
            stageSablons={stageSablons}
            disableDocumentGuidance={disableDocumentGuidance}
            invitedFirms={invitedFirms}
            allPoolFirms={allPoolFirms}
            handleAddSingleFirm={handleAddSingleFirm}
            handleCreateNewFirm={logic.handleCreateNewFirm}
            handleRemoveFirm={handleRemoveFirm}
            items={items}
            bids={bids}
            sablons={sablons}
            activeStarredDocs={activeStarredDocs}
            ciktiLoading={ciktiLoading}
            handleOpenPreviewForSablon={handleOpenPreviewForSablon}
            quickPrint={quickPrint}
            quickExport={quickExport}
            quickOpenExternal={quickOpenExternal}
            isSablonDisabled={isSablonDisabled}
            handleUpdateDocumentDate={handleUpdateDocumentDate}
            handleDeleteDocument={handleDeleteDocument}
            setIsFirmModalOpen={setIsFirmModalOpen}
            handleSaveToDosya={handleSaveToDosya}
            getEstimatedCostTotal={getEstimatedCostTotal}
            manualWinnerFirmaId={manualWinnerFirmaId}
            handleSetWinnerFirma={handleSetWinnerFirma}
            lowestTotalFirmaId={lowestTotalFirmaId}
            hesaplamaEsasi={hesaplamaEsasi}
            setHesaplamaEsasi={setHesaplamaEsasi}
          />
        )
        : (
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
        onClose={() => setIsFirmModalOpen(false)}
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
