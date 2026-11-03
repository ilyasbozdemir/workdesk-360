import React, { useMemo, useState } from "react";
import { DocumentPreviewModalV3Props } from "./types";
import { useDocumentPreviewData } from "./hooks/useDocumentPreviewData";
import { DocumentPreviewHeader } from "./components/DocumentPreviewHeader";
import { DocumentPreviewTabBar } from "./components/DocumentPreviewTabBar";
import { DocumentPreviewSidebar } from "./components/DocumentPreviewSidebar";
import { DocumentPreviewCanvas } from "./components/DocumentPreviewCanvas";
import { FloatingDocumentBubble } from "./components/FloatingDocumentBubble";
import { useSettingsStore } from "../../../../store/settingsStore";
import {
  getAdjacentStageTemplate,
  getStageById,
  getStageForTemplate,
  IHTIYAC_RAPORU_STAGE,
} from "./stages";

/** JSON sözdizimi renklendirmesi. Veriyi değiştirmez; yalnızca metni biçimlendirir. */
function DebugJsonLine(
  { line, search }: { line: string; search: string },
): React.JSX.Element {
  const tokens = line.split(
    /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
  );
  const searchLower = search.trim().toLocaleLowerCase();
  return (
    <>
      {tokens.map((token, i) => {
        const isKey = /^"(?:\\.|[^"\\])*"$/.test(token) &&
          /^\s*:/.test(tokens[i + 1] ?? "");
        const isString = token.startsWith('"');
        const isBoolean = /^(true|false)$/.test(token);
        const isNull = token === "null";
        const isNumber = /^-?\d/.test(token);
        const color = isKey
          ? "text-sky-300"
          : isString
          ? "text-emerald-300"
          : isBoolean
          ? "text-violet-300"
          : isNull
          ? "text-rose-300"
          : isNumber
          ? "text-amber-300"
          : "text-slate-400";
        if (!searchLower) return <span key={i} className={color}>{token}</span>;
        const pieces = token.split(
          new RegExp(`(${escapeDebugRegex(searchLower)})`, "gi"),
        );
        return (
          <span key={i} className={color}>
            {pieces.map((piece, j) =>
              piece.toLocaleLowerCase() === searchLower
                ? (
                  <mark
                    key={j}
                    className="rounded bg-yellow-300 text-slate-950"
                  >
                    {piece}
                  </mark>
                )
                : <React.Fragment key={j}>{piece}</React.Fragment>
            )}
          </span>
        );
      })}
    </>
  );
}

function escapeDebugRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function DocumentPreviewModalV3({
  isOpen,
  documentId,
  dosyaId: propDosyaId,
  source,
  initialTemplateId,
  invitedFirms: propInvitedFirms,
  onClose,
  isModal = false,
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onAddTab,
  currentStage: propCurrentStage,
  stage: propStage,
  isBalloon: propIsBalloon,
  onToggleBalloon: propOnToggleBalloon,
}: DocumentPreviewModalV3Props): React.JSX.Element | null {
  const [internalBalloon, setInternalBalloon] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugSearch, setDebugSearch] = useState("");
  const isBalloon = propIsBalloon !== undefined
    ? propIsBalloon
    : internalBalloon;
  const setIsBalloon = React.useCallback(
    (val: boolean) => {
      if (propOnToggleBalloon) {
        propOnToggleBalloon();
      } else {
        setInternalBalloon(val);
      }
    },
    [propOnToggleBalloon],
  );
  const currentDocKey = initialTemplateId ||
    documentId ||
    (source?.kind === "ihtiyacRaporu" ? `rapor_${source.raporId}` : null);
  const [prevDocKey, setPrevDocKey] = useState<string | null>(currentDocKey);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const {
    isLoading,
    selectedDocId,
    setSelectedDocId,
    templateOptions,
    activeTemplateConf,
    ActiveComponent,
    formData,
    setFormData,
    personelListesi,
    firmaListesi,
    birimListesi,
    localShowLogoLeft,
    setLocalShowLogoLeft,
    localShowLogoRight,
    setLocalShowLogoRight,
    orientation,
    setOrientation,
    isEditingMode,
    setIsEditingMode,
    previewScale,
    isPrinting,
    isSaving,
    saveSuccess,
    saveError,
    isDirty,
    downloadOpen,
    setDownloadOpen,
    sidebarOpen,
    setSidebarOpen,
    zoomMode,
    setZoomMode,
    manualZoom,
    setManualZoom,
    isFullScreen,
    setIsFullScreen,
    previewContainerRef,
    dropdownRef,
    handleSaveToDb,
    handlePrint,
    handlePdf,
    handleDocx,
    handleOpenPdfInNewTab,
    handleRefreshFromDb,
  } = useDocumentPreviewData({
    isOpen,
    documentId,
    dosyaId: propDosyaId,
    source,
    initialTemplateId,
    invitedFirms: propInvitedFirms,
  });

  // Belge değiştiğinde veya modal yeniden açıldığında yüzen balon durumunu sıfırla
  if (currentDocKey !== prevDocKey || (!prevIsOpen && isOpen)) {
    setPrevDocKey(currentDocKey);
    setPrevIsOpen(isOpen);
    if (isBalloon) {
      setIsBalloon(false);
    }
  } else if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
  }

  const rawStage = propCurrentStage ?? propStage;
  const { disableDocumentGuidance } = useSettingsStore();

  const stageInfo = useMemo(() => {
    if (source?.kind === "ihtiyacRaporu") return IHTIYAC_RAPORU_STAGE;
    if (rawStage !== undefined && rawStage !== null) {
      const found = getStageById(rawStage);
      if (found) return found;
    }
    return getStageForTemplate(
      selectedDocId,
      activeTemplateConf?.category,
      source?.kind,
    );
  }, [source?.kind, rawStage, selectedDocId, activeTemplateConf?.category]);

  const nextTemplate = useMemo(() => {
    return getAdjacentStageTemplate(
      selectedDocId,
      stageInfo.id,
      templateOptions,
      "next",
    );
  }, [selectedDocId, stageInfo.id, templateOptions]);

  const prevTemplate = useMemo(() => {
    return getAdjacentStageTemplate(
      selectedDocId,
      stageInfo.id,
      templateOptions,
      "prev",
    );
  }, [selectedDocId, stageInfo.id, templateOptions]);

  const handleClose = React.useCallback(() => {
    if (isDirty) {
      const confirmClose = window.confirm(
        "Belgede kaydedilmemiş değişiklikler var. Kaydetmeden çıkmak istediğinizden emin misiniz?",
      );
      if (!confirmClose) {
        return;
      }
    }
    setIsBalloon(false);
    onClose();
  }, [onClose, isDirty, setIsBalloon]);

  if (!isOpen) return null;

  const docTitle = activeTemplateConf?.name.replace(/([A-Z])/g, " $1").trim();

  // If in floating balloon mode, render only the floating bubble
  if (isBalloon) {
    return (
      <FloatingDocumentBubble
        documentTitle={docTitle}
        onExpand={() => setIsBalloon(false)}
        onClose={handleClose}
        onPrint={handlePrint}
        onPdf={handlePdf}
        isPrinting={isPrinting}
      />
    );
  }

  const debugData = {
    isLoading,
    previewScale,
    orientation,
    selectedDocId,
    isEditingMode,
    formData,
    personelListesi,
    firmaListesi,
    birimListesi,
    localShowLogoLeft,
    localShowLogoRight,
    templateOptions,

    // Fonksiyon ve ref bilgileri
    previewContainerRef: "[React Ref]",
    ActiveComponent: ActiveComponent?.displayName ||
      ActiveComponent?.name ||
      null,
    setFormData: typeof setFormData,
    onSelectTemplate: typeof setSelectedDocId,
  };

  const debugJson = JSON.stringify(
    debugData,
    (_key, value) => {
      if (value === undefined) return "[undefined]";
      if (typeof value === "function") {
        return `[Function: ${value.name || "anonymous"}]`;
      }
      if (typeof value === "bigint") return value.toString();
      return value;
    },
    2,
  );

  const mainContent = (
    <div
      className={isFullScreen
        ? "fixed inset-0 z-[200] w-screen h-screen max-w-none max-h-none rounded-none border-none shadow-none flex flex-col bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in duration-150"
        : isModal
        ? "bg-white dark:bg-slate-900 w-full max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
        : "absolute inset-0 z-40 w-full h-full max-w-none max-h-none rounded-none border-none shadow-none flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-150"}
      onClick={(e) => (isModal || isFullScreen) && e.stopPropagation()}
    >
      {/* 1. Belge Sekmeleri Çubuğu (En Üstte) */}
      {tabs && tabs.length > 0 && onSwitchTab && onCloseTab && (
        <DocumentPreviewTabBar
          tabs={tabs}
          activeTabId={activeTabId || null}
          onSwitchTab={onSwitchTab}
          onCloseTab={onCloseTab}
          onAddTab={onAddTab}
          templateOptions={templateOptions}
          currentDosyaId={propDosyaId}
          onToggleBalloon={() => setIsBalloon(true)}
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
          onClose={handleClose}
          stageInfo={stageInfo}
          disableDocumentGuidance={disableDocumentGuidance}
          sourceKind={source?.kind}
        />
      )}

      {/* 2. Aktif Belge Araç Çubuğu */}
      <DocumentPreviewHeader
        onClose={handleClose}
        documentTitle={docTitle}
        zoomMode={zoomMode}
        manualZoom={manualZoom}
        previewScale={previewScale}
        setZoomMode={setZoomMode}
        setManualZoom={setManualZoom}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        saveError={saveError}
        isDirty={isDirty}
        handleSaveToDb={handleSaveToDb}
        isPrinting={isPrinting}
        handlePrint={handlePrint}
        downloadOpen={downloadOpen}
        setDownloadOpen={setDownloadOpen}
        dropdownRef={dropdownRef}
        handleRefreshFromDb={handleRefreshFromDb}
        handlePdf={handlePdf}
        handleDocx={handleDocx}
        handleOpenPdfInNewTab={handleOpenPdfInNewTab}
        onToggleBalloon={() => setIsBalloon(true)}
        dosyaId={propDosyaId}
        docKey={selectedDocId}
        orientation={orientation}
        stageInfo={stageInfo}
        disableDocumentGuidance={disableDocumentGuidance}
        nextTemplate={nextTemplate}
        onSelectTemplate={setSelectedDocId}
      />

      {/* Main Area: Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <DocumentPreviewSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          selectedDocId={selectedDocId}
          supportsOlur={activeTemplateConf?.capabilities?.supportsOlur}
          supportsLogos={activeTemplateConf?.category !==
            "5-klasor-ve-kapaklar"}
          templateCapabilities={activeTemplateConf?.capabilities}
          onSelectTemplate={setSelectedDocId}
          templateOptions={templateOptions}
          isEditingMode={isEditingMode}
          setIsEditingMode={setIsEditingMode}
          orientation={orientation}
          setOrientation={setOrientation}
          formData={formData}
          setFormData={setFormData}
          localShowLogoLeft={localShowLogoLeft}
          setLocalShowLogoLeft={setLocalShowLogoLeft}
          localShowLogoRight={localShowLogoRight}
          setLocalShowLogoRight={setLocalShowLogoRight}
          stageInfo={stageInfo}
          disableDocumentGuidance={disableDocumentGuidance}
          sourceKind={source?.kind}
          nextTemplate={nextTemplate}
          prevTemplate={prevTemplate}
        />

        <DocumentPreviewCanvas
          isLoading={isLoading}
          previewContainerRef={previewContainerRef}
          previewScale={previewScale}
          orientation={orientation}
          ActiveComponent={ActiveComponent}
          selectedDocId={selectedDocId}
          isEditingMode={isEditingMode}
          formData={formData}
          setFormData={setFormData}
          personelListesi={personelListesi}
          firmaListesi={firmaListesi}
          birimListesi={birimListesi}
          localShowLogoLeft={localShowLogoLeft}
          localShowLogoRight={localShowLogoRight}
          onSelectTemplate={setSelectedDocId}
          templateOptions={templateOptions}
        />

        {/* Debug butonu: belge önizlemesinden bağımsız */}
        <button
          type="button"
          className="absolute bottom-4 right-4 z-[60] flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xl hover:bg-indigo-500"
          onClick={() => setShowDebugPanel(true)}
        >
          <span aria-hidden="true">{`{ }`}</span>
          JSON Debug
        </button>

        {showDebugPanel && (
          <div
            className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowDebugPanel(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="DocumentPreviewCanvas JSON Debug"
              className="flex h-full max-h-[850px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0d1117] text-slate-200 shadow-2xl"
              onKeyDown={(event) => {
                if (event.key === "Escape") setShowDebugPanel(false);
              }}
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-[#161b22] px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    DocumentPreviewCanvas · JSON Debug
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Gelen prop değerleri · Salt okunur · React güncellemeleriyle
                    yenilenir
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
                    onClick={() =>
                      void navigator.clipboard.writeText(debugJson)}
                  >
                    JSON Kopyala
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
                    onClick={() => {
                      const url = URL.createObjectURL(
                        new Blob([debugJson], { type: "application/json" }),
                      );
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "document-preview-debug.json";
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    JSON İndir
                  </button>
                  <button
                    type="button"
                    aria-label="Debug penceresini kapat"
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                    onClick={() => setShowDebugPanel(false)}
                  >
                    Kapat ✕
                  </button>
                </div>
              </header>
              <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-3">
                <label
                  htmlFor="document-debug-search"
                  className="shrink-0 text-xs text-slate-400"
                >
                  JSON'da ara
                </label>
                <input
                  id="document-debug-search"
                  type="search"
                  value={debugSearch}
                  onChange={(event) => setDebugSearch(event.target.value)}
                  placeholder="Alan adı veya değer..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                />
                <span className="shrink-0 text-xs text-slate-500">
                  {debugJson.split("\n").length} satır
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto px-5 py-4 font-mono text-[12px] leading-6">
                <pre className="min-w-max whitespace-pre">{debugJson.split("\n").map((line, index) => (
                  <div key={index} className="flex gap-5 hover:bg-white/5">
                    <span className="w-10 shrink-0 select-none text-right text-slate-600">{index + 1}</span>
                    <span><DebugJsonLine line={line} search={debugSearch} /></span>
                  </div>
                ))}</pre>
              </div>
              <footer className="border-t border-slate-800 bg-[#161b22] px-5 py-2 text-xs text-slate-400">
                Veriler yalnızca görüntülenir; formData ve diğer prop'lar
                değiştirilmez.
              </footer>
            </section>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {mainContent}
      </div>
    );
  }

  return mainContent;
}

export default DocumentPreviewModalV3;
