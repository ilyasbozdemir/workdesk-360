import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Lock,
  PackageSearch,
  Printer,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Unlock,
} from "lucide-react";
import { cn } from "@renderer/utils/cn";
import { SubScreen } from "../../SubScreens.screen";
import { FirmaSecmeModali } from "./components/FirmaSecmeModali";
import { PiyasaFiyatArastirmasiForm } from "./components/PiyasaFiyatArastirmasiForm";
import { FiyatIstenenFirmalarınSecilmesi } from "./components/FiyatIstenenFirmalarınSecilmesi";
import { DagitimBelgeleriKartlari } from "./components/PiyasaFiyatArastirmasi/DagitimBelgeleriKartlari";
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
    piyasaFiyatOnayDurumu,
    piyasaFiyatOnayTarihi,
    togglePiyasaFiyatOnay,
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

  // Koruma / Değişiklik Önlem Modalı Durumu
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const isApproved = piyasaFiyatOnayDurumu === "onaylandi";

  // Onaylı durumdayken fiyat veya kazanan değiştirilmek istendiğinde güvenlik kontrolü
  const handleProtectedAction = (action: () => void): void => {
    if (isApproved) {
      setPendingAction(() => action);
      setIsWarningModalOpen(true);
    } else {
      action();
    }
  };

  const handleConfirmWarning = async (): Promise<void> => {
    if (togglePiyasaFiyatOnay) {
      await togglePiyasaFiyatOnay();
    }
    setIsWarningModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

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
    firmaColumns,
    formattedFirms,
    activeWinnerFirma,
    lowestBidFirm,
  } = dashboardHelpers;

  const normalizedEsas = hesaplamaEsasi || "Ortalama fiyat esasına göre";
  const isLowestBasis =
    normalizedEsas.toLowerCase().includes("en düşük") ||
    normalizedEsas.toLowerCase().includes("en dusuk");

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
        <div className="flex flex-col gap-4 animate-in fade-in duration-200 pb-16">
          {/* 1. ÜST KISIM: 3. ADIMDAKİ GİBİ ŞIK KAZANAN / YÜKLENİCİ VE ONAY KARTI */}
          <div
            className={cn(
              "p-4 rounded-2xl border transition-all shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4",
              isApproved
                ? "border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent"
                : "border-amber-200/90 dark:border-amber-900/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
            )}
          >
            {/* Sol: Kazanan Bilgileri & Onay Durumu Rozeti */}
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "p-3 rounded-xl shrink-0 shadow-2xs",
                  isApproved
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                )}
              >
                {isApproved ? <ShieldCheck className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Kazanan / En Uygun İstekli Firma</span>
                  </h4>

                  {/* Onay Durumu Rozeti */}
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                      <Lock className="w-3 h-3" />
                      <span>ONAYLANDI (KİLİTLİ)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      <Unlock className="w-3 h-3" />
                      <span>Taslak / İncelemede</span>
                    </span>
                  )}

                  {/* Hesaplama Esası Değiştirici */}
                  {setHesaplamaEsasi && (
                    <select
                      value={normalizedEsas}
                      onChange={(e): void => {
                        handleProtectedAction(() => {
                          if (setHesaplamaEsasi) setHesaplamaEsasi(e.target.value);
                        });
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 focus:outline-none cursor-pointer"
                      title="Dosya Hesaplama Esasını Değiştir"
                    >
                      <option value="Ortalama fiyat esasına göre">⚙️ Ortalama Fiyat Esası</option>
                      <option value="En Düşük fiyat esasına göre">⚙️ En Düşük Fiyat Esası</option>
                    </select>
                  )}
                </div>

                {/* Kazanan Firma Adı */}
                <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {activeWinnerFirma
                    ? activeWinnerFirma.unvan
                    : lowestBidFirm
                    ? `${lowestBidFirm.unvan} (${
                        isLowestBasis ? "En Düşük Teklif Sahibi" : "En Uygun Teklif Sahibi"
                      })`
                    : "Henüz teklif girilmedi veya kazanan seçilmedi"}
                </div>

                {/* Onay Tarihi veya Detay Açıklaması */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isApproved
                    ? `Bu araştırma ${
                        piyasaFiyatOnayTarihi
                          ? new Date(piyasaFiyatOnayTarihi).toLocaleDateString("tr-TR")
                          : "tarihinde"
                      } onaylanmıştır. Fiyatlar ve kazanan kilit altındadır.`
                    : "Fiyatları girip en uygun teklifi belirledikten sonra araştırmayı onaylayıp kilitleyebilirsiniz."}
                </p>
              </div>
            </div>

            {/* Sağ: Hızlı Aksiyon Butonları (Düzenle + Onayla) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Fiyatları Düzenle Butonu (Korumalı) */}
              <button
                type="button"
                onClick={(): void => {
                  handleProtectedAction(() => {
                    setIsFormOpen(true);
                    setActiveFormTab("matrix");
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer border-0"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Teklif Fiyatlarını Düzenle</span>
              </button>

              {/* Onayla / Kilidi Aç Butonu */}
              {togglePiyasaFiyatOnay && hasPricesEntered && (
                <button
                  type="button"
                  onClick={async (): Promise<void> => {
                    if (isApproved) {
                      // Kilitliyken açmak istiyorsa uyarı göster
                      setIsWarningModalOpen(true);
                      setPendingAction(null);
                    } else {
                      await togglePiyasaFiyatOnay();
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer border-0",
                    isApproved
                      ? "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white",
                  )}
                  title={isApproved ? "Kilidi Aç" : "Piyasa Araştırmasını Onayla & Kilitle"}
                >
                  {isApproved ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Kilidi Aç / Taslağa Al</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Araştırmayı Onayla &amp; Kilitle</span>
                    </>
                  )}
                </button>
              )}

              {/* En Uygun Teklifi Kazanan Yap Butonu */}
              {lowestBidFirm && !isApproved && (
                <button
                  type="button"
                  onClick={(): void => {
                    if (handleSetWinnerFirma) {
                      handleSetWinnerFirma(lowestBidFirm.firma_id || lowestBidFirm.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer border-0 active:scale-95"
                  title="En uygun teklif sahibini kazanan olarak ata"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>En Uygunu Kazanan Yap</span>
                </button>
              )}

              {/* Seçimi Sıfırla */}
              {activeWinnerFirma && !isApproved && (
                <button
                  type="button"
                  onClick={(): void => {
                    if (handleSetWinnerFirma) {
                      handleSetWinnerFirma(null);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border-0"
                  title="Seçimi Kaldır"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sıfırla</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. TEKLİF İSTEME & DAĞITIM BELGELERİ (Akıllı ve Sakin Çubuk) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs overflow-hidden transition-all">
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                    hasPricesEntered
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                  )}
                >
                  {hasPricesEntered ? (
                    <CheckCircle2 className="w-4 h-4" />
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
                      ? "Teklif mektupları ve çizelgeleri hazır. İhtiyaç halinde tekrar açıp yazdırabilirsiniz."
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
                  {isDagitimExpanded ? "Belgeleri Gizle" : "Belgeleri Aç & Yazdır"}
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

          {/* 3. ANA ÇALIŞMA ALANI: İSTEKLİ FİRMALAR & FİYAT MATRİSİ */}
          <div className="flex flex-col gap-5">
            {/* İstekli Firmalar Tablosu */}
            <FiyatIstenenFirmalarınSecilmesi
              title="Fiyat İstenen İstekli Firmalar"
              firms={formattedFirms}
              columns={firmaColumns}
              winnerFirmaId={manualWinnerFirmaId}
              onSetWinnerFirma={(f): void => {
                handleProtectedAction(() => {
                  if (handleSetWinnerFirma) {
                    const targetId = (f.firma_id as number) || f.id;
                    handleSetWinnerFirma(
                      manualWinnerFirmaId === targetId ? null : targetId,
                    );
                  }
                });
              }}
              onCreateNewFirm={logic.handleCreateNewFirm}
              onFiyatGir={(): void => {
                handleProtectedAction(() => {
                  setIsFormOpen(true);
                  setActiveFormTab("matrix");
                });
              }}
              onEkapSorgula={handleOpenEkapSorgu}
              onOpenFirmaSecmeModali={(): void => {
                handleProtectedAction(() => {
                  if (setIsFirmModalOpen) setIsFirmModalOpen(true);
                });
              }}
              onFirmaCikar={(f): void => {
                handleProtectedAction(() => {
                  if (handleRemoveFirm) handleRemoveFirm(f.id);
                });
              }}
              onFirmaEkle={(f): void => {
                handleProtectedAction(() => {
                  if (handleAddSingleFirm) handleAddSingleFirm(f);
                });
              }}
            />

            {/* Fiyat Özeti & Canlı Matris Önizlemesi */}
            <PricesSummaryDashboard
              invitedFirms={invitedFirms}
              items={items}
              bids={bids}
              manualWinnerFirmaId={manualWinnerFirmaId}
              handleSetWinnerFirma={handleSetWinnerFirma}
              hesaplamaEsasi={hesaplamaEsasi}
              onManageFirmsClick={(): void => {
                handleProtectedAction(() => {
                  setIsFormOpen(true);
                  setActiveFormTab("matrix");
                });
              }}
            />

            {/* 4. SONUÇ ÇIKTILARI (Piyasa Fiyat Araştırması Tutanağı & Yaklaşık Maliyet Cetveli) */}
            {hasPricesEntered && (
              <div className="mt-1">
                <SonucBelgesiKartlari
                  handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi}
                  handleNewDocument={handleNewDocument}
                />
              </div>
            )}
          </div>

          {/* GÜVENLİK / DEĞİŞİKLİK ÖNLEM VE UYARI MODALI */}
          {isWarningModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl border border-amber-300 dark:border-amber-800 shadow-2xl flex flex-col gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Piyasa Araştırması Onaylanmış Durumda!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      Bu dosyaya ait piyasa fiyat araştırması ve yaklaşık maliyet tutanakları
                      onaylanmıştır. Fiyatlar üzerinde oynama yapmak veya kazanan firmayı değiştirmek
                      düzenlenmiş resmî evrakları doğrudan etkileyecektir.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                  <span className="font-bold">Önlem Uyarısı:</span> Düzenlemeye devam etmek için araştırmanın onay kilidini kaldırmanız gerekmektedir.
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={(): void => {
                      setIsWarningModalOpen(false);
                      setPendingAction(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWarning}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Onayı Kaldır ve Düzenle</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DÜZENLEME & MATRİS FORMU (Alt+Arrow, Enter tuşları ve Excel navigasyonu) */
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
