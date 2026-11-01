import React from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Download,
  Eye,
  FileText,
  Layers,
  Maximize2,
  Minimize2,
  MoreVertical,
  Printer,
  RefreshCw,
  Save,
  Send,
  Sliders,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { usePrintQueueStore } from "../../../../../store/printQueueStore";
import { useWorkspaceStore } from "../../../../../store/workspaceStore";

interface DocumentPreviewHeaderProps {
  onClose: () => void;
  documentTitle?: string;
  zoomMode: "auto" | "manual";
  manualZoom: number;
  previewScale: number;
  setZoomMode: (mode: "auto" | "manual") => void;
  setManualZoom: React.Dispatch<React.SetStateAction<number>>;
  isFullScreen: boolean;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError?: string | null;
  isDirty?: boolean;
  handleSaveToDb: () => Promise<void>;
  isPrinting: boolean;
  handlePrint: () => Promise<void>;
  downloadOpen: boolean;
  setDownloadOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleRefreshFromDb: () => Promise<void>;
  handlePdf: () => Promise<void>;
  handleDocx?: () => Promise<void>;
  handleOpenPdfInNewTab: () => Promise<void>;
  onToggleBalloon?: () => void;
  dosyaId?: number | null;
  docKey?: string | null;
  orientation?: "portrait" | "landscape";
  stageInfo?: import("../stages").DocumentStageInfo;
  disableDocumentGuidance?: boolean;
  nextTemplate?: import("../templateResolver").TemplateOptionItem;
  onSelectTemplate?: (id: string) => void;
}

