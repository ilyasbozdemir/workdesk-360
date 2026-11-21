import React, { useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileCode2,
  FileEdit,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Printer,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { EvrakItem } from "../types";
import { DocumentRenderer } from "@worksuite-360/document-engine";
import { resolveTemplateKey, TemplateKey } from "@temin360/document-templates";
import { cn } from "@renderer/utils/cn";

interface DosyaEvrakGoruntuleyiciProps {
  selectedEvrak: EvrakItem | null;
  currentIndex: number;
  totalCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevDoc: () => void;
  onNextDoc: () => void;
  viewMode: "canvas" | "pdf";
  onViewModeChange: (mode: "canvas" | "pdf") => void;
  previewScale: number;
  onScaleChange: (scale: number) => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  docLoading: boolean;
  pdfGenerating: boolean;
  activeTemplateData: any;
  personelListesi?: any[];
  firmaListesi?: any[];
  birimListesi?: any[];
  activePdfBlobUrl: string | null;
  onGeneratePdf: () => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onOpenExternal: () => void;
  onOpenModalPreview?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  copyCount?: number;
  onCopyCountChange?: (count: number) => void;
  activeViewVariant?: "template" | "signed";
  onVariantChange?: (variant: "template" | "signed") => void;
  onUploadSignedDocForSelected?: (targetCode?: string) => void;
  onNavigateToStage?: (evrak: EvrakItem) => void;
}

export const DosyaEvrakGoruntuleyici: React.FC<DosyaEvrakGoruntuleyiciProps> = (
  {
    selectedEvrak,
    currentIndex,
    totalCount,
    hasPrev,
    hasNext,
    onPrevDoc,
    onNextDoc,
    viewMode,
    onViewModeChange,
    previewScale,
    onScaleChange,
    currentPage,
    totalPages,
    onPrevPage,
    onNextPage,
    docLoading,
    pdfGenerating,
    activeTemplateData,
    personelListesi = [],
    firmaListesi = [],
    birimListesi = [],
    activePdfBlobUrl,
    onGeneratePdf,
    onPrint,
    onExportPdf,
    onOpenExternal,
    onOpenModalPreview,
    isFullscreen,
    onToggleFullscreen,
    copyCount = 1,
    onCopyCountChange,
    activeViewVariant = "template",
    onVariantChange,
    onUploadSignedDocForSelected,
    onNavigateToStage,
  },
) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!selectedEvrak) {
    return (
      <main className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Görüntülenecek Belge Seçilmedi
          </h3>
          <p className="text-xs text-slate-500">
            Lütfen sol menüdeki dosya evrak akışından incelemek istediğiniz
            belgeyi seçin.
          </p>
        </div>
      </main>
    );
  }

  const isTemplate = selectedEvrak.type === "template";
  const isSignedPdf = selectedEvrak.type === "signed_pdf" ||
    selectedEvrak.type === "uploaded_pdf";
  const canonicalKey: TemplateKey = (resolveTemplateKey(selectedEvrak.code) ||
    "ihtiyac_listesi") as TemplateKey;
  const orientation = activeTemplateData?.orientation || "portrait";

  return (
    <main
      className={cn(
        "flex-1 flex flex-col bg-slate-100/90 dark:bg-slate-950 min-w-0 h-full relative transition-all",
        isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-slate-950" : "",
      )}
    >
      {/* ── ÜST ARAÇ ÇUBUĞU (TOOLBAR) ── */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-3 shadow-2xs z-20 shrink-0 min-h-[52px]">
        {/* Sol: Belge Başlığı & Rozet */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-sm sm:max-w-md lg:max-w-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {selectedEvrak.stageName}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span
                className={cn(
                  "text-[9px] font-extrabold px-1.5 py-0.2 rounded border",
                  selectedEvrak.badge.color,
                  selectedEvrak.badge.textColor,
                  selectedEvrak.badge.borderColor,
                )}
              >
                {selectedEvrak.badge.label}
              </span>
            </div>

            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate mt-0.5" title={selectedEvrak.title}>
              {selectedEvrak.title}
            </h2>
          </div>
        </div>

        {/* Sağ: Gruplanmış Araçlar ve Aksiyonlar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Belge Navigasyonu (Önceki / Sonraki) */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-850 p-0.5 text-xs font-bold shrink-0 shadow-2xs">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrevDoc}
              className="h-7 px-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              title="Önceki Belge (Sol Ok)"
            >
              <ArrowLeft size={13} />
              <span className="hidden xl:inline text-[11px]">Önceki</span>
            </button>

            <span className="px-2 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 select-none">
              {currentIndex + 1} <span className="text-slate-400">/</span> {totalCount}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={onNextDoc}
              className="h-7 px-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
              title="Sonraki Belge (Sağ Ok)"
            >
              <span className="hidden xl:inline text-[11px]">Sonraki</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 2. İmzalı Nüsha vs Sistem Şablonu Seçici */}
          {selectedEvrak.matchedSignedDoc
            ? (
              <div className="inline-flex items-center rounded-xl border border-emerald-300/80 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-0.5 text-xs font-bold shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onVariantChange?.("template")}
                  className={cn(
                    "h-7 px-2.5 rounded-lg transition-all flex items-center gap-1 text-[11px] cursor-pointer",
                    activeViewVariant === "template"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400",
                  )}
                  title="Sistem tarafından otomatik üretilen şablon"
                >
                  <FileCode2 size={13} />
                  <span>Sistem Şablonu</span>
                </button>

                <button
                  type="button"
                  onClick={() => onVariantChange?.("signed")}
                  className={cn(
                    "h-7 px-2.5 rounded-lg transition-all flex items-center gap-1 text-[11px] cursor-pointer",
                    activeViewVariant === "signed"
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400",
                  )}
                  title="Islak imzalı taranmış PDF nüshası"
                >
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>İmzalı Nüsha</span>
                </button>
              </div>
            )
            : isTemplate
            ? (
              <button
                type="button"
                onClick={() => onUploadSignedDocForSelected?.(selectedEvrak.code)}
                className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-emerald-700 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                title="Bu belge için ıslak imzalı taranmış PDF nüshası yükleyin"
              >
                <Upload size={13} />
                <span className="hidden xl:inline">+ İmzalı Nüsha</span>
              </button>
            )
            : null}

          {/* 3. Canlı A4 vs Gerçek PDF Seçici */}
          {isTemplate && activeViewVariant !== "signed" && (
            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-850 p-0.5 text-xs font-bold shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => onViewModeChange("canvas")}
                className={cn(
                  "h-7 px-2.5 rounded-lg transition-all flex items-center gap-1 text-[11px] cursor-pointer",
                  viewMode === "canvas"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400",
                )}
                title="A4 Canlı Tuval Modu"
              >
                <FileCode2 size={13} />
                <span>Canlı A4</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!activePdfBlobUrl) {
                    onGeneratePdf();
                  } else {
                    onViewModeChange("pdf");
                  }
                }}
                disabled={pdfGenerating}
                className={cn(
                  "h-7 px-2.5 rounded-lg transition-all flex items-center gap-1 text-[11px] cursor-pointer",
                  viewMode === "pdf"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400",
                )}
                title="Baskı Uyumlu Gerçek PDF Önizleme Modu"
              >
                {pdfGenerating
                  ? <Loader2 size={13} className="animate-spin text-blue-500" />
                  : <Eye size={13} />}
                <span>Gerçek PDF</span>
              </button>
            </div>
          )}

          {/* 4. Zoom Kontrolleri */}
          <div className="hidden lg:inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-850 p-0.5 text-xs font-bold shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => onScaleChange(Math.max(0.5, Number((previewScale - 0.1).toFixed(2))))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Küçült (-)"
            >
              <ZoomOut size={13} />
            </button>

            <span
              onClick={() => onScaleChange(1.0)}
              className="px-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer hover:text-blue-600 select-none"
              title="Varsayılan Boyuta Sıfırla (%100)"
            >
              %{Math.round(previewScale * 100)}
            </span>

            <button
              type="button"
              onClick={() => onScaleChange(Math.min(1.75, Number((previewScale + 0.1).toFixed(2))))}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Büyüt (+)"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* 5. Şablonda Düzenle Butonu */}
          {isTemplate && onOpenModalPreview && (
            <button
              type="button"
              onClick={onOpenModalPreview}
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 transition-all cursor-pointer shadow-2xs text-xs font-bold shrink-0"
              title="Belgeyi Şablon Düzenleme Modalında Aç (Makam, Ekler, Rota düzenle)"
            >
              <FileEdit size={13} />
              <span className="hidden xl:inline">Şablonda Düzenle</span>
            </button>
          )}

          {/* 6. Birincil Aksiyon: Yazdır Butonu */}
          <button
            type="button"
            onClick={onPrint}
            className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-blue-500 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white transition-all cursor-pointer shadow-xs text-xs font-bold shrink-0"
            title="Yazdır (Baskı Masası & Yazıcı Seçimi)"
          >
            <Printer size={13} />
            <span>Yazdır</span>
          </button>

          {/* 7. Yardımcı İkon Grubu: İndir / Harici Aç / Tam Ekran */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs divide-x divide-slate-100 dark:divide-slate-800 h-8 shrink-0">
            <button
              type="button"
              onClick={onExportPdf}
              className="w-8 h-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="PDF Olarak Bilgisayara İndir / Kaydet"
            >
              <Download size={14} />
            </button>

            <button
              type="button"
              onClick={onOpenExternal}
              className="w-8 h-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Harici Sistem PDF Okuyucusunda Aç (Acrobat vb.)"
            >
              <ExternalLink size={14} />
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="w-8 h-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? "Tam Ekrandan Çık (Esc)" : "Tam Ekran Belge İnceleme"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── TASLAK & EKSİK VERİ BİLGİLENDİRME & YÖNLENDİRME ÇUBUĞU ── */}
      {selectedEvrak.status === "taslak" && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/80 dark:border-amber-900/60 px-4 py-2 flex items-center justify-between gap-3 shrink-0 z-10 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertCircle size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Otomatik Taslak Belge
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  Veri Girişi Bekliyor
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 truncate">
                Bu belgenin içerik verileri henüz tamamlanmamış. İlgili adıma geçip veri girebilir veya belgeyi kesinleştirebilirsiniz.
              </p>
            </div>
          </div>

          {onNavigateToStage && (
            <button
              type="button"
              onClick={() => onNavigateToStage(selectedEvrak)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
              title={`${selectedEvrak.stageName} ekranına geç ve veri girişini tamamla`}
            >
              <span>{selectedEvrak.stageName} Adımına Git & Veri Gir</span>
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* ── BELGE GÖRÜNTÜLEME ALANI (CANVAS / PDF IFRAME) ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar flex justify-center items-start p-4 sm:p-8 relative [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] dark:[background-image:radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] select-text"
      >
        {docLoading || pdfGenerating
          ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs z-30">
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {pdfGenerating
                      ? "Gerçek PDF Çıktısı Derleniyor..."
                      : "Belge PDF Olarak Hazırlanıyor..."}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Resmî mevzuat şablonu ve kurum değişkenleri A4 formatında
                    derleniyor
                  </p>
                </div>
              </div>
            </div>
          )
          : null}

        {/* DURUM 1: PDF Görüntüleme (Yüklenmiş İmzalı PDF veya Derlenmiş PDF) */}
        {viewMode === "pdf" || isSignedPdf
          ? (
            activePdfBlobUrl
              ? (
                <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white">
                  <iframe
                    src={activePdfBlobUrl}
                    title={`PDF Belgesi: ${selectedEvrak.title}`}
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              )
              : (
                <div className="flex flex-col items-center justify-center text-slate-500 py-32 text-center max-w-sm mx-auto">
                  <FileCheck
                    size={40}
                    className="text-slate-300 dark:text-slate-700 mb-2"
                  />
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    PDF Dokümanı Yüklenemedi
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dosya yolu: {selectedEvrak.filePath || "Belirtilmedi"}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenExternal}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700 transition-all"
                  >
                    Harici Dosyayı Aç
                  </button>
                </div>
              )
          )
          : (
            /* DURUM 2: Canlı A4 Şablon Tuvali (DocumentRenderer) */
            activeTemplateData
              ? (
                <div className="transition-transform duration-150 origin-top flex justify-center pb-12">
                  <DocumentRenderer
                    templateKey={canonicalKey}
                    data={activeTemplateData}
                    orientation={orientation}
                    chrome="paper"
                    scale={previewScale}
                    isEditing={false}
                    personelListesi={personelListesi.length
                      ? personelListesi
                      : activeTemplateData.personelListesi || []}
                    firmaListesi={firmaListesi.length
                      ? firmaListesi
                      : activeTemplateData.firmaListesi || []}
                    birimListesi={birimListesi.length
                      ? birimListesi
                      : activeTemplateData.birimListesi || []}
                    firstPageLimit={activeTemplateData.firstPageLimit}
                  />
                </div>
              )
              : (
                <div className="flex flex-col items-center justify-center text-slate-500 py-32 text-center">
                  <FileText
                    size={36}
                    className="text-slate-300 dark:text-slate-700 mb-2"
                  />
                  <p className="text-xs font-bold">
                    Belge verisi hazırlanamadı.
                  </p>
                </div>
              )
          )}
      </div>

      {/* ── ALT DURUM & HIZLI NAVİGASYON BARI ── */}
      <footer className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-5 py-2 flex items-center justify-between text-xs text-slate-500 z-10 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                selectedEvrak.status === "imzali"
                  ? "bg-emerald-500"
                  : selectedEvrak.status === "hazir"
                  ? "bg-blue-500"
                  : "bg-amber-500",
              )}
            />
            <span>{selectedEvrak.badge.label}</span>
          </span>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
            •
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            Klavye Kısayolları:{" "}
            <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
              ↑ / ↓
            </kbd>{" "}
            Belge Değiştir,{" "}
            <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
              + / -
            </kbd>{" "}
            Yakınlaştır
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={onPrevDoc}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Önceki Belge"
          >
            <ArrowLeft size={13} />
          </button>
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">
            {currentIndex + 1} / {totalCount}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={onNextDoc}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Sonraki Belge"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      </footer>
    </main>
  );
};
