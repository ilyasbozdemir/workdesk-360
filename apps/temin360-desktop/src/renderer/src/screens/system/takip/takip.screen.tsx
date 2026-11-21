/* eslint-disable */
import React, { useState } from "react";
import {
  BookOpen,
  Columns3,
  FileText,
  Files,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { APP_ROUTES } from "../../../constants/routeConstants";
import { DosyaEvrakAkisiScreen } from "../../dosya/sub-screens/DosyaEvrakAkisi";

import { useTakip } from "./components/useTakip";
import { TakipHeader, TakipViewMode } from "./components/TakipHeader";
import { TakipActiveDosyaSummary } from "./components/TakipActiveDosyaSummary";
import { TakipDosyaTarihlerWidget } from "./components/TakipDosyaTarihlerWidget";
import { TakipUretilenBelgelerWidget } from "./components/TakipUretilenBelgelerWidget";
import { TakipAsamaStepper } from "./components/TakipAsamaStepper";
import { TakipIsAkisiYonergesi } from "./components/TakipIsAkisiYonergesi";
import { TakipKalemlerVeFirmalarGrid } from "./components/TakipKalemlerVeFirmalarGrid";
import { TakipDosyaDetayBilgileri } from "./components/TakipDosyaDetayBilgileri";
import { TakipAsamaAciklamalari } from "./components/TakipAsamaAciklamalari";
import { TakipGenelMetrikView } from "./components/TakipGenelMetrikView";
import { TakipKanbanBoard } from "./components/TakipKanbanBoard";
import { TakipGridView } from "./components/TakipGridView";
import { TakipListView } from "./components/TakipListView";
import { TakipDosyaDetayDialog } from "./components/TakipDosyaDetayDialog";
import { DosyaNotlariWidget } from "../../notlar/components/DosyaNotlariWidget";
import { DosyaInspectorView } from "../../dosyalar/components/inspector/DosyaInspectorView";
import { useQueryClient } from "@tanstack/react-query";
import type { TeminDosyasi } from "../../dosyalar/dosyalar.hooks";
import { useDosyalarHooks } from "../../dosyalar/dosyalar.hooks";
import { groupUniqueCommissioners } from "../../../utils/commissionGrouping";
import { dialogs } from "../../../components/ui/AlertDialogProvider";
import { logActivity } from "../../../utils/logger";
import { AITextGeneratorModal } from "../../../components/ui/AITextGeneratorModal";
import { EkapIknModal } from "../../dosyalar/components/EkapIknModal";
import { MaliyetAyarlariPopover } from "../../dosyalar/components/MaliyetAyarlariPopover";
import { useWorkspaceStore } from "../../../store/workspaceStore";

export function TakipScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const {
    activeDosyaId,
    setActiveDosyaId,
    activeDosya,
    dosyalar,
    dbBelgeler,
    allBelgeler,
    kalemler,
    firmalar,
    komisyonlar,
    stages,
    dbAsamalar,
    currentAsamaSira,
    STAGE_ROUTES,
    STAGE_SHORT_LABELS,
    status,
    setStatus,
    acilisTarihi,
    setAcilisTarihi,
    sonTeklifTarihi,
    setSonTeklifTarihi,
    teminTarihi,
    setTeminTarihi,
    teslimTarihi,
    setTeslimTarihi,
    notlar,
    setNotlar,
    saveLoading,
    saveMessage,
    handleEditDosya,
    handleSurecAkisi,
    handleOpenInNewWindow,
    handleDelete,
    handleUpdateDosya,
    handleToggleSign,
    formatCurrency,
  } = useTakip();

  const queryClient = useQueryClient();
  const { hardDeleteDosya, deleteDosya, updateDosya } = useDosyalarHooks();
  const { activeFilePath, activeMeta } = useWorkspaceStore();

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Dışarı tıklandığında açık menüyü kapat
  React.useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  // Yapay Zeka Danışmanı Modalı
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedFileForAI, setSelectedFileForAI] = useState<Partial<TeminDosyasi> | null>(null);

  const handleOpenAI = (dosya?: Partial<TeminDosyasi>) => {
    setSelectedFileForAI(
      dosya || activeDosya || {
        konu: "Genel Mevzuat Danışmanlığı",
        yaklasik_maliyet: 0,
        temin_no: "Belirtilmemiş",
      }
    );
    setShowAIModal(true);
  };

  // Yaklaşık Maliyet Ayarları Modalı
  const [selectedDosyaForMaliyet, setSelectedDosyaForMaliyet] = useState<any | null>(null);

  const handleOpenMaliyetAyarlari = (dosya: any) => {
    setSelectedDosyaForMaliyet({ ...dosya });
  };

  const handleSaveMaliyetAyarlari = async () => {
    if (!selectedDosyaForMaliyet) return;
    let finalMaliyet = Number(selectedDosyaForMaliyet.yaklasik_maliyet) || 0;
    const kdvRate = Number(selectedDosyaForMaliyet.kdv) || 0;
    const isKdvDahil = Number(selectedDosyaForMaliyet.yaklasik_maliyet_kdv_dahil_mi) === 1;

    if (isKdvDahil && kdvRate > 0) {
      finalMaliyet = Number((finalMaliyet / (1 + kdvRate / 100)).toFixed(2));
    }

    await updateDosya({
      id: selectedDosyaForMaliyet.id,
      yaklasik_maliyet: finalMaliyet,
      kdv: selectedDosyaForMaliyet.kdv,
      yaklasik_maliyet_hesaplamasi: selectedDosyaForMaliyet.yaklasik_maliyet_hesaplamasi,
      yaklasik_maliyet_kdv_dahil_mi: 0,
    });
    queryClient.invalidateQueries({ queryKey: ["temin_dosyalari"] });
    setSelectedDosyaForMaliyet(null);
  };

  // EKAP Gönder / İptal Modalı
  const [ekapModalOpen, setEkapModalOpen] = useState(false);
  const [ekapInputVal, setEkapInputVal] = useState("");
  const [ekapTargetId, setEkapTargetId] = useState<number | null>(null);

  const handleEkapGonder = (id: number) => {
    setEkapTargetId(id);
    setEkapInputVal("");
    setEkapModalOpen(true);
  };

  const handleEkapGonderSubmit = async () => {
    if (!ekapTargetId) return;
    await updateDosya({
      id: ekapTargetId,
      ekap_no: ekapInputVal,
      is_ekap_sent: 1,
    });
    await logActivity(
      "EKAP İptal / Kilit",
      `Dosya EKAP üzerinden kilitlendi (İKN: ${ekapInputVal})`,
      "info"
    );
    queryClient.invalidateQueries({ queryKey: ["temin_dosyalari"] });
    setEkapModalOpen(false);
    setEkapTargetId(null);
  };

  const handleKilidiAc = async (id: number) => {
    const ok = await dialogs.confirm({
      title: "Dosya Kilidini Aç",
      message: "Dosyanın EKAP kilidini açmak istediğinize emin misiniz?",
      variant: "warning",
      confirmText: "Evet, Kilidi Aç",
    });
    if (ok) {
      await updateDosya({ id, is_ekap_sent: 0 });
      queryClient.invalidateQueries({ queryKey: ["temin_dosyalari"] });
    }
  };

  // Durum Güncelle
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    await updateDosya({ id, status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["temin_dosyalari"] });
  };

  // Yeni Pencerede Aç
  const handleOpenInNewWindowCustom = (dosya: TeminDosyasi) => {
    if (!dosya) return;
    const wpParam = activeFilePath ? `&wp=${encodeURIComponent(activeFilePath)}` : "";
    window.electron?.ipcRenderer.send("window:open-secondary", {
      path: "/dosyalar",
      search: `?id=${dosya.id}&mode=window${wpParam}`,
      title: `DT: ${dosya.konu}`,
    });
  };

  // Kalıcı Sil (Hard Delete)
  const handleHardDelete = async (id: number) => {
    const ok = await dialogs.confirm({
      title: "Kalıcı Olarak Sil",
      message:
        "DİKKAT: Bu dosyayı veritabanından KALICI OLARAK SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz!",
      variant: "danger",
      confirmText: "Evet, Kalıcı Olarak Sil",
    });
    if (ok) {
      try {
        await hardDeleteDosya(id);
        if (activeDosyaId === id) setActiveDosyaId(null);
        queryClient.invalidateQueries({ queryKey: ["temin_dosyalari"] });
      } catch (error: any) {
        let errorMsg = error?.message || "Bilinmeyen bir hata oluştu.";
        if (errorMsg.includes("FOREIGN KEY") || errorMsg.includes("CONSTRAINT")) {
          errorMsg =
            "Bu dosyayı silemezsiniz çünkü bu dosyaya bağlı alt kayıtlar (fatura, komisyon üyeleri, yüklenen evraklar vb.) mevcut. Dosyayı kalıcı olarak silebilmek için önce o kayıtları silmeniz gerekmektedir.\n\nTeknik Hata: " +
            errorMsg;
        }
        await dialogs.alert({
          title: "Silme İşlemi Başarısız",
          message: errorMsg,
          variant: "danger",
        });
      }
    }
  };

  // Kart / Liste üzerinden Sil (Soft Delete)
  const handleDeleteDosyaItem = async (id: number) => {
    const ok = await dialogs.confirm({
      title: "Dosyayı İptal Et",
      message:
        'Bu dosyayı iptal etmek istediğinize emin misiniz? Dosya listelerde "İptal Edildi" olarak işaretlenecektir.',
      variant: "warning",
      confirmText: "Evet, İptal Et",
    });
    if (ok) {
      await deleteDosya(id);
      if (activeDosyaId === id) setActiveDosyaId(null);
      queryClient.invalidateQueries({ queryKey: ["temin_dosyalari"] });
    }
  };

  // Ana Görünüm Modu: Kullanıcının son seçtiği görünüm (localStorage ile korunur)
  const [viewMode, setViewModeState] = useState<TakipViewMode>(() => {
    try {
      const saved = localStorage.getItem(
        "temin_takip_view_mode",
      ) as TakipViewMode;
      if (
        saved && ["kanban", "grid", "list", "metrik", "detay"].includes(saved)
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "kanban";
  });

  const setViewMode = (mode: TakipViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem("temin_takip_view_mode", mode);
    } catch {
      // ignore
    }
  };

  // Detay modu seçildiğinde aktif dosya yoksa mevcut ilk dosyayı otomatik seç
  React.useEffect(() => {
    if (viewMode === "detay" && !activeDosyaId && dosyalar.length > 0) {
      setActiveDosyaId(dosyalar[0].id);
    }
  }, [viewMode, activeDosyaId, dosyalar, setActiveDosyaId]);

  // Üst bardan veya dış bağlantıdan Dosya Detayı'na geçildiğinde detay modunu ve detay sekmesini aç
  React.useEffect(() => {
    const handleViewModeChanged = (e: Event) => {
      const custom = e as CustomEvent<
        {
          mode?: TakipViewMode;
          dosyaId?: number;
          tab?: "ozet" | "kunye" | "kalemler" | "komisyon" | "mevzuat" | "evraklar";
        }
      >;
      if (custom.detail?.dosyaId) {
        setActiveDosyaId(custom.detail.dosyaId);
      }
      if (custom.detail?.mode) {
        setViewMode(custom.detail.mode);
      }
      if (custom.detail?.tab) {
        setActiveTab(custom.detail.tab);
      } else if (custom.detail?.mode === "detay") {
        setActiveTab("kunye");
      }
    };
    window.addEventListener("takip:view-mode-changed", handleViewModeChanged);
    return () => {
      window.removeEventListener(
        "takip:view-mode-changed",
        handleViewModeChanged,
      );
    };
  }, [setActiveDosyaId]);

  const [selectedDetailDosya, setSelectedDetailDosya] = useState<
    TeminDosyasi | null
  >(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenDetailModal = (dosya: TeminDosyasi) => {
    setActiveDosyaId(dosya.id);
    setSelectedDetailDosya(dosya);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const handleDosyaUpdatedInModal = (
    updated: Partial<TeminDosyasi> & { id: number },
  ) => {
    queryClient.invalidateQueries({ queryKey: ["temin_dosyalari"] });
    if (selectedDetailDosya && selectedDetailDosya.id === updated.id) {
      setSelectedDetailDosya((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  // Ortak Arama ve Filtreleme Durumu (Görünüm değişiminde sıfırlanmaz)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYil, setSelectedYil] = useState("all");
  const [selectedTur, setSelectedTur] = useState("all");

  const uniqueYillar = React.useMemo(() => {
    const years = new Set<number>();
    dosyalar.forEach((d) => {
      const y = d.butce_yili ||
        (d.dosya_acilis_tarihi
          ? new Date(d.dosya_acilis_tarihi).getFullYear()
          : null);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [dosyalar]);

  const filteredDosyalar = React.useMemo(() => {
    return dosyalar.filter((d) => {
      if (d.is_deleted === 1) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKonu = (d.konu || "").toLowerCase().includes(q);
        const matchNo = (d.temin_no || "").toLowerCase().includes(q);
        const matchBirim = (
          (d as { birim_adi?: string; birim?: string }).birim_adi ||
          (d as { birim?: string }).birim ||
          ""
        )
          .toLowerCase()
          .includes(q);
        if (!matchKonu && !matchNo && !matchBirim) return false;
      }

      if (selectedYil !== "all") {
        const dYear = d.butce_yili ||
          (d.dosya_acilis_tarihi
            ? new Date(d.dosya_acilis_tarihi).getFullYear()
            : null);
        if (String(dYear) !== selectedYil) return false;
      }

      if (selectedTur !== "all") {
        if (d.tur !== selectedTur) return false;
      }

      return true;
    });
  }, [dosyalar, searchQuery, selectedYil, selectedTur]);

  // Tabbed Görünüm (Dosya Detayı alt sekmeleri)
  const [activeTab, setActiveTab] = useState<
    "ozet" | "kunye" | "kalemler" | "komisyon" | "mevzuat" | "evraklar"
  >("ozet");

  const uniqueCommissionCount = React.useMemo(() => {
    return groupUniqueCommissioners(komisyonlar).uniqueCount;
  }, [komisyonlar]);

  const tabs = [
    {
      id: "ozet",
      label: "Genel Bakış & Tarihler",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "kunye",
      label: "Dosya Detayı & Parametreler",
      icon: FileText,
      badge: null,
    },
    {
      id: "evraklar",
      label: "Evrak Akışı & Belgeler",
      icon: Files,
      badge: allBelgeler && allBelgeler.length > 0 ? allBelgeler.length : null,
    },
    {
      id: "kalemler",
      label: "Malzeme & Firmalar",
      icon: Package,
      badge: kalemler.length > 0 ? kalemler.length : null,
    },
    {
      id: "komisyon",
      label: "Yetkili & Komisyon Detayları",
      icon: Users,
      badge: uniqueCommissionCount > 0 ? uniqueCommissionCount : null,
    },
    {
      id: "mevzuat",
      label: "İş Akışı & Yönerge",
      icon: BookOpen,
      badge: null,
    },
  ];

  const isKanban = viewMode === "kanban";

  return (
    <div
      className={`flex flex-col gap-3.5 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        isKanban ? "h-[calc(100vh-7rem)] min-h-0" : "pb-6"
      }`}
    >
      {/* HEADER SECTION */}
      <div className="shrink-0">
        <TakipHeader
          activeDosya={activeDosya}
          onEditClick={handleEditDosya}
          activeView={viewMode}
          setActiveView={setViewMode}
          onOpenAI={() => handleOpenAI()}
          onGoToDetayTab={() => setActiveTab("kunye")}
          onOpenWizard={() => {
            navigate({
              to: APP_ROUTES.YENI_DOSYA,
              search: { initialStage: 1 },
            });
          }}
        />
      </div>

      {/* GÖRÜNÜM 1: KANBAN İŞ AKIŞI TAHTASI */}
      {viewMode === "kanban" && (
        <div className="flex flex-col flex-1 min-h-0">
          <TakipKanbanBoard
            dosyalar={dosyalar}
            activeDosyaId={activeDosyaId}
            setActiveDosyaId={(id) => {
              setActiveDosyaId(id);
            }}
            formatCurrency={formatCurrency}
            onOpenWizard={(targetStage) => {
              navigate({
                to: APP_ROUTES.YENI_DOSYA,
                search: { initialStage: targetStage || 1 },
              });
            }}
            onOpenSurec={(d) => {
              setActiveDosyaId(d.id);
              const route = STAGE_ROUTES[d.durum_asama_id || 1] ||
                "/dosya/hazirlik-ve-ihtiyac";
              navigate({ to: route });
            }}
            onEdit={(dosyaId) => {
              navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` });
            }}
            onOpenDetail={handleOpenDetailModal}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedYil={selectedYil}
            setSelectedYil={setSelectedYil}
            selectedTur={selectedTur}
            setSelectedTur={setSelectedTur}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            handleOpenInNewWindow={handleOpenInNewWindowCustom}
            handleUpdateStatus={handleUpdateStatus}
            handleEkapGonder={handleEkapGonder}
            handleKilidiAc={handleKilidiAc}
            handleOpenAI={handleOpenAI}
            handleDelete={handleDeleteDosyaItem}
            handleHardDelete={handleHardDelete}
            handleOpenMaliyetAyarlari={handleOpenMaliyetAyarlari}
          />
        </div>
      )}

      {/* GÖRÜNÜM 2: GRID / KART GÖRÜNÜMÜ */}
      {viewMode === "grid" && (
        <TakipGridView
          dosyalar={filteredDosyalar}
          activeDosyaId={activeDosyaId}
          setActiveDosyaId={(id) => {
            setActiveDosyaId(id);
          }}
          formatCurrency={formatCurrency}
          onOpenDetail={handleOpenDetailModal}
          onOpenSurec={(d) => {
            setActiveDosyaId(d.id);
            const route = STAGE_ROUTES[d.durum_asama_id || 1] ||
              "/dosya/hazirlik-ve-ihtiyac";
            navigate({ to: route });
          }}
          onEdit={(dosyaId) => {
            navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` });
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedYil={selectedYil}
          setSelectedYil={setSelectedYil}
          selectedTur={selectedTur}
          setSelectedTur={setSelectedTur}
          uniqueYillar={uniqueYillar}
          totalCount={dosyalar.length}
          onOpenWizard={() => {
            navigate({
              to: APP_ROUTES.YENI_DOSYA,
              search: { initialStage: 1 },
            });
          }}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          handleOpenInNewWindow={handleOpenInNewWindowCustom}
          handleUpdateStatus={handleUpdateStatus}
          handleEkapGonder={handleEkapGonder}
          handleKilidiAc={handleKilidiAc}
          handleOpenAI={handleOpenAI}
          handleDelete={handleDeleteDosyaItem}
          handleHardDelete={handleHardDelete}
          handleOpenMaliyetAyarlari={handleOpenMaliyetAyarlari}
        />
      )}

      {/* GÖRÜNÜM 3: KOMPAKT LİSTE GÖRÜNÜMÜ */}
      {viewMode === "list" && (
        <TakipListView
          dosyalar={filteredDosyalar}
          activeDosyaId={activeDosyaId}
          setActiveDosyaId={(id) => {
            setActiveDosyaId(id);
          }}
          formatCurrency={formatCurrency}
          onOpenDetail={handleOpenDetailModal}
          onOpenSurec={(d) => {
            setActiveDosyaId(d.id);
            const route = STAGE_ROUTES[d.durum_asama_id || 1] ||
              "/dosya/hazirlik-ve-ihtiyac";
            navigate({ to: route });
          }}
          onEdit={(dosyaId) => {
            navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` });
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedYil={selectedYil}
          setSelectedYil={setSelectedYil}
          selectedTur={selectedTur}
          setSelectedTur={setSelectedTur}
          uniqueYillar={uniqueYillar}
          totalCount={dosyalar.length}
          onOpenWizard={() => {
            navigate({
              to: APP_ROUTES.YENI_DOSYA,
              search: { initialStage: 1 },
            });
          }}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          handleOpenInNewWindow={handleOpenInNewWindowCustom}
          handleUpdateStatus={handleUpdateStatus}
          handleEkapGonder={handleEkapGonder}
          handleKilidiAc={handleKilidiAc}
          handleOpenAI={handleOpenAI}
          handleDelete={handleDeleteDosyaItem}
          handleHardDelete={handleHardDelete}
          handleOpenMaliyetAyarlari={handleOpenMaliyetAyarlari}
        />
      )}

      {/* GÖRÜNÜM 2: SEÇİLİ AKTİF DOSYA DETAYI */}
      {viewMode === "detay" && (
        <>
          {activeDosya
            ? (
              <div className="space-y-4">
                {/* TAB BAR (SEKMELER) */}
                <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-2xs"
                              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-xl"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                          {tab.badge !== null && (
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                isActive
                                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SEKME 1: GENEL BAKIŞ & TARİHLER (ÖZET KOKPİTİ) */}
                {activeTab === "ozet" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-8 space-y-6">
                        <TakipActiveDosyaSummary
                          activeDosya={activeDosya}
                          kalemler={kalemler}
                          firmalar={firmalar}
                          formatCurrency={formatCurrency}
                          onEditClick={handleEditDosya}
                          onSurecAkisiClick={handleSurecAkisi}
                          onOpenNewWindowClick={handleOpenInNewWindow}
                          onDeleteClick={handleDelete}
                        />

                        <TakipAsamaStepper
                          stages={stages}
                          currentAsamaSira={currentAsamaSira}
                          stageRoutes={STAGE_ROUTES}
                          stageShortLabels={STAGE_SHORT_LABELS}
                        />
                      </div>

                      <div className="lg:col-span-4 space-y-6">
                        {activeDosyaId && (
                          <DosyaNotlariWidget
                            dosyaId={activeDosyaId}
                            dosyaNo={activeDosya?.temin_no}
                          />
                        )}

                        <TakipDosyaTarihlerWidget
                          status={status}
                          setStatus={setStatus}
                          acilisTarihi={acilisTarihi}
                          setAcilisTarihi={setAcilisTarihi}
                          sonTeklifTarihi={sonTeklifTarihi}
                          setSonTeklifTarihi={setSonTeklifTarihi}
                          teminTarihi={teminTarihi}
                          setTeminTarihi={setTeminTarihi}
                          teslimTarihi={teslimTarihi}
                          setTeslimTarihi={setTeslimTarihi}
                          notlar={notlar}
                          setNotlar={setNotlar}
                          saveLoading={saveLoading}
                          saveMessage={saveMessage}
                          onSubmit={handleUpdateDosya}
                        />

                        <TakipUretilenBelgelerWidget
                          dbBelgeler={dbBelgeler}
                          onToggleSign={handleToggleSign}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SEKME 2: DOSYA KÜNYESİ & DETAY PARAMETRELERİ (BİRLEŞİK KÜNYE GÖRÜNÜMÜ) */}
                {activeTab === "kunye" && (
                  <div className="space-y-6">
                    <TakipDosyaDetayBilgileri
                      activeDosya={activeDosya}
                      komisyonlar={komisyonlar}
                      onEditClick={handleEditDosya}
                      mode="kunye"
                    />
                  </div>
                )}

                {/* SEKME: EVRAK AKIŞI & BELGELER (DİJİTAL BELGE İNCELEME KOKPİTİ) */}
                {activeTab === "evraklar" && (
                  <div className="h-[calc(100vh-14rem)] min-h-[660px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    <DosyaEvrakAkisiScreen />
                  </div>
                )}

                {/* SEKME 3: MALZEME & FİRMALAR TABLOSU */}
                {activeTab === "kalemler" && (
                  <div className="space-y-6">
                    <TakipKalemlerVeFirmalarGrid
                      kalemler={kalemler}
                      firmalar={firmalar}
                    />
                  </div>
                )}

                {/* SEKME 4: YETKİLİ & KOMİSYON DETAYLARI */}
                {activeTab === "komisyon" && (
                  <div className="space-y-6">
                    <TakipDosyaDetayBilgileri
                      activeDosya={activeDosya}
                      komisyonlar={komisyonlar}
                      onEditClick={handleEditDosya}
                      mode="komisyon"
                    />
                  </div>
                )}

                {/* SEKME 4: İŞ AKIŞI & MEVZUAT YÖNERGESİ */}
                {activeTab === "mevzuat" && (
                  <div className="space-y-6">
                    <TakipIsAkisiYonergesi />

                    <TakipAsamaAciklamalari
                      stages={stages}
                      currentAsamaSira={currentAsamaSira}
                    />
                  </div>
                )}
              </div>
            )
            : (
              <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Columns3 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    İncelenecek Aktif Dosya Seçilmedi
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Dosya detaylarını ve evraklarını görüntülemek için lütfen
                    Kanban tahtasından bir dosya seçin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Kanban Tahtasına Git
                </button>
              </div>
            )}
        </>
      )}

      {/* GÖRÜNÜM 3: GENEL METRİK VE DAĞILIM GÖRÜNÜMÜ */}
      {viewMode === "metrik" && (
        <TakipGenelMetrikView
          activeDosya={activeDosya}
          dosyalar={dosyalar}
          allBelgeler={allBelgeler}
          kalemler={kalemler}
          firmalar={firmalar}
          dbBelgeler={dbBelgeler}
          komisyonlar={komisyonlar}
          stages={stages}
          dbAsamalar={dbAsamalar}
          formatCurrency={formatCurrency}
          onGoToDetail={() => setViewMode("detay")}
          onOpenKanban={() => setViewMode("kanban")}
          setActiveDosyaId={(id) => {
            setActiveDosyaId(id);
            setViewMode("detay");
          }}
        />
      )}

      <TakipDosyaDetayDialog
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        dosya={selectedDetailDosya}
        formatCurrency={formatCurrency}
        onEdit={(dosyaId) => {
          handleCloseDetailModal();
          navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` });
        }}
        onOpenSurec={(d) => {
          handleCloseDetailModal();
          setActiveDosyaId(d.id);
          const route = STAGE_ROUTES[d.durum_asama_id || 1] ||
            "/dosya/hazirlik-ve-ihtiyac";
          navigate({ to: route });
        }}
        onDosyaUpdated={handleDosyaUpdatedInModal}
        onGoToDetailTab={(d) => {
          handleCloseDetailModal();
          setActiveDosyaId(d.id);
          setViewMode("detay");
          setActiveTab("kunye");
        }}
        handleOpenInNewWindow={handleOpenInNewWindowCustom}
        handleOpenMaliyetAyarlari={handleOpenMaliyetAyarlari}
        handleOpenAI={handleOpenAI}
        handleUpdateStatus={handleUpdateStatus}
        handleEkapGonder={handleEkapGonder}
        handleKilidiAc={handleKilidiAc}
        handleDelete={handleDeleteDosyaItem}
        handleHardDelete={handleHardDelete}
      />

      {showAIModal && selectedFileForAI && (
        <AITextGeneratorModal
          isOpen={true}
          isAdvisorMode={true}
          fieldName="Mevzuat Analizi"
          title="Yapay Zeka Asistanı"
          initialPrompt=""
          systemInstruction={
            selectedFileForAI.konu === 'Genel Mevzuat Danışmanlığı'
              ? 'Sen profesyonel bir kamu ihale ve doğrudan temin (4734 Sayılı Kanun) asistanısın. Kullanıcıya genel mevzuat veya idari işleyiş hakkında rehberlik edeceksin.\n\nÖNEMLİ GİZLİLİK KURALI: Gerçek kurum veya kişi isimlerini maskele.'
              : `Sen profesyonel bir kamu ihale ve doğrudan temin (4734 Sayılı Kanun) asistanısın. Kullanıcı sana sistemdeki bir dosyası hakkında danışacak.\n\nŞu anki Aktif Dosya Bilgileri:\n- Dosya No: [DOSYA_NO]\n- Konu: [DOSYA_KONU]\n- Maliyet: [DOSYA_MALIYET]\n- İhale Şekli (Madde): [DOSYA_IHALE_SEKLI]\n\nÖNEMLİ GİZLİLİK KURALI: Gerçek kurum, şahıs isimleri veya adresleri [Kurum Adı], [İlgili Kişi] şeklinde maskele. Eğer dosyayla ilgili analiz veya rehberlik yaparken dosya numarası, konu, maliyet veya ihale şeklinden bahsedeceksen kesinlikle [DOSYA_NO], [DOSYA_KONU], [DOSYA_MALIYET], [DOSYA_IHALE_SEKLI] şeklinde olan bu yer tutucuları aynen koru, gerçek veriyi asla kullanma.`
          }
          placeholderMappings={{
            '[DOSYA_NO]': selectedFileForAI.temin_no || 'Belirtilmemiş',
            '[DOSYA_KONU]': selectedFileForAI.konu || 'Belirtilmemiş',
            '[DOSYA_MALIYET]':
              (selectedFileForAI.yaklasik_maliyet || 0).toLocaleString('tr-TR') + ' TL',
            '[DOSYA_IHALE_SEKLI]': selectedFileForAI.ihale_sekli || 'Belirtilmemiş',
            '[KURUM_ADI]': activeMeta?.institution || 'Belirtilmemiş',
            '[BIRIM_ADI]': (selectedFileForAI as any).birim_adi || 'Belirtilmemiş'
          }}
          onClose={() => {
            setShowAIModal(false)
            setSelectedFileForAI(null)
          }}
          onApply={(text) => {
            console.log('AI tavsiyesi:', text)
            setShowAIModal(false)
            setSelectedFileForAI(null)
          }}
        />
      )}

      <EkapIknModal
        isOpen={ekapModalOpen}
        inputVal={ekapInputVal}
        setInputVal={setEkapInputVal}
        onClose={() => setEkapModalOpen(false)}
        onSubmit={handleEkapGonderSubmit}
      />

      <MaliyetAyarlariPopover
        selectedDosya={selectedDosyaForMaliyet}
        setSelectedDosya={setSelectedDosyaForMaliyet}
        onSave={handleSaveMaliyetAyarlari}
      />
    </div>
  );
}

export default TakipScreen;