export function DocumentPreviewHeader({
  onClose,
  documentTitle,
  zoomMode,
  manualZoom,
  previewScale,
  setZoomMode,
  setManualZoom,
  isFullScreen,
  setIsFullScreen,
  sidebarOpen,
  setSidebarOpen,
  isSaving,
  saveSuccess,
  saveError,
  isDirty = false,
  handleSaveToDb,
  isPrinting,
  handlePrint,
  downloadOpen,
  setDownloadOpen,
  dropdownRef,
  handleRefreshFromDb,
  handlePdf,
  handleDocx,
  handleOpenPdfInNewTab,
  onToggleBalloon,
  dosyaId: propDosyaId,
  docKey,
  orientation,
  stageInfo,
  disableDocumentGuidance,
  nextTemplate,
  onSelectTemplate,
}: DocumentPreviewHeaderProps): React.JSX.Element {
  const { activeDosyaId: workspaceDosyaId } = useWorkspaceStore();
  const targetDosyaId = propDosyaId || workspaceDosyaId;

  const { isInQueue, toggleReadyToPrint, markAsPrinted, getDocumentStatus } =
    usePrintQueueStore();

  const isQueued = targetDosyaId && docKey
    ? isInQueue(targetDosyaId, docKey)
    : false;
  const docStatus = targetDosyaId && docKey
    ? getDocumentStatus(targetDosyaId, docKey)
    : "draft";

  const handleToggleQueue = (): void => {
    if (!targetDosyaId || !docKey) {
      alert("Belge kuyruğa eklenemedi: Dosya veya şablon tanımlanamadı.");
      return;
    }
    toggleReadyToPrint(targetDosyaId, docKey, documentTitle || docKey, {
      orientation,
    });
  };

  const onPrintClick = async (): Promise<void> => {
    if (targetDosyaId && docKey) {
      markAsPrinted(targetDosyaId, docKey);
    }
    await handlePrint();
  };

  return (
    <header className="flex flex-col border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs shrink-0 select-none min-w-0">
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-1.5 gap-2 shrink-0 select-none min-w-0">
        {/* Sol: Belge İkonu, Başlık ve Durum Rozetleri */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            <h2
              className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 truncate tracking-tight"
              title={documentTitle || "Belge Düzenleyici"}
            >
              {documentTitle || "Belge Düzenleyici"}
            </h2>

            {/* Aşama Rozeti */}
            {stageInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 transition-all ${stageInfo.badgeBg} ${stageInfo.badgeText}`}
                title={stageInfo.name}
              >
                <Compass className="w-3 h-3" />
                <span className="hidden sm:inline">{stageInfo.shortName}</span>
              </span>
            )}

            {/* Yönlendirme Modu Rozeti */}
            {disableDocumentGuidance !== undefined &&
              (!disableDocumentGuidance
                ? (
                  <span
                    className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shrink-0"
                    title="Kılavuzlu Belge Çıkarma Modu (Aşama belgeleri sırayla çıkarılır)"
                  >
                    <Compass className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Kılavuzlu Mod</span>
                  </span>
                )
                : (
                  <span
                    className="hidden 2xl:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 shrink-0"
                    title="Serbest Belge Çıkarma Modu"
                  >
                    <Sparkles className="w-3 h-3 text-slate-500" />
                    <span>Serbest Mod</span>
                  </span>
                ))}

            {/* Kılavuzlu Modda Sıradaki Belge Butonu */}
            {!disableDocumentGuidance && nextTemplate && onSelectTemplate && (
              <button
                type="button"
                onClick={() => onSelectTemplate(nextTemplate.id)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                title={`Sıradaki Kılavuzlu Belge: ${nextTemplate.title}`}
              >
                <span>Sıradaki Belge</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {docKey && (
              <span
                className="hidden 2xl:inline-flex text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 px-1.5 py-0.5 rounded-md shrink-0"
                title={`Şablon ID: ${docKey}`}
              >
                {docKey}
              </span>
            )}

            {isQueued && (
              <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-1.5 py-0.5 rounded-full shrink-0 animate-in fade-in">
                <CheckCircle2
                  size={10}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                Sırada
              </span>
            )}

            {docStatus === "printed" && !isQueued && (
              <span className="hidden xl:inline-flex text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-full shrink-0">
                Yazdırıldı
              </span>
            )}
          </div>
        </div>

        {/* Sağ: Aksiyon Grupları */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* GRUP 1: Yakınlaştırma & Görünüm */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 rounded-xl p-0.5 shrink-0 h-8">
            <button
              type="button"
              onClick={() => {
                setZoomMode("manual");
                setManualZoom((prev) =>
                  Math.max(0.4, Number((prev - 0.1).toFixed(1)))
                );
              }}
              className="w-6 sm:w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Uzaklaştır (%10)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoomMode("auto");
                setManualZoom(1.0);
              }}
              className="px-1 sm:px-1.5 h-7 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer min-w-9 sm:min-w-11 text-center"
              title="Otomatik Sığdır (Sıfırla)"
            >
              %{Math.round(
                (zoomMode === "auto" ? previewScale : manualZoom) * 100,
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setZoomMode("manual");
                setManualZoom((prev) =>
                  Math.min(2.0, Number((prev + 0.1).toFixed(1)))
                );
              }}
              className="w-6 sm:w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Yakınlaştır (%10)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Yüzen Balon Modu */}
          {onToggleBalloon && (
            <button
              type="button"
              onClick={onToggleBalloon}
              className="w-8 h-8 rounded-xl font-bold transition-all flex items-center justify-center text-xs cursor-pointer border bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-blue-950/40 shrink-0"
              title="Yüzen Balon Moduna Al (Ekranın köşesine küçült)"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Tam Ekran Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen((v) => !v)}
            className={`w-8 h-8 rounded-xl font-bold transition-all flex items-center justify-center text-xs cursor-pointer border shrink-0 ${
              isFullScreen
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50"
            }`}
            title={isFullScreen ? "Tam Ekrandan Çık" : "Tam Ekran Önizleme"}
          >
            {isFullScreen
              ? <Minimize2 className="w-3.5 h-3.5" />
              : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Kenar Çubuğu (Ayarlar) Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className={`h-8 px-2 sm:px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer border shrink-0 ${
              sidebarOpen
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
            title={sidebarOpen
              ? "Belge Ayarlarını Gizle"
              : "Belge Ayarlarını Göster"}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">
              {sidebarOpen ? "Ayarlar Açık" : "Ayarlar"}
            </span>
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0 hidden sm:block" />

          {/* GRUP 2: Veri Yenileme & Kaydet */}
          <button
            type="button"
            onClick={handleRefreshFromDb}
            disabled={isSaving}
            className="w-8 h-8 2xl:w-auto 2xl:px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer border bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border-slate-200 hover:border-teal-300 dark:bg-slate-900 dark:hover:bg-teal-950/40 dark:text-slate-200 dark:hover:text-teal-300 dark:border-slate-800 dark:hover:border-teal-800 shadow-2xs group shrink-0"
            title="Dosyadaki güncel kalem ve teklifleri kullanıcı düzenlemelerini ezmeden akıllıca senkronize eder (Smart Refresh)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden 2xl:inline">Verileri Senkronize Et</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToDb}
            disabled={isSaving}
            className={`h-8 px-2.5 sm:px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-2xs shrink-0 ${
              saveError
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-500/50"
                : saveSuccess
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30"
                : isSaving
                ? "bg-blue-600 text-white opacity-90 cursor-wait"
                : isDirty
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/50"
                : "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
            }`}
            title={saveError
              ? `Kaydetme Hatası: ${saveError}`
              : isDirty
              ? "Belgede kaydedilmemiş değişiklikler var. Veritabanına kaydetmek için tıklayın."
              : "Belgedeki düzenlemeleri veri tabanına kaydeder"}
          >
            {saveError
              ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                  <span>Kayıt Başarısız!</span>
                </>
              )
              : saveSuccess
              ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Kaydedildi!</span>
                </>
              )
              : isSaving
              ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span className="hidden sm:inline">Kaydediliyor...</span>
                </>
              )
              : (
                <>
                  {isDirty && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                  )}
                  <Save className="w-3.5 h-3.5" />
                  <span>Kaydet</span>
                </>
              )}
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0 hidden sm:block" />

          {/* GRUP 3: Yazdırma & Sıra */}
          {targetDosyaId && docKey && (
            <button
              type="button"
              onClick={handleToggleQueue}
              className={`h-8 px-2 sm:px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-2xs border shrink-0 ${
                isQueued
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-500/20"
                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/60"
              }`}
              title={isQueued
                ? "Belge yazdırma merkezine eklendi. Sıradan çıkarmak için tıklayın."
                : "Belgeyi Çıktı & Yazdırma Merkezindeki yazdırma listesine ekler."}
            >
              {isQueued
                ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline">Sırada</span>
                  </>
                )
                : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden 2xl:inline">Sıraya Ekle</span>
                  </>
                )}
            </button>
          )}

          {/* Doğrudan Yazdır Butonu (Birincil Aksiyon) */}
          <button
            type="button"
            onClick={onPrintClick}
            disabled={isPrinting}
            className="h-8 px-3 sm:px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs shadow-2xs shadow-blue-600/25 cursor-pointer shrink-0"
            title="Doğrudan Yazıcıya Gönder"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır</span>
          </button>

          {/* Yeni Sekmede Önizle */}
          <button
            type="button"
            onClick={async () => {
              setDownloadOpen(false);
              await handleOpenPdfInNewTab();
            }}
            className="h-8 w-8 xl:w-auto xl:px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs shadow-2xs shadow-indigo-600/20 cursor-pointer shrink-0"
            title="PDF Olarak Yeni Sekmede Aç ve Önizle"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Önizle</span>
          </button>

          {/* Diğer Seçenekler Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDownloadOpen((v) => !v)}
              disabled={isPrinting}
              title="Diğer Seçenekler (İndir, Dışa Aktar, Yenile)"
              className="w-8 h-8 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50 text-xs shadow-2xs cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {downloadOpen && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                <button
                  type="button"
                  onClick={async () => {
                    setDownloadOpen(false);
                    await handleRefreshFromDb();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold">Verileri Yeniden Hesapla</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Dosyadan güncel kalem ve teklifleri çeker
                    </div>
                  </div>
                </button>

                {targetDosyaId && docKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadOpen(false);
                      handleToggleQueue();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/50"
                  >
                    <Send className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold">
                        {isQueued ? "Sıradan Çıkar" : "Yazdırma Sırasına Ekle"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Toplu yazdırma merkezine gönderir
                      </div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    setDownloadOpen(false);
                    await handlePdf();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/50"
                >
                  <Download className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold">PDF Olarak İndir</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Yüksek çözünürlüklü vektör PDF
                    </div>
                  </div>
                </button>

                {handleDocx && (
                  <button
                    type="button"
                    onClick={async () => {
                      setDownloadOpen(false);
                      await handleDocx();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/50"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold">Word (DOCX) İndir</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Düzenlenebilir ofis belgesi
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

          {/* Kapat Butonu */}
          <button
            type="button"
            onClick={onClose}
            title="Kapat (ESC)"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
      {saveError && (
        <div className="bg-rose-50 border-t border-rose-200 px-4 py-1.5 text-xs text-rose-800 flex items-center justify-between dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              <strong>Kayıt Hatası:</strong> {saveError}{" "}
              (Değişiklikleriniz henüz veri tabanına kaydedilmedi)
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveToDb}
            className="text-xs font-bold underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer ml-3"
          >
            Tekrar Dene
          </button>
        </div>
      )}
    </header>
  );
}
